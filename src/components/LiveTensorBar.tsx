import React from 'react';
import { Activity } from 'lucide-react';
import type { QuantFeatures } from '../types/ppo';

interface LiveTensorBarProps {
  quantVector: QuantFeatures;
}

export const LiveTensorBar: React.FC<LiveTensorBarProps> = ({ quantVector }) => {
  const v = quantVector;

  const items = [
    { label: 'Ret1', val: `${v.ret1 >= 0 ? '+' : ''}${v.ret1.toFixed(2)}%`, col: v.ret1 >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]' },
    { label: 'Ret5', val: `${v.ret5 >= 0 ? '+' : ''}${v.ret5.toFixed(2)}%`, col: v.ret5 >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]' },
    { label: 'RSI-14', val: v.rsiNorm.toFixed(2), col: 'text-[#00c7be]' },
    { label: 'DistSMA-20', val: `${v.distSma >= 0 ? '+' : ''}${v.distSma.toFixed(2)}%`, col: v.distSma >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]' },
    { label: 'Position', val: v.posState === 1 ? 'LONG (+1)' : (v.posState === -1 ? 'SHORT (-1)' : 'FLAT (0)'), col: v.posState === 1 ? 'text-[#30d158]' : (v.posState === -1 ? 'text-[#ff453a]' : 'text-[#86868b]') },
    { label: 'Open PnL', val: `${v.pnlPct >= 0 ? '+' : ''}${v.pnlPct.toFixed(2)}%`, col: v.pnlPct >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]' },
  ];

  return (
    <div className="h-10 border-t border-[#1c1c24] bg-[#060608] px-4 flex items-center justify-between text-[11px] font-mono select-none overflow-x-auto">
      <div className="flex items-center gap-2 text-[#00c7be] font-bold shrink-0 mr-4">
        <Activity className="w-3.5 h-3.5" />
        <span>6-DIM QUANT TENSOR:</span>
      </div>

      <div className="flex items-center gap-6 divide-x divide-[#1c1c24] overflow-x-auto py-1">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-1.5 pl-6 shrink-0">
            <span className="text-[#86868b]">{it.label}:</span>
            <span className={`font-bold ${it.col}`}>{it.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
