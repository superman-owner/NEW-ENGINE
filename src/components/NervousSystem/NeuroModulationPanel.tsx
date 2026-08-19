import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { GNNControlState, GNNLayerType, BrainLobe } from './types';

interface NeuroModulationPanelProps {
  gnnState: GNNControlState;
  onUpdateState: (updates: Partial<GNNControlState>) => void;
  onTriggerShockwave: () => void;
}

export const NeuroModulationPanel: React.FC<NeuroModulationPanelProps> = ({
  gnnState,
  onUpdateState,
  onTriggerShockwave,
}) => {
  const toggleLobe = (lobe: BrainLobe) => {
    onUpdateState({
      activeLobes: {
        ...gnnState.activeLobes,
        [lobe]: !gnnState.activeLobes[lobe],
      },
    });
  };

  return (
    <div className="w-[330px] h-full bg-[#0c0c14]/95 backdrop-blur-3xl border-r border-white/[0.08] flex flex-col select-none z-20 flex-shrink-0 overflow-y-auto custom-scrollbar">
      {/* 1. Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#ffd60a]/15 border border-[#ffd60a]/30 flex items-center justify-center text-[#ffd60a]">
            <LucideIcons.Brain size={16} />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-tight">3D GNN Architecture</h2>
            <p className="text-[10px] text-[#86868b] font-mono">Connectome & SNN Engine</p>
          </div>
        </div>

        <button
          onClick={onTriggerShockwave}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-[#ffd60a] to-[#ff3b30] text-black font-extrabold text-[11px] shadow-[0_0_16px_rgba(255,214,10,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          title="Inject massive electrical shockwave across all 3D cortical lobes"
        >
          <LucideIcons.Zap size={12} className="fill-black" />
          <span>Shockwave</span>
        </button>
      </div>

      {/* 2. GNN Layer Type Selector */}
      <div className="p-4 space-y-2.5 border-b border-white/[0.08]">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#86868b]">
          GNN Propagation Model
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'GAT', label: 'GAT (Attention)', desc: 'Multi-Head Attention' },
            { id: 'GCN', label: 'GCN (Conv)', desc: 'Spectral Convolution' },
            { id: 'GraphSAGE', label: 'GraphSAGE', desc: 'Inductive Neighbor' },
            { id: 'Neuromorphic_SNN', label: 'Neuromorphic', desc: 'Spike-Timing (LIF)' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onUpdateState({ layerType: item.id as GNNLayerType })}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                gnnState.layerType === item.id
                  ? 'bg-[#007aff]/20 border-[#007aff] text-white shadow-[0_0_12px_rgba(0,122,255,0.35)]'
                  : 'bg-white/[0.02] border-white/[0.06] text-white/70 hover:bg-white/[0.05]'
              }`}
            >
              <div className="text-xs font-bold">{item.label}</div>
              <div className="text-[9px] text-[#86868b] font-mono">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. 3D Anatomical Brain Lobes Filter */}
      <div className="p-4 space-y-2.5 border-b border-white/[0.08]">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#86868b]">
          3D Cortical Lobes Filter
        </div>
        <div className="space-y-1.5">
          {[
            { id: 'frontal' as BrainLobe, name: 'Frontal Lobe', color: '#ffd60a', sub: 'Alpha & Decisions' },
            { id: 'parietal' as BrainLobe, name: 'Parietal Lobe', color: '#64d2ff', sub: 'Spatial & Covariance' },
            { id: 'temporal' as BrainLobe, name: 'Temporal Lobe', color: '#ff9f0a', sub: 'Sequential LSTM Memory' },
            { id: 'occipital' as BrainLobe, name: 'Occipital Lobe', color: '#bf5af2', sub: 'Wavelet Pattern Rec' },
            { id: 'cerebellum' as BrainLobe, name: 'Cerebellum', color: '#30d158', sub: 'Risk Circuit Breaker' },
            { id: 'brainstem' as BrainLobe, name: 'Brainstem', color: '#ff375f', sub: 'HFT Microstructure Flow' },
          ].map((lobe) => {
            const isActive = gnnState.activeLobes[lobe.id];
            return (
              <button
                key={lobe.id}
                onClick={() => toggleLobe(lobe.id)}
                className={`w-full px-2.5 py-1.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-white/[0.05] border-white/[0.12] text-white'
                    : 'bg-white/[0.01] border-white/[0.03] text-white/30'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: lobe.color,
                      boxShadow: isActive ? `0 0 8px ${lobe.color}` : 'none',
                      opacity: isActive ? 1 : 0.25,
                    }}
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold block truncate">{lobe.name}</span>
                    <span className="text-[9px] text-[#86868b] font-mono block truncate">{lobe.sub}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono ml-2 font-bold" style={{ color: isActive ? lobe.color : '#555' }}>
                  {isActive ? 'ON' : 'OFF'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. 3D Camera & Visuals */}
      <div className="p-4 space-y-3.5 border-b border-white/[0.08]">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#86868b]">
          3D Orbital Rendering
        </div>

        {/* Auto Rotation Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-white font-medium">360° Continuous Auto-Orbit</span>
          <button
            onClick={() => onUpdateState({ autoRotate: !gnnState.autoRotate })}
            className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold transition-all cursor-pointer ${
              gnnState.autoRotate
                ? 'bg-[#30d158]/20 border border-[#30d158] text-[#30d158]'
                : 'bg-white/[0.05] border border-white/[0.1] text-white/40'
            }`}
          >
            {gnnState.autoRotate ? 'ORBIT ON' : 'PAUSED'}
          </button>
        </div>

        {/* Rotation Speed */}
        {gnnState.autoRotate && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-white/80">
              <span>Orbit Speed</span>
              <span className="font-mono text-[#007aff]">{gnnState.rotationSpeed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={gnnState.rotationSpeed}
              onChange={(e) => onUpdateState({ rotationSpeed: Number(e.target.value) })}
              className="w-full accent-[#007aff] cursor-pointer"
            />
          </div>
        )}

        {/* Wireframe Mesh Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-white font-medium">Synaptic Wireframe Mesh</span>
          <button
            onClick={() => onUpdateState({ showWireframe: !gnnState.showWireframe })}
            className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold transition-all cursor-pointer ${
              gnnState.showWireframe
                ? 'bg-[#007aff]/20 border border-[#007aff] text-[#007aff]'
                : 'bg-white/[0.05] border border-white/[0.1] text-white/40'
            }`}
          >
            {gnnState.showWireframe ? 'VISIBLE' : 'HIDDEN'}
          </button>
        </div>
      </div>

      {/* 5. GNN Message Passing Dynamics */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-white">
          <span className="font-medium">Message Passing Velocity</span>
          <span className="font-mono text-[#ffd60a] font-bold">
            {gnnState.messagePassingSpeed.toFixed(1)}x
          </span>
        </div>
        <input
          type="range"
          min="0.4"
          max="3.0"
          step="0.2"
          value={gnnState.messagePassingSpeed}
          onChange={(e) => onUpdateState({ messagePassingSpeed: Number(e.target.value) })}
          className="w-full accent-[#ffd60a] cursor-pointer"
        />
      </div>
    </div>
  );
};
