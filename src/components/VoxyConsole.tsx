import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, X, CornerDownLeft } from 'lucide-react';
import { VoxyConfig } from '../types/voxy';

interface VoxyConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
  onOpenConfig: () => void;
  onOpenImporter: () => void;
  onOpenBenchmarks: () => void;
  onOpenVulkan: () => void;
}

interface LogEntry {
  text: string;
  type: 'info' | 'warn' | 'error' | 'success' | 'command';
  timestamp: string;
}

export const VoxyConsole: React.FC<VoxyConsoleProps> = ({
  isOpen,
  onClose,
  onReload,
  onOpenConfig,
  onOpenImporter,
  onOpenBenchmarks,
  onOpenVulkan,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      text: '[Voxy] Initializing Voxy Level of Detail Engine v0.4.3',
      type: 'info',
      timestamp: '20:06:12',
    },
    {
      text: '[Voxy] GPU Capabilities verified: GL_ARB_shader_draw_parameters, GL_ARB_multi_draw_indirect, Compute Shaders active',
      type: 'success',
      timestamp: '20:06:12',
    },
    {
      text: '[Voxy] Octree hierarchical traverser registered. Storage: LMDB Backend (Fast Mapped)',
      type: 'info',
      timestamp: '20:06:13',
    },
    {
      text: 'Type /help or /voxy to see all available in-engine commands.',
      type: 'info',
      timestamp: '20:06:13',
    },
  ]);

  const inputRef = useRef<HTMLInputElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isOpen) return null;

  const handleCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    const timeStr = new Date().toLocaleTimeString();

    // Echo command
    setLogs((prev) => [...prev, { text: `> ${trimmed}`, type: 'command', timestamp: timeStr }]);
    setInputVal('');

    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase();
    const sub = parts[1]?.toLowerCase();
    const arg = parts[2]?.toLowerCase();

    if (cmd === '/help') {
      setLogs((prev) => [
        ...prev,
        {
          text: 'Available Commands:\n  /vulkan - Opens Vulkan 1.3 pipeline inspector & SPIR-V viewer\n  /vulkan info - Prints active Vulkan device and extensions\n  /vulkan validate - Intercepts Khronos validation layer audit\n  /voxy reload - Reloads renderer and engine instances\n  /voxy import world <name> - Ingests world region\n  /voxy import distant_horizons <db> - Imports DH SQLite DB\n  /voxy import bobby <name> - Ingests Bobby cache\n  /voxy debug verifyTLNChildMask - Verifies Top Level Node octree integrity\n  /voxy settings - Opens Sodium configuration\n  /voxy benchmark - Opens JMH benchmark suite\n  /clear - Clears console logs',
          type: 'info',
          timestamp: timeStr,
        },
      ]);
    } else if (cmd === '/clear') {
      setLogs([]);
    } else if (cmd === '/vulkan') {
      if (!sub || sub === 'gui' || sub === 'inspect') {
        onOpenVulkan();
        setLogs((prev) => [...prev, { text: '[Vulkan] Opening Vulkan 1.3 Pipeline & SPIR-V Inspector...', type: 'info', timestamp: timeStr }]);
      } else if (sub === 'info') {
        setLogs((prev) => [
          ...prev,
          {
            text: '[Vulkan 1.3] API: VK_API_VERSION_1_3 (1.3.280) | Extensions: VK_EXT_mesh_shader, VK_KHR_draw_indirect_count, VK_KHR_timeline_semaphore, VK_EXT_descriptor_indexing | Allocator: VMA Pool',
            type: 'success',
            timestamp: timeStr,
          },
        ]);
      } else if (sub === 'validate') {
        setLogs((prev) => [
          ...prev,
          {
            text: '[VK_LAYER_KHRONOS_validation] Audit complete: 0 Hazards, 0 Sync Barrier Collisions, All SPIR-V descriptors verified.',
            type: 'success',
            timestamp: timeStr,
          },
        ]);
      } else {
        setLogs((prev) => [
          ...prev,
          { text: `[Vulkan] Unknown subcommand: ${sub}. Try /vulkan or /vulkan info.`, type: 'error', timestamp: timeStr },
        ]);
      }
    } else if (cmd === '/voxy') {
      if (sub === 'reload') {
        onReload();
        setLogs((prev) => [
          ...prev,
          { text: '[Voxy] Rebuilding active render pipeline and octree nodes...', type: 'success', timestamp: timeStr },
        ]);
      } else if (sub === 'settings' || sub === 'config') {
        onOpenConfig();
        setLogs((prev) => [...prev, { text: '[Voxy] Opening Settings modal', type: 'info', timestamp: timeStr }]);
      } else if (sub === 'benchmark' || sub === 'bench') {
        onOpenBenchmarks();
        setLogs((prev) => [...prev, { text: '[Voxy] Opening JMH Benchmarks modal', type: 'info', timestamp: timeStr }]);
      } else if (sub === 'import') {
        onOpenImporter();
        setLogs((prev) => [
          ...prev,
          { text: `[Voxy] World importer invoked for target: ${arg || 'default'}`, type: 'info', timestamp: timeStr },
        ]);
      } else if (sub === 'debug' && parts[2] === 'verifyTLNChildMask') {
        setLogs((prev) => [
          ...prev,
          {
            text: '[Voxy] Verifying all Top Level Nodes... All 49 TLN child masks intact [100% OK]. No orphaned octants found.',
            type: 'success',
            timestamp: timeStr,
          },
        ]);
      } else {
        setLogs((prev) => [
          ...prev,
          {
            text: `[Voxy] Unknown subcommand: "${sub}". Type /help for assistance.`,
            type: 'error',
            timestamp: timeStr,
          },
        ]);
      }
    } else {
      setLogs((prev) => [
        ...prev,
        {
          text: `Unknown command: "${trimmed}". Type /help for list of commands.`,
          type: 'error',
          timestamp: timeStr,
        },
      ]);
    }
  };

  return (
    <div
      id="voxy-console-drawer"
      className="fixed bottom-0 left-0 right-0 z-40 h-80 bg-stone-950/95 backdrop-blur-md border-t border-stone-800 shadow-2xl flex flex-col font-mono text-xs animate-in slide-in-from-bottom duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-stone-800 bg-stone-900/60">
        <div className="flex items-center gap-2 text-stone-300">
          <Terminal className="w-4 h-4 text-sky-400" />
          <span className="font-bold">Voxy Command Console</span>
        </div>
        <button
          id="btn-close-console"
          onClick={onClose}
          className="text-stone-400 hover:text-stone-100 p-1 rounded hover:bg-stone-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Log Output */}
      <div ref={logContainerRef} className="flex-1 overflow-y-auto p-4 space-y-1.5 font-mono">
        {logs.map((log, i) => (
          <div key={i} className="flex items-start gap-2 leading-relaxed">
            <span className="text-stone-600 select-none">[{log.timestamp}]</span>
            <span
              className={
                log.type === 'command'
                  ? 'text-sky-300 font-bold'
                  : log.type === 'success'
                  ? 'text-emerald-400'
                  : log.type === 'error'
                  ? 'text-rose-400'
                  : log.type === 'warn'
                  ? 'text-amber-400'
                  : 'text-stone-300'
              }
            >
              {log.text}
            </span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-2.5 border-t border-stone-800 bg-stone-900/40 flex items-center gap-2">
        <span className="text-sky-400 font-bold pl-2 select-none">&gt;</span>
        <input
          ref={inputRef}
          id="voxy-console-input"
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCommand(inputVal);
            if (e.key === 'Tab') {
              e.preventDefault();
              if (inputVal.startsWith('/voxy')) {
                setInputVal('/voxy reload');
              } else if (inputVal.startsWith('/')) {
                setInputVal('/voxy ');
              }
            }
          }}
          placeholder="Type command (/help, /voxy reload, /voxy settings...)"
          className="flex-1 bg-transparent text-stone-100 text-xs focus:outline-none font-mono placeholder:text-stone-600"
        />
        <button
          id="btn-submit-console-cmd"
          onClick={() => handleCommand(inputVal)}
          className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-xs flex items-center gap-1 transition-colors"
        >
          <span>Send</span>
          <CornerDownLeft className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
