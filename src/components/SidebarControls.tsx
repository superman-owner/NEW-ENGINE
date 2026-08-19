import React from 'react';
import { 
  Play, 
  Square, 
  Sparkles, 
  Sliders, 
  Zap, 
  Clock, 
  Database, 
  ShieldAlert, 
  Cpu 
} from 'lucide-react';
import type { StrategyPreset } from '../types/ppo';

interface SidebarControlsProps {
  presets: StrategyPreset[];
  currentPreset: StrategyPreset;
  onSelectPreset: (preset: StrategyPreset) => void;
  onOpenCreatePreset: () => void;
  symbol: string;
  setSymbol: (s: string) => void;
  timeframe: string;
  setTimeframe: (tf: string) => void;
  bars: string;
  setBars: (b: string) => void;
  episodes: number;
  setEpisodes: (ep: number) => void;
  actorLr: number;
  setActorLr: (lr: number) => void;
  criticLr: number;
  setCriticLr: (lr: number) => void;
  clipEps: number;
  setClipEps: (eps: number) => void;
  isTraining: boolean;
  onStartTraining: () => void;
  onStopTraining: () => void;
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({
  presets,
  currentPreset,
  onSelectPreset,
  onOpenCreatePreset,
  symbol,
  setSymbol,
  timeframe,
  setTimeframe,
  bars,
  setBars,
  episodes,
  setEpisodes,
  actorLr,
  setActorLr,
  criticLr,
  setCriticLr,
  clipEps,
  setClipEps,
  isTraining,
  onStartTraining,
  onStopTraining,
}) => {
  return (
    <aside className="w-80 border-r border-[#1c1c24] bg-[#060608] flex flex-col justify-between h-[calc(100vh-3.5rem)] select-none">
      <div className="p-4 space-y-4 overflow-y-auto">
        {/* Strategy Preset Selector Card */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00c7be]" />
              Strategy Preset:
            </label>
            <button
              onClick={onOpenCreatePreset}
              className="text-[11px] font-bold text-[#00c7be] hover:text-white px-2 py-0.5 rounded bg-[#0c0c10] border border-[#1c1c24] transition-colors"
            >
              + New
            </button>
          </div>
          <select
            value={currentPreset.id}
            onChange={(e) => {
              const p = presets.find((x) => x.id === e.target.value);
              if (p) onSelectPreset(p);
            }}
            className="w-full bg-[#0c0c10] border border-[#1c1c24] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#007aff] transition-colors"
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#0c0c10] text-white">
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Asset Symbol Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#86868b]">Asset Symbol:</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="e.g. XAUUSD"
            className="w-full bg-[#0c0c10] border border-[#1c1c24] text-white font-bold text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#007aff]"
          />
        </div>

        {/* Timeframe & Bars Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#86868b] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#86868b]" />
              Timeframe:
            </label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full bg-[#0c0c10] border border-[#1c1c24] text-white text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#007aff]"
            >
              {['M1', 'M5', 'M15', 'H1', 'H4', 'D1'].map((tf) => (
                <option key={tf} value={tf} className="bg-[#0c0c10]">
                  {tf}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#86868b] flex items-center gap-1">
              <Database className="w-3 h-3 text-[#86868b]" />
              Bars Count:
            </label>
            <select
              value={bars}
              onChange={(e) => setBars(e.target.value)}
              className="w-full bg-[#0c0c10] border border-[#1c1c24] text-white text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#007aff]"
            >
              {['5,000', '10,000', '20,000', '50,000', '100,000'].map((b) => (
                <option key={b} value={b} className="bg-[#0c0c10]">
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Training Epochs Slider */}
        <div className="space-y-2 pt-1">
          <div className="flex justify-between text-xs">
            <span className="text-[#86868b]">PPO Epochs:</span>
            <span className="font-mono font-bold text-white">{episodes} Epochs</span>
          </div>
          <input
            type="range"
            min={100}
            max={800}
            step={25}
            value={episodes}
            onChange={(e) => setEpisodes(Number(e.target.value))}
            className="w-full accent-[#007aff] cursor-pointer"
          />
        </div>

        {/* Advanced PPO Hyperparameters Drawer */}
        <div className="pt-2 border-t border-[#1c1c24] space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Sliders className="w-3.5 h-3.5 text-[#007aff]" />
            <span>PPO Hyperparameters</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#86868b]">Actor LR:</span>
              <input
                type="number"
                step="0.0001"
                value={actorLr}
                onChange={(e) => setActorLr(Number(e.target.value))}
                className="w-20 bg-[#0c0c10] border border-[#1c1c24] text-right font-mono text-white px-2 py-1 rounded text-xs"
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#86868b]">Critic LR:</span>
              <input
                type="number"
                step="0.0001"
                value={criticLr}
                onChange={(e) => setCriticLr(Number(e.target.value))}
                className="w-20 bg-[#0c0c10] border border-[#1c1c24] text-right font-mono text-white px-2 py-1 rounded text-xs"
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#86868b]">Clip Epsilon (ε):</span>
              <input
                type="number"
                step="0.05"
                value={clipEps}
                onChange={(e) => setClipEps(Number(e.target.value))}
                className="w-20 bg-[#0c0c10] border border-[#1c1c24] text-right font-mono text-white px-2 py-1 rounded text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons Bar */}
      <div className="p-4 border-t border-[#1c1c24] bg-[#060608] space-y-2">
        {!isTraining ? (
          <button
            onClick={onStartTraining}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#007aff] to-[#0062cc] hover:from-[#0062cc] hover:to-[#0051a8] text-white font-bold text-sm shadow-lg shadow-blue-950/40 transition-all active:scale-98"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>START PPO TRAINING</span>
          </button>
        ) : (
          <button
            onClick={onStopTraining}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#ff453a] hover:bg-[#d70015] text-white font-bold text-sm shadow-lg shadow-red-950/40 transition-all active:scale-98"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>STOP TRAINING</span>
          </button>
        )}
      </div>
    </aside>
  );
};
