import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import type { StrategyPreset } from '../types/ppo';

interface CreatePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preset: StrategyPreset) => void;
}

export const CreatePresetModal: React.FC<CreatePresetModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('XAUUSD');
  const [timeframe, setTimeframe] = useState('M15');
  const [bars, setBars] = useState('10,000');
  const [episodes, setEpisodes] = useState(300);
  const [modelType, setModelType] = useState('PPO Actor-Critic (12 Quant Features)');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const presetName = name.trim() || `✨ Custom ${symbol} Strategy`;
    const newPreset: StrategyPreset = {
      id: `custom_${Date.now()}`,
      name: presetName.startsWith('✨') ? presetName : `✨ ${presetName}`,
      symbol: symbol.toUpperCase(),
      timeframe,
      bars,
      episodes,
      modelType,
      description: `Custom Quant Pipeline for ${symbol} (${timeframe})`,
      spread: 0.00015,
      actorLr: 0.0003,
      criticLr: 0.0010,
      clipEps: 0.20,
      gamma: 0.99,
      gaeLambda: 0.95,
    };
    onSave(newPreset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0c0c10] border border-[#1c1c24] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1c1c24] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00c7be]" />
            <h2 className="text-sm font-bold text-white">Create Strategy Preset</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#121217] hover:bg-[#1c1c24] flex items-center justify-center text-[#86868b] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-white">Preset Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 🎯 Gold Sniper DRL"
              className="w-full bg-[#121217] border border-[#1c1c24] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#007aff]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-white">Symbol:</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="XAUUSD"
                className="w-full bg-[#121217] border border-[#1c1c24] rounded-lg px-3 py-2 font-bold text-white focus:outline-none focus:border-[#007aff]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-white">Timeframe:</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full bg-[#121217] border border-[#1c1c24] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#007aff]"
              >
                {['M1', 'M5', 'M15', 'H1', 'H4', 'D1'].map((tf) => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-white">Bars History:</label>
              <select
                value={bars}
                onChange={(e) => setBars(e.target.value)}
                className="w-full bg-[#121217] border border-[#1c1c24] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#007aff]"
              >
                {['5,000', '10,000', '20,000', '50,000', '100,000'].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-white">Epochs ({episodes}):</label>
              <select
                value={episodes}
                onChange={(e) => setEpisodes(Number(e.target.value))}
                className="w-full bg-[#121217] border border-[#1c1c24] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#007aff]"
              >
                {[200, 300, 400, 500, 800].map((ep) => (
                  <option key={ep} value={ep}>{ep} Epochs</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-white">Model Architecture:</label>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              className="w-full bg-[#121217] border border-[#1c1c24] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#007aff]"
            >
              <option value="PPO Actor-Critic (12 Quant Features)">PPO Actor-Critic (12 Quant Features)</option>
              <option value="Standalone BPNN (5➔6➔6➔3 Alpha Strategy)">Standalone BPNN (5➔6➔6➔3 Alpha Strategy)</option>
              <option value="LightGBM + Triple Barrier Alpha">LightGBM + Triple Barrier Alpha</option>
              <option value="PyTorch Neural Sequence (LSTM Deep)">PyTorch Neural Sequence (LSTM Deep)</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#007aff] hover:bg-[#0062cc] font-bold text-white text-xs transition-colors shadow-lg shadow-blue-950/50"
            >
              Save & Activate Strategy Preset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
