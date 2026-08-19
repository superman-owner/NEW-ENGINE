import React from 'react';
import * as LucideIcons from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  YAxis,
} from 'recharts';
import type { Brain3DNode, EEGDataPoint, MembraneHistoryPoint } from './types';

interface NeuralTelemetryHUDProps {
  selectedNode: Brain3DNode | null;
  totalNodes: number;
  totalEdges: number;
  firingRateHz: number;
  graphHomophily: number;
  eegHistory: EEGDataPoint[];
  membraneHistory: MembraneHistoryPoint[];
  onInjectCurrent: (nodeId: string, amount: number) => void;
}

export const NeuralTelemetryHUD: React.FC<NeuralTelemetryHUDProps> = ({
  selectedNode,
  totalNodes,
  totalEdges,
  firingRateHz,
  graphHomophily,
  eegHistory,
  membraneHistory,
  onInjectCurrent,
}) => {
  return (
    <div className="w-[350px] h-full bg-[#0c0c14]/95 backdrop-blur-3xl border-l border-white/[0.08] flex flex-col select-none z-20 flex-shrink-0 overflow-y-auto custom-scrollbar">
      {/* 1. Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#64d2ff]/15 border border-[#64d2ff]/30 flex items-center justify-center text-[#64d2ff]">
            <LucideIcons.Activity size={16} />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-tight">GNN Graph Telemetry</h2>
            <p className="text-[10px] text-[#86868b] font-mono">Connectome Embeddings & Spikes</p>
          </div>
        </div>

        <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#ffd60a] bg-[#ffd60a]/10 px-2 py-0.5 rounded-full border border-[#ffd60a]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ffd60a] animate-ping" />
          ONLINE
        </span>
      </div>

      {/* 2. Top Summary Metric Cards */}
      <div className="p-4 grid grid-cols-2 gap-2.5 border-b border-white/[0.08]">
        {/* 3D Vertices */}
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <span className="text-[10px] font-mono text-[#86868b] block">3D Cortical Nodes</span>
          <span className="text-lg font-mono font-bold text-white mt-0.5 block">
            {totalNodes} <span className="text-xs text-[#ffd60a]">somas</span>
          </span>
        </div>

        {/* 3D Synaptic Edges */}
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <span className="text-[10px] font-mono text-[#86868b] block">Synaptic Edges</span>
          <span className="text-lg font-mono font-bold text-white mt-0.5 block">
            {totalEdges} <span className="text-xs text-[#64d2ff]">links</span>
          </span>
        </div>

        {/* Firing Rate */}
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <span className="text-[10px] font-mono text-[#86868b] block">Spike Frequency</span>
          <span className="text-lg font-mono font-bold text-[#ff375f] mt-0.5 block">
            {firingRateHz.toFixed(1)} <span className="text-xs">Hz</span>
          </span>
        </div>

        {/* Graph Homophily */}
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <span className="text-[10px] font-mono text-[#86868b] block">Graph Homophily</span>
          <span className="text-lg font-mono font-bold text-[#30d158] mt-0.5 block">
            {(graphHomophily * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* 3. Inspected 3D Node Ego-Network & Vector Embedding */}
      <div className="p-4 border-b border-white/[0.08] space-y-3">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#86868b]">
          Inspected 3D Vertex & Embedding
        </div>

        {selectedNode ? (
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.1] space-y-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">{selectedNode.label}</span>
                <span className="text-[10px] font-mono text-[#ffd60a] uppercase block truncate">
                  Lobe: {selectedNode.lobe} • {selectedNode.subLabel}
                </span>
              </div>
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: selectedNode.color, boxShadow: `0 0 10px ${selectedNode.color}` }}
              />
            </div>

            {/* 8-Dimensional Hidden Vector Embedding Heatmap */}
            <div>
              <div className="flex items-center justify-between text-[9px] font-mono text-[#86868b] mb-1">
                <span>Latent Embedding (h_v ∈ R⁸)</span>
                <span>Layer 2</span>
              </div>
              <div className="grid grid-cols-8 gap-1">
                {selectedNode.embedding.map((val, idx) => {
                  const normalized = Math.max(-1, Math.min(1, val));
                  const bg =
                    normalized > 0
                      ? `rgba(100, 210, 255, ${Math.abs(normalized) * 0.9 + 0.1})`
                      : `rgba(255, 69, 58, ${Math.abs(normalized) * 0.9 + 0.1})`;

                  return (
                    <div
                      key={idx}
                      className="h-6 rounded flex items-center justify-center text-[8px] font-mono font-bold text-white/90 border border-white/[0.1]"
                      style={{ backgroundColor: bg }}
                      title={`dim ${idx}: ${val}`}
                    >
                      {val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1)}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 1-Hop Attention Weights */}
            <div>
              <div className="text-[9px] font-mono text-[#86868b] mb-1">
                1-Hop Synaptic Attention (α_ij): {selectedNode.connections.length} targets
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {selectedNode.connections.slice(0, 5).map((tgtId) => (
                  <div
                    key={tgtId}
                    className="flex items-center justify-between text-[10px] font-mono bg-black/40 px-2 py-1 rounded border border-white/[0.04]"
                  >
                    <span className="text-white/70 truncate">{tgtId}</span>
                    <span className="text-[#64d2ff] font-bold">
                      {(selectedNode.attentionWeights[tgtId] || 0.5).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => onInjectCurrent(selectedNode.id, 50)}
              className="w-full py-1.5 rounded-xl bg-gradient-to-r from-[#007aff] to-[#38bdf8] text-white text-xs font-bold shadow-[0_0_14px_rgba(0,122,255,0.45)] hover:brightness-110 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LucideIcons.Zap size={13} className="fill-white" />
              <span>Depolarize Vertex (I_inj = 50μA)</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-center text-xs text-[#86868b]">
            <LucideIcons.MousePointerClick size={18} className="mx-auto mb-1.5 opacity-40 text-[#ffd60a]" />
            <p>Click on any 3D Brain Vertex to inspect its feature vector and ego-graph attention weights</p>
          </div>
        )}
      </div>

      {/* 4. Real-Time Action Potential Oscilloscope */}
      <div className="p-4 border-b border-white/[0.08]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff9f0a]" />
            <span className="text-xs font-bold text-white">Membrane Potential ($V_m$)</span>
          </div>
          <span className="text-[10px] font-mono text-[#ff9f0a]">
            {selectedNode ? `${selectedNode.membranePotential.toFixed(1)} mV` : 'Cortex Average'}
          </span>
        </div>

        <div className="h-24 w-full bg-[#05050a] rounded-xl border border-white/[0.06] p-1 relative overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={membraneHistory}>
              <YAxis domain={[-85, 50]} hide />
              <Line
                type="monotone"
                dataKey="vm"
                stroke="#ffd60a"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Live Multi-Band EEG Oscillations */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#64d2ff]" />
            <span className="text-xs font-bold text-white">Multi-Band EEG Stream</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-mono">
            <span className="text-[#ffd60a]">α Alpha</span>
            <span className="text-[#ff375f]">γ Gamma</span>
          </div>
        </div>

        <div className="h-24 w-full bg-[#05050a] rounded-xl border border-white/[0.06] p-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={eegHistory}>
              <Line
                type="monotone"
                dataKey="alpha"
                stroke="#ffd60a"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="gamma"
                stroke="#ff375f"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="beta"
                stroke="#64d2ff"
                strokeWidth={1}
                dot={false}
                strokeDasharray="2 2"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
