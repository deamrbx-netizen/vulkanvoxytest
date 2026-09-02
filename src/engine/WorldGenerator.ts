import { FastNoise } from './Noise';
import { ScanMesher, QuadFace } from './ScanMesher';

export interface GeneratedSection {
  cx: number;
  cy: number;
  cz: number;
  lod: number;
  worldX: number;
  worldY: number;
  worldZ: number;
  size: number;
  scale: number;
  voxels: Uint8Array;
  quads: QuadFace[];
  quadCount: number;
  hasSolid: boolean;
}

export class WorldGenerator {
  private terrainNoise: FastNoise;
  private mountainNoise: FastNoise;
  private caveNoise: FastNoise;
  private biomeNoise: FastNoise;
  private seed: number;

  constructor(seed = 42) {
    this.seed = seed;
    this.terrainNoise = new FastNoise(seed);
    this.mountainNoise = new FastNoise(seed + 101);
    this.caveNoise = new FastNoise(seed + 202);
    this.biomeNoise = new FastNoise(seed + 303);
  }

  public setSeed(seed: number) {
    this.seed = seed;
    this.terrainNoise.reseed(seed);
    this.mountainNoise.reseed(seed + 101);
    this.caveNoise.reseed(seed + 202);
    this.biomeNoise.reseed(seed + 303);
  }

  /**
   * Generates a 16x16x16 voxel section for a given LOD level
   * lod: 0 (1:1, 16 blocks), 1 (2x2 downsample, spans 32 blocks), 2 (64 blocks), etc.
   */
  public generateSection(cx: number, cy: number, cz: number, lod = 0): GeneratedSection {
    const size = 16;
    const scale = Math.pow(2, lod);
    const worldX = cx * size * scale;
    const worldY = cy * size * scale;
    const worldZ = cz * size * scale;
    const voxels = new Uint8Array(size * size * size);
    let hasSolid = false;

    const seaLevel = 64;

    for (let vz = 0; vz < size; vz++) {
      const wz = worldZ + vz * scale;
      for (let vx = 0; vx < size; vx++) {
        const wx = worldX + vx * scale;

        // Base terrain height
        const baseHeight = 60 + this.terrainNoise.fbm2D(wx * 0.003, wz * 0.003, 4) * 40;
        // Mountain peak multiplier
        const mountainFactor = Math.max(0, this.mountainNoise.fbm2D(wx * 0.0015, wz * 0.0015, 3) - 0.2) * 120;
        const totalHeight = Math.floor(baseHeight + mountainFactor);

        for (let vy = 0; vy < size; vy++) {
          const wy = worldY + vy * scale;
          const idx = vx + vy * size + vz * (size * size);

          if (wy > totalHeight) {
            // Water layer
            if (wy <= seaLevel) {
              voxels[idx] = 4; // Water
              hasSolid = true;
            } else {
              voxels[idx] = 0; // Air
            }
          } else {
            // Check for 3D cave hollows
            const caveVal = this.caveNoise.fbm2D(wx * 0.02, wy * 0.03 + wz * 0.02, 2);
            if (caveVal > 0.65 && wy > 10 && wy < totalHeight - 4) {
              voxels[idx] = 0; // Cave air
              continue;
            }

            hasSolid = true;
            // Block selection based on elevation
            if (wy === totalHeight && wy > seaLevel) {
              if (wy > 140) {
                voxels[idx] = 7; // Snow
              } else if (wy === seaLevel + 1) {
                voxels[idx] = 8; // Sand beach
              } else {
                voxels[idx] = 1; // Grass
              }
            } else if (wy >= totalHeight - 3) {
              voxels[idx] = wy > 130 ? 3 : 2; // Dirt / High Stone
            } else if (wy < 20) {
              voxels[idx] = 10; // Deepslate
            } else {
              // Rare gold vein
              if ((wx ^ wy ^ wz) % 97 === 0) {
                voxels[idx] = 9; // Gold Ore
              } else {
                voxels[idx] = 3; // Stone
              }
            }
          }
        }

        // Add tree leaves/logs if on grass top
        if (lod <= 1 && totalHeight > seaLevel + 2 && totalHeight < 130) {
          const treeNoise = (this.biomeNoise.noise2D(wx * 0.1, wz * 0.1) * 100) | 0;
          if (treeNoise === 42) {
            const trunkBaseY = totalHeight + 1;
            for (let ty = 0; ty < 5; ty++) {
              const twy = trunkBaseY + ty;
              if (twy >= worldY && twy < worldY + size * scale) {
                const lvy = Math.floor((twy - worldY) / scale);
                if (lvy >= 0 && lvy < size) {
                  voxels[vx + lvy * size + vz * (size * size)] = 6; // Wood log
                }
              }
            }
          }
        }
      }
    }

    // Mesh the section if it contains solid voxels
    const quads = hasSolid ? ScanMesher.meshSection(voxels, size) : [];

    return {
      cx,
      cy,
      cz,
      lod,
      worldX,
      worldY,
      worldZ,
      size,
      scale,
      voxels,
      quads,
      quadCount: quads.length,
      hasSolid,
    };
  }
}
