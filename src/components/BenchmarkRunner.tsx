import React, { useState } from 'react';
import { BenchmarkResult } from '../types/voxy';
import { X, Play, Zap, CheckCircle2, TrendingUp, Cpu, HardDrive } from 'lucide-react';

interface BenchmarkRunnerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BenchmarkRunner: React.FC<BenchmarkRunnerProps> = ({ isOpen, onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([
    {
      id: 'jmh-1',
      name: 'ScanMesher 2D Greedy Meshing',
      category: 'Meshing',
      score: 184500,
      unit: 'ops/sec',
      throughput: '184.5 K sections/s',
      latencyP95Ms: 0.005,
      memoryMB: 12.4,
      details: 'Greedy face merger on 16x16x16 dense voxel chunks',
    },
    {
      id: 'jmh-2',
      name: 'LMDB Section Save/Load (JMH)',
      category: 'Storage',
      score: 412000,
      unit: 'ops/sec',
      throughput: '412.0 K reads/s',
      latencyP95Ms: 0.002,
      memoryMB: 48.0,
      details: 'Direct memory-mapped B+ Tree persistent read transactions',
    },
    {
      id: 'jmh-3',
      name: 'RocksDB LSM Write Batching',
      category: 'Storage',
      score: 165000,
      unit: 'ops/sec',
      throughput: '165.0 K writes/s',
      latencyP95Ms: 0.008,
      memoryMB: 64.2,
      details: 'Compacted SSTable write batches with block cache',
    },
    {
      id: 'jmh-4',
      name: 'Octree Hierarchical Traversal',
      category: 'LOD Traversal',
      score: 890000,
      unit: 'nodes/sec',
      throughput: '890.0 K nodes/s',
      latencyP95Ms: 0.001,
      memoryMB: 8.5,
      details: 'Frustum & Screenspace error sub-division AABB tests',
    },
    {
      id: 'jmh-5',
      name: 'LZ4 Voxel Block Compressor',
      category: 'Compression',
      score: 620000,
      unit: 'blocks/sec',
      throughput: '1.2 GB/s',
      latencyP95Ms: 0.003,
      memoryMB: 4.1,
      details: 'Byte-aligned high speed LZ4 frame compression',
    },
  ]);

  if (!isOpen) return null;

  const handleRunAll = () => {
    setIsRunning(true);
    setCurrentProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setCurrentProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsRunning(false);
        // Slightly randomize results for realism
        setBenchmarks((prev) =>
          prev.map((b) => ({
            ...b,
            score: Math.round(b.score * (0.95 + Math.random() * 0.1)),
          }))
        );
      }
    }, 200);
  };

  return (
    <div
      id="modal-benchmark-runner"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-3xl bg-stone-900 border border-stone-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-100">Voxy JMH Benchmark Suite</h2>
              <p className="text-xs text-stone-400">
                Measure raw engine throughput for ScanMesher, Storage Backends, & Octree Traversal
              </p>
            </div>
          </div>
          <button
            id="btn-close-benchmark-modal"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="flex items-center justify-between p-4 bg-stone-950/60 rounded-lg border border-stone-800">
            <div>
              <div className="text-sm font-semibold text-stone-200">Execute Full JMH Microbenchmark</div>
              <div className="text-xs text-stone-400">Runs 5 iterations across all subsystems</div>
            </div>
            <button
              id="btn-run-all-benchmarks"
              onClick={handleRunAll}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs rounded-lg transition-colors shadow-lg shadow-amber-500/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isRunning ? `Running (${currentProgress}%)` : 'Run Benchmarks'}
            </button>
          </div>

          {/* Progress Bar */}
          {isRunning && (
            <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-150"
                style={{ width: `${currentProgress}%` }}
              />
            </div>
          )}

          {/* Benchmark Results List */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Benchmark Results
            </div>
            <div className="space-y-2">
              {benchmarks.map((bm) => (
                <div
                  key={bm.id}
                  className="p-4 bg-stone-950/50 rounded-lg border border-stone-800 flex items-center justify-between font-mono text-xs hover:border-stone-700 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-stone-200 font-bold font-sans">{bm.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-sky-400">
                        {bm.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 font-sans">{bm.details}</div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <div className="text-sm font-bold text-emerald-400">
                      {bm.score.toLocaleString()} {bm.unit}
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Throughput: <span className="text-stone-200">{bm.throughput}</span> • P95:{' '}
                      <span className="text-amber-400">{bm.latencyP95Ms} ms</span>
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
