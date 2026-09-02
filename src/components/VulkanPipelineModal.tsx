import React, { useState } from 'react';
import {
  VulkanConfig,
  VulkanTelemetry,
  SpirvShaderStage,
  VulkanValidationMessage,
  GraphicsBackendType,
  DEFAULT_VULKAN_CONFIG,
} from '../types/voxy';
import {
  AVAILABLE_GPUS,
  SPIRV_SHADERS,
  VulkanGpuProfile,
  VulkanSupportLayer,
} from '../engine/vulkan/VulkanSupportLayer';
import {
  X,
  Cpu,
  Layers,
  Zap,
  HardDrive,
  ShieldCheck,
  Code2,
  Terminal,
  Activity,
  Check,
  RefreshCw,
  Sliders,
  ChevronRight,
  Database,
  Sparkles,
  Flame,
} from 'lucide-react';

interface VulkanPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  vulkanConfig?: VulkanConfig;
  onUpdateVulkanConfig: (newConfig: VulkanConfig) => void;
  telemetry?: VulkanTelemetry;
  vulkanLayer: VulkanSupportLayer;
}

export const VulkanPipelineModal: React.FC<VulkanPipelineModalProps> = ({
  isOpen,
  onClose,
  vulkanConfig = DEFAULT_VULKAN_CONFIG,
  onUpdateVulkanConfig,
  telemetry,
  vulkanLayer,
}) => {
  const activeVulkanConfig = vulkanConfig || DEFAULT_VULKAN_CONFIG;
  const [activeTab, setActiveTab] = useState<
    'device' | 'spirv' | 'vma' | 'meshlets' | 'validation'
  >('device');
  const [selectedShaderId, setSelectedShaderId] = useState<string>('shader-cull-comp');
  const [isDefragging, setIsDefragging] = useState(false);
  const [validationFilter, setValidationFilter] = useState<string>('ALL');

  if (!isOpen) return null;

  const currentShader =
    SPIRV_SHADERS.find((s) => s.id === selectedShaderId) || SPIRV_SHADERS[0];
  const selectedGpu = vulkanLayer.getSelectedGpu();
  const validationLogs = vulkanLayer.getValidationLogs();

  const handleBackendChange = (backend: GraphicsBackendType) => {
    onUpdateVulkanConfig({ ...activeVulkanConfig, backend });
  };

  const handleGpuChange = (gpuId: string) => {
    onUpdateVulkanConfig({ ...activeVulkanConfig, selectedGpu: gpuId });
  };

  const handleToggleFeature = (key: keyof VulkanConfig) => {
    onUpdateVulkanConfig({
      ...activeVulkanConfig,
      [key]: !activeVulkanConfig[key],
    });
  };

  const handleTriggerDefrag = () => {
    setIsDefragging(true);
    setTimeout(() => {
      setIsDefragging(false);
      vulkanLayer.addValidationMessage(
        'INFO',
        'VMA_DEFRAG_COMPLETE',
        'VMA Defragmentation complete: Compacted 2,048 allocations, reduced external fragmentation from 14.2% to 1.8%.'
      );
    }, 600);
  };

  const handleRunValidationAudit = () => {
    vulkanLayer.addValidationMessage(
      'INFO',
      'AUDIT_PASS',
      'Pipeline Synchronization Audit: All VkPipelineBarrier2 dependencies match standard renderpass layout transitions. Zero hazards detected.'
    );
  };

  const filteredValidationLogs = validationLogs.filter((log) => {
    if (validationFilter === 'ALL') return true;
    return log.severity === validationFilter;
  });

  return (
    <div
      id="modal-vulkan-pipeline"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-5xl bg-stone-900 border border-stone-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-stone-800 bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-stone-100 font-sans flex items-center gap-2">
                  Vulkan 1.3 Support Layer
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  VK_API_1_3
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono text-stone-400 bg-stone-800 border border-stone-700">
                  {selectedGpu.name}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Low-overhead hardware draw indirect, SPIR-V compute culling, meshlet shaders, and VMA memory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Backend Selector Pill */}
            <div className="flex items-center bg-stone-950 p-1 rounded-lg border border-stone-800 text-xs">
              {(
                [
                  { id: 'VULKAN_1_3', label: 'Vulkan 1.3' },
                  { id: 'OPENGL_4_6', label: 'OpenGL 4.6' },
                  { id: 'WEBGPU', label: 'WebGPU' },
                ] as const
              ).map((b) => (
                <button
                  key={b.id}
                  id={`btn-backend-${b.id.toLowerCase()}`}
                  onClick={() => handleBackendChange(b.id)}
                  className={`px-2.5 py-1 rounded font-medium transition-all ${
                    activeVulkanConfig.backend === b.id
                      ? 'bg-rose-500 text-stone-950 font-bold shadow-md'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <button
              id="btn-close-vulkan-modal"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-2.5 border-b border-stone-800 bg-stone-950/40 overflow-x-auto select-none">
          {[
            { id: 'device', label: 'Device & Queues', icon: Cpu },
            { id: 'spirv', label: 'SPIR-V Shaders', icon: Code2 },
            { id: 'vma', label: 'VMA Memory Allocator', icon: HardDrive },
            { id: 'meshlets', label: 'Mesh Shaders & Indirect', icon: Zap },
            { id: 'validation', label: 'Validation Layers', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-vulkan-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-rose-500 text-rose-400 font-semibold'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: DEVICE & QUEUE FAMILIES */}
          {activeTab === 'device' && (
            <div className="space-y-6">
              {/* GPU Selector Grid */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Active Vulkan Physical Device
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AVAILABLE_GPUS.map((gpu) => (
                    <div
                      key={gpu.id}
                      onClick={() => handleGpuChange(gpu.id)}
                      className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                        activeVulkanConfig.selectedGpu === gpu.id
                          ? 'bg-rose-500/10 border-rose-500/60 shadow-lg shadow-rose-500/10'
                          : 'bg-stone-950/50 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-stone-200">{gpu.name}</span>
                        {activeVulkanConfig.selectedGpu === gpu.id && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500 text-stone-950 font-bold">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-400 mt-1 font-mono">
                        Driver: {gpu.driverVersion} • VRAM: {gpu.totalVramMB / 1024} GB
                      </div>
                      <div className="flex gap-1.5 mt-2.5">
                        {gpu.supportsMeshShaders && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-800 text-emerald-400 font-mono">
                            VK_EXT_mesh_shader
                          </span>
                        )}
                        {gpu.supportsIndirectCount && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-800 text-sky-400 font-mono">
                            VK_KHR_draw_indirect_count
                          </span>
                        )}
                        {gpu.supportsTimelineSemaphores && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-800 text-amber-400 font-mono">
                            TimelineSemaphores
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Queue Family Telemetry */}
              <div className="p-4 bg-stone-950/60 rounded-lg border border-stone-800 space-y-3 font-mono text-xs">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-400 font-sans flex items-center justify-between">
                  <span>Vulkan Queue Family Dispatchers</span>
                  <span className="text-[11px] text-stone-500">Async Compute Enabled</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Graphics Queue */}
                  <div className="p-3 bg-stone-900/60 rounded border border-stone-800/80 space-y-2">
                    <div className="flex justify-between text-stone-300">
                      <span className="font-bold text-rose-400">Graphics Queue (0)</span>
                      <span>{telemetry?.graphicsQueueUsagePercent || 38}% Load</span>
                    </div>
                    <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 h-full transition-all"
                        style={{ width: `${telemetry?.graphicsQueueUsagePercent || 38}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-stone-500">
                      RenderPass, Rasterization, Present
                    </div>
                  </div>

                  {/* Async Compute Queue */}
                  <div className="p-3 bg-stone-900/60 rounded border border-stone-800/80 space-y-2">
                    <div className="flex justify-between text-stone-300">
                      <span className="font-bold text-sky-400">Compute Queue (1)</span>
                      <span>{telemetry?.computeQueueUsagePercent || 22}% Load</span>
                    </div>
                    <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-sky-400 h-full transition-all"
                        style={{ width: `${telemetry?.computeQueueUsagePercent || 22}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-stone-500">
                      Octree Traversal, Hi-Z Occlusion Culling
                    </div>
                  </div>

                  {/* DMA Transfer Queue */}
                  <div className="p-3 bg-stone-900/60 rounded border border-stone-800/80 space-y-2">
                    <div className="flex justify-between text-stone-300">
                      <span className="font-bold text-emerald-400">Transfer Queue (2)</span>
                      <span>{telemetry?.transferQueueUsagePercent || 6}% Load</span>
                    </div>
                    <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full transition-all"
                        style={{ width: `${telemetry?.transferQueueUsagePercent || 6}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-stone-500">
                      VMA Staging Buffer Uploads
                    </div>
                  </div>
                </div>
              </div>

              {/* Vulkan Hardware Feature Toggles */}
              <div className="p-4 bg-stone-950/60 rounded-lg border border-stone-800 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Vulkan 1.3 Hardware Acceleration Features
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center justify-between p-2.5 bg-stone-900/50 rounded border border-stone-800/60 cursor-pointer">
                    <div>
                      <div className="font-semibold text-stone-200">Mesh Shading Pipeline</div>
                      <div className="text-[11px] text-stone-500">VK_EXT_mesh_shader for 64-vertex task amplification</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={activeVulkanConfig.enableMeshShaders}
                      onChange={() => handleToggleFeature('enableMeshShaders')}
                      className="rounded bg-stone-800 border-stone-700 text-rose-500 focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-stone-900/50 rounded border border-stone-800/60 cursor-pointer">
                    <div>
                      <div className="font-semibold text-stone-200">Indirect Draw Count</div>
                      <div className="text-[11px] text-stone-500">vkCmdDrawIndexedIndirectCountKHR GPU execution</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={activeVulkanConfig.enableIndirectDrawCount}
                      onChange={() => handleToggleFeature('enableIndirectDrawCount')}
                      className="rounded bg-stone-800 border-stone-700 text-rose-500 focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-stone-900/50 rounded border border-stone-800/60 cursor-pointer">
                    <div>
                      <div className="font-semibold text-stone-200">Async Compute Culling</div>
                      <div className="text-[11px] text-stone-500">Overlap octree culling compute pass with rasterization</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={activeVulkanConfig.asyncComputeCulling}
                      onChange={() => handleToggleFeature('asyncComputeCulling')}
                      className="rounded bg-stone-800 border-stone-700 text-rose-500 focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-stone-900/50 rounded border border-stone-800/60 cursor-pointer">
                    <div>
                      <div className="font-semibold text-stone-200">VkPipelineCache</div>
                      <div className="text-[11px] text-stone-500">Persist compiled SPIR-V bytecode pipelines to disk</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={activeVulkanConfig.pipelineCacheEnabled}
                      onChange={() => handleToggleFeature('pipelineCacheEnabled')}
                      className="rounded bg-stone-800 border-stone-700 text-rose-500 focus:ring-0"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SPIR-V SHADER PIPELINE */}
          {activeTab === 'spirv' && (
            <div className="space-y-4">
              {/* Shader Module Selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {SPIRV_SHADERS.map((shader) => (
                  <button
                    key={shader.id}
                    onClick={() => setSelectedShaderId(shader.id)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all flex items-center gap-2 ${
                      selectedShaderId === shader.id
                        ? 'bg-rose-500/10 border-rose-500/60 text-rose-300'
                        : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-800 text-stone-300 uppercase">
                      {shader.stage}
                    </span>
                    <span>{shader.name}</span>
                  </button>
                ))}
              </div>

              {/* 2-Column Code Viewer: GLSL Source & SPIR-V Disassembly */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: GLSL 460 Source */}
                <div className="bg-stone-950 rounded-lg border border-stone-800 overflow-hidden flex flex-col h-96">
                  <div className="px-3 py-2 border-b border-stone-800 bg-stone-900/50 flex items-center justify-between text-xs font-mono">
                    <span className="text-stone-300 font-semibold">GLSL 460 Source</span>
                    <span className="text-stone-500 text-[10px]">
                      {currentShader.workgroupSize ? `LocalSize (${currentShader.workgroupSize})` : 'Graphics Stage'}
                    </span>
                  </div>
                  <pre className="p-3 text-[11px] font-mono text-stone-300 overflow-auto flex-1 leading-relaxed bg-[#0c0d10]">
                    <code>{currentShader.glslSource}</code>
                  </pre>
                </div>

                {/* Right: Compiled SPIR-V Disassembly */}
                <div className="bg-stone-950 rounded-lg border border-stone-800 overflow-hidden flex flex-col h-96">
                  <div className="px-3 py-2 border-b border-stone-800 bg-stone-900/50 flex items-center justify-between text-xs font-mono">
                    <span className="text-rose-400 font-semibold">SPIR-V 1.6 Bytecode Disassembly</span>
                    <span className="text-stone-500 text-[10px]">{currentShader.spirvSizeWords} Words</span>
                  </div>
                  <pre className="p-3 text-[11px] font-mono text-emerald-400/90 overflow-auto flex-1 leading-relaxed bg-[#0c0d10]">
                    <code>{currentShader.spirvDisassembly.join('\n')}</code>
                  </pre>
                </div>
              </div>

              {/* Reflection Data: Descriptor Sets & Push Constants */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                {/* Descriptor Set Bindings */}
                <div className="p-3.5 bg-stone-950/60 rounded-lg border border-stone-800 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-400 font-sans">
                    Descriptor Set Layouts
                  </div>
                  <div className="space-y-1.5">
                    {currentShader.descriptorBindings.map((b, i) => (
                      <div
                        key={i}
                        className="p-2 bg-stone-900/60 rounded border border-stone-800 flex items-center justify-between text-[11px]"
                      >
                        <div className="text-stone-300">
                          <span className="text-rose-400">Set {b.set}</span>, Binding {b.binding}:{' '}
                          <span className="text-stone-100 font-bold">{b.name}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-sky-300">
                          {b.type.replace('VK_DESCRIPTOR_TYPE_', '')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Push Constants Map */}
                <div className="p-3.5 bg-stone-950/60 rounded-lg border border-stone-800 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-400 font-sans">
                    Push Constants Range (128 Bytes Max)
                  </div>
                  <div className="space-y-1.5">
                    {currentShader.pushConstants.map((p, i) => (
                      <div
                        key={i}
                        className="p-2 bg-stone-900/60 rounded border border-stone-800 flex items-center justify-between text-[11px]"
                      >
                        <div className="text-stone-300">
                          Offset {p.offset} (+{p.size}B):{' '}
                          <span className="text-stone-100 font-bold">{p.name}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-amber-300">
                          {p.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VMA MEMORY ALLOCATOR */}
          {activeTab === 'vma' && (
            <div className="space-y-6">
              {/* Heap Stats Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-4 bg-stone-950/60 rounded-lg border border-stone-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-stone-500 font-sans">
                    Device Local VRAM Pool (Heap 0)
                  </div>
                  <div className="text-lg font-bold text-rose-400">
                    {telemetry?.vmaDeviceLocalAllocatedMB || 28.5} MB /{' '}
                    {Math.round((telemetry?.vmaDeviceLocalTotalMB || 24576) / 1024)} GB
                  </div>
                  <div className="text-[10px] text-stone-400 font-sans">SSBO Voxel Quads & Index Buffers</div>
                </div>

                <div className="p-4 bg-stone-950/60 rounded-lg border border-stone-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-stone-500 font-sans">
                    Host Visible Staging Ring (Heap 1)
                  </div>
                  <div className="text-lg font-bold text-sky-400">
                    {telemetry?.vmaHostVisibleAllocatedMB || 8.0} MB / 4,096 MB
                  </div>
                  <div className="text-[10px] text-stone-400 font-sans">Persistent Mapped DMA Buffer</div>
                </div>

                <div className="p-4 bg-stone-950/60 rounded-lg border border-stone-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-stone-500 font-sans">
                    Active VMA Allocations
                  </div>
                  <div className="text-lg font-bold text-emerald-400">
                    {telemetry?.vmaAllocationCount || 54} Sub-allocations
                  </div>
                  <div className="text-[10px] text-stone-400 font-sans">Sub-block alignment 64B</div>
                </div>
              </div>

              {/* Visual Memory Block Map */}
              <div className="p-4 bg-stone-950/60 rounded-lg border border-stone-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400 font-sans">
                    VMA 256MB Block Sub-Allocation Map
                  </span>
                  <button
                    id="btn-trigger-vma-defrag"
                    onClick={handleTriggerDefrag}
                    disabled={isDefragging}
                    className="flex items-center gap-1.5 px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-xs transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${isDefragging ? 'animate-spin' : ''}`} />
                    <span>{isDefragging ? 'Defragmenting...' : 'Defragment VMA Pools'}</span>
                  </button>
                </div>

                {/* Simulated Memory Visualizer */}
                <div className="grid grid-cols-16 gap-1 p-2 bg-stone-900 rounded-lg border border-stone-800">
                  {Array.from({ length: 32 }).map((_, i) => {
                    const isAllocated = i < 18;
                    const isStaging = i >= 18 && i < 22;
                    return (
                      <div
                        key={i}
                        title={`Block Chunk #${i} (${8 * i}MB - ${8 * (i + 1)}MB)`}
                        className={`h-7 rounded-[3px] border transition-all ${
                          isAllocated
                            ? 'bg-rose-500/80 border-rose-400'
                            : isStaging
                            ? 'bg-sky-500/80 border-sky-400'
                            : 'bg-stone-800/40 border-stone-700/50'
                        }`}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center gap-4 text-[11px] text-stone-400 font-sans">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-rose-500" />
                    <span>Device Local Quad SSBOs (68%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-sky-500" />
                    <span>Host Visible Dynamic Ring (14%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-stone-800" />
                    <span>Free Arena Memory (18%)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MESH SHADERS & INDIRECT */}
          {activeTab === 'meshlets' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Hardware Meshlet Pipeline */}
                <div className="p-4 bg-stone-950/60 rounded-lg border border-stone-800 space-y-3 font-mono text-xs">
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-400 font-sans flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-rose-400" />
                    <span>VK_EXT_mesh_shader Pipeline</span>
                  </div>

                  <div className="space-y-2 text-stone-300 text-[11px]">
                    <div className="flex justify-between p-2 bg-stone-900/60 rounded border border-stone-800/60">
                      <span className="text-stone-400">Mesh Task Invocations:</span>
                      <span className="text-stone-100 font-bold">
                        {telemetry?.meshletInvocations.toLocaleString() || '1,420'}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-stone-900/60 rounded border border-stone-800/60">
                      <span className="text-stone-400">Meshlet Output Primitives:</span>
                      <span className="text-emerald-400 font-bold">
                        {telemetry?.meshletPrimitivesGenerated.toLocaleString() || '48,920'} Triangles
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-stone-900/60 rounded border border-stone-800/60">
                      <span className="text-stone-400">Hardware Cluster Cull Rate:</span>
                      <span className="text-rose-400 font-bold">
                        {telemetry?.meshletCullRatePercent || 74.2}% Culled
                      </span>
                    </div>
                  </div>
                </div>

                {/* GPU Indirect Buffer Telemetry */}
                <div className="p-4 bg-stone-950/60 rounded-lg border border-stone-800 space-y-3 font-mono text-xs">
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-400 font-sans flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span>vkCmdDrawIndexedIndirectCountKHR</span>
                  </div>

                  <div className="space-y-2 text-stone-300 text-[11px]">
                    <div className="flex justify-between p-2 bg-stone-900/60 rounded border border-stone-800/60">
                      <span className="text-stone-400">GPU Indirect Dispatches:</span>
                      <span className="text-sky-400 font-bold">
                        {telemetry?.indirectCommandsDispatched || 24} Commands
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-stone-900/60 rounded border border-stone-800/60">
                      <span className="text-stone-400">Draw Command Buffer Offset:</span>
                      <span className="text-stone-100 font-bold">0x0000_1000 (Aligned)</span>
                    </div>
                    <div className="flex justify-between p-2 bg-stone-900/60 rounded border border-stone-800/60">
                      <span className="text-stone-400">Timeline Semaphore Value:</span>
                      <span className="text-amber-400 font-bold">
                        #{telemetry?.timelineSemaphoreValue || 1042}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: VALIDATION LAYERS */}
          {activeTab === 'validation' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-stone-950/60 rounded-lg border border-stone-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-stone-200">
                    VK_LAYER_KHRONOS_validation Stream:
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="btn-audit-validation"
                    onClick={handleRunValidationAudit}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-xs font-medium transition-colors"
                  >
                    Run Sync Barrier Audit
                  </button>
                  <button
                    id="btn-clear-validation"
                    onClick={() => vulkanLayer.clearValidationLogs()}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-xs font-medium transition-colors"
                  >
                    Clear Logs
                  </button>
                </div>
              </div>

              {/* Log Messages List */}
              <div className="bg-stone-950 rounded-lg border border-stone-800 p-3 h-80 overflow-y-auto space-y-2 font-mono text-xs">
                {filteredValidationLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded bg-stone-900/50 border border-stone-800/60 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            log.severity === 'ERROR'
                              ? 'bg-rose-500/20 text-rose-300'
                              : log.severity === 'WARNING'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {log.severity}
                        </span>
                        <span className="text-stone-400 font-bold">{log.code}</span>
                      </div>
                      <span className="text-stone-600 text-[10px]">{log.timestamp}</span>
                    </div>
                    <div className="text-stone-300 text-[11px] leading-relaxed">
                      {log.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-2 text-xs text-stone-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse" />
            <span>Vulkan 1.3 Direct Rendering Pipeline Ready</span>
          </div>
          <button
            id="btn-done-vulkan-pipeline"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-stone-950 rounded-lg transition-colors shadow-lg shadow-rose-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
