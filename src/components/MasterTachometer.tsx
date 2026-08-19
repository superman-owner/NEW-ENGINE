import React from 'react';
import { TrendingUp, ShieldAlert, Zap, BarChart3 } from 'lucide-react';
import type { EpochTelemetry } from '../types/ppo';

interface MasterTachometerProps {
  telemetry: EpochTelemetry;
}

export const MasterTachometer: React.FC<MasterTachometerProps> = ({ telemetry }) => {
  const winRate = telemetry.winRate || 0;
  const cumReturn = telemetry.cumReturn || 0;
  const sharpe = telemetry.sharpe || 0;
  const maxDd = telemetry.maxDrawdown || 0;
  const sortino = telemetry.sortino || 0;
  const trades = telemetry.totalTrades || 0;
  const profitFactor = telemetry.profitFactor || 0;

  // SVG Gauge calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (winRate / 100) * circumference * 0.75;

  return (
    <div className="bg-[#0c0c10] border border-[#1c1c24] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Gauge and Main Metrics */}
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-135" viewBox="0 0 100 100">
            {/* Background Arc */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#1c1c24"
              strokeWidth="7"
              strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
              strokeLinecap="round"
            />
            {/* Value Arc */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#30d158"
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-sm font-extrabold font-mono text-white">
              {winRate.toFixed(1)}%
            </span>
            <span className="text-[9px] uppercase tracking-wider font-bold text-[#86868b]">
              Win Rate
            </span>
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider">
            WALK-FORWARD PERFORMANCE
          </div>
          <div className="text-xl font-black text-white mt-0.5">
            {winRate.toFixed(1)}% <span className="text-xs font-medium text-[#86868b]">Out-of-Sample</span>
          </div>
          <div className={`text-xs font-bold mt-0.5 flex items-center gap-1 ${cumReturn >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
            <span>↗ {cumReturn >= 0 ? '+' : ''}{cumReturn.toFixed(1)}% Net Return</span>
            <span className="text-[#86868b] font-normal">| PF: {profitFactor.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 4 Mini KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
        <div className="bg-[#121217] border border-[#1c1c24] rounded-xl px-3.5 py-2 flex flex-col justify-center min-w-[110px]">
          <div className="text-[10px] font-bold text-[#86868b] flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-[#30d158]" />
            <span>VAL SHARPE</span>
          </div>
          <div className="text-base font-extrabold font-mono text-[#30d158] mt-0.5">
            {sharpe.toFixed(2)}
          </div>
        </div>

        <div className="bg-[#121217] border border-[#1c1c24] rounded-xl px-3.5 py-2 flex flex-col justify-center min-w-[110px]">
          <div className="text-[10px] font-bold text-[#86868b] flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-[#ff453a]" />
            <span>MAX DRAWDOWN</span>
          </div>
          <div className="text-base font-extrabold font-mono text-[#ff453a] mt-0.5">
            -{maxDd.toFixed(1)}%
          </div>
        </div>

        <div className="bg-[#121217] border border-[#1c1c24] rounded-xl px-3.5 py-2 flex flex-col justify-center min-w-[110px]">
          <div className="text-[10px] font-bold text-[#86868b] flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#00c7be]" />
            <span>SORTINO RATIO</span>
          </div>
          <div className="text-base font-extrabold font-mono text-[#00c7be] mt-0.5">
            {sortino.toFixed(2)}
          </div>
        </div>

        <div className="bg-[#121217] border border-[#1c1c24] rounded-xl px-3.5 py-2 flex flex-col justify-center min-w-[110px]">
          <div className="text-[10px] font-bold text-[#86868b] flex items-center gap-1">
            <BarChart3 className="w-3 h-3 text-[#007aff]" />
            <span>TOTAL TRADES</span>
          </div>
          <div className="text-base font-extrabold font-mono text-white mt-0.5">
            {trades}
          </div>
        </div>
      </div>
    </div>
  );
};
