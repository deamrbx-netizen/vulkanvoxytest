export type FogMode = 'FOG_AND_FADE' | 'FOG' | 'FADE' | 'OFF';
export type SSAOMode = 'AUTO' | 'BASIC' | 'BETTER' | 'BEST' | 'OFF';
export type StorageBackendType = 'LMDB' | 'ROCKSDB' | 'REDIS' | 'IN_MEMORY';
export type CompressorType = 'LZ4' | 'ZSTD' | 'LZMA' | 'NONE';
export type GraphicsBackendType = 'VULKAN_1_3' | 'OPENGL_4_6' | 'WEBGPU';

export type RenderMode =
  | 'NORMAL'
  | 'LOD_LEVEL'
  | 'WIREFRAME'
  | 'BOUNDING_BOX'
  | 'DEPTH_MAP'
  | 'NORMALS'
  | 'HEATMAP';

export interface VulkanConfig {
  backend: GraphicsBackendType;
  selectedGpu: string;
  enableMeshShaders: boolean; // VK_EXT_mesh_shader / VK_NV_mesh_shader
  enableIndirectDrawCount: boolean; // VK_KHR_draw_indirect_count
  enableDescriptorIndexing: boolean; // VK_EXT_descriptor_indexing
  enableTimelineSemaphores: boolean; // VK_KHR_timeline_semaphore
  enableValidationLayers: boolean; // VK_LAYER_KHRONOS_validation
  memoryAllocator: 'VMA' | 'RAW_VULKAN';
  pipelineCacheEnabled: boolean;
  presentMode: 'VK_PRESENT_MODE_MAILBOX_KHR' | 'VK_PRESENT_MODE_FIFO_KHR' | 'VK_PRESENT_MODE_IMMEDIATE_KHR';
  asyncComputeCulling: boolean;
}

export interface VoxyConfig {
  enabled: boolean;
  enableRendering: boolean;
  ingestEnabled: boolean;
  sectionRenderDistance: number; // in Top-Level LODs (x16 chunks) -> 10 to 64 (160 to 1024 chunks)
  serviceThreads: number;
  subDivisionSize: number; // Pixels^2 screenspace error (28 to 256)
  fogMode: FogMode;
  dontUseSodiumBuilderThreads: boolean;
  ssaoMode: SSAOMode;
  storageBackend: StorageBackendType;
  compressor: CompressorType;
  meshletBatching: boolean;
  frustumCulling: boolean;
  hiZOcclusionCulling: boolean;
  vulkan?: VulkanConfig;
}

export const DEFAULT_VULKAN_CONFIG: VulkanConfig = {
  backend: 'VULKAN_1_3',
  selectedGpu: 'gpu-rtx4090',
  enableMeshShaders: true,
  enableIndirectDrawCount: true,
  enableDescriptorIndexing: true,
  enableTimelineSemaphores: true,
  enableValidationLayers: true,
  memoryAllocator: 'VMA',
  pipelineCacheEnabled: true,
  presentMode: 'VK_PRESENT_MODE_MAILBOX_KHR',
  asyncComputeCulling: true,
};

export const DEFAULT_VOXY_CONFIG: VoxyConfig = {
  enabled: true,
  enableRendering: true,
  ingestEnabled: true,
  sectionRenderDistance: 16, // 16 * 16 = 256 chunks
  serviceThreads: 8,
  subDivisionSize: 64,
  fogMode: 'FOG_AND_FADE',
  dontUseSodiumBuilderThreads: false,
  ssaoMode: 'AUTO',
  storageBackend: 'LMDB',
  compressor: 'LZ4',
  meshletBatching: true,
  frustumCulling: true,
  hiZOcclusionCulling: true,
  vulkan: DEFAULT_VULKAN_CONFIG,
};

export interface VulkanTelemetry {
  gpuName: string;
  driverVersion: string;
  vulkanApiVersion: string;
  graphicsQueueUsagePercent: number;
  computeQueueUsagePercent: number;
  transferQueueUsagePercent: number;
  vmaDeviceLocalAllocatedMB: number;
  vmaDeviceLocalTotalMB: number;
  vmaHostVisibleAllocatedMB: number;
  vmaHostVisibleTotalMB: number;
  vmaAllocationCount: number;
  indirectCommandsDispatched: number;
  meshletInvocations: number;
  meshletPrimitivesGenerated: number;
  meshletCullRatePercent: number;
  validationWarningsCount: number;
  pipelineCacheHits: number;
  timelineSemaphoreValue: number;
}

export interface SpirvShaderStage {
  id: string;
  name: string;
  stage: 'COMPUTE' | 'TASK' | 'MESH' | 'VERTEX' | 'FRAGMENT';
  glslSource: string;
  spirvDisassembly: string[];
  descriptorBindings: {
    set: number;
    binding: number;
    name: string;
    type: string;
    stageFlags: string;
  }[];
  pushConstants: {
    offset: number;
    size: number;
    name: string;
    type: string;
  }[];
  workgroupSize?: string;
  spirvSizeWords: number;
}

export interface VulkanValidationMessage {
  id: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'PERFORMANCE';
  layer: string;
  code: string;
  message: string;
  timestamp: string;
}

export interface RenderStatisticsData {
  enabled: boolean;
  hierarchicalTraversalCounts: number[]; // Index 0 is LOD 0, up to MAX_LOD_LAYER (7)
  hierarchicalRenderSections: number[];
  visibleSections: number[];
  quadCount: number[];
  totalQuads: number;
  totalSections: number;
  drawCalls: number;
  culledSections: number;
  vramUsageMB: number;
  fps: number;
  frameTimeMs: number;
  vulkanTelemetry?: VulkanTelemetry;
}

export interface TimingSampler {
  name: string;
  rollingTimeMs: number;
  color: string;
}

export interface WorldSectionData {
  id: string;
  x: number;
  y: number;
  z: number;
  lod: number;
  size: number;
  quadCount: number;
  isCulled: boolean;
  blockCount: number;
}

export interface ImportTask {
  id: string;
  name: string;
  type: 'world' | 'bobby' | 'distant_horizons' | 'zip' | 'raw';
  source: string;
  progress: number; // 0 to 100
  totalChunks: number;
  processedChunks: number;
  quadsGenerated: number;
  rateChunksPerSec: number;
  status: 'queued' | 'processing' | 'completed' | 'cancelled' | 'error';
  errorMessage?: string;
  startTime: number;
}

export interface BenchmarkResult {
  id: string;
  name: string;
  category: 'Storage' | 'Meshing' | 'LOD Traversal' | 'Compression';
  throughput: string;
  score: number;
  unit: string;
  latencyP95Ms: number;
  memoryMB: number;
  details: string;
}

export interface BlockVoxel {
  type: number; // 0: air, 1: grass, 2: dirt, 3: stone, 4: water, 5: leaves, 6: wood, 7: snow, 8: sand, 9: gold
  color: string;
  roughness: number;
  isTranslucent?: boolean;
}

