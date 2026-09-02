import React, { useState } from 'react';
import { X, Layers, Box, Cpu, Sparkles, Check, ArrowRight } from 'lucide-react';
import { BLOCK_COLORS, LOD_COLORS, ScanMesher } from '../engine/ScanMesher';

interface VoxelInspectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoxelInspector: React.FC<VoxelInspectorProps> = ({ isOpen, onClose }) => {
  const [selectedLod, setSelectedLod] = useState<number>(0);
  const [activeLayerY, setActiveLayerY] = useState<number>(8);
  const [selectedBlockType, setSelectedBlockType] = useState<number>(1);

  if (!isOpen) return null;

  // 16x16 mock section slice
  const renderVoxelGrid = () => {
    const cells = [];
    const gridSize = 16;

    for (let z = 0; z < gridSize; z++) {
      for (let x = 0; x < gridSize; x++) {
        // Deterministic voxel type for demo
        let type = 0;
        const distFromCenter = Math.hypot(x - 8, z - 8);
        if (activeLayerY < 4) {
          type = 10; // Deepslate
        } else if (activeLayerY < 8) {
          type = 3; // Stone
          if ((x * 7 + z * 13) % 19 === 0) type = 9; // Gold ore
        } else if (activeLayerY < 12) {
          type = distFromCenter < 6 ? 2 : 4; // Dirt / Water
        } else if (activeLayerY === 12) {
          type = distFromCenter < 6 ? 1 : 4; // Grass
        } else if (activeLayerY > 12 && distFromCenter < 4) {
          type = activeLayerY === 13 ? 6 : 5; // Tree log / leaves
        }

        const block = BLOCK_COLORS[type] || BLOCK_COLORS[0];
        const isAir = type === 0;

        cells.push(
          <div
            key={`${x}-${z}`}
            title={`Voxel (${x}, ${activeLayerY}, ${z}) - ${block.name}`}
            className="w-5 h-5 rounded-[2px] border border-stone-900/60 transition-all flex items-center justify-center text-[9px] font-mono select-none hover:scale-110 hover:z-10"
            style={{
              backgroundColor: isAir ? 'rgba(30, 41, 59, 0.4)' : block.hex,
              color: isAir ? '#64748b' : '#ffffff',
            }}
          >
            {isAir ? '·' : ''}
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <div
      id="modal-voxel-inspector"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-100">Voxel Section & Mipper Inspector</h2>
              <p className="text-xs text-stone-400">
                Inspect 16×16×16 chunk voxel layouts, greedy ScanMesher quad merging, and LOD mip downsampling
              </p>
            </div>
          </div>
          <button
            id="btn-close-inspector-modal"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* LOD Level Selector */}
          <div className="flex items-center justify-between p-3 bg-stone-950/60 rounded-lg border border-stone-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-stone-200">Inspect LOD Mip Level:</span>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((lod) => (
                <button
                  key={lod}
                  id={`btn-inspect-lod-${lod}`}
                  onClick={() => setSelectedLod(lod)}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                    selectedLod === lod
                      ? 'bg-sky-500 text-stone-950 shadow-md'
                      : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                  style={selectedLod === lod ? {} : { borderLeft: `3px solid ${LOD_COLORS[lod]?.hex}` }}
                >
                  LOD {lod} ({Math.pow(2, lod)}×)
                </button>
              ))}
            </div>
          </div>

          {/* 2-Column Inspector Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: 2D Section Slice Viewer */}
            <div className="p-4 bg-stone-950/60 rounded-lg border border-stone-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Section Slice (Y = {activeLayerY})
                </span>
                <span className="text-[11px] font-mono text-stone-500">16×16 Grid</span>
              </div>

              {/* Slice Grid */}
              <div className="flex justify-center p-2 bg-stone-900/80 rounded-lg border border-stone-800">
                <div className="grid grid-cols-16 gap-[2px]">{renderVoxelGrid()}</div>
              </div>

              {/* Y Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-stone-400 font-mono">
                  <span>Y-Layer Height:</span>
                  <span className="text-sky-400 font-bold">{activeLayerY} / 15</span>
                </div>
                <input
                  id="input-section-layer-y"
                  type="range"
                  min="0"
                  max="15"
                  value={activeLayerY}
                  onChange={(e) => setActiveLayerY(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-stone-800 rounded-lg custom-range cursor-pointer"
                />
              </div>
            </div>

            {/* Right: Mipper & Mesher Telemetry */}
            <div className="space-y-4">
              <div className="p-4 bg-stone-950/60 rounded-lg border border-stone-800 space-y-3 font-mono text-xs">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-400 font-sans flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>ScanMesher Optimization</span>
                </div>

                <div className="space-y-2 text-stone-300 text-[11px]">
                  <div className="flex justify-between p-2 bg-stone-900/60 rounded border border-stone-800/60">
                    <span className="text-stone-400">Raw Cube Faces:</span>
                    <span className="text-stone-100 font-bold">2,496 Quads</span>
                  </div>
                  <div className="flex justify-between p-2 bg-stone-900/60 rounded border border-stone-800/60">
                    <span className="text-stone-400">Greedy Merged Faces:</span>
                    <span className="text-emerald-400 font-bold">342 Quads (-86.3%)</span>
                  </div>
                  <div className="flex justify-between p-2 bg-stone-900/60 rounded border border-stone-800/60">
                    <span className="text-stone-400">Mipper Downsample:</span>
                    <span className="text-sky-400 font-bold">
                      {selectedLod === 0 ? '1:1 Full Detail' : `${Math.pow(2, selectedLod)}× Box Average`}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-stone-900/60 rounded border border-stone-800/60">
                    <span className="text-stone-400">VRAM Buffer Size:</span>
                    <span className="text-stone-100 font-bold">10.9 KB</span>
                  </div>
                </div>
              </div>

              {/* Palette Legend */}
              <div className="p-4 bg-stone-950/60 rounded-lg border border-stone-800 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Block Texture Palette
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(BLOCK_COLORS)
                    .filter(([type]) => type !== '0')
                    .map(([type, block]) => (
                      <div
                        key={type}
                        className="flex items-center gap-2 p-1.5 bg-stone-900/60 rounded border border-stone-800/50"
                      >
                        <span
                          className="w-3.5 h-3.5 rounded border border-stone-700 shrink-0"
                          style={{ backgroundColor: block.hex }}
                        />
                        <span className="text-stone-300 text-[11px] truncate">{block.name}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
