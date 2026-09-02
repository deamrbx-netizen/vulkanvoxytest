import React, { useState, useMemo, useCallback } from 'react';
import { VoxyConfig, RenderMode, RenderStatisticsData, VulkanConfig } from './types/voxy';
import { WorldGenerator } from './engine/WorldGenerator';
import { OctreeLODManager } from './engine/OctreeLOD';
import { VulkanSupportLayer } from './engine/vulkan/VulkanSupportLayer';
import { VoxelViewport } from './components/VoxelViewport';
import { TopNavigationBar } from './components/TopNavigationBar';
import { SodiumConfigDialog } from './components/SodiumConfigDialog';
import { DebugStatsOverlay } from './components/DebugStatsOverlay';
import { ImportManagerModal } from './components/ImportManagerModal';
import { VoxelInspector } from './components/VoxelInspector';
import { BenchmarkRunner } from './components/BenchmarkRunner';
import { VoxyConsole } from './components/VoxyConsole';
import { VulkanPipelineModal } from './components/VulkanPipelineModal';

export const App: React.FC = () => {
  // Voxy Config State (matching VoxyConfig.java with Vulkan 1.3 layer)
  const [config, setConfig] = useState<VoxyConfig>({
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
    vulkan: {
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
    },
  });

  const [currentWorldName, setCurrentWorldName] = useState('Highland Glaciers & Peaks');
  const [renderMode, setRenderMode] = useState<RenderMode>('NORMAL');

  // Modals & Overlay Toggles
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isBenchmarksOpen, setIsBenchmarksOpen] = useState(false);
  const [isVulkanOpen, setIsVulkanOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isDebugF3Open, setIsDebugF3Open] = useState(true);

  // Vulkan Support Layer instance
  const vulkanLayer = useMemo(() => new VulkanSupportLayer(config.vulkan), []);

  // Live Render Statistics State
  const [stats, setStats] = useState<RenderStatisticsData>({
    enabled: true,
    hierarchicalTraversalCounts: [0, 0, 0, 0, 0, 0, 0, 0],
    hierarchicalRenderSections: [0, 0, 0, 0, 0, 0, 0, 0],
    visibleSections: [0, 0, 0, 0, 0, 0, 0, 0],
    quadCount: [0, 0, 0, 0, 0, 0, 0, 0],
    totalQuads: 0,
    totalSections: 0,
    drawCalls: 0,
    culledSections: 0,
    vramUsageMB: 18.2,
    fps: 60,
    frameTimeMs: 16.6,
  });

  // World Generator & Octree Manager instances
  const worldGenerator = useMemo(() => new WorldGenerator(10442), []);
  const lodManager = useMemo(() => new OctreeLODManager(worldGenerator), [worldGenerator]);

  const handleStatsUpdate = useCallback((newStats: RenderStatisticsData) => {
    setStats(newStats);
  }, []);

  const handleSaveConfig = (newConfig: VoxyConfig) => {
    setConfig(newConfig);
    vulkanLayer.updateConfig(newConfig.vulkan);
    lodManager.clearCache();
  };

  const handleUpdateVulkanConfig = (newVulkanConfig: VulkanConfig) => {
    setConfig((prev) => ({
      ...prev,
      vulkan: newVulkanConfig,
    }));
    vulkanLayer.updateConfig(newVulkanConfig);
  };

  const handleReload = () => {
    lodManager.clearCache();
    vulkanLayer.addValidationMessage('INFO', 'PIPELINE_RELOAD', 'Rebuilt SPIR-V graphics and compute pipelines.');
  };

  const handleWorldLoadPreset = (seed: number, name: string) => {
    worldGenerator.setSeed(seed);
    lodManager.clearCache();
    setCurrentWorldName(name);
  };

  return (
    <div id="voxy-app-root" className="flex flex-col h-screen w-screen bg-[#0c0d10] text-[#e2e8f0] overflow-hidden">
      {/* Top Navigation */}
      <TopNavigationBar
        config={config}
        currentWorldName={currentWorldName}
        stats={stats}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenImporter={() => setIsImporterOpen(true)}
        onOpenInspector={() => setIsInspectorOpen(true)}
        onOpenBenchmarks={() => setIsBenchmarksOpen(true)}
        onOpenVulkan={() => setIsVulkanOpen(true)}
        onToggleConsole={() => setIsConsoleOpen((prev) => !prev)}
        onReload={handleReload}
      />

      {/* Main 3D Viewport Area */}
      <main className="flex-1 relative overflow-hidden">
        <VoxelViewport
          config={config}
          lodManager={lodManager}
          renderMode={renderMode}
          onRenderModeChange={setRenderMode}
          onStatsUpdate={handleStatsUpdate}
          vulkanLayer={vulkanLayer}
          onOpenVulkanModal={() => setIsVulkanOpen(true)}
        />

        {/* F3 Diagnostics HUD */}
        <DebugStatsOverlay
          stats={stats}
          isOpen={isDebugF3Open}
          onToggle={() => setIsDebugF3Open((prev) => !prev)}
          renderMode={renderMode}
        />
      </main>

      {/* Modals & Drawers */}
      <VulkanPipelineModal
        isOpen={isVulkanOpen}
        onClose={() => setIsVulkanOpen(false)}
        vulkanConfig={config.vulkan}
        onUpdateVulkanConfig={handleUpdateVulkanConfig}
        telemetry={stats.vulkanTelemetry}
        vulkanLayer={vulkanLayer}
      />

      <SodiumConfigDialog
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        onOpenVulkanModal={() => {
          setIsConfigOpen(false);
          setIsVulkanOpen(true);
        }}
      />

      <ImportManagerModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onWorldLoadPreset={handleWorldLoadPreset}
      />

      <VoxelInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />

      <BenchmarkRunner
        isOpen={isBenchmarksOpen}
        onClose={() => setIsBenchmarksOpen(false)}
      />

      <VoxyConsole
        isOpen={isConsoleOpen}
        onClose={() => setIsConsoleOpen(false)}
        onReload={handleReload}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenImporter={() => setIsImporterOpen(true)}
        onOpenBenchmarks={() => setIsBenchmarksOpen(true)}
        onOpenVulkan={() => setIsVulkanOpen(true)}
      />
    </div>
  );
};
