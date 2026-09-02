import * as THREE from 'three';
import { VoxyConfig, RenderStatisticsData } from '../types/voxy';
import { WorldGenerator, GeneratedSection } from './WorldGenerator';

export interface OctreeNode {
  id: string;
  cx: number;
  cy: number;
  cz: number;
  lod: number;
  bounds: THREE.Box3;
  center: THREE.Vector3;
  size: number;
  children?: OctreeNode[];
  sectionData?: GeneratedSection;
  isLeaf: boolean;
}

export class OctreeLODManager {
  private generator: WorldGenerator;
  private sectionCache: Map<string, GeneratedSection> = new Map();
  private frustum: THREE.Frustum = new THREE.Frustum();
  private projScreenMatrix: THREE.Matrix4 = new THREE.Matrix4();
  private rootNodes: OctreeNode[] = [];

  constructor(generator: WorldGenerator) {
    this.generator = generator;
    this.initRoots();
  }

  public clearCache() {
    this.sectionCache.clear();
    this.initRoots();
  }

  private initRoots() {
    this.rootNodes = [];
    // Top Level Nodes (TLN) at LOD 4 (spans 16*16 = 256 blocks each)
    const tlnLod = 4;
    const tlnSpan = 16 * Math.pow(2, tlnLod); // 256
    const radius = 3; // 7x7 grid of TLNs = ~1800x1800 voxel area

    for (let rx = -radius; rx <= radius; rx++) {
      for (let rz = -radius; rz <= radius; rz++) {
        for (let ry = 0; ry <= 1; ry++) {
          const minX = rx * tlnSpan;
          const minY = ry * tlnSpan;
          const minZ = rz * tlnSpan;
          const bounds = new THREE.Box3(
            new THREE.Vector3(minX, minY, minZ),
            new THREE.Vector3(minX + tlnSpan, minY + tlnSpan, minZ + tlnSpan)
          );
          const center = new THREE.Vector3();
          bounds.getCenter(center);

          this.rootNodes.push({
            id: `tln_${rx}_${ry}_${rz}_lod${tlnLod}`,
            cx: rx,
            cy: ry,
            cz: rz,
            lod: tlnLod,
            bounds,
            center,
            size: tlnSpan,
            isLeaf: false,
          });
        }
      }
    }
  }

  public getSection(cx: number, cy: number, cz: number, lod: number): GeneratedSection {
    const key = `${cx}_${cy}_${cz}_lod${lod}`;
    let section = this.sectionCache.get(key);
    if (!section) {
      section = this.generator.generateSection(cx, cy, cz, lod);
      this.sectionCache.set(key, section);
    }
    return section;
  }

  /**
   * Evaluates screenspace pixel area for node AABB
   */
  private computeScreenSpaceSize(
    bounds: THREE.Box3,
    camera: THREE.Camera,
    viewportHeight: number
  ): number {
    const sphere = new THREE.Sphere();
    bounds.getBoundingSphere(sphere);
    const dist = Math.max(camera.position.distanceTo(sphere.center) - sphere.radius, 1.0);

    // Approximate screenspace diameter in pixels
    const fovRad = ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 180;
    const screenDiameter = (sphere.radius * 2.0 * viewportHeight) / (2.0 * dist * Math.tan(fovRad / 2));
    // Pixel area approx
    return (screenDiameter * screenDiameter) / 4;
  }

  /**
   * Traverse octree from roots down according to subDivisionSize & distance
   */
  public traverseAndCull(
    camera: THREE.PerspectiveCamera,
    viewportWidth: number,
    viewportHeight: number,
    config: VoxyConfig
  ): {
    visibleSections: GeneratedSection[];
    allVisitedNodes: OctreeNode[];
    stats: RenderStatisticsData;
  } {
    const htc = [0, 0, 0, 0, 0, 0, 0, 0];
    const hrs = [0, 0, 0, 0, 0, 0, 0, 0];
    const vs = [0, 0, 0, 0, 0, 0, 0, 0];
    const qc = [0, 0, 0, 0, 0, 0, 0, 0];

    let totalQuads = 0;
    let culledSections = 0;
    const visibleSections: GeneratedSection[] = [];
    const allVisitedNodes: OctreeNode[] = [];

    // Update camera frustum
    this.projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);

    const maxRenderDistBlocks = config.sectionRenderDistance * 16 * 16; // Chunks to blocks

    const traverse = (node: OctreeNode) => {
      if (node.lod >= 0 && node.lod <= 7) {
        htc[node.lod]++;
      }
      allVisitedNodes.push(node);

      // Distance check
      const distToCam = node.center.distanceTo(camera.position);
      if (distToCam > maxRenderDistBlocks + node.size) {
        culledSections++;
        return;
      }

      // Frustum culling
      if (config.frustumCulling && !this.frustum.intersectsBox(node.bounds)) {
        culledSections++;
        return;
      }

      // Screenspace pixel error evaluation
      const screenAreaPx = this.computeScreenSpaceSize(node.bounds, camera, viewportHeight);

      // If screen pixel area exceeds subdivision threshold and not at leaf LOD 0 -> subdivide
      const shouldSubdivide = screenAreaPx > config.subDivisionSize && node.lod > 0;

      if (shouldSubdivide) {
        // Expand / visit children (2x2x2 = 8 child octants)
        if (!node.children || node.children.length === 0) {
          node.children = this.createChildren(node);
        }

        for (const child of node.children) {
          traverse(child);
        }
      } else {
        // Render this node at its current LOD level
        if (node.lod >= 0 && node.lod <= 7) {
          hrs[node.lod]++;
        }

        const section = this.getSection(node.cx, node.cy, node.cz, node.lod);
        node.sectionData = section;

        if (section.quadCount > 0) {
          if (node.lod >= 0 && node.lod <= 7) {
            vs[node.lod]++;
            qc[node.lod] += section.quadCount;
          }
          visibleSections.push(section);
          totalQuads += section.quadCount;
        }
      }
    };

    if (config.enabled && config.enableRendering) {
      for (const root of this.rootNodes) {
        traverse(root);
      }
    }

    const totalRenderSections = visibleSections.length;
    const cullingEfficiency =
      totalRenderSections + culledSections > 0
        ? Math.round((culledSections / (totalRenderSections + culledSections)) * 100)
        : 0;

    const stats: RenderStatisticsData = {
      enabled: config.enabled,
      hierarchicalTraversalCounts: htc,
      hierarchicalRenderSections: hrs,
      visibleSections: vs,
      quadCount: qc,
      totalQuads,
      totalSections: totalRenderSections,
      drawCalls: totalRenderSections,
      culledSections,
      vramUsageMB: Math.round((totalQuads * 32 * 4) / (1024 * 1024) * 10) / 10 + 14.5,
      fps: 60,
      frameTimeMs: 16.6,
    };

    return {
      visibleSections,
      allVisitedNodes,
      stats,
    };
  }

  private createChildren(parent: OctreeNode): OctreeNode[] {
    const childLod = parent.lod - 1;
    const childSize = parent.size / 2;
    const children: OctreeNode[] = [];

    // Each parent (cx, cy, cz) expands into 2x2x2 children
    for (let ox = 0; ox < 2; ox++) {
      for (let oy = 0; oy < 2; oy++) {
        for (let oz = 0; oz < 2; oz++) {
          const childCx = parent.cx * 2 + ox;
          const childCy = parent.cy * 2 + oy;
          const childCz = parent.cz * 2 + oz;

          const minX = parent.bounds.min.x + ox * childSize;
          const minY = parent.bounds.min.y + oy * childSize;
          const minZ = parent.bounds.min.z + oz * childSize;

          const bounds = new THREE.Box3(
            new THREE.Vector3(minX, minY, minZ),
            new THREE.Vector3(minX + childSize, minY + childSize, minZ + childSize)
          );
          const center = new THREE.Vector3();
          bounds.getCenter(center);

          children.push({
            id: `node_${childCx}_${childCy}_${childCz}_lod${childLod}`,
            cx: childCx,
            cy: childCy,
            cz: childCz,
            lod: childLod,
            bounds,
            center,
            size: childSize,
            isLeaf: childLod === 0,
          });
        }
      }
    }

    return children;
  }
}
