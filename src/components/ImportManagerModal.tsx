import React, { useState, useEffect } from 'react';
import { ImportTask } from '../types/voxy';
import { X, UploadCloud, FolderArchive, Database, Play, CheckCircle2, AlertCircle, Trash2, FileText } from 'lucide-react';

interface ImportManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorldLoadPreset: (seed: number, name: string) => void;
}

export const ImportManagerModal: React.FC<ImportManagerModalProps> = ({
  isOpen,
  onClose,
  onWorldLoadPreset,
}) => {
  const [importType, setImportType] = useState<'world' | 'distant_horizons' | 'bobby' | 'zip'>('world');
  const [targetPath, setTargetPath] = useState('saves/Highland_Peaks');
  const [isProcessing, setIsProcessing] = useState(false);
  const [tasks, setTasks] = useState<ImportTask[]>([
    {
      id: 'task-1',
      name: 'Alpine Highlands (.mca region)',
      type: 'world',
      source: 'saves/Alpine_Highlands/region',
      progress: 100,
      totalChunks: 1024,
      processedChunks: 1024,
      quadsGenerated: 48920,
      rateChunksPerSec: 184,
      status: 'completed',
      startTime: Date.now() - 3600000,
    },
  ]);

  // Simulate ongoing import progress
  useEffect(() => {
    let interval: number;
    if (isProcessing) {
      interval = window.setInterval(() => {
        setTasks((prev) =>
          prev.map((t) => {
            if (t.status === 'processing') {
              const nextChunks = Math.min(t.totalChunks, t.processedChunks + 48);
              const progress = Math.round((nextChunks / t.totalChunks) * 100);
              const isDone = nextChunks >= t.totalChunks;
              return {
                ...t,
                processedChunks: nextChunks,
                progress,
                quadsGenerated: t.quadsGenerated + 1450,
                status: isDone ? 'completed' : 'processing',
              };
            }
            return t;
          })
        );
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  // Stop processing if all tasks completed
  useEffect(() => {
    const hasActive = tasks.some((t) => t.status === 'processing');
    if (!hasActive && isProcessing) {
      setIsProcessing(false);
    }
  }, [tasks, isProcessing]);

  if (!isOpen) return null;

  const handleStartImport = () => {
    const newTask: ImportTask = {
      id: `task-${Date.now()}`,
      name: targetPath.split('/').pop() || 'Imported_World',
      type: importType,
      source: targetPath,
      progress: 0,
      totalChunks: 2048,
      processedChunks: 0,
      quadsGenerated: 0,
      rateChunksPerSec: 220,
      status: 'processing',
      startTime: Date.now(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setIsProcessing(true);
  };

  const handleLoadPreset = (seed: number, name: string) => {
    onWorldLoadPreset(seed, name);
    onClose();
  };

  return (
    <div
      id="modal-import-manager"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-3xl bg-stone-900 border border-stone-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-100">World Ingest & Importer</h2>
              <p className="text-xs text-stone-400">
                Batch convert Minecraft MCA regions, Distant Horizons SQLite DBs, & Bobby caches into Voxy LODs
              </p>
            </div>
          </div>
          <button
            id="btn-close-import-modal"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Preset Environments */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Quick Load Procedural Worlds
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'Alpine High Glaciers', seed: 10442, desc: 'Rugged jagged peaks & snowy summits' },
                { name: 'Lush Forest & River', seed: 42918, desc: 'Deep river valleys & dense oak canopies' },
                { name: 'Amplified Crags & Caves', seed: 88310, desc: 'Extreme vertical cliffs with hollow caves' },
              ].map((preset) => (
                <button
                  key={preset.name}
                  id={`btn-load-preset-${preset.seed}`}
                  onClick={() => handleLoadPreset(preset.seed, preset.name)}
                  className="p-3 rounded-lg bg-stone-950/60 border border-stone-800 hover:border-sky-500/60 hover:bg-stone-800/40 text-left transition-all group"
                >
                  <div className="text-sm font-semibold text-stone-200 group-hover:text-sky-400">
                    {preset.name}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1">{preset.desc}</div>
                  <div className="text-[10px] font-mono text-stone-500 mt-2">Seed: {preset.seed}</div>
                </button>
              ))}
            </div>
          </div>

          {/* New Ingestion Task Box */}
          <div className="p-4 bg-stone-950/60 border border-stone-800 rounded-lg space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Create New Ingest Task
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { type: 'world', label: 'Minecraft Save (.mca)', icon: FolderArchive },
                  { type: 'distant_horizons', label: 'Distant Horizons DB', icon: Database },
                  { type: 'bobby', label: 'Bobby Cache (.bobby)', icon: FileText },
                  { type: 'zip', label: 'Zip Archive (.zip)', icon: UploadCloud },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    id={`btn-import-type-${item.type}`}
                    onClick={() => {
                      setImportType(item.type);
                      if (item.type === 'distant_horizons') setTargetPath('DistantHorizons.sqlite');
                      else if (item.type === 'bobby') setTargetPath('.bobby/survival_server');
                      else if (item.type === 'zip') setTargetPath('backups/world_backup.zip');
                      else setTargetPath('saves/Highland_Peaks');
                    }}
                    className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center text-center gap-1.5 transition-all ${
                      importType === item.type
                        ? 'bg-sky-500/10 border-sky-500/60 text-sky-300'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <input
                id="input-import-path"
                type="text"
                value={targetPath}
                onChange={(e) => setTargetPath(e.target.value)}
                placeholder="Path to directory, region folder, or .sqlite file"
                className="flex-1 bg-stone-900 border border-stone-800 text-stone-200 text-xs rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-sky-500"
              />
              <button
                id="btn-trigger-import"
                onClick={handleStartImport}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-stone-950 font-semibold text-xs rounded-lg transition-colors shadow-lg shadow-emerald-500/10"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Ingest
              </button>
            </div>
          </div>

          {/* Active / Previous Ingest Tasks */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center justify-between">
              <span>Ingestion Tasks History</span>
              <span className="text-[11px] font-mono text-stone-500">{tasks.length} total</span>
            </div>

            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 bg-stone-950/40 rounded-lg border border-stone-800 flex flex-col gap-2 font-mono text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {task.status === 'processing' && (
                        <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                      )}
                      {task.status === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
                      <span className="text-stone-200 font-semibold">{task.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-400 uppercase">
                        {task.type}
                      </span>
                    </div>

                    <div className="text-stone-400 text-[11px]">
                      {task.processedChunks} / {task.totalChunks} Chunks ({task.progress}%)
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        task.status === 'completed' ? 'bg-emerald-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <div>Source: {task.source}</div>
                    <div className="flex items-center gap-3">
                      <span>Quads: {task.quadsGenerated.toLocaleString()}</span>
                      {task.status === 'processing' && (
                        <span className="text-sky-400 font-bold">{task.rateChunksPerSec} chunks/s</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
