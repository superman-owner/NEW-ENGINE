import React from 'react';
import { Activity, ShieldCheck } from 'lucide-react';
import type { QuantFeatures } from '../types/ppo';

interface LiveTensorBarProps {
  quantVector: QuantFeatures;
}

export const LiveTensorBar: React.FC<LiveTensorBarProps> = ({ quantVector }) => {
  const v = quantVector;

  const items = [
    { label: 'Ret1', val: `${v.ret1 >= 0 ? '+' : ''}${v.ret1.toFixed(2)}%`, col: v.ret1 >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]' },
    { label: 'Ret3', val: `${v.ret3 >= 0 ? '+' : ''}${v.ret3.toFixed(2)}%`, col: v.ret3 >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]' },
    { label: 'Ret8', val: `${v.ret8 >= 0 ? '+' : ''}${v.ret8.toFixed(2)}%`, col: v.ret8 >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]' },
    { label: 'Ret21', val: `${v.ret21 >= 0 ? '+' : ''}${v.ret21.toFixed(2)}%`, col: v.ret21 >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]' },
    { label: 'RSI-14', val: v.rsi14.toFixed(2), col: 'text-[#00c7be]' },
    { label: 'VolATR', val: `${v.volAtr.toFixed(2)}%`, col: 'text-white' },
    { label: 'EMA50 Dist', val: `${v.emaDist >= 0 ? '+' : ''}${v.emaDist.toFixed(2)}%`, col: v.emaDist >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]' },
    { label: 'BB %B', val: `${v.bbPctB >= 0 ? '+' : ''}${v.bbPctB.toFixed(2)}`, col: 'text-white' },
    { label: 'SinT', val: v.sessionSin.toFixed(2), col: 'text-[#86868b]' },
    { label: 'CosT', val: v.sessionCos.toFixed(2), col: 'text-[#86868b]' },
    { label: 'Position', val: v.posState === 1 ? 'LONG (+1)' : (v.posState === -1 ? 'SHORT (-1)' : 'FLAT (0)'), col: v.posState === 1 ? 'text-[#30d158]' : (v.posState === -1 ? 'text-[#ff453a]' : 'text-[#86868b]') },
    { label: 'Open PnL', val: `${v.unrealizedPnl >= 0 ? '+' : ''}${v.unrealizedPnl.toFixed(2)}%`, col: v.unrealizedPnl >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]' },
  ];

  return (
    <div className="h-10 border-t border-[#1c1c24] bg-[#060608] px-4 flex items-center justify-between text-[11px] font-mono select-none overflow-x-auto">
      <div className="flex items-center gap-2 text-[#00c7be] font-bold shrink-0 mr-4">
        <Activity className="w-3.5 h-3.5" />
        <span>12-DIM QUANT TENSOR:</span>
      </div>

      <div className="flex items-center gap-4 divide-x divide-[#1c1c24] overflow-x-auto py-1">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-1.5 pl-4 shrink-0">
            <span className="text-[#86868b]">{it.label}:</span>
            <span className={`font-bold ${it.col}`}>{it.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
