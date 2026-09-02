// Voxy ScanMesher2D - greedy voxel face merger
// Generates compact, non-overlapping quads for 16x16x16 / 32x32x32 chunk sections

export interface QuadFace {
  // Position in chunk coordinates
  x: number;
  y: number;
  z: number;
  w: number; // width in voxels
  h: number; // height in voxels
  face: 0 | 1 | 2 | 3 | 4 | 5; // 0: +Y (top), 1: -Y (bottom), 2: +Z (south), 3: -Z (north), 4: +X (east), 5: -X (west)
  blockType: number;
  light: number;
  ao: number[]; // 4 ambient occlusion values [0..3]
}

export const BLOCK_COLORS: Record<number, { r: number; g: number; b: number; hex: string; name: string }> = {
  0: { r: 0, g: 0, b: 0, hex: 'transparent', name: 'Air' },
  1: { r: 92, g: 145, b: 58, hex: '#5c913a', name: 'Grass Block' },
  2: { r: 134, g: 96, b: 67, hex: '#866043', name: 'Dirt' },
  3: { r: 125, g: 125, b: 125, hex: '#7d7d7d', name: 'Stone' },
  4: { r: 44, g: 110, b: 196, hex: '#2c6ec4', name: 'Water' },
  5: { r: 52, g: 118, b: 38, hex: '#347626', name: 'Oak Leaves' },
  6: { r: 103, g: 77, b: 46, hex: '#674d2e', name: 'Oak Log' },
  7: { r: 240, g: 245, b: 250, hex: '#f0f5fa', name: 'Snow' },
  8: { r: 219, g: 207, b: 153, hex: '#dbc199', name: 'Sand' },
  9: { r: 235, g: 178, b: 45, hex: '#ebb22d', name: 'Gold Ore' },
  10: { r: 65, g: 68, b: 75, hex: '#41444b', name: 'Deepslate' },
};

// LOD Colors matching Voxy's debug shader color pallette
export const LOD_COLORS: Record<number, { r: number; g: number; b: number; hex: string; label: string }> = {
  0: { r: 46, g: 204, b: 113, hex: '#2ecc71', label: 'LOD 0 (1:1 Native)' },
  1: { r: 52, g: 152, b: 219, hex: '#3498db', label: 'LOD 1 (2x2 Mip)' },
  2: { r: 155, g: 89, b: 182, hex: '#9b59b6', label: 'LOD 2 (4x4 Mip)' },
  3: { r: 230, g: 126, b: 34, hex: '#e67e22', label: 'LOD 3 (8x8 Mip)' },
  4: { r: 231, g: 76, b: 60, hex: '#e74c3c', label: 'LOD 4 (16x16 Mip)' },
  5: { r: 241, g: 196, b: 15, hex: '#f1c40f', label: 'LOD 5 (32x32 Mip)' },
  6: { r: 26, g: 188, b: 156, hex: '#1abc9c', label: 'LOD 6 (64x64 Mip)' },
  7: { r: 149, g: 165, b: 166, hex: '#95a5a6', label: 'LOD 7 (128x128 Mip)' },
};

export class ScanMesher {
  /**
   * Generates optimized 3D quads from 3D voxel density array
   * size: dimension of section (e.g. 16)
   */
  public static meshSection(voxels: Uint8Array, size = 16): QuadFace[] {
    const quads: QuadFace[] = [];
    const sizeSq = size * size;

    const getVoxel = (x: number, y: number, z: number): number => {
      if (x < 0 || x >= size || y < 0 || y >= size || z < 0 || z >= size) return 0;
      return voxels[x + y * size + z * sizeSq];
    };

    // 1. Scan Top & Bottom (+Y, -Y) faces
    for (let y = 0; y < size; y++) {
      for (const face of [0, 1] as (0 | 1)[]) {
        const ny = face === 0 ? y + 1 : y - 1;
        const mask = new Uint8Array(size * size);

        for (let z = 0; z < size; z++) {
          for (let x = 0; x < size; x++) {
            const current = getVoxel(x, y, z);
            if (current !== 0) {
              const neighbor = getVoxel(x, ny, z);
              // Face visible if neighbor is air or transparent
              if (neighbor === 0 || (neighbor === 4 && current !== 4)) {
                mask[x + z * size] = current;
              }
            }
          }
        }

        // Greedy 2D meshing over the mask
        for (let z = 0; z < size; z++) {
          for (let x = 0; x < size; ) {
            const block = mask[x + z * size];
            if (block === 0) {
              x++;
              continue;
            }

            // Compute width
            let w = 1;
            while (x + w < size && mask[(x + w) + z * size] === block) {
              w++;
            }

            // Compute height (along Z)
            let h = 1;
            let canExpand = true;
            while (z + h < size && canExpand) {
              for (let k = 0; k < w; k++) {
                if (mask[(x + k) + (z + h) * size] !== block) {
                  canExpand = false;
                  break;
                }
              }
              if (canExpand) h++;
            }

            // Clear masked area
            for (let dz = 0; dz < h; dz++) {
              for (let dx = 0; dx < w; dx++) {
                mask[(x + dx) + (z + dz) * size] = 0;
              }
            }

            quads.push({
              x,
              y: face === 0 ? y + 1 : y,
              z,
              w,
              h,
              face,
              blockType: block,
              light: face === 0 ? 1.0 : 0.6,
              ao: [1, 1, 1, 1],
            });

            x += w;
          }
        }
      }
    }

    // 2. Scan South & North (+Z, -Z) faces
    for (let z = 0; z < size; z++) {
      for (const face of [2, 3] as (2 | 3)[]) {
        const nz = face === 2 ? z + 1 : z - 1;
        const mask = new Uint8Array(size * size);

        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const current = getVoxel(x, y, z);
            if (current !== 0) {
              const neighbor = getVoxel(x, y, nz);
              if (neighbor === 0 || (neighbor === 4 && current !== 4)) {
                mask[x + y * size] = current;
              }
            }
          }
        }

        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; ) {
            const block = mask[x + y * size];
            if (block === 0) {
              x++;
              continue;
            }

            let w = 1;
            while (x + w < size && mask[(x + w) + y * size] === block) {
              w++;
            }

            let h = 1;
            let canExpand = true;
            while (y + h < size && canExpand) {
              for (let k = 0; k < w; k++) {
                if (mask[(x + k) + (y + h) * size] !== block) {
                  canExpand = false;
                  break;
                }
              }
              if (canExpand) h++;
            }

            for (let dy = 0; dy < h; dy++) {
              for (let dx = 0; dx < w; dx++) {
                mask[(x + dx) + (y + dy) * size] = 0;
              }
            }

            quads.push({
              x,
              y,
              z: face === 2 ? z + 1 : z,
              w,
              h,
              face,
              blockType: block,
              light: face === 2 ? 0.85 : 0.8,
              ao: [1, 1, 1, 1],
            });

            x += w;
          }
        }
      }
    }

    // 3. Scan East & West (+X, -X) faces
    for (let x = 0; x < size; x++) {
      for (const face of [4, 5] as (4 | 5)[]) {
        const nx = face === 4 ? x + 1 : x - 1;
        const mask = new Uint8Array(size * size);

        for (let y = 0; y < size; y++) {
          for (let z = 0; z < size; z++) {
            const current = getVoxel(x, y, z);
            if (current !== 0) {
              const neighbor = getVoxel(nx, y, z);
              if (neighbor === 0 || (neighbor === 4 && current !== 4)) {
                mask[z + y * size] = current;
              }
            }
          }
        }

        for (let y = 0; y < size; y++) {
          for (let z = 0; z < size; ) {
            const block = mask[z + y * size];
            if (block === 0) {
              z++;
              continue;
            }

            let w = 1;
            while (z + w < size && mask[(z + w) + y * size] === block) {
              w++;
            }

            let h = 1;
            let canExpand = true;
            while (y + h < size && canExpand) {
              for (let k = 0; k < w; k++) {
                if (mask[(z + k) + (y + h) * size] !== block) {
                  canExpand = false;
                  break;
                }
              }
              if (canExpand) h++;
            }

            for (let dy = 0; dy < h; dy++) {
              for (let dz = 0; dz < w; dz++) {
                mask[(z + dz) + (y + dy) * size] = 0;
              }
            }

            quads.push({
              x: face === 4 ? x + 1 : x,
              y,
              z,
              w,
              h,
              face,
              blockType: block,
              light: face === 4 ? 0.75 : 0.7,
              ao: [1, 1, 1, 1],
            });

            z += w;
          }
        }
      }
    }

    return quads;
  }
}
