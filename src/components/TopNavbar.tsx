import React from 'react';
import { 
  Activity, 
  Settings, 
  Download, 
  Rocket, 
  Layers, 
  CheckCircle2, 
  Cpu, 
  ShieldCheck 
} from 'lucide-react';
import type { StrategyPreset } from '../types/ppo';

interface TopNavbarProps {
  presets: StrategyPreset[];
  currentPreset: StrategyPreset;
  onSelectPreset: (preset: StrategyPreset) => void;
  onOpenCreatePreset: () => void;
  onOpenSettings: () => void;
  onExportMql5: () => void;
  onDeployMT5: () => void;
  isTraining: boolean;
  trainingProgress: number;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  presets,
  currentPreset,
  onSelectPreset,
  onOpenCreatePreset,
  onOpenSettings,
  onExportMql5,
  onDeployMT5,
  isTraining,
  trainingProgress,
}) => {
  return (
    <header className="h-14 border-b border-[#1c1c24] bg-[#060608] px-4 flex items-center justify-between select-none">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5 px-1">
          <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block shadow-sm" />
          <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block shadow-sm" />
          <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block shadow-sm" />
        </div>

        <div className="h-4 w-px bg-[#1c1c24] mx-1" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#007aff]/30 to-[#00c7be]/30 border border-[#00c7be]/40 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-[#00c7be]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-wider text-white">FXFORGE</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-[#007aff]/20 text-[#007aff] font-bold border border-[#007aff]/30 tracking-wide">
                PPO ENGINE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Active Strategy Indicator */}
      <div className="hidden md:flex items-center gap-2 bg-[#0c0c10] border border-[#1c1c24] rounded-full px-4 py-1.5 text-xs">
        <span className="text-[#86868b] flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#00c7be]" />
          Strategy:
        </span>
        <select
          value={currentPreset.id}
          onChange={(e) => {
            const p = presets.find((x) => x.id === e.target.value);
            if (p) onSelectPreset(p);
          }}
          className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-2"
        >
          {presets.map((p) => (
            <option key={p.id} value={p.id} className="bg-[#0c0c10] text-white">
              {p.name}
            </option>
          ))}
        </select>
        <button
          onClick={onOpenCreatePreset}
          className="ml-1 text-[11px] font-bold text-[#00c7be] hover:text-white transition-colors"
        >
          + New
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0c0c10] border border-[#1c1c24] text-xs">
          <span className={`w-2 h-2 rounded-full ${isTraining ? 'bg-[#00c7be] animate-ping' : 'bg-[#30d158]'}`} />
          <span className="text-[#86868b]">Engine:</span>
          <span className="font-medium text-white">
            {isTraining ? `Training (${trainingProgress.toFixed(0)}%)` : 'Ready'}
          </span>
        </div>

        {/* Export MQL5 EA Button */}
        <button
          onClick={onExportMql5}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121217] hover:bg-[#1c1c24] border border-[#1c1c24] text-xs font-semibold text-white transition-all active:scale-95"
          title="Export Standalone MQL5 EA Code"
        >
          <Download className="w-3.5 h-3.5 text-[#86868b]" />
          <span>Export EA</span>
        </button>

        {/* 1-Click Deploy Button */}
        <button
          onClick={onDeployMT5}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#15803d] to-[#16a34a] hover:from-[#16a34a] hover:to-[#22c55e] text-xs font-bold text-white shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
        >
          <Rocket className="w-3.5 h-3.5" />
          <span>Deploy MT5</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="w-8 h-8 rounded-lg bg-[#0c0c10] hover:bg-[#181820] border border-[#1c1c24] flex items-center justify-center text-[#86868b] hover:text-white transition-colors"
          title="Engine Risk & Pipeline Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
