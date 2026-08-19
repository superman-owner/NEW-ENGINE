import React from 'react';
import { X, Settings, ShieldCheck, Folder, Database } from 'lucide-react';
import type { EngineSettings } from '../types/ppo';

interface EngineSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EngineSettings;
  onSaveSettings: (s: EngineSettings) => void;
}

export const EngineSettingsModal: React.FC<EngineSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [spreadPips, setSpreadPips] = React.useState(settings.spreadPips);
  const [slippagePips, setSlippagePips] = React.useState(settings.slippagePips);
  const [maxDrawdownLimit, setMaxDrawdownLimit] = React.useState(settings.maxDrawdownLimit);
  const [mt5Directory, setMt5Directory] = React.useState(settings.mt5Directory);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      spreadPips,
      slippagePips,
      maxDrawdownLimit,
      mt5Directory,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0c0c10] border border-[#1c1c24] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="px-5 py-4 border-b border-[#1c1c24] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#007aff]" />
            <h2 className="text-sm font-bold text-white">PPO Engine Settings & Risk Controls</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#121217] hover:bg-[#1c1c24] flex items-center justify-center text-[#86868b] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-white">Spread Friction (Pips):</label>
              <input
                type="number"
                step="0.1"
                value={spreadPips}
                onChange={(e) => setSpreadPips(Number(e.target.value))}
                className="w-full bg-[#121217] border border-[#1c1c24] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#007aff]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-white">Slippage Buffer (Pips):</label>
              <input
                type="number"
                step="0.1"
                value={slippagePips}
                onChange={(e) => setSlippagePips(Number(e.target.value))}
                className="w-full bg-[#121217] border border-[#1c1c24] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#007aff]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-white">Max Drawdown Circuit Breaker (%):</label>
            <input
              type="number"
              step="0.5"
              value={maxDrawdownLimit}
              onChange={(e) => setMaxDrawdownLimit(Number(e.target.value))}
              className="w-full bg-[#121217] border border-[#1c1c24] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#007aff]"
            />
            <p className="text-[10px] text-[#86868b]">
              If episode drawdown exceeds this threshold, strong penalty is injected into PPO reward.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-white">MetaTrader 5 MQL5 Directory:</label>
            <input
              type="text"
              value={mt5Directory}
              onChange={(e) => setMt5Directory(e.target.value)}
              placeholder="e.g. C:/Users/.../AppData/Roaming/MetaQuotes/Terminal/.../MQL5"
              className="w-full bg-[#121217] border border-[#1c1c24] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#007aff] font-mono text-[11px]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#007aff] hover:bg-[#0062cc] font-bold text-white text-xs transition-colors shadow-lg shadow-blue-950/50"
            >
              Save Engine Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
