import React, { useState } from 'react';
import { VoxyConfig, FogMode, SSAOMode, StorageBackendType, CompressorType, GraphicsBackendType, DEFAULT_VOXY_CONFIG, DEFAULT_VULKAN_CONFIG } from '../types/voxy';
import { X, Sliders, Monitor, Database, Cpu, Info, Check, RotateCcw, Flame, Zap } from 'lucide-react';
import { AVAILABLE_GPUS } from '../engine/vulkan/VulkanSupportLayer';

interface SodiumConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  config: VoxyConfig;
  onSaveConfig: (newConfig: VoxyConfig) => void;
  onOpenVulkanModal?: () => void;
}

export const SodiumConfigDialog: React.FC<SodiumConfigDialogProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onOpenVulkanModal,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'rendering' | 'vulkan' | 'storage'>('general');
  const [formState, setFormState] = useState<VoxyConfig>({
    ...DEFAULT_VOXY_CONFIG,
    ...config,
    vulkan: {
      ...DEFAULT_VULKAN_CONFIG,
      ...(config?.vulkan || {}),
    },
  });
  const [hoveredOptionTooltip, setHoveredOptionTooltip] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentVulkan = formState.vulkan || DEFAULT_VULKAN_CONFIG;

  const handleToggle = (key: keyof VoxyConfig) => {
    setFormState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleVulkanToggle = <K extends keyof typeof DEFAULT_VULKAN_CONFIG>(key: K) => {
    setFormState((prev) => {
      const prevVulkan = prev.vulkan || DEFAULT_VULKAN_CONFIG;
      return {
        ...prev,
        vulkan: {
          ...prevVulkan,
          [key]: !prevVulkan[key],
        },
      };
    });
  };

  const handleVulkanChange = <K extends keyof typeof DEFAULT_VULKAN_CONFIG>(key: K, value: typeof DEFAULT_VULKAN_CONFIG[K]) => {
    setFormState((prev) => {
      const prevVulkan = prev.vulkan || DEFAULT_VULKAN_CONFIG;
      return {
        ...prev,
        vulkan: {
          ...prevVulkan,
          [key]: value,
        },
      };
    });
  };

  const handleChange = <K extends keyof VoxyConfig>(key: K, value: VoxyConfig[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onSaveConfig(formState);
    onClose();
  };

  const handleResetDefaults = () => {
    setFormState({ ...DEFAULT_VOXY_CONFIG });
  };

  return (
    <div
      id="modal-voxy-config"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-3xl bg-stone-900 border border-stone-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-100 flex items-center gap-2">
                Voxy Settings
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  v0.4.3
                </span>
              </h2>
              <p className="text-xs text-stone-400">High-Performance LOD Engine Configuration</p>
            </div>
          </div>
          <button
            id="btn-close-config-modal"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-stone-800 bg-stone-950/30">
          <button
            id="tab-config-general"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'general'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            General
          </button>
          <button
            id="tab-config-rendering"
            onClick={() => setActiveTab('rendering')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'rendering'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Monitor className="w-4 h-4" />
            Rendering
          </button>
          <button
            id="tab-config-vulkan"
            onClick={() => setActiveTab('vulkan')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'vulkan'
                ? 'border-rose-500 text-rose-400 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Flame className="w-4 h-4" />
            Vulkan 1.3
          </button>
          <button
            id="tab-config-storage"
            onClick={() => setActiveTab('storage')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'storage'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Database className="w-4 h-4" />
            Storage & Engine
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Option: Enable Voxy */}
              <div
                onMouseEnter={() => setHoveredOptionTooltip('Fully enables or disables Voxy mod execution.')}
                onMouseLeave={() => setHoveredOptionTooltip(null)}
                className="flex items-center justify-between p-4 bg-stone-950/50 rounded-lg border border-stone-800 hover:border-stone-700 transition-colors"
              >
                <div>
                  <div className="text-sm font-semibold text-stone-200">Enable Voxy</div>
                  <div className="text-xs text-stone-400">Master switch for LOD rendering and background services</div>
                </div>
                <button
                  id="toggle-voxy-enabled"
                  onClick={() => handleToggle('enabled')}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    formState.enabled ? 'bg-sky-500' : 'bg-stone-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      formState.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Option: Service Threads */}
              <div
                onMouseEnter={() =>
                  setHoveredOptionTooltip('Number of dedicated worker threads in the ServiceThreadPool for voxelization and mipping.')
                }
                onMouseLeave={() => setHoveredOptionTooltip(null)}
                className="p-4 bg-stone-950/50 rounded-lg border border-stone-800 hover:border-stone-700 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-stone-200">Service Threads</div>
                    <div className="text-xs text-stone-400">Worker threads for chunk voxel conversion & meshing</div>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 bg-stone-800 text-sky-400 rounded-md font-bold">
                    {formState.serviceThreads} Threads
                  </span>
                </div>
                <input
                  id="input-service-threads"
                  type="range"
                  min="1"
                  max="16"
                  value={formState.serviceThreads}
                  onChange={(e) => handleChange('serviceThreads', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-stone-800 rounded-lg custom-range cursor-pointer"
                />
              </div>

              {/* Option: Use Sodium Builder Threads */}
              <div
                onMouseEnter={() =>
                  setHoveredOptionTooltip('Uses Sodium builder threads as part of Voxy thread pool to reduce stuttering.')
                }
                onMouseLeave={() => setHoveredOptionTooltip(null)}
                className="flex items-center justify-between p-4 bg-stone-950/50 rounded-lg border border-stone-800 hover:border-stone-700"
              >
                <div>
                  <div className="text-sm font-semibold text-stone-200">Use Sodium Threads</div>
                  <div className="text-xs text-stone-400">Share thread pool with Sodium chunk builders to minimize hitching</div>
                </div>
                <button
                  id="toggle-sodium-threads"
                  onClick={() => handleToggle('dontUseSodiumBuilderThreads')}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    !formState.dontUseSodiumBuilderThreads ? 'bg-sky-500' : 'bg-stone-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      !formState.dontUseSodiumBuilderThreads ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Option: Chunk Ingestion */}
              <div
                onMouseEnter={() =>
                  setHoveredOptionTooltip('Enables or disables Voxy ability to convert new loaded chunks into LoDs.')
                }
                onMouseLeave={() => setHoveredOptionTooltip(null)}
                className="flex items-center justify-between p-4 bg-stone-950/50 rounded-lg border border-stone-800 hover:border-stone-700"
              >
                <div>
                  <div className="text-sm font-semibold text-stone-200">Chunk Ingestion</div>
                  <div className="text-xs text-stone-400">Automatically capture and voxelize newly loaded world chunks</div>
                </div>
                <button
                  id="toggle-chunk-ingest"
                  onClick={() => handleToggle('ingestEnabled')}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    formState.ingestEnabled ? 'bg-sky-500' : 'bg-stone-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      formState.ingestEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: RENDERING */}
          {activeTab === 'rendering' && (
            <div className="space-y-4">
              {/* Option: Voxy Rendering */}
              <div
                onMouseEnter={() => setHoveredOptionTooltip('Enables or disables Voxy 3D Level of Detail drawing.')}
                onMouseLeave={() => setHoveredOptionTooltip(null)}
                className="flex items-center justify-between p-4 bg-stone-950/50 rounded-lg border border-stone-800 hover:border-stone-700"
              >
                <div>
                  <div className="text-sm font-semibold text-stone-200">Voxy 3D Rendering</div>
                  <div className="text-xs text-stone-400">Draw distant voxel LOD quads in the 3D viewport</div>
                </div>
                <button
                  id="toggle-rendering-enabled"
                  onClick={() => handleToggle('enableRendering')}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    formState.enableRendering ? 'bg-sky-500' : 'bg-stone-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      formState.enableRendering ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Option: Subdivision Size */}
              <div
                onMouseEnter={() =>
                  setHoveredOptionTooltip(
                    'Maximum size in pixels^2 of screenspace AABB before subdividing to smaller LoDs (Smaller = higher quality, higher GPU load).'
                  )
                }
                onMouseLeave={() => setHoveredOptionTooltip(null)}
                className="p-4 bg-stone-950/50 rounded-lg border border-stone-800 hover:border-stone-700 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-stone-200">Subdivision Size (Pixels²)</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        High Impact
                      </span>
                    </div>
                    <div className="text-xs text-stone-400">Screenspace error threshold for octree node refinement</div>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 bg-stone-800 text-sky-400 rounded-md font-bold">
                    {Math.round(formState.subDivisionSize)} px²
                  </span>
                </div>
                <input
                  id="input-subdivision-size"
                  type="range"
                  min="28"
                  max="256"
                  step="4"
                  value={formState.subDivisionSize}
                  onChange={(e) => handleChange('subDivisionSize', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-stone-800 rounded-lg custom-range cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                  <span>28 px² (Ultra Quality)</span>
                  <span>64 px² (Balanced)</span>
                  <span>256 px² (Max Performance)</span>
                </div>
              </div>

              {/* Option: Render Distance */}
              <div
                onMouseEnter={() =>
                  setHoveredOptionTooltip('Render distance of Voxy LODs in chunks (Spanning up to 1024 chunks).')
                }
                onMouseLeave={() => setHoveredOptionTooltip(null)}
                className="p-4 bg-stone-950/50 rounded-lg border border-stone-800 hover:border-stone-700 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-stone-200">Render Distance</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Medium Impact
                      </span>
                    </div>
                    <div className="text-xs text-stone-400">Maximum horizon radius for hierarchical sections</div>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 bg-stone-800 text-sky-400 rounded-md font-bold">
                    {Math.round(formState.sectionRenderDistance * 16)} Chunks ({Math.round(formState.sectionRenderDistance * 256)}m)
                  </span>
                </div>
                <input
                  id="input-render-distance"
                  type="range"
                  min="4"
                  max="48"
                  step="1"
                  value={formState.sectionRenderDistance}
                  onChange={(e) => handleChange('sectionRenderDistance', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-stone-800 rounded-lg custom-range cursor-pointer"
                />
              </div>

              {/* Option: Environmental Fog */}
              <div
                onMouseEnter={() =>
                  setHoveredOptionTooltip('Configures distance fog blending and horizon fade effects.')
                }
                onMouseLeave={() => setHoveredOptionTooltip(null)}
                className="flex items-center justify-between p-4 bg-stone-950/50 rounded-lg border border-stone-800 hover:border-stone-700"
              >
                <div>
                  <div className="text-sm font-semibold text-stone-200">Environmental Fog & Fade</div>
                  <div className="text-xs text-stone-400">Seamlessly blend LOD horizon into the sky</div>
                </div>
                <select
                  id="select-fog-mode"
                  value={formState.fogMode}
                  onChange={(e) => handleChange('fogMode', e.target.value as FogMode)}
                  className="bg-stone-800 border border-stone-700 text-stone-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 font-medium"
                >
                  <option value="FOG_AND_FADE">Fog and Fade</option>
                  <option value="FOG">Fog Only</option>
                  <option value="FADE">Fade Only</option>
                  <option value="OFF">Off</option>
                </select>
              </div>

              {/* Option: SSAO Mode */}
              <div
                onMouseEnter={() =>
                  setHoveredOptionTooltip(
                    'Mode for Screen Space Ambient Occlusion shading pass (Auto picks optimum profile).'
                  )
                }
                onMouseLeave={() => setHoveredOptionTooltip(null)}
                className="flex items-center justify-between p-4 bg-stone-950/50 rounded-lg border border-stone-800 hover:border-stone-700"
              >
                <div>
                  <div className="text-sm font-semibold text-stone-200">SSAO Mode</div>
                  <div className="text-xs text-stone-400">Screenspace ambient occlusion contact shadows</div>
                </div>
                <select
                  id="select-ssao-mode"
                  value={formState.ssaoMode}
                  onChange={(e) => handleChange('ssaoMode', e.target.value as SSAOMode)}
                  className="bg-stone-800 border border-stone-700 text-stone-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 font-medium"
                >
                  <option value="AUTO">Auto (Smart)</option>
                  <option value="BASIC">Basic (Fast)</option>
                  <option value="BETTER">Better (Balanced)</option>
                  <option value="BEST">Best (High Quality)</option>
                  <option value="OFF">Disabled</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 3: VULKAN & GRAPHICS API */}
          {activeTab === 'vulkan' && (
            <div className="space-y-4">
              {/* Graphics Backend Selection */}
              <div
                onMouseEnter={() => setHoveredOptionTooltip('Primary low-level graphics API pipeline.')}
                onMouseLeave={() => setHoveredOptionTooltip(null)}
                className="flex items-center justify-between p-4 bg-stone-950/50 rounded-lg border border-stone-800 hover:border-stone-700"
              >
                <div>
                  <div className="text-sm font-semibold text-stone-200">Graphics Backend API</div>
                  <div className="text-xs text-stone-400">Direct hardware pipeline for LOD rasterization and compute</div>
                </div>
                <select
                  id="select-graphics-backend"
                  value={currentVulkan.backend}
                  onChange={(e) => handleVulkanChange('backend', e.target.value as GraphicsBackendType)}
                  className="bg-stone-800 border border-stone-700 text-stone-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-rose-500 font-medium"
                >
                  <option value="VULKAN_1_3">Vulkan 1.3 (Recommended)</option>
                  <option value="OPENGL_4_6">OpenGL 4.6 (Legacy Core)</option>
                  <option value="WEBGPU">WebGPU Standard</option>
                </select>
              </div>

              {/* Physical GPU Selector */}
              <div
                onMouseEnter={() => setHoveredOptionTooltip('Target physical Vulkan device adapter.')}
                onMouseLeave={() => setHoveredOptionTooltip(null)}
                className="p-4 bg-stone-950/50 rounded-lg border border-stone-800 hover:border-stone-700 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-stone-200">Vulkan Physical GPU</div>
                    <div className="text-xs text-stone-400">Selected adapter for SPIR-V execution</div>
                  </div>
                  {onOpenVulkanModal && (
                    <button
                      id="btn-open-vulkan-diagnostics"
                      type="button"
                      onClick={onOpenVulkanModal}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-md hover:bg-rose-500/20"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Inspect SPIR-V & VMA</span>
                    </button>
                  )}
                </div>
                <select
                  id="select-vulkan-gpu"
                  value={currentVulkan.selectedGpu}
                  onChange={(e) => handleVulkanChange('selectedGpu', e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 text-stone-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-rose-500 font-mono"
                >
                  {AVAILABLE_GPUS.map((gpu) => (
                    <option key={gpu.id} value={gpu.id}>
                      {gpu.name} ({gpu.vulkanApiVersion})
                    </option>
                  ))}
                </select>
              </div>

              {/* Vulkan Hardware Extensions Toggles */}
              <div className="p-4 bg-stone-950/50 rounded-lg border border-stone-800 space-y-3">
                <div className="text-sm font-semibold text-stone-200">Vulkan 1.3 Feature Extensions</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                  <label className="flex items-center justify-between p-2 bg-stone-900/60 rounded border border-stone-800/80 cursor-pointer">
                    <div>
                      <div className="font-semibold text-stone-300">VK_EXT_mesh_shader</div>
                      <div className="text-[10px] text-stone-500">Task & Meshlet shading stages</div>
                    </div>
                    <input
                      id="checkbox-vulkan-mesh-shader"
                      type="checkbox"
                      checked={currentVulkan.enableMeshShaders}
                      onChange={() => handleVulkanToggle('enableMeshShaders')}
                      className="rounded bg-stone-800 border-stone-700 text-rose-500 focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 bg-stone-900/60 rounded border border-stone-800/80 cursor-pointer">
                    <div>
                      <div className="font-semibold text-stone-300">VK_KHR_draw_indirect_count</div>
                      <div className="text-[10px] text-stone-500">GPU-driven command emission</div>
                    </div>
                    <input
                      id="checkbox-vulkan-indirect-count"
                      type="checkbox"
                      checked={currentVulkan.enableIndirectDrawCount}
                      onChange={() => handleVulkanToggle('enableIndirectDrawCount')}
                      className="rounded bg-stone-800 border-stone-700 text-rose-500 focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 bg-stone-900/60 rounded border border-stone-800/80 cursor-pointer">
                    <div>
                      <div className="font-semibold text-stone-300">Async Compute Culling</div>
                      <div className="text-[10px] text-stone-500">Dedicated compute queue</div>
                    </div>
                    <input
                      id="checkbox-vulkan-async-compute"
                      type="checkbox"
                      checked={currentVulkan.asyncComputeCulling}
                      onChange={() => handleVulkanToggle('asyncComputeCulling')}
                      className="rounded bg-stone-800 border-stone-700 text-rose-500 focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 bg-stone-900/60 rounded border border-stone-800/80 cursor-pointer">
                    <div>
                      <div className="font-semibold text-stone-300">VMA Sub-Allocator</div>
                      <div className="text-[10px] text-stone-500">Fast memory heap arenas</div>
                    </div>
                    <input
                      id="checkbox-vulkan-vma"
                      type="checkbox"
                      checked={currentVulkan.memoryAllocator === 'VMA'}
                      onChange={() =>
                        handleVulkanChange(
                          'memoryAllocator',
                          currentVulkan.memoryAllocator === 'VMA' ? 'RAW_VULKAN' : 'VMA'
                        )
                      }
                      className="rounded bg-stone-800 border-stone-700 text-rose-500 focus:ring-0"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STORAGE & ENGINE */}
          {activeTab === 'storage' && (
            <div className="space-y-4">
              {/* Storage Backend */}
              <div className="flex items-center justify-between p-4 bg-stone-950/50 rounded-lg border border-stone-800 hover:border-stone-700">
                <div>
                  <div className="text-sm font-semibold text-stone-200">Storage Backend</div>
                  <div className="text-xs text-stone-400">Database engine for persistent LOD sections & world cache</div>
                </div>
                <select
                  id="select-storage-backend"
                  value={formState.storageBackend}
                  onChange={(e) => handleChange('storageBackend', e.target.value as StorageBackendType)}
                  className="bg-stone-800 border border-stone-700 text-stone-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 font-medium"
                >
                  <option value="LMDB">LMDB (Lightning Mapped DB)</option>
                  <option value="ROCKSDB">RocksDB (LSM-Tree)</option>
                  <option value="IN_MEMORY">In-Memory (High-Speed RAM)</option>
                  <option value="REDIS">Redis Networked Storage</option>
                </select>
              </div>

              {/* Compression */}
              <div className="flex items-center justify-between p-4 bg-stone-950/50 rounded-lg border border-stone-800 hover:border-stone-700">
                <div>
                  <div className="text-sm font-semibold text-stone-200">Storage Compressor</div>
                  <div className="text-xs text-stone-400">Voxel section compression algorithm</div>
                </div>
                <select
                  id="select-compressor"
                  value={formState.compressor}
                  onChange={(e) => handleChange('compressor', e.target.value as CompressorType)}
                  className="bg-stone-800 border border-stone-700 text-stone-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 font-medium"
                >
                  <option value="LZ4">LZ4 (Ultra Fast Compression)</option>
                  <option value="ZSTD">Zstandard (High Ratio)</option>
                  <option value="LZMA">LZMA (Extreme Archival)</option>
                  <option value="NONE">Uncompressed Raw</option>
                </select>
              </div>

              {/* Culling Optimizations */}
              <div className="p-4 bg-stone-950/50 rounded-lg border border-stone-800 space-y-3">
                <div className="text-sm font-semibold text-stone-200">Hardware & Shading Acceleration</div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                    <input
                      id="checkbox-frustum-cull"
                      type="checkbox"
                      checked={formState.frustumCulling}
                      onChange={() => handleToggle('frustumCulling')}
                      className="rounded bg-stone-800 border-stone-700 text-sky-500 focus:ring-0"
                    />
                    Frustum Culling (CPU/GPU)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                    <input
                      id="checkbox-hiz-cull"
                      type="checkbox"
                      checked={formState.hiZOcclusionCulling}
                      onChange={() => handleToggle('hiZOcclusionCulling')}
                      className="rounded bg-stone-800 border-stone-700 text-sky-500 focus:ring-0"
                    />
                    Hi-Z Hierarchical Occlusion
                  </label>
                  <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                    <input
                      id="checkbox-meshlet-batch"
                      type="checkbox"
                      checked={formState.meshletBatching}
                      onChange={() => handleToggle('meshletBatching')}
                      className="rounded bg-stone-800 border-stone-700 text-sky-500 focus:ring-0"
                    />
                    Meshlet Drawcall Batching
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tooltip Bar */}
        <div className="px-6 py-2.5 bg-stone-950 border-t border-stone-800/80 flex items-center gap-2 text-xs text-stone-400 min-h-[38px]">
          <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>{hoveredOptionTooltip || 'Hover over any option to view documentation & performance impact.'}</span>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-800 bg-stone-950/80">
          <button
            id="btn-reset-defaults"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <div className="flex items-center gap-3">
            <button
              id="btn-cancel-config"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-apply-config"
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-stone-950 rounded-lg transition-colors shadow-lg shadow-sky-500/20"
            >
              <Check className="w-4 h-4" />
              Apply & Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
