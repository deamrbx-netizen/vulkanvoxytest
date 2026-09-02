import { VulkanConfig, VulkanTelemetry, SpirvShaderStage, VulkanValidationMessage, DEFAULT_VULKAN_CONFIG } from '../../types/voxy';

export interface VulkanGpuProfile {
  id: string;
  name: string;
  vendor: 'NVIDIA' | 'AMD' | 'INTEL' | 'APPLE';
  driverVersion: string;
  vulkanApiVersion: string;
  totalVramMB: number;
  totalHostMemoryMB: number;
  supportsMeshShaders: boolean;
  supportsIndirectCount: boolean;
  supportsTimelineSemaphores: boolean;
  supportsDescriptorIndexing: boolean;
  maxComputeWorkGroupInvocations: number;
  maxMeshOutputVertices: number;
  maxMeshOutputPrimitives: number;
}

export const AVAILABLE_GPUS: VulkanGpuProfile[] = [
  {
    id: 'gpu-rtx4090',
    name: 'NVIDIA GeForce RTX 4090 (Ada Lovelace)',
    vendor: 'NVIDIA',
    driverVersion: '552.22 (Vulkan 1.3.280)',
    vulkanApiVersion: '1.3.280',
    totalVramMB: 24576,
    totalHostMemoryMB: 65536,
    supportsMeshShaders: true,
    supportsIndirectCount: true,
    supportsTimelineSemaphores: true,
    supportsDescriptorIndexing: true,
    maxComputeWorkGroupInvocations: 1024,
    maxMeshOutputVertices: 256,
    maxMeshOutputPrimitives: 512,
  },
  {
    id: 'gpu-rx7900xtx',
    name: 'AMD Radeon RX 7900 XTX (RDNA 3)',
    vendor: 'AMD',
    driverVersion: '24.5.1 (Vulkan 1.3.283)',
    vulkanApiVersion: '1.3.283',
    totalVramMB: 24576,
    totalHostMemoryMB: 32768,
    supportsMeshShaders: true,
    supportsIndirectCount: true,
    supportsTimelineSemaphores: true,
    supportsDescriptorIndexing: true,
    maxComputeWorkGroupInvocations: 1024,
    maxMeshOutputVertices: 256,
    maxMeshOutputPrimitives: 512,
  },
  {
    id: 'gpu-m3max',
    name: 'Apple M3 Max (MoltenVK Vulkan 1.3)',
    vendor: 'APPLE',
    driverVersion: 'MoltenVK 1.2.9 (Metal 3.1)',
    vulkanApiVersion: '1.3.275',
    totalVramMB: 49152,
    totalHostMemoryMB: 65536,
    supportsMeshShaders: true,
    supportsIndirectCount: true,
    supportsTimelineSemaphores: true,
    supportsDescriptorIndexing: true,
    maxComputeWorkGroupInvocations: 1024,
    maxMeshOutputVertices: 256,
    maxMeshOutputPrimitives: 256,
  },
  {
    id: 'gpu-arca770',
    name: 'Intel Arc A770 Graphics (Alchemist)',
    vendor: 'INTEL',
    driverVersion: '31.0.101.5522 (Vulkan 1.3.277)',
    vulkanApiVersion: '1.3.277',
    totalVramMB: 16384,
    totalHostMemoryMB: 32768,
    supportsMeshShaders: true,
    supportsIndirectCount: true,
    supportsTimelineSemaphores: true,
    supportsDescriptorIndexing: true,
    maxComputeWorkGroupInvocations: 1024,
    maxMeshOutputVertices: 256,
    maxMeshOutputPrimitives: 512,
  },
];

export const SPIRV_SHADERS: SpirvShaderStage[] = [
  {
    id: 'shader-cull-comp',
    name: 'voxy_cull_indirect.comp.spv',
    stage: 'COMPUTE',
    workgroupSize: '64, 1, 1',
    spirvSizeWords: 3420,
    glslSource: `#version 460
#extension GL_EXT_shader_8bit_storage : require
#extension GL_EXT_shader_explicit_arithmetic_types_int64 : require
#extension GL_KHR_shader_subgroup_ballot : enable

layout(local_size_x = 64, local_size_y = 1, local_size_z = 1) in;

struct SectionNode {
    vec3 minBounds;
    uint lodLevel;
    vec3 maxBounds;
    uint quadOffset;
    uint quadCount;
    uint packedData;
};

struct VkDrawIndexedIndirectCommand {
    uint indexCount;
    uint instanceCount;
    uint firstIndex;
    int  vertexOffset;
    uint firstInstance;
};

layout(std430, set = 0, binding = 0) readonly buffer SectionBuffer {
    SectionNode sections[];
};

layout(std430, set = 0, binding = 1) writeonly buffer IndirectDrawBuffer {
    VkDrawIndexedIndirectCommand commands[];
};

layout(std430, set = 0, binding = 2) buffer DrawCountBuffer {
    uint drawCount;
};

layout(push_constant) uniform PushConstants {
    mat4 viewProjMatrix;
    vec4 cameraPos;
    vec4 frustumPlanes[6];
    float subDivisionErrorThreshold;
    uint  totalCandidateSections;
} push;

bool testFrustumAABB(vec3 bMin, vec3 bMax) {
    for (int i = 0; i < 6; ++i) {
        vec3 p = vec3(
            push.frustumPlanes[i].x > 0 ? bMax.x : bMin.x,
            push.frustumPlanes[i].y > 0 ? bMax.y : bMin.y,
            push.frustumPlanes[i].z > 0 ? bMax.z : bMin.z
        );
        if (dot(push.frustumPlanes[i].xyz, p) + push.frustumPlanes[i].w < 0.0) {
            return false;
        }
    }
    return true;
}

void main() {
    uint gId = gl_GlobalInvocationID.x;
    if (gId >= push.totalCandidateSections) return;

    SectionNode sec = sections[gId];
    if (!testFrustumAABB(sec.minBounds, sec.maxBounds)) return;

    // Allocate draw command atomically on GPU
    uint outIdx = atomicAdd(drawCount, 1);
    commands[outIdx].indexCount = sec.quadCount * 6;
    commands[outIdx].instanceCount = 1;
    commands[outIdx].firstIndex = sec.quadOffset * 6;
    commands[outIdx].vertexOffset = 0;
    commands[outIdx].firstInstance = gId;
}`,
    spirvDisassembly: [
      '; SPIR-V',
      '; Version: 1.6',
      '; Generator: Khronos Glslang Reference Front End; 11',
      '; Bound: 184',
      '; Schema: 0',
      '               OpCapability Shader',
      '               OpCapability StorageBuffer8BitAccess',
      '               OpCapability Int64',
      '               OpCapability GroupNonUniformBallot',
      '          %1 = OpExtInstImport "GLSL.std.450"',
      '               OpMemoryModel Logical GLSL450',
      '               OpEntryPoint GLCompute %main "main" %gl_GlobalInvocationID',
      '               OpExecutionMode %main LocalSize 64 1 1',
      '               OpSource GLSL 460',
      '               OpDecorate %gl_GlobalInvocationID BuiltIn GlobalInvocationId',
      '               OpDecorate %SectionBuffer Block',
      '               OpDecorate %sections ArrayStride 48',
      '               OpDecorate %SectionBuffer DescriptorSet 0',
      '               OpDecorate %SectionBuffer Binding 0',
      '               OpDecorate %IndirectDrawBuffer Block',
      '               OpDecorate %commands ArrayStride 20',
      '               OpDecorate %IndirectDrawBuffer DescriptorSet 0',
      '               OpDecorate %IndirectDrawBuffer Binding 1',
      '               OpDecorate %DrawCountBuffer Block',
      '               OpDecorate %DrawCountBuffer DescriptorSet 0',
      '               OpDecorate %DrawCountBuffer Binding 2',
      '               OpMemberDecorate %PushConstants 0 Offset 0',
      '               OpMemberDecorate %PushConstants 1 Offset 64',
      '               OpMemberDecorate %PushConstants 2 Offset 80',
      '               OpDecorate %PushConstants Block',
      '       %main = OpFunction %void None %3',
      '          %5 = OpLabel',
      '      %gid_x = OpLoad %v3uint %gl_GlobalInvocationID',
      '     %test_g = OpCompositeExtract %uint %gid_x 0',
      '     %cond_g = OpUGreaterThanEqual %bool %test_g %total_sections',
      '               OpBranchConditional %cond_g %exit_label %continue_label',
      '; ... [142 additional SPIR-V opcodes executing frustum check and atomic draw emission] ...',
      ' %emit_draw = OpAtomicIAdd %uint %drawCountPtr %uint_1 %uint_0 %uint_1',
      '               OpStore %cmdPtr %outCmdStruct',
      '               OpReturn',
      '               OpFunctionEnd',
    ],
    descriptorBindings: [
      { set: 0, binding: 0, name: 'sections[]', type: 'VK_DESCRIPTOR_TYPE_STORAGE_BUFFER', stageFlags: 'VK_SHADER_STAGE_COMPUTE_BIT' },
      { set: 0, binding: 1, name: 'commands[] (Indirect)', type: 'VK_DESCRIPTOR_TYPE_STORAGE_BUFFER', stageFlags: 'VK_SHADER_STAGE_COMPUTE_BIT' },
      { set: 0, binding: 2, name: 'drawCount (Atomic)', type: 'VK_DESCRIPTOR_TYPE_STORAGE_BUFFER', stageFlags: 'VK_SHADER_STAGE_COMPUTE_BIT' },
    ],
    pushConstants: [
      { offset: 0, size: 64, name: 'viewProjMatrix', type: 'mat4' },
      { offset: 64, size: 16, name: 'cameraPos', type: 'vec4' },
      { offset: 80, size: 96, name: 'frustumPlanes[6]', type: 'vec4[6]' },
      { offset: 176, size: 4, name: 'subDivisionErrorThreshold', type: 'float' },
      { offset: 180, size: 4, name: 'totalCandidateSections', type: 'uint' },
    ],
  },
  {
    id: 'shader-mesh-ext',
    name: 'voxy_voxel_meshlet.mesh.spv',
    stage: 'MESH',
    workgroupSize: '32, 1, 1',
    spirvSizeWords: 4890,
    glslSource: `#version 460
#extension GL_EXT_mesh_shader : require
#extension GL_EXT_shader_8bit_storage : require

layout(local_size_x = 32) in;
layout(triangles, max_vertices = 64, max_primitives = 126) out;

struct MeshletPayload {
    uint sectionId;
    uint meshletOffset;
    uint lodLevel;
};

taskPayloadSharedEXT MeshletPayload IN_PAYLOAD;

layout(std430, set = 1, binding = 0) readonly buffer VoxelQuadMeshletBuffer {
    uvec4 packedVoxelVertices[];
};

layout(location = 0) out vec3 outWorldPos[];
layout(location = 1) out vec3 outNormal[];
layout(location = 2) out flat uint outBlockType[];
layout(location = 3) out vec2 outUV[];

void main() {
    uint tid = gl_LocalInvocationIndex;
    uint meshletIdx = IN_PAYLOAD.meshletOffset + gl_WorkGroupID.x;

    // Set meshlet hardware output sizes
    SetMeshOutputsEXT(64, 126);

    if (tid < 64) {
        uvec4 rawVert = packedVoxelVertices[meshletIdx * 64 + tid];
        vec3 pos = vec3(rawVert.xyz) * (1 << IN_PAYLOAD.lodLevel);
        gl_MeshVerticesEXT[tid].gl_Position = ubo.viewProj * vec4(pos, 1.0);
        outWorldPos[tid] = pos;
        outNormal[tid] = decodeVoxelNormal(rawVert.w);
        outBlockType[tid] = (rawVert.w >> 8) & 0xFF;
    }

    if (tid < 126) {
        // Emit 2 triangles per quad
        gl_PrimitiveTriangleIndicesEXT[tid] = uvec3(
            (tid / 2) * 4 + (tid % 2 == 0 ? 0 : 2),
            (tid / 2) * 4 + (tid % 2 == 0 ? 1 : 3),
            (tid / 2) * 4 + (tid % 2 == 0 ? 2 : 0)
        );
    }
}`,
    spirvDisassembly: [
      '; SPIR-V',
      '; Version: 1.6',
      '; Generator: Khronos Glslang Reference Front End; 11',
      '; Bound: 240',
      '               OpCapability MeshShadingEXT',
      '               OpCapability Shader',
      '          %1 = OpExtInstImport "GLSL.std.450"',
      '               OpMemoryModel Logical GLSL450',
      '               OpEntryPoint MeshEXT %main "main" %gl_MeshVerticesEXT %outWorldPos %outNormal',
      '               OpExecutionMode %main LocalSize 32 1 1',
      '               OpExecutionMode %main OutputVertices 64',
      '               OpExecutionMode %main OutputPrimitivesEXT 126',
      '               OpExecutionMode %main OutputTrianglesEXT',
      '               OpDecorate %gl_MeshVerticesEXT BuiltIn Position',
      '               OpDecorate %VoxelQuadMeshletBuffer DescriptorSet 1',
      '               OpDecorate %VoxelQuadMeshletBuffer Binding 0',
      '       %main = OpFunction %void None %3',
      '          %5 = OpLabel',
      '               OpSetMeshOutputsEXT %uint_64 %uint_126',
      '     %lod_mul = OpShiftLeftLogical %uint %uint_1 %in_lod',
      '  %mesh_emit = OpStore %gl_Position_Ptr %calc_clip_pos',
      '               OpReturn',
      '               OpFunctionEnd',
    ],
    descriptorBindings: [
      { set: 1, binding: 0, name: 'packedVoxelVertices[]', type: 'VK_DESCRIPTOR_TYPE_STORAGE_BUFFER', stageFlags: 'VK_SHADER_STAGE_MESH_BIT_EXT' },
      { set: 0, binding: 0, name: 'GlobalUniforms', type: 'VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER', stageFlags: 'VK_SHADER_STAGE_MESH_BIT_EXT' },
    ],
    pushConstants: [
      { offset: 0, size: 64, name: 'viewProjMatrix', type: 'mat4' },
      { offset: 64, size: 16, name: 'cameraPos', type: 'vec4' },
    ],
  },
  {
    id: 'shader-raster-vert',
    name: 'voxy_quad_raster.vert.spv',
    stage: 'VERTEX',
    spirvSizeWords: 2150,
    glslSource: `#version 460
#extension GL_ARB_shader_draw_parameters : enable

layout(location = 0) in vec3 inPosition;
layout(location = 1) in vec3 inNormal;
layout(location = 2) in vec3 inColor;
layout(location = 3) in vec2 inUV;

layout(push_constant) uniform PushConstants {
    mat4 modelViewProj;
    vec4 cameraPos;
    vec4 fogParams;
} push;

layout(location = 0) out vec3 outFragPos;
layout(location = 1) out vec3 outFragNormal;
layout(location = 2) out vec3 outFragColor;
layout(location = 3) out float outFogDist;

void main() {
    vec4 worldPos = vec4(inPosition, 1.0);
    gl_Position = push.modelViewProj * worldPos;
    outFragPos = inPosition;
    outFragNormal = inNormal;
    outFragColor = inColor;
    outFogDist = length(push.cameraPos.xyz - inPosition);
}`,
    spirvDisassembly: [
      '; SPIR-V',
      '; Version: 1.6',
      '               OpCapability Shader',
      '               OpCapability DrawParameters',
      '               OpMemoryModel Logical GLSL450',
      '               OpEntryPoint Vertex %main "main" %inPosition %inNormal %inColor %gl_Position',
      '               OpDecorate %gl_Position BuiltIn Position',
      '       %main = OpFunction %void None %3',
      '          %5 = OpLabel',
      '    %pos_val = OpLoad %v3float %inPosition',
      '   %mvp_mult = OpMatrixTimesVector %v4float %mvp_mat %pos_ext',
      '               OpStore %gl_Position %mvp_mult',
      '               OpReturn',
      '               OpFunctionEnd',
    ],
    descriptorBindings: [
      { set: 0, binding: 0, name: 'CameraBuffer', type: 'VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER', stageFlags: 'VK_SHADER_STAGE_VERTEX_BIT' },
    ],
    pushConstants: [
      { offset: 0, size: 64, name: 'modelViewProj', type: 'mat4' },
      { offset: 64, size: 16, name: 'cameraPos', type: 'vec4' },
      { offset: 80, size: 16, name: 'fogParams', type: 'vec4' },
    ],
  },
  {
    id: 'shader-raster-frag',
    name: 'voxy_quad_raster.frag.spv',
    stage: 'FRAGMENT',
    spirvSizeWords: 2980,
    glslSource: `#version 460
layout(location = 0) in vec3 inFragPos;
layout(location = 1) in vec3 inFragNormal;
layout(location = 2) in vec3 inFragColor;
layout(location = 3) in float inFogDist;

layout(set = 0, binding = 1) uniform sampler2D ssaoTexture;
layout(set = 0, binding = 2) uniform sampler2DArray voxelAtlas;

layout(location = 0) out vec4 outColor;

const vec3 SUN_DIR = normalize(vec3(0.4, 0.9, 0.3));
const vec3 SKY_FOG_COLOR = vec3(0.737, 0.862, 0.980);

void main() {
    float NdotL = max(dot(inFragNormal, SUN_DIR), 0.0);
    float directionalLight = 0.45 + 0.55 * NdotL;
    
    // Directional shading + vertex AO
    vec3 baseColor = inFragColor * directionalLight;
    
    // Environmental distance fog blend
    float fogFactor = clamp((inFogDist - 120.0) / (600.0 - 120.0), 0.0, 1.0);
    vec3 finalColor = mix(baseColor, SKY_FOG_COLOR, fogFactor);
    
    outColor = vec4(finalColor, 1.0);
}`,
    spirvDisassembly: [
      '; SPIR-V',
      '; Version: 1.6',
      '               OpCapability Shader',
      '               OpMemoryModel Logical GLSL450',
      '               OpEntryPoint Fragment %main "main" %inFragPos %inFragNormal %inFragColor %outColor',
      '               OpExecutionMode %main OriginUpperLeft',
      '               OpDecorate %outColor Location 0',
      '       %main = OpFunction %void None %3',
      '          %5 = OpLabel',
      '     %ndotl  = OpDot %float %norm %sundir',
      '     %fogmix = OpExtInst %v3float %1 FMix %base_rgb %fog_rgb %fog_factor',
      '               OpStore %outColor %res_rgba',
      '               OpReturn',
      '               OpFunctionEnd',
    ],
    descriptorBindings: [
      { set: 0, binding: 1, name: 'ssaoTexture', type: 'VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER', stageFlags: 'VK_SHADER_STAGE_FRAGMENT_BIT' },
      { set: 0, binding: 2, name: 'voxelAtlas', type: 'VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER', stageFlags: 'VK_SHADER_STAGE_FRAGMENT_BIT' },
    ],
    pushConstants: [],
  },
];

export class VulkanSupportLayer {
  private config: VulkanConfig;
  private selectedGpu: VulkanGpuProfile;
  private validationLog: VulkanValidationMessage[] = [];
  private timelineValue = 1042;
  private indirectCmdDispatched = 0;
  private meshletInvocations = 0;
  private pipelineCacheHitCount = 148;

  constructor(config?: VulkanConfig) {
    this.config = config || DEFAULT_VULKAN_CONFIG;
    this.selectedGpu =
      AVAILABLE_GPUS.find((g) => g.id === this.config.selectedGpu) || AVAILABLE_GPUS[0];

    this.initValidationLayer();
  }

  private initValidationLayer() {
    const time = new Date().toLocaleTimeString();
    this.validationLog = [
      {
        id: 'val-1',
        severity: 'INFO',
        layer: 'VK_LAYER_KHRONOS_validation',
        code: 'VUID-VkInstance-pNext-pNext',
        message: `Vulkan 1.3 Instance initialized on device "${this.selectedGpu.name}". Extensions enabled: VK_EXT_mesh_shader, VK_KHR_draw_indirect_count, VK_KHR_timeline_semaphore, VK_EXT_descriptor_indexing.`,
        timestamp: time,
      },
      {
        id: 'val-2',
        severity: 'INFO',
        layer: 'VK_LAYER_KHRONOS_validation',
        code: 'VUID-VkDevice-queueFamilyIndex-00001',
        message: 'Created 3 Queue Families: Graphics (Family 0, Count 16), Async Compute (Family 1, Count 8), Dedicated DMA Transfer (Family 2, Count 4).',
        timestamp: time,
      },
      {
        id: 'val-3',
        severity: 'INFO',
        layer: 'VMA (Vulkan Memory Allocator)',
        code: 'VMA_INIT_OK',
        message: 'VMA Pool instantiated: 2048 MB Device-Local Heap Block 0 with sub-allocation granularities of 64 bytes (aligned for SSBO).',
        timestamp: time,
      },
    ];
  }

  public updateConfig(newConfig?: VulkanConfig) {
    if (!newConfig) return;
    this.config = newConfig;
    const gpu = AVAILABLE_GPUS.find((g) => g.id === newConfig.selectedGpu);
    if (gpu) this.selectedGpu = gpu;

    if (newConfig.enableValidationLayers) {
      this.addValidationMessage('INFO', 'VALIDATION_STATE', 'VK_LAYER_KHRONOS_validation active and intercepting queue submits.');
    }
  }

  public addValidationMessage(
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'PERFORMANCE',
    code: string,
    message: string
  ) {
    const msg: VulkanValidationMessage = {
      id: `val-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      severity,
      layer: 'VK_LAYER_KHRONOS_validation',
      code,
      message,
      timestamp: new Date().toLocaleTimeString(),
    };
    this.validationLog.unshift(msg);
    if (this.validationLog.length > 50) {
      this.validationLog.pop();
    }
  }

  public clearValidationLogs() {
    this.validationLog = [];
  }

  public getValidationLogs(): VulkanValidationMessage[] {
    return this.validationLog;
  }

  public getSelectedGpu(): VulkanGpuProfile {
    return this.selectedGpu;
  }

  public getTelemetry(visibleSectionCount: number, totalQuads: number): VulkanTelemetry {
    this.timelineValue++;
    this.indirectCmdDispatched = visibleSectionCount;
    this.meshletInvocations = Math.ceil(totalQuads / 32);

    const deviceLocalAllocated = Math.min(
      this.selectedGpu.totalVramMB * 0.8,
      28.5 + (totalQuads * 32) / (1024 * 1024)
    );

    const hostVisibleAllocated = Math.min(
      4096,
      8.0 + (visibleSectionCount * 128) / (1024 * 1024)
    );

    return {
      gpuName: this.selectedGpu.name,
      driverVersion: this.selectedGpu.driverVersion,
      vulkanApiVersion: this.selectedGpu.vulkanApiVersion,
      graphicsQueueUsagePercent: Math.min(98, Math.max(15, Math.round(35 + (visibleSectionCount / 10)))),
      computeQueueUsagePercent: Math.min(95, Math.max(10, Math.round(20 + (visibleSectionCount / 15)))),
      transferQueueUsagePercent: 6,
      vmaDeviceLocalAllocatedMB: Math.round(deviceLocalAllocated * 10) / 10,
      vmaDeviceLocalTotalMB: this.selectedGpu.totalVramMB,
      vmaHostVisibleAllocatedMB: Math.round(hostVisibleAllocated * 10) / 10,
      vmaHostVisibleTotalMB: 4096,
      vmaAllocationCount: 42 + visibleSectionCount,
      indirectCommandsDispatched: this.indirectCmdDispatched,
      meshletInvocations: this.meshletInvocations,
      meshletPrimitivesGenerated: totalQuads * 2,
      meshletCullRatePercent: 74.2,
      validationWarningsCount: this.validationLog.filter((v) => v.severity === 'WARNING').length,
      pipelineCacheHits: this.pipelineCacheHitCount,
      timelineSemaphoreValue: this.timelineValue,
    };
  }
}
