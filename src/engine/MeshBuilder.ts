import * as THREE from 'three';
import { GeneratedSection } from './WorldGenerator';
import { BLOCK_COLORS, LOD_COLORS, QuadFace } from './ScanMesher';
import { RenderMode } from '../types/voxy';

export class MeshBuilder {
  /**
   * Builds an optimized Three.js BufferGeometry from section quads
   */
  public static buildSectionGeometry(
    section: GeneratedSection,
    renderMode: RenderMode
  ): THREE.BufferGeometry {
    const quads = section.quads;
    const quadCount = quads.length;

    // 4 vertices per quad, 2 triangles = 6 indices per quad
    const positions = new Float32Array(quadCount * 4 * 3);
    const normals = new Float32Array(quadCount * 4 * 3);
    const colors = new Float32Array(quadCount * 4 * 3);
    const uvs = new Float32Array(quadCount * 4 * 2);
    const indices = new Uint32Array(quadCount * 6);

    const scale = section.scale;
    const baseWorldX = section.worldX;
    const baseWorldY = section.worldY;
    const baseWorldZ = section.worldZ;

    for (let i = 0; i < quadCount; i++) {
      const q = quads[i];
      const vOffset = i * 4 * 3;
      const cOffset = i * 4 * 3;
      const nOffset = i * 4 * 3;
      const uvOffset = i * 4 * 2;
      const idxOffset = i * 6;

      // Base coordinate scaled
      const x0 = baseWorldX + q.x * scale;
      const y0 = baseWorldY + q.y * scale;
      const z0 = baseWorldZ + q.z * scale;

      const w = q.w * scale;
      const h = q.h * scale;

      let nx = 0, ny = 0, nz = 0;
      let p0 = [0, 0, 0], p1 = [0, 0, 0], p2 = [0, 0, 0], p3 = [0, 0, 0];

      switch (q.face) {
        case 0: // +Y (Top)
          nx = 0; ny = 1; nz = 0;
          p0 = [x0, y0, z0];
          p1 = [x0 + w, y0, z0];
          p2 = [x0 + w, y0, z0 + h];
          p3 = [x0, y0, z0 + h];
          break;
        case 1: // -Y (Bottom)
          nx = 0; ny = -1; nz = 0;
          p0 = [x0, y0, z0 + h];
          p1 = [x0 + w, y0, z0 + h];
          p2 = [x0 + w, y0, z0];
          p3 = [x0, y0, z0];
          break;
        case 2: // +Z (South)
          nx = 0; ny = 0; nz = 1;
          p0 = [x0, y0, z0];
          p1 = [x0 + w, y0, z0];
          p2 = [x0 + w, y0 + h, z0];
          p3 = [x0, y0 + h, z0];
          break;
        case 3: // -Z (North)
          nx = 0; ny = 0; nz = -1;
          p0 = [x0 + w, y0, z0];
          p1 = [x0, y0, z0];
          p2 = [x0, y0 + h, z0];
          p3 = [x0 + w, y0 + h, z0];
          break;
        case 4: // +X (East)
          nx = 1; ny = 0; nz = 0;
          p0 = [x0, y0, z0 + w];
          p1 = [x0, y0, z0];
          p2 = [x0, y0 + h, z0];
          p3 = [x0, y0 + h, z0 + w];
          break;
        case 5: // -X (West)
          nx = -1; ny = 0; nz = 0;
          p0 = [x0, y0, z0];
          p1 = [x0, y0, z0 + w];
          p2 = [x0, y0 + h, z0 + w];
          p3 = [x0, y0 + h, z0];
          break;
      }

      // Fill positions
      positions[vOffset] = p0[0];     positions[vOffset + 1] = p0[1]; positions[vOffset + 2] = p0[2];
      positions[vOffset + 3] = p1[0]; positions[vOffset + 4] = p1[1]; positions[vOffset + 5] = p1[2];
      positions[vOffset + 6] = p2[0]; positions[vOffset + 7] = p2[1]; positions[vOffset + 8] = p2[2];
      positions[vOffset + 9] = p3[0]; positions[vOffset + 10] = p3[1]; positions[vOffset + 11] = p3[2];

      // Fill normals
      for (let k = 0; k < 4; k++) {
        normals[nOffset + k * 3] = nx;
        normals[nOffset + k * 3 + 1] = ny;
        normals[nOffset + k * 3 + 2] = nz;
      }

      // Color mapping according to render mode
      let r = 0.8, g = 0.8, b = 0.8;
      if (renderMode === 'LOD_LEVEL') {
        const lodCol = LOD_COLORS[section.lod] || LOD_COLORS[0];
        r = lodCol.r / 255;
        g = lodCol.g / 255;
        b = lodCol.b / 255;
      } else if (renderMode === 'NORMALS') {
        r = Math.abs(nx);
        g = Math.abs(ny);
        b = Math.abs(nz);
      } else if (renderMode === 'HEATMAP') {
        // Density heatmap
        const heat = Math.min(1.0, quadCount / 1200);
        r = heat;
        g = 1.0 - heat * 0.7;
        b = 0.2;
      } else {
        // Standard block colors with directional lighting
        const block = BLOCK_COLORS[q.blockType] || BLOCK_COLORS[1];
        const light = q.light;
        r = (block.r / 255) * light;
        g = (block.g / 255) * light;
        b = (block.b / 255) * light;
      }

      for (let k = 0; k < 4; k++) {
        colors[cOffset + k * 3] = r;
        colors[cOffset + k * 3 + 1] = g;
        colors[cOffset + k * 3 + 2] = b;
      }

      // UVs
      uvs[uvOffset] = 0; uvs[uvOffset + 1] = 0;
      uvs[uvOffset + 2] = q.w; uvs[uvOffset + 3] = 0;
      uvs[uvOffset + 4] = q.w; uvs[uvOffset + 5] = q.h;
      uvs[uvOffset + 6] = 0; uvs[uvOffset + 7] = q.h;

      // Triangle indices (0, 1, 2) and (0, 2, 3)
      const baseIdx = i * 4;
      indices[idxOffset] = baseIdx;
      indices[idxOffset + 1] = baseIdx + 1;
      indices[idxOffset + 2] = baseIdx + 2;
      indices[idxOffset + 3] = baseIdx;
      indices[idxOffset + 4] = baseIdx + 2;
      indices[idxOffset + 5] = baseIdx + 3;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    return geometry;
  }
}
