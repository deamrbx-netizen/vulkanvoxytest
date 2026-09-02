import React from 'react';
import { Sliders, UploadCloud, Box, Zap, Terminal, RefreshCw, Eye, Sparkles, Flame } from 'lucide-react';
import { VoxyConfig, RenderStatisticsData } from '../types/voxy';

interface TopNavigationBarProps {
  config: VoxyConfig;
  currentWorldName: string;
  stats: RenderStatisticsData;
  onOpenConfig: () => void;
  onOpenImporter: () => void;
  onOpenInspector: () => void;
  onOpenBenchmarks: () => void;
  onOpenVulkan: () => void;
  onToggleConsole: () => void;
  onReload: () => void;
}

export const TopNavigationBar: React.FC<TopNavigationBarProps> = ({
  config,
  currentWorldName,
  stats,
  onOpenConfig,
  onOpenImporter,
  onOpenInspector,
  onOpenBenchmarks,
  onOpenVulkan,
  onToggleConsole,
  onReload,
}) => {
  return (
    <header
      id="voxy-main-header"
      className="h-14 bg-stone-950/90 backdrop-blur-md border-b border-stone-800/80 px-4 flex items-center justify-between z-30 shrink-0 select-none"
    >
      {/* Brand & World Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 p-0.5 shadow-lg shadow-sky-500/10">
            <div className="w-full h-full bg-stone-950 rounded-[6px] flex items-center justify-center text-sky-400 font-black text-sm tracking-tighter">
              VX
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-stone-100">VOXY</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
                LOD ENGINE
              </span>
            </div>
            <div className="text-[11px] text-stone-400 truncate max-w-[200px] flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <span>{currentWorldName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Feature Action Buttons */}
      <div className="flex items-center gap-1.5">
        {/* Vulkan Layer Dedicated Quick Button */}
        <button
          id="nav-btn-vulkan"
          onClick={onOpenVulkan}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-300 hover:text-rose-200 transition-all shadow-sm group"
        >
          <Flame className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
          <span>Vulkan 1.3</span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">
            {(config?.vulkan?.backend || 'VULKAN_1_3') === 'VULKAN_1_3' ? 'DIRECT' : (config?.vulkan?.backend || 'VULKAN_1_3')}
          </span>
        </button>

        <button
          id="nav-btn-config"
          onClick={onOpenConfig}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-xs font-medium text-stone-200 hover:text-white transition-colors shadow-sm"
        >
          <Sliders className="w-3.5 h-3.5 text-sky-400" />
          <span>Settings</span>
        </button>

        <button
          id="nav-btn-importer"
          onClick={onOpenImporter}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-xs font-medium text-stone-200 hover:text-white transition-colors shadow-sm"
        >
          <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
          <span>Ingest World</span>
        </button>

        <button
          id="nav-btn-inspector"
          onClick={onOpenInspector}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-xs font-medium text-stone-200 hover:text-white transition-colors shadow-sm"
        >
          <Box className="w-3.5 h-3.5 text-purple-400" />
          <span>Section Mips</span>
        </button>

        <button
          id="nav-btn-benchmark"
          onClick={onOpenBenchmarks}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-xs font-medium text-stone-200 hover:text-white transition-colors shadow-sm"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>JMH Benchmarks</span>
        </button>

        <div className="h-5 w-[1px] bg-stone-800 mx-1" />

        {/* Reload Pipeline */}
        <button
          id="nav-btn-reload"
          onClick={onReload}
          title="Reload Renderer and Octree Nodes (/voxy reload)"
          className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* In-Engine Console */}
        <button
          id="nav-btn-console"
          onClick={onToggleConsole}
          title="Open In-Engine CLI Terminal"
          className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white transition-colors"
        >
          <Terminal className="w-3.5 h-3.5 text-sky-400" />
        </button>
      </div>
    </header>
  );
};
