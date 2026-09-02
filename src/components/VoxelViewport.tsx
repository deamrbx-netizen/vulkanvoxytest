import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { VoxyConfig, RenderMode, RenderStatisticsData } from '../types/voxy';
import { OctreeLODManager, OctreeNode } from '../engine/OctreeLOD';
import { MeshBuilder } from '../engine/MeshBuilder';
import { VulkanSupportLayer } from '../engine/vulkan/VulkanSupportLayer';
import { Eye, Compass, Layers, Maximize2, RotateCcw, Box, Cpu, Flame, Zap } from 'lucide-react';

interface VoxelViewportProps {
  config: VoxyConfig;
  lodManager: OctreeLODManager;
  renderMode: RenderMode;
  onRenderModeChange: (mode: RenderMode) => void;
  onStatsUpdate: (stats: RenderStatisticsData) => void;
  isInspectingSection?: boolean;
  vulkanLayer?: VulkanSupportLayer;
  onOpenVulkanModal?: () => void;
}

export const VoxelViewport: React.FC<VoxelViewportProps> = ({
  config,
  lodManager,
  renderMode,
  onRenderModeChange,
  onStatsUpdate,
  vulkanLayer,
  onOpenVulkanModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Freecam state
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const meshesGroupRef = useRef<THREE.Group>(new THREE.Group());
  const wireframeGroupRef = useRef<THREE.Group>(new THREE.Group());
  const boundingBoxesGroupRef = useRef<THREE.Group>(new THREE.Group());

  const [camPos, setCamPos] = useState({ x: 0, y: 140, z: 0 });
  const [camFacing, setCamFacing] = useState({ yaw: 0, pitch: -20 });
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [showWireframe, setShowWireframe] = useState(false);
  const [showBounds, setShowBounds] = useState(false);

  // Input tracking
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Camera angles
  const yawRef = useRef(0);
  const pitchRef = useRef(-0.35); // Look slightly downward

  const setupScene = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Minecraft sky blue
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(70, width / height, 0.5, 4000);
    camera.position.set(0, 140, 200);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    rendererRef.current = renderer;

    // Ambient and Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    sunLight.position.set(200, 400, 150);
    scene.add(sunLight);

    // Groups
    scene.add(meshesGroupRef.current);
    scene.add(wireframeGroupRef.current);
    scene.add(boundingBoxesGroupRef.current);

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const cleanup = setupScene();
    return cleanup;
  }, [setupScene]);

  // Update Fog and Background based on Voxy Config
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    if (config.fogMode === 'OFF') {
      scene.fog = null;
      scene.background = new THREE.Color(0x87ceeb);
    } else if (config.fogMode === 'FOG' || config.fogMode === 'FOG_AND_FADE') {
      const near = (config.sectionRenderDistance * 16 * 16) * 0.4;
      const far = config.sectionRenderDistance * 16 * 16;
      scene.fog = new THREE.Fog(0xbcdcfa, near, far);
      scene.background = new THREE.Color(0xbcdcfa);
    } else {
      // Fade only
      const far = config.sectionRenderDistance * 16 * 16;
      scene.fog = new THREE.FogExp2(0xbcdcfa, 1.0 / far);
      scene.background = new THREE.Color(0xbcdcfa);
    }
  }, [config.fogMode, config.sectionRenderDistance]);

  // Main Render & LOD Update Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTime = performance.now();
    let currentFps = 60;

    const activeMeshCache = new Map<string, THREE.Mesh>();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // FPS Calculation
      frameCount++;
      if (now - fpsTime >= 500) {
        currentFps = Math.round((frameCount * 1000) / (now - fpsTime));
        frameCount = 0;
        fpsTime = now;
      }

      const camera = cameraRef.current;
      const scene = sceneRef.current;
      const renderer = rendererRef.current;
      const container = containerRef.current;

      if (!camera || !scene || !renderer || !container) return;

      // Camera Free Flight Movement
      const moveSpeed = 120 * speedMultiplier * delta;
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yawRef.current);
      const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yawRef.current);
      const up = new THREE.Vector3(0, 1, 0);

      let moved = false;
      if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) {
        camera.position.addScaledVector(forward, moveSpeed);
        moved = true;
      }
      if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) {
        camera.position.addScaledVector(forward, -moveSpeed);
        moved = true;
      }
      if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) {
        camera.position.addScaledVector(right, -moveSpeed);
        moved = true;
      }
      if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) {
        camera.position.addScaledVector(right, moveSpeed);
        moved = true;
      }
      if (keysPressed.current['Space']) {
        camera.position.addScaledVector(up, moveSpeed);
        moved = true;
      }
      if (keysPressed.current['ShiftLeft'] || keysPressed.current['ShiftRight']) {
        camera.position.addScaledVector(up, -moveSpeed);
        moved = true;
      }

      // Update Camera Rotation (Yaw / Pitch)
      const euler = new THREE.Euler(0, 0, 0, 'YXZ');
      euler.y = yawRef.current;
      euler.x = pitchRef.current;
      camera.quaternion.setFromEuler(euler);

      if (moved || frameCount % 30 === 0) {
        setCamPos({
          x: Math.round(camera.position.x),
          y: Math.round(camera.position.y),
          z: Math.round(camera.position.z),
        });
        setCamFacing({
          yaw: Math.round((yawRef.current * 180) / Math.PI) % 360,
          pitch: Math.round((pitchRef.current * 180) / Math.PI),
        });
      }

      // Run Voxy Hierarchical Octree Traversal & Culling
      const startTime = performance.now();
      const { visibleSections, allVisitedNodes, stats } = lodManager.traverseAndCull(
        camera,
        container.clientWidth,
        container.clientHeight,
        config
      );
      const traversalTime = performance.now() - startTime;

      // Synchronize 3D Meshes with visible sections
      const currentKeys = new Set<string>();

      // Clear existing children from meshes group
      while (meshesGroupRef.current.children.length > 0) {
        const obj = meshesGroupRef.current.children[0];
        meshesGroupRef.current.remove(obj);
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      }

      // Rebuild visible meshes
      const baseMaterial = new THREE.MeshLambertMaterial({
        vertexColors: true,
        wireframe: renderMode === 'WIREFRAME' || showWireframe,
        side: THREE.FrontSide,
      });

      for (const section of visibleSections) {
        const key = `${section.cx}_${section.cy}_${section.cz}_lod${section.lod}_${renderMode}`;
        currentKeys.add(key);

        const geom = MeshBuilder.buildSectionGeometry(section, renderMode);
        const mesh = new THREE.Mesh(geom, baseMaterial);
        meshesGroupRef.current.add(mesh);
      }

      // Render Bounding Boxes if enabled
      while (boundingBoxesGroupRef.current.children.length > 0) {
        const b = boundingBoxesGroupRef.current.children[0];
        boundingBoxesGroupRef.current.remove(b);
        if (b instanceof THREE.LineSegments) {
          b.geometry.dispose();
          (b.material as THREE.Material).dispose();
        }
      }

      if (showBounds || renderMode === 'BOUNDING_BOX') {
        const boxMaterial = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
        for (const node of allVisitedNodes) {
          if (node.lod <= 3) {
            const boxGeom = new THREE.Box3Helper(node.bounds, new THREE.Color(node.lod === 0 ? 0x22c55e : 0x38bdf8));
            boundingBoxesGroupRef.current.add(boxGeom);
          }
        }
      }

      // Render Scene
      renderer.render(scene, camera);

      // Push Live Telemetry stats
      stats.fps = currentFps;
      stats.frameTimeMs = Math.round((performance.now() - now) * 10) / 10;
      if (vulkanLayer) {
        stats.vulkanTelemetry = vulkanLayer.getTelemetry(visibleSections.length, stats.totalQuads);
      }
      onStatsUpdate(stats);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [config, lodManager, renderMode, showWireframe, showBounds, speedMultiplier, onStatsUpdate, vulkanLayer]);

  // Keyboard & Mouse Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs/console
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }
      keysPressed.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isDragging.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };

      const sensitivity = 0.003;
      yawRef.current -= dx * sensitivity;
      pitchRef.current -= dy * sensitivity;
      // Clamp pitch between -89 and +89 deg
      pitchRef.current = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, pitchRef.current));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mouseup', handleMouseUp);

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      if (canvas) {
        canvas.removeEventListener('mousedown', handleMouseDown);
      }
    };
  }, []);

  const resetCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 140, 200);
      yawRef.current = 0;
      pitchRef.current = -0.35;
    }
  };

  return (
    <div
      ref={containerRef}
      id="voxy-viewport-container"
      className="relative w-full h-full bg-[#0a0b0e] overflow-hidden select-none cursor-grab active:cursor-grabbing"
    >
      <canvas ref={canvasRef} id="voxy-render-canvas" className="w-full h-full block" />

      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40">
        <div className="w-4 h-0.5 bg-white/90"></div>
        <div className="w-0.5 h-4 bg-white/90 -mt-2.25 ml-1.75"></div>
      </div>

      {/* Floating HUD Controls */}
      <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
        {/* Coordinates & Heading Chip */}
        <div
          id="camera-telemetry-chip"
          className="flex items-center gap-3 bg-stone-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-stone-800/80 text-xs font-mono text-stone-300 shadow-lg"
        >
          <div className="flex items-center gap-1 text-emerald-400">
            <Compass className="w-3.5 h-3.5" />
            <span>
              XYZ: {camPos.x}, {camPos.y}, {camPos.z}
            </span>
          </div>
          <div className="h-3 w-[1px] bg-stone-700" />
          <div className="text-stone-400">
            Chunk: [{Math.floor(camPos.x / 16)}, {Math.floor(camPos.z / 16)}]
          </div>
          <div className="h-3 w-[1px] bg-stone-700" />
          <div className="text-sky-400">
            Facing: {camFacing.yaw}° / {camFacing.pitch}°
          </div>
        </div>

        {/* Render Mode Pills */}
        <div
          id="render-modes-toolbar"
          className="flex items-center gap-1 bg-stone-950/80 backdrop-blur-md p-1 rounded-lg border border-stone-800/80 text-xs shadow-lg"
        >
          {(
            [
              { mode: 'NORMAL', label: 'Shaded' },
              { mode: 'LOD_LEVEL', label: 'LOD Tiers' },
              { mode: 'WIREFRAME', label: 'Meshlets' },
              { mode: 'NORMALS', label: 'Normals' },
              { mode: 'HEATMAP', label: 'Density' },
            ] as const
          ).map((item) => (
            <button
              key={item.mode}
              id={`btn-rendermode-${item.mode.toLowerCase()}`}
              onClick={() => onRenderModeChange(item.mode)}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                renderMode === item.mode
                  ? 'bg-sky-500 text-stone-950 font-semibold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Flight Control Helpers (Right Side) */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        {/* Vulkan Direct Layer Pill */}
        {config?.vulkan?.backend === 'VULKAN_1_3' && (
          <button
            id="btn-viewport-vulkan-pill"
            onClick={onOpenVulkanModal}
            className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 backdrop-blur-md px-2.5 py-1 rounded-lg border border-rose-500/30 text-xs font-mono text-rose-300 shadow-lg transition-all group"
            title="Open Vulkan 1.3 Pipeline Inspector & SPIR-V Disassembler"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold">VK 1.3</span>
            {config?.vulkan?.enableMeshShaders && (
              <span className="text-[10px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold">
                MESHLET
              </span>
            )}
            {config?.vulkan?.enableIndirectDrawCount && (
              <span className="text-[10px] px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold">
                INDIRECT
              </span>
            )}
          </button>
        )}

        {/* Fly Speed selector */}
        <div className="flex items-center bg-stone-950/80 backdrop-blur-md px-2 py-1 rounded-lg border border-stone-800/80 text-xs text-stone-300">
          <span className="text-stone-400 mr-1.5 font-mono">Speed:</span>
          {[1, 2, 4].map((spd) => (
            <button
              key={spd}
              id={`btn-speed-${spd}x`}
              onClick={() => setSpeedMultiplier(spd)}
              className={`px-1.5 py-0.5 rounded font-mono ${
                speedMultiplier === spd ? 'bg-stone-700 text-sky-400 font-bold' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Bounds Toggle */}
        <button
          id="btn-toggle-bounds"
          onClick={() => setShowBounds(!showBounds)}
          title="Toggle Octree Section Bounding Boxes"
          className={`p-1.5 rounded-lg border text-xs backdrop-blur-md transition-all ${
            showBounds
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : 'bg-stone-950/80 border-stone-800/80 text-stone-400 hover:text-stone-200'
          }`}
        >
          <Box className="w-4 h-4" />
        </button>

        {/* Reset Camera */}
        <button
          id="btn-reset-camera"
          onClick={resetCamera}
          title="Reset Freecam Position"
          className="p-1.5 rounded-lg border border-stone-800/80 bg-stone-950/80 backdrop-blur-md text-stone-400 hover:text-stone-200 text-xs"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Flight Control Legend (Bottom Left) */}
      <div className="absolute bottom-3 left-3 bg-stone-950/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-stone-800/60 text-[11px] font-mono text-stone-400 flex items-center gap-3 pointer-events-none">
        <span>WASD: Fly</span>
        <span>•</span>
        <span>Space/Shift: Up/Down</span>
        <span>•</span>
        <span>Drag: Look Around</span>
      </div>
    </div>
  );
};
