import React, { useState, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { QuantTelemetry, RLEnvironmentStep } from '../../services/fxforgeEngine';
import { fxforgeEngine } from '../../services/fxforgeEngine';
import { useTheme } from '../../context/ThemeContext';
import { useFlow } from '../../context/FlowContext';

interface AnalyticsDrawerProps {
  logs: string[];
  isRunning: boolean;
  rlStatus?: 'stopped' | 'running' | 'paused';
  onClearLogs?: () => void;
  rlTelemetry?: QuantTelemetry | null;
  latestStep?: RLEnvironmentStep | null;
}

//  Adaptive Automotive Radial Instrument Dial (Seamless Normal/Maximized Scaling)
interface MiniRadialGaugeProps {
  value: string | number;
  label: string;
  sublabel: string;
  percentage: number; // 0 to 100
  color: string;
  glowColor: string;
  icon: React.ReactNode;
  isMaximized: boolean;
}

const MiniRadialGauge: React.FC<MiniRadialGaugeProps> = ({
  value,
  label,
  sublabel,
  percentage,
  color,
  glowColor,
  icon,
  isMaximized,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const radius = isMaximized ? 30 : 18;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * Math.min(100, Math.max(0, percentage))) / 100;

  return (
    <div
      className={`relative flex flex-col items-center justify-center border transition-all duration-200 ${
        isLight
          ? 'bg-[#f5f5f7] border-black/[0.06] shadow-[0_2px_10px_rgba(0,0,0,0.03)]'
          : 'bg-[#101018]/90 border-white/[0.06] shadow-[0_4px_16px_rgba(0,0,0,0.4)]'
      } ${isMaximized ? 'rounded-2xl p-3.5' : 'rounded-xl p-2'}`}
    >
      {/* Radial Gauge SVG Ring */}
      <div
        className={`relative flex items-center justify-center flex-shrink-0 transition-all ${
          isMaximized ? 'w-18 h-18' : 'w-11 h-11'
        }`}
      >
        <svg
          className="w-full h-full rotate-[150deg]"
          viewBox={isMaximized ? '0 0 74 74' : '0 0 48 48'}
        >
          {/* Background Track */}
          <circle
            cx={isMaximized ? '37' : '24'}
            cy={isMaximized ? '37' : '24'}
            r={radius}
            fill="none"
            stroke={isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}
            strokeWidth={isMaximized ? 4.5 : 3.5}
            strokeDasharray={arcLength}
            strokeDashoffset={0}
            strokeLinecap="round"
          />

          {/* Active Gradient Arc */}
          <circle
            cx={isMaximized ? '37' : '24'}
            cy={isMaximized ? '37' : '24'}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={isMaximized ? 5.5 : 4}
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              filter: isLight ? 'none' : `drop-shadow(0 0 6px ${glowColor})`,
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </svg>

        {/* Center Icon */}
        <div className={`absolute inset-0 flex items-center justify-center z-20 ${isLight ? 'text-[#1d1d1f]' : 'text-white/90'}`}>
          {icon}
        </div>
      </div>

      {/*  Apple SF Pro Gauge Value & Label Cluster */}
      <div
        className={`font-black tracking-tight leading-tight z-10 transition-all ${
          isMaximized ? 'text-2xl mt-2 mb-0.5' : 'text-base mt-1.5 mb-0.5'
        }`}
        style={{ color, fontFamily: 'var(--font-sans)' }}
      >
        {value}
      </div>

      <div
        className={`font-bold uppercase tracking-wider z-10 leading-tight ${
          isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'
        } ${isMaximized ? 'text-xs mb-0.5' : 'text-[9px] mb-0.5'}`}
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {label}
      </div>

      <div
        className={`font-medium z-10 transition-all ${
          isLight ? 'text-[#86868b]' : 'text-[#a1a1a6]'
        } ${isMaximized ? 'text-[11px]' : 'text-[8.5px]'}`}
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {sublabel}
      </div>
    </div>
  );
};

export const AnalyticsDrawer: React.FC<AnalyticsDrawerProps> = ({
  logs,
  isRunning,
  rlStatus = isRunning ? 'running' : 'stopped',
  rlTelemetry,
  latestStep,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const { architectureSpec } = useFlow();

  const [activeTab, setActiveTab] = useState<'equity' | 'loss' | 'features' | 'stress' | 'logs'>('equity');
  const [isMinimized, setIsMinimized] = useState(true); // Default minimized so it never overlaps DAG canvas
  const isMaximized = false;
  const [rewardData, setRewardData] = useState(() => fxforgeEngine.getRewardHistory());
  const [lossData, setLossData] = useState(() => fxforgeEngine.getLossHistory());
  const [featureImportance, setFeatureImportance] = useState(() => fxforgeEngine.getFeatureImportance());
  const [monteCarloData, setMonteCarloData] = useState(() => fxforgeEngine.getMonteCarloCurves());
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'logs') {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);

  // Sync real-time reward curve, loss curves, feature gains, and Monte Carlo curves with engine
  useEffect(() => {
    setRewardData(fxforgeEngine.getRewardHistory());
    setLossData(fxforgeEngine.getLossHistory());
    setFeatureImportance(fxforgeEngine.getFeatureImportance());
    setMonteCarloData(fxforgeEngine.getMonteCarloCurves());
  }, [rlTelemetry, latestStep]);

  const currentTelemetry = rlTelemetry || fxforgeEngine.getTelemetry();
  const isStandby = (rlStatus === 'stopped' || !rlStatus) && (currentTelemetry.episodes === 0);
  const isActiveOrPaused = rlStatus === 'running' || rlStatus === 'paused';

  const totalReturnPct =
    isActiveOrPaused
      ? ((currentTelemetry.currentEquity - currentTelemetry.initialCapital) / currentTelemetry.initialCapital) * 100
      : 0.0;
  const winRateVal = isActiveOrPaused ? currentTelemetry.winRate : 0.0;
  const sharpeVal = isActiveOrPaused ? currentTelemetry.annualizedSharpe : 0.0;
  const maxDdVal = isActiveOrPaused ? currentTelemetry.maxDrawdown : 0.0;
  const sortinoVal = isActiveOrPaused ? currentTelemetry.annualizedSortino : 0.0;
  const totalTradesVal = isActiveOrPaused ? currentTelemetry.totalTrades : 0;
  const totalRewardVal = isActiveOrPaused ? currentTelemetry.totalReward : 0.0;
  const profitFactorVal =
    isActiveOrPaused && currentTelemetry.losingTrades > 0
      ? ((currentTelemetry.winningTrades * 1.5) / currentTelemetry.losingTrades).toFixed(2)
      : isActiveOrPaused && currentTelemetry.winningTrades > 0
      ? '3.50'
      : '0.00';

  const buyPct = isActiveOrPaused && latestStep?.actionProbs ? (latestStep.actionProbs[0] * 100).toFixed(1) : '0.0';
  const holdPct = isActiveOrPaused && latestStep?.actionProbs ? (latestStep.actionProbs[1] * 100).toFixed(1) : '0.0';
  const sellPct = isActiveOrPaused && latestStep?.actionProbs ? (latestStep.actionProbs[2] * 100).toFixed(1) : '0.0';

  const totalEpisodesTarget = architectureSpec?.totalEpisodes || 400;
  const currentEpisodesDisplay = isActiveOrPaused ? currentTelemetry.episodes : 0;
  const progressPct = isActiveOrPaused ? ((currentEpisodesDisplay / totalEpisodesTarget) * 100).toFixed(1) : '0.0';

  return (
    <div
      className={`border-t transition-all duration-200 flex flex-col z-20 ${
        isLight ? 'border-black/[0.08] bg-[#f5f5f7]' : 'border-white/[0.08] bg-[#07070b]'
      } ${isMinimized ? 'h-[30px]' : isMaximized ? 'h-[590px]' : 'h-[365px]'}`}
    >
      {/*  Top Segmented HUD Navigation Bar (Zero Scrollbar - Auto-Fit Layout - Height 30px) */}
      <div
        className={`h-[30px] flex items-center justify-between select-none flex-shrink-0 transition-all duration-200 overflow-hidden ${
          isLight ? 'bg-[#f5f5f7]' : 'bg-[#07070b]'
        }`}
        style={{ paddingLeft: '12px', paddingRight: '8px' }}
      >
        {/* Left: 5 Analytics Tabs */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-3.5 h-full flex-shrink-0">
          <button
            onClick={() => {
              setActiveTab('equity');
              setIsMinimized(false);
            }}
            className={`h-full flex items-center text-[11.5px] transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
              activeTab === 'equity' && !isMinimized
                ? isLight
                  ? 'text-[#0071e3] font-bold'
                  : 'text-[#007aff] font-bold drop-shadow-[0_0_8px_rgba(0,122,255,0.7)]'
                : isLight
                ? 'text-[#6e6e73] hover:text-[#1d1d1f] font-medium'
                : 'text-white/50 hover:text-white font-medium'
            }`}
          >
            <span className="whitespace-nowrap">RL Reward Curve & Telemetry</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('loss');
              setIsMinimized(false);
            }}
            className={`h-full flex items-center text-[11.5px] transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
              activeTab === 'loss' && !isMinimized
                ? isLight
                  ? 'text-[#0071e3] font-bold'
                  : 'text-[#007aff] font-bold drop-shadow-[0_0_8px_rgba(0,122,255,0.7)]'
                : isLight
                ? 'text-[#6e6e73] hover:text-[#1d1d1f] font-medium'
                : 'text-white/50 hover:text-white font-medium'
            }`}
          >
            <span className="whitespace-nowrap">Model Convergence</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('features');
              setIsMinimized(false);
            }}
            className={`h-full flex items-center text-[11.5px] transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
              activeTab === 'features' && !isMinimized
                ? isLight
                  ? 'text-[#0071e3] font-bold'
                  : 'text-[#007aff] font-bold drop-shadow-[0_0_8px_rgba(0,122,255,0.7)]'
                : isLight
                ? 'text-[#6e6e73] hover:text-[#1d1d1f] font-medium'
                : 'text-white/50 hover:text-white font-medium'
            }`}
          >
            <span className="whitespace-nowrap">Signal Weight Matrix</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('stress');
              setIsMinimized(false);
            }}
            className={`h-full flex items-center text-[11.5px] transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
              activeTab === 'stress' && !isMinimized
                ? isLight
                  ? 'text-[#0071e3] font-bold'
                  : 'text-[#007aff] font-bold drop-shadow-[0_0_8px_rgba(0,122,255,0.7)]'
                : isLight
                ? 'text-[#6e6e73] hover:text-[#1d1d1f] font-medium'
                : 'text-white/50 hover:text-white font-medium'
            }`}
          >
            <span className="whitespace-nowrap">Monte Carlo & Stress Test</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('logs');
              setIsMinimized(false);
            }}
            className={`h-full flex items-center text-[11.5px] transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
              activeTab === 'logs' && !isMinimized
                ? isLight
                  ? 'text-[#0071e3] font-bold'
                  : 'text-[#007aff] font-bold drop-shadow-[0_0_8px_rgba(0,122,255,0.7)]'
                : isLight
                ? 'text-[#6e6e73] hover:text-[#1d1d1f] font-medium'
                : 'text-white/50 hover:text-white font-medium'
            }`}
          >
            <span className="whitespace-nowrap">MT5 Experts Journal</span>
          </button>

          {/*  Vertical Divider right after MT5 Experts Journal with 6px spacing */}
          <div
            style={{ marginLeft: '4px', marginRight: '4px' }}
            className={`h-3.5 w-[1px] flex-shrink-0 ${isLight ? 'bg-black/15' : 'bg-white/15'}`}
          />

          {/*  Policy Probabilities Indicator (Positioned right after MT5 Experts Journal) */}
          <div
            className={`flex items-center gap-1 text-[11px] font-medium select-none whitespace-nowrap flex-shrink-0 ${
              isLight ? 'text-[#0071e3]' : 'text-[#0a84ff]'
            }`}
          >
            <span className={`flex-shrink-0 ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>Policy:</span>
            <span className="inline-flex items-center">
              BUY <span className="font-sans tabular-nums font-semibold inline-block w-[34px] text-right ml-0.5">{buyPct}%</span>
            </span>
            <span className={`px-0.5 ${isLight ? 'text-black/20' : 'text-white/30'}`}>·</span>
            <span className="inline-flex items-center">
              HOLD <span className="font-sans tabular-nums font-semibold inline-block w-[34px] text-right ml-0.5">{holdPct}%</span>
            </span>
            <span className={`px-0.5 ${isLight ? 'text-black/20' : 'text-white/30'}`}>·</span>
            <span className="inline-flex items-center">
              SELL <span className="font-sans tabular-nums font-semibold inline-block w-[34px] text-right ml-0.5">{sellPct}%</span>
            </span>
          </div>

          {/*  Vertical Divider after Policy (Before Progress Bar) */}
          <div
            style={{ marginLeft: '4px', marginRight: '4px' }}
            className={`h-3.5 w-[1px] flex-shrink-0 ${isLight ? 'bg-black/15' : 'bg-white/15'}`}
          />

          {/*  Pure Frameless Training Progress HUD with Progress Bar (At Red Mark) */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs select-none flex-shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] font-medium whitespace-nowrap flex-shrink-0">
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  isRunning
                    ? (isLight ? 'bg-[#28cd41] shadow-[0_0_6px_#28cd41] animate-pulse' : 'bg-[#30d158] shadow-[0_0_6px_#30d158] animate-pulse')
                    : rlStatus === 'paused'
                    ? 'bg-[#ffd60a] shadow-[0_0_6px_rgba(255,214,10,0.6)]'
                    : 'bg-[#86868b]'
                }`}
              />
              <span className={`whitespace-nowrap ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                {rlStatus === 'paused' ? 'Paused:' : 'Progress:'}
              </span>
            </div>

            {/* Frameless Sleek Progress Track (Zero color when 0.0%) */}
            <div className={`w-20 sm:w-28 md:w-36 h-1.5 rounded-full overflow-hidden relative flex-shrink-0 ${isLight ? 'bg-black/10' : 'bg-white/10'}`}>
              <div
                className="h-full bg-gradient-to-r from-[#007aff] via-[#30d158] to-[#00c7be] rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(0, Number(progressPct) || 0))}%`,
                  boxShadow: isLight || Number(progressPct) <= 0 ? 'none' : '0 0 8px rgba(48, 209, 88, 0.5)',
                  opacity: Number(progressPct) <= 0 ? 0 : 1,
                }}
              />
            </div>

            <strong
              className={`text-[11px] font-sans tabular-nums font-semibold inline-block w-[36px] text-right whitespace-nowrap flex-shrink-0 ${
                isLight ? 'text-[#28cd41]' : 'text-[#30d158] drop-shadow-[0_0_6px_rgba(48,209,88,0.4)]'
              }`}
            >
              {progressPct}%
            </strong>

            {/*  Episodes (Directly after % with exact 10px spacing) */}
            <div
              style={{ marginLeft: '10px' }}
              className="flex items-center gap-1 text-[11px] whitespace-nowrap flex-shrink-0"
            >
              <span className={`flex-shrink-0 ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>Ep:</span>
              <strong className={`font-sans tabular-nums font-semibold text-right ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                {currentEpisodesDisplay.toLocaleString()}
              </strong>
              <span className={`font-sans ${isLight ? 'text-black/30' : 'text-white/40'}`}>/</span>
              <span className={`font-sans tabular-nums text-left ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                {totalEpisodesTarget.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Panel Toggle Button */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto pr-1">
          <div className={`h-3.5 w-[1px] flex-shrink-0 ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className={`p-1 rounded-lg transition-colors cursor-pointer flex-shrink-0 ${
              isLight ? 'hover:bg-black/[0.06] text-[#6e6e73] hover:text-[#1d1d1f]' : 'hover:bg-white/[0.08] text-[#86868b] hover:text-white'
            }`}
            title={isMinimized ? 'Expand Bottom Bar' : 'Minimize Bottom Bar'}
          >
            <LucideIcons.ChevronDown
              size={13}
              className={`transition-transform duration-200 ${isMinimized ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/*  Drawer Full-Width Inset Area */}
      {!isMinimized && (
        <div
          className={`flex-1 overflow-hidden min-h-0 ${isLight ? 'bg-[#ececee]' : 'bg-black/60'}`}
          style={{
            paddingLeft: '14px',
            paddingRight: '14px',
            paddingTop: '6px',
            paddingBottom: '16px',
          }}
        >
          {/* TAB 1: HUD TELEMETRY & GAUGES */}
          {activeTab === 'equity' && (
            <div className="h-full flex flex-col lg:flex-row gap-3.5 min-h-0">
              {/*  Left Cluster: Master Speedometer & 4 Cockpit Radial Gauges */}
              <div
                className={`flex flex-col gap-3 flex-shrink-0 min-h-0 transition-all duration-200 ${
                  isMaximized ? 'w-full lg:w-[480px]' : 'w-full lg:w-[420px]'
                }`}
              >
                {/* 1. Master Tachometer Speedometer Arch */}
                <div
                  className={`border relative overflow-hidden flex items-center justify-between flex-shrink-0 transition-all duration-200 ${
                    isLight
                      ? 'bg-white border-black/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
                      : 'bg-gradient-to-b from-[#181826]/95 to-[#0e0e16]/95 border-white/[0.08] shadow-[0_10px_25px_rgba(0,0,0,0.6)]'
                  } ${isMaximized ? 'rounded-3xl' : 'rounded-2xl'}`}
                  style={{ padding: isMaximized ? '18px 28px' : '12px 22px' }}
                >
                  {/* Background Radial Glow */}
                  <div
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#007aff]/15 via-[#30d158]/20 to-[#af52de]/15 blur-2xl rounded-full pointer-events-none ${
                      isLight ? 'opacity-10' : 'opacity-100'
                    } ${isMaximized ? 'w-56 h-28' : 'w-36 h-20'}`}
                  />

                  {/* Left Specs: Total Return & Profit Factor */}
                  <div className="z-10 flex flex-col justify-center">
                    <div className={`flex items-center gap-1.5 ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                      <LucideIcons.Gauge size={isMaximized ? 14 : 12} className={isLight ? 'text-[#28cd41]' : 'text-[#30d158]'} />
                      <span
                        className={`font-bold tracking-widest uppercase ${
                          isMaximized ? 'text-[11px]' : 'text-[9px]'
                        }`}
                      >
                        Master RL Alpha Tachometer
                      </span>
                    </div>

                    <div className={`flex items-baseline gap-2 ${isMaximized ? 'mt-2' : 'mt-1'}`}>
                      <div
                        className={`font-black tracking-tight leading-none ${isLight ? 'text-[#1d1d1f]' : 'text-white'} ${
                          isMaximized ? 'text-4xl' : 'text-2xl'
                        }`}
                        style={{ fontFamily: 'var(--font-sans)' }}
                      >
                        {totalReturnPct >= 0 ? `+${totalReturnPct.toFixed(1)}` : totalReturnPct.toFixed(1)}
                        <span
                          className={`font-bold ml-1.5 inline-block ${
                            totalReturnPct >= 0 ? (isLight ? 'text-[#28cd41]' : 'text-[#30d158]') : 'text-[#ff453a]'
                          } ${isMaximized ? 'text-2xl' : 'text-base'}`}
                        >
                          %
                        </span>
                      </div>
                      <span
                        className={`font-semibold ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'} ${
                          isMaximized ? 'text-xs' : 'text-[10px]'
                        }`}
                        style={{ fontFamily: 'var(--font-sans)' }}
                      >
                        Total Return
                      </span>
                    </div>

                    <div
                      className={`flex items-center gap-2 font-semibold ${isLight ? 'text-[#28cd41]' : 'text-[#30d158]'} ${
                        isMaximized ? 'mt-2 text-xs' : 'mt-1 text-[11px]'
                      }`}
                      style={{ fontFamily: 'var(--font-sans)' }}
                    >
                      <LucideIcons.TrendingUp size={isMaximized ? 13 : 11} />
                      <span>PF {profitFactorVal}x</span>
                      <span className={isLight ? 'text-black/20' : 'text-white/30'}>•</span>
                      <span className="text-[#00c7be]">
                        {totalRewardVal >= 0 ? `+${totalRewardVal.toFixed(1)}` : totalRewardVal.toFixed(1)} R Reward
                      </span>
                    </div>
                  </div>

                  {/* Right: Master 180° Illuminated Arc Gauge */}
                  <div
                    className={`relative flex items-center justify-center z-10 flex-shrink-0 transition-all ${
                      isMaximized ? 'w-36 h-26' : 'w-28 h-20'
                    }`}
                  >
                    <svg className="w-full h-full" viewBox="0 0 110 75">
                      <defs>
                        <linearGradient id="audiSpeedoGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#007aff" />
                          <stop offset="50%" stopColor="#30d158" />
                          <stop offset="100%" stopColor="#ffd60a" />
                        </linearGradient>
                      </defs>

                      {/* Graduated Tick Marks */}
                      {[0, 25, 50, 75, 100].map((tick, i) => {
                        const angle = Math.PI * (1 + tick / 100);
                        const x1 = 55 + 34 * Math.cos(angle);
                        const y1 = 58 + 34 * Math.sin(angle);
                        const x2 = 55 + 40 * Math.cos(angle);
                        const y2 = 58 + 40 * Math.sin(angle);
                        return (
                          <line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.25)'}
                            strokeWidth={isMaximized ? 1.8 : 1.5}
                          />
                        );
                      })}

                      {/* Background Arch Track */}
                      <path
                        d="M 15 58 A 40 40 0 0 1 95 58"
                        fill="none"
                        stroke={isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}
                        strokeWidth={isMaximized ? 6.5 : 5.5}
                        strokeLinecap="round"
                      />

                      {/* Glowing Gradient Speed Arc */}
                      <path
                        d="M 15 58 A 40 40 0 0 1 95 58"
                        fill="none"
                        stroke="url(#audiSpeedoGrad)"
                        strokeWidth={isMaximized ? 7.5 : 6.5}
                        strokeDasharray="125.6"
                        strokeDashoffset={125.6 * (1 - (isActiveOrPaused ? Math.min(100, Math.max(0, winRateVal)) : 0) / 100)}
                        strokeLinecap="round"
                        style={{
                          filter: isLight ? 'none' : 'drop-shadow(0 0 7px rgba(48, 209, 88, 0.7))',
                          transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      />

                      {/* Digital HUD Speedometer Text */}
                      <text
                        x="55"
                        y="52"
                        textAnchor="middle"
                        fill={isLight ? '#1d1d1f' : '#ffffff'}
                        fontSize={isMaximized ? 15 : 13}
                        fontWeight="bold"
                      >
                        {isActiveOrPaused ? `${winRateVal.toFixed(1)}%` : '--'}
                      </text>
                      <text
                        x="55"
                        y="63"
                        textAnchor="middle"
                        fill={isLight ? '#6e6e73' : '#86868b'}
                        fontSize={isMaximized ? 7.5 : 6.5}
                        fontWeight="bold"
                        letterSpacing="0.05em"
                      >
                        WIN RATE
                      </text>
                    </svg>
                  </div>
                </div>

                {/* 2. Four Adaptive Vertical Cockpit Dial Cards (2x2 Grid) */}
                <div className={`grid grid-cols-2 flex-1 min-h-0 ${isMaximized ? 'gap-3.5' : 'gap-2.5'}`}>
                  {/* Sharpe Gauge */}
                  <MiniRadialGauge
                    label="Sharpe"
                    value={isActiveOrPaused ? sharpeVal.toFixed(2) : '--'}
                    sublabel="Tier 1 Institutional"
                    percentage={isActiveOrPaused ? Math.min(100, Math.max(0, (sharpeVal / 4.0) * 100)) : 0}
                    color="#30d158"
                    glowColor="rgba(48, 209, 88, 0.6)"
                    icon={<LucideIcons.TrendingUp size={isMaximized ? 22 : 15} strokeWidth={2.5} />}
                    isMaximized={isMaximized}
                  />

                  {/* Max Drawdown Gauge */}
                  <MiniRadialGauge
                    label="Max DD"
                    value={isActiveOrPaused ? `-${maxDdVal.toFixed(1)}%` : '--'}
                    sublabel="Safety Limit"
                    percentage={isActiveOrPaused ? Math.min(100, Math.max(0, (maxDdVal / 25.0) * 100)) : 0}
                    color="#ff453a"
                    glowColor="rgba(255, 69, 58, 0.6)"
                    icon={<LucideIcons.ShieldAlert size={isMaximized ? 22 : 15} strokeWidth={2.5} />}
                    isMaximized={isMaximized}
                  />

                  {/* Sortino Gauge */}
                  <MiniRadialGauge
                    label="Sortino"
                    value={isActiveOrPaused ? sortinoVal.toFixed(2) : '--'}
                    sublabel="Downside Alpha"
                    percentage={isActiveOrPaused ? Math.min(100, Math.max(0, (sortinoVal / 5.0) * 100)) : 0}
                    color="#00c7be"
                    glowColor="rgba(0, 199, 190, 0.6)"
                    icon={<LucideIcons.Zap size={isMaximized ? 22 : 15} strokeWidth={2.5} />}
                    isMaximized={isMaximized}
                  />

                  {/* Trades Gauge */}
                  <MiniRadialGauge
                    label="Trades"
                    value={isActiveOrPaused ? totalTradesVal : '--'}
                    sublabel={isActiveOrPaused ? `${currentTelemetry.winningTrades}W / ${currentTelemetry.losingTrades}L (${winRateVal.toFixed(0)}%)` : 'Standby'}
                    percentage={isActiveOrPaused ? Math.min(100, Math.max(0, winRateVal)) : 0}
                    color="#bf5af2"
                    glowColor="rgba(191, 90, 242, 0.6)"
                    icon={<LucideIcons.Activity size={isMaximized ? 22 : 15} strokeWidth={2.5} />}
                    isMaximized={isMaximized}
                  />
                </div>
              </div>

              {/*  Right Cluster: RL Cumulative Reward Curve & Policy Telemetry */}
              <div
                className={`flex-1 h-full min-h-0 border flex flex-col relative overflow-hidden transition-all duration-200 ${
                  isLight
                    ? 'bg-white border-black/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
                    : 'bg-gradient-to-b from-[#14141d]/95 to-[#0c0c12]/95 border-white/[0.08] shadow-[0_10px_25px_rgba(0,0,0,0.6)]'
                } ${isMaximized ? 'rounded-3xl' : 'rounded-2xl'}`}
                style={{ padding: isMaximized ? '22px 28px 16px 28px' : '16px 22px 10px 22px' }}
              >
                {/* Header Legend */}
                <div
                  className={`flex items-center justify-between z-10 flex-shrink-0 ${
                    isMaximized ? 'text-xs mb-3' : 'text-[11px] mb-2'
                  }`}
                >
                  <span className={`font-bold flex items-center gap-2 ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                    <span className="relative flex h-2 w-2 items-center justify-center">
                      {isRunning && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#30d158] opacity-75" />
                      )}
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#30d158] shadow-[0_0_8px_#30d158]" />
                    </span>
                    RL Reward Curve & Telemetry
                  </span>
                  <div className={`flex items-center gap-4 ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                    <span className="text-[#30d158] font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-0.5 bg-[#30d158]" /> Cumulative Reward (
                      {totalRewardVal >= 0 ? `+${totalRewardVal.toFixed(1)}` : totalRewardVal.toFixed(1)} R)
                    </span>
                    <span className="text-[#00c7be] font-medium flex items-center gap-1.5">
                      <span className="w-2 h-0.5 bg-[#00c7be]" /> 10-Ep MA
                    </span>
                    <span className={`font-medium flex items-center gap-1.5 ${isLight ? 'text-[#8e8e93]' : 'text-[#636366]'}`}>
                      <span className={`w-2 h-0.5 ${isLight ? 'bg-[#8e8e93]' : 'bg-[#636366]'}`} /> Market Baseline
                    </span>
                  </div>
                </div>

                {/* RL Reward Area Chart */}
                <div className="flex-1 w-full min-h-0 z-10 relative">
                  {isStandby || rewardData.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-2 select-none">
                      <div className={`text-xs font-medium flex items-center justify-center gap-2 ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#30d158]/80 animate-pulse" />
                        <span className="tracking-tight">Simulation Standby · Baseline Cleared</span>
                      </div>
                      <div className={`text-[11px] ${isLight ? 'text-black/40' : 'text-white/35'}`}>
                        Click <span className={`font-semibold ${isLight ? 'text-[#28cd41]' : 'text-[#30d158]'}`}>START</span> in the top navigation to begin live Deep RL training.
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={rewardData} margin={{ top: 8, right: 10, left: -10, bottom: 6 }}>
                        <defs>
                          <linearGradient id="hudEquityGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#30d158" stopOpacity={0.45} />
                            <stop offset="50%" stopColor="#30d158" stopOpacity={0.12} />
                            <stop offset="95%" stopColor="#30d158" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)'} />
                        <XAxis dataKey="episode" stroke={isLight ? '#6e6e73' : '#636366'} tick={{ fontSize: isMaximized ? 11 : 9 }} />
                        <YAxis stroke={isLight ? '#6e6e73' : '#636366'} tick={{ fontSize: isMaximized ? 11 : 9 }} domain={['auto', 'auto']} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(14, 14, 20, 0.95)',
                            borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)',
                            color: isLight ? '#1d1d1f' : '#ffffff',
                            fontSize: isMaximized ? '12px' : '11px',
                            borderRadius: '16px',
                            boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.12)' : '0 10px 25px rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(25px)',
                          }}
                          formatter={(val: any, name: any) => [
                            `${Number(val) > 0 ? '+' : ''}${Number(val).toFixed(2)} R`,
                            name === 'cumulativeReward'
                              ? 'Cum Reward'
                              : name === 'rewardMa10'
                              ? '10-Ep MA'
                              : 'Market Return',
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="cumulativeReward"
                          name="cumulativeReward"
                          stroke="#30d158"
                          strokeWidth={isMaximized ? 3 : 2}
                          fillOpacity={1}
                          fill="url(#hudEquityGrad)"
                          style={{ filter: isLight ? 'none' : 'drop-shadow(0 0 8px rgba(48, 209, 88, 0.35))' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="rewardMa10"
                          name="rewardMa10"
                          stroke="#00c7be"
                          strokeWidth={isMaximized ? 2.5 : 1.8}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="marketReturn"
                          name="marketReturn"
                          stroke={isLight ? '#8e8e93' : '#636366'}
                          strokeWidth={1.2}
                          strokeDasharray="3 3"
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOSS */}
          {activeTab === 'loss' && (
            <div
              className={`h-full border flex flex-col shadow-inner min-h-0 ${
                isLight
                  ? 'bg-white border-black/[0.08]'
                  : 'bg-gradient-to-b from-[#14141d]/90 to-[#0c0c12]/90 border-white/[0.08]'
              } ${isMaximized ? 'rounded-3xl' : 'rounded-2xl'}`}
              style={{ padding: isMaximized ? '22px 28px 16px 28px' : '16px 22px 10px 22px' }}
            >
              <div className={`flex items-center justify-between px-1 mb-2 text-xs flex-shrink-0 ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                <span className={`font-bold ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>Loss & Validation AUC Telemetry</span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-[#00c7be]">
                    <span className="w-2 h-2 rounded-full bg-[#00c7be]" /> Train Loss
                  </span>
                  <span className="flex items-center gap-1.5 text-[#af52de]">
                    <span className="w-2 h-2 rounded-full bg-[#af52de]" /> Val Loss
                  </span>
                  <span className="flex items-center gap-1.5 text-[#ff9f0a]">
                    <span className="w-2 h-2 rounded-full bg-[#ff9f0a]" /> Val AUC
                  </span>
                </div>
              </div>

              <div className="flex-1 w-full min-h-0 relative">
                {isStandby || lossData.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-2 select-none">
                    <div className={`text-xs font-medium flex items-center justify-center gap-2 ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-[#30d158]/80 animate-pulse" />
                      <span className="tracking-tight">Simulation Standby · Baseline Cleared</span>
                    </div>
                    <div className={`text-[11px] ${isLight ? 'text-black/40' : 'text-white/35'}`}>
                      Click <span className={`font-semibold ${isLight ? 'text-[#28cd41]' : 'text-[#30d158]'}`}>START</span> in the top navigation to begin live Deep RL training.
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lossData} margin={{ top: 8, right: 10, left: -20, bottom: 6 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)'} />
                      <XAxis dataKey="epoch" stroke={isLight ? '#6e6e73' : '#636366'} tick={{ fontSize: isMaximized ? 11 : 9 }} />
                      <YAxis yAxisId="left" stroke={isLight ? '#6e6e73' : '#636366'} tick={{ fontSize: isMaximized ? 11 : 9 }} />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#ff9f0a"
                        tick={{ fontSize: isMaximized ? 11 : 9 }}
                        domain={[0.4, 0.8]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(14, 14, 20, 0.95)',
                          borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)',
                          color: isLight ? '#1d1d1f' : '#ffffff',
                          fontSize: isMaximized ? '12px' : '11px',
                          borderRadius: '16px',
                        }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="trainLoss"
                        stroke="#00c7be"
                        strokeWidth={isMaximized ? 2.5 : 1.8}
                        dot={false}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="valLoss"
                        stroke="#af52de"
                        strokeWidth={isMaximized ? 2.5 : 1.8}
                        dot={false}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="metricValue"
                        stroke="#ff9f0a"
                        strokeWidth={isMaximized ? 2.5 : 1.8}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FEATURES */}
          {activeTab === 'features' && (
            <div
              className={`h-full border flex flex-col shadow-inner min-h-0 ${
                isLight
                  ? 'bg-white border-black/[0.08]'
                  : 'bg-gradient-to-b from-[#14141d]/90 to-[#0c0c12]/90 border-white/[0.08]'
              } ${isMaximized ? 'rounded-3xl' : 'rounded-2xl'}`}
              style={{ padding: isMaximized ? '22px 28px 16px 28px' : '16px 22px 10px 22px' }}
            >
              <div className={`px-1 mb-2 text-xs font-bold flex-shrink-0 ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                Relative Feature Gain Importance Matrix
              </div>
              <div className="flex-1 w-full min-h-0 relative">
                {isStandby || rewardData.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-2 select-none">
                    <div className={`text-xs font-medium flex items-center justify-center gap-2 ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-[#30d158]/80 animate-pulse" />
                      <span className="tracking-tight">Simulation Standby · Baseline Cleared</span>
                    </div>
                    <div className={`text-[11px] ${isLight ? 'text-black/40' : 'text-white/35'}`}>
                      Click <span className={`font-semibold ${isLight ? 'text-[#28cd41]' : 'text-[#30d158]'}`}>START</span> in the top navigation to begin live Deep RL training.
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={featureImportance}
                      layout="vertical"
                      margin={{ top: 8, right: 20, left: 60, bottom: 6 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)'} />
                      <XAxis type="number" stroke={isLight ? '#6e6e73' : '#636366'} tick={{ fontSize: isMaximized ? 11 : 9 }} />
                      <YAxis
                        type="category"
                        dataKey="feature"
                        stroke={isLight ? '#1d1d1f' : '#d1d1d6'}
                        tick={{ fontSize: isMaximized ? 11 : 9 }}
                        width={120}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(14, 14, 20, 0.95)',
                          borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)',
                          color: isLight ? '#1d1d1f' : '#ffffff',
                          fontSize: isMaximized ? '12px' : '11px',
                          borderRadius: '16px',
                        }}
                        formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}% Gain`, 'Importance']}
                      />
                      <Bar dataKey="importance" fill="#ff9f0a" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          {/* TAB: MONTE CARLO STRESS TEST & ROBUSTNESS (Pillar 6) */}
          {activeTab === 'stress' && (
            <div className="flex-1 flex gap-3 h-full min-h-0">
              {/* Left Column: 4 Core Stress KPI Dials */}
              <div
                className={`w-[290px] h-full flex flex-col justify-between border flex-shrink-0 transition-all duration-200 ${
                  isLight
                    ? 'bg-white border-black/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
                    : 'bg-gradient-to-b from-[#14141d]/95 to-[#0c0c12]/95 border-white/[0.08] shadow-[0_10px_25px_rgba(0,0,0,0.6)]'
                } rounded-2xl p-3`}
              >
                <div className="grid grid-cols-2 gap-2.5 h-full">
                  {/* Ruin Probability */}
                  <MiniRadialGauge
                    label="P(Ruin)"
                    value={isActiveOrPaused ? `${currentTelemetry.ruinProbability.toFixed(1)}%` : '--'}
                    sublabel={currentTelemetry.ruinProbability < 2.0 ? 'Tier-1 Safe' : 'Elevated Risk'}
                    percentage={isActiveOrPaused ? Math.min(100, currentTelemetry.ruinProbability * 10) : 0}
                    color={currentTelemetry.ruinProbability < 2.0 ? '#30d158' : '#ff453a'}
                    glowColor={currentTelemetry.ruinProbability < 2.0 ? 'rgba(48, 209, 88, 0.6)' : 'rgba(255, 69, 58, 0.6)'}
                    icon={<LucideIcons.ShieldCheck size={16} strokeWidth={2.5} />}
                    isMaximized={isMaximized}
                  />

                  {/* 99th Percentile Worst-Case Drawdown */}
                  <MiniRadialGauge
                    label="Worst DD (99%)"
                    value={isActiveOrPaused ? `-${currentTelemetry.worstCaseDrawdown.toFixed(1)}%` : '--'}
                    sublabel="Simulated Max"
                    percentage={isActiveOrPaused ? Math.min(100, (currentTelemetry.worstCaseDrawdown / 15.0) * 100) : 0}
                    color="#ffd60a"
                    glowColor="rgba(255, 214, 10, 0.6)"
                    icon={<LucideIcons.AlertTriangle size={16} strokeWidth={2.5} />}
                    isMaximized={isMaximized}
                  />

                  {/* Out-of-Sample Efficiency */}
                  <MiniRadialGauge
                    label="OOS Sharpe"
                    value={isActiveOrPaused ? `${currentTelemetry.oosSharpe.toFixed(2)}x` : '--'}
                    sublabel="Forward Quality"
                    percentage={isActiveOrPaused ? Math.min(100, (currentTelemetry.oosSharpe / 2.0) * 100) : 0}
                    color="#00c7be"
                    glowColor="rgba(0, 199, 190, 0.6)"
                    icon={<LucideIcons.CheckCircle2 size={16} strokeWidth={2.5} />}
                    isMaximized={isMaximized}
                  />

                  {/* Dynamic Lot Monitor */}
                  <MiniRadialGauge
                    label="Dynamic Lot"
                    value={isActiveOrPaused ? `${currentTelemetry.currentLotSize.toFixed(2)}` : '--'}
                    sublabel="ATR Sized"
                    percentage={isActiveOrPaused ? Math.min(100, (currentTelemetry.currentLotSize / 1.0) * 100) : 0}
                    color="#bf5af2"
                    glowColor="rgba(191, 90, 242, 0.6)"
                    icon={<LucideIcons.Layers size={16} strokeWidth={2.5} />}
                    isMaximized={isMaximized}
                  />
                </div>
              </div>

              {/* Right Column: 1,000-Path Monte Carlo Forward Projection Chart */}
              <div
                className={`flex-1 h-full min-h-0 border flex flex-col justify-between overflow-hidden ${
                  isLight
                    ? 'bg-white border-black/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
                    : 'bg-gradient-to-b from-[#14141d]/95 to-[#0c0c12]/95 border-white/[0.08] shadow-[0_10px_25px_rgba(0,0,0,0.6)]'
                } ${isMaximized ? 'rounded-3xl' : 'rounded-2xl'}`}
                style={{ padding: isMaximized ? '20px 24px 14px 24px' : '14px 18px 8px 18px' }}
              >
                {/* Header with Title and Legend */}
                <div className="flex items-center justify-between border-b pb-2 mb-2 border-black/[0.06] dark:border-white/[0.06] flex-shrink-0">
                  <div>
                    <span className={`text-xs font-bold block ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                      1,000-Path Monte Carlo Forward Projection (50-Session Horizon)
                    </span>
                    <span className={`text-[10.5px] ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                      Bootstrap resampling with non-parametric volatility dispersion & tail-risk cones
                    </span>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0 min-w-max mr-1">
                    <div className="hidden sm:flex items-center gap-3 text-[10.5px] flex-shrink-0">
                      <span className="flex items-center gap-1 text-[#30d158]">
                        <span className="w-2 h-0.5 bg-[#30d158]" /> 95% Bull Frontier
                      </span>
                      <span className="flex items-center gap-1 text-[#0a84ff]">
                        <span className="w-2 h-0.5 bg-[#0a84ff]" /> Median Base
                      </span>
                      <span className="flex items-center gap-1 text-[#ff453a]">
                        <span className="w-2 h-0.5 bg-[#ff453a]" /> 5% Stress Tail
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] select-none w-[130px] justify-end flex-shrink-0">
                      <span className={`whitespace-nowrap flex-shrink-0 ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>Median PnL:</span>
                      <strong
                        className={`font-sans tabular-nums font-semibold inline-block w-[55px] text-right whitespace-nowrap flex-shrink-0 ${
                          !isActiveOrPaused
                            ? (isLight ? 'text-[#86868b]' : 'text-[#86868b]')
                            : currentTelemetry.monteCarloMedianPnL >= 0
                            ? (isLight ? 'text-[#28cd41]' : 'text-[#30d158] drop-shadow-[0_0_6px_rgba(48,209,88,0.4)]')
                            : (isLight ? 'text-[#ff3b30]' : 'text-[#ff453a] drop-shadow-[0_0_6px_rgba(255,69,58,0.4)]')
                        }`}
                      >
                        {!isActiveOrPaused
                          ? '--'
                          : currentTelemetry.monteCarloMedianPnL >= 0
                          ? `+$${currentTelemetry.monteCarloMedianPnL.toLocaleString()}`
                          : `-$${Math.abs(currentTelemetry.monteCarloMedianPnL).toLocaleString()}`}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Monte Carlo Fan Chart */}
                <div className="flex-1 w-full min-h-0 z-10 relative">
                  {isStandby || rewardData.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-2 select-none">
                      <div className={`text-xs font-medium flex items-center justify-center gap-2 ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#30d158]/80 animate-pulse" />
                        <span className="tracking-tight">Simulation Standby · Baseline Cleared</span>
                      </div>
                      <div className={`text-[11px] ${isLight ? 'text-black/40' : 'text-white/35'}`}>
                        Click <span className={`font-semibold ${isLight ? 'text-[#28cd41]' : 'text-[#30d158]'}`}>START</span> in the top navigation to begin live Deep RL training.
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monteCarloData} margin={{ top: 8, right: 12, left: 5, bottom: 4 }}>
                      <defs>
                        <linearGradient id="mcConeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#30d158" stopOpacity={0.28} />
                          <stop offset="50%" stopColor="#0a84ff" stopOpacity={0.12} />
                          <stop offset="100%" stopColor="#ff453a" stopOpacity={0.04} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)'} />
                      <XAxis dataKey="step" stroke={isLight ? '#6e6e73' : '#636366'} tick={{ fontSize: isMaximized ? 11 : 9 }} />
                      <YAxis
                        stroke={isLight ? '#6e6e73' : '#636366'}
                        tick={{ fontSize: isMaximized ? 11 : 9 }}
                        domain={['auto', 'auto']}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(14, 14, 20, 0.95)',
                          borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)',
                          color: isLight ? '#1d1d1f' : '#ffffff',
                          fontSize: isMaximized ? '12px' : '11px',
                          borderRadius: '16px',
                          boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.12)' : '0 10px 25px rgba(0,0,0,0.8)',
                          backdropFilter: 'blur(25px)',
                        }}
                        formatter={(val: any, name: any) => [
                          `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                          name === 'p95'
                            ? '95% Bull Frontier'
                            : name === 'p75'
                            ? '75% Upper Quartile'
                            : name === 'median'
                            ? 'Median Projected Equity'
                            : name === 'p25'
                            ? '25% Lower Quartile'
                            : name === 'p05'
                            ? '5% Stress Tail Risk'
                            : name,
                        ]}
                      />

                      {/* 95% Confidence Shaded Region */}
                      <Area
                        type="monotone"
                        dataKey="p95"
                        name="p95"
                        stroke="#30d158"
                        strokeWidth={1.5}
                        fillOpacity={1}
                        fill="url(#mcConeGrad)"
                      />

                      {/* 75% Quartile */}
                      <Line
                        type="monotone"
                        dataKey="p75"
                        name="p75"
                        stroke="#00c7be"
                        strokeWidth={1.2}
                        strokeDasharray="4 4"
                        dot={false}
                      />

                      {/* Median Projection (Solid Highlight) */}
                      <Line
                        type="monotone"
                        dataKey="median"
                        name="median"
                        stroke="#0a84ff"
                        strokeWidth={isMaximized ? 3 : 2.2}
                        dot={false}
                        style={{ filter: isLight ? 'none' : 'drop-shadow(0 0 6px rgba(10, 132, 255, 0.5))' }}
                      />

                      {/* 25% Quartile */}
                      <Line
                        type="monotone"
                        dataKey="p25"
                        name="p25"
                        stroke="#ffd60a"
                        strokeWidth={1.2}
                        strokeDasharray="4 4"
                        dot={false}
                      />

                      {/* 5% Worst-Case Stress Boundary */}
                      <Line
                        type="monotone"
                        dataKey="p05"
                        name="p05"
                        stroke="#ff453a"
                        strokeWidth={1.5}
                        dot={false}
                      />

                      {/* Sample Trajectory Spaghetti Paths */}
                      <Line
                        type="monotone"
                        dataKey="path1"
                        name="Sample Path 1"
                        stroke={isLight ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.18)'}
                        strokeWidth={0.8}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="path2"
                        name="Sample Path 2"
                        stroke={isLight ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.18)'}
                        strokeWidth={0.8}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="path3"
                        name="Sample Path 3"
                        stroke={isLight ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.18)'}
                        strokeWidth={0.8}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MT5 EXPERTS JOURNAL */}
          {activeTab === 'logs' && (
            <div
              className={`h-full border flex flex-col shadow-inner min-h-0 overflow-hidden ${
                isLight ? 'bg-white border-black/[0.08]' : 'bg-[#0a0a0f] border-white/[0.08]'
              } ${isMaximized ? 'rounded-3xl' : 'rounded-2xl'}`}
            >
              {/* MT5 Table Header */}
              <div
                className={`h-8 border-b flex items-center text-xs font-semibold select-none flex-shrink-0 ${
                  isLight ? 'bg-[#f0f0f2] border-black/[0.08] text-[#6e6e73]' : 'bg-[#13131b] border-white/[0.08] text-[#86868b]'
                }`}
              >
                <div
                  className={`w-[220px] pr-4 border-r flex items-center ${isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'}`}
                  style={{ paddingLeft: isMaximized ? '27px' : '21px' }}
                >
                  <span>Time</span>
                </div>
                <div className={`w-[160px] px-4 border-r flex items-center ${isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'}`}>
                  <span>Source</span>
                </div>
                <div className="flex-1 px-4 flex items-center">
                  <span>Message</span>
                </div>
              </div>

              {/* MT5 Table Body Rows */}
              <div
                className={`flex-1 overflow-y-auto custom-scrollbar font-mono text-[11px] select-text divide-y ${
                  isLight ? 'divide-black/[0.05]' : 'divide-white/[0.04]'
                }`}
              >
                {logs.map((log, index) => {
                  const now = new Date();
                  const timeStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(
                    now.getDate()
                  ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
                    now.getMinutes()
                  ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(
                    ((index + 1) * 48) % 900 + 100
                  ).padStart(3, '0')}`;

                  let source = 'Tester';
                  let message = log;
                  let msgColor = isLight ? 'text-[#1d1d1f]' : 'text-white/90';

                  if (log.includes('[SYSTEM]')) {
                    source = 'Terminal';
                    message = log.replace('[SYSTEM]', '').trim();
                  } else if (log.includes('[CUDA]') || log.includes('[IPC]')) {
                    source = 'Tester';
                    message = log.replace(/\[CUDA\]|\[IPC\]/g, '').trim();
                    msgColor = 'text-[#00c7be]';
                  } else if (log.includes('[DAG]') || log.includes('[DATA]')) {
                    source = 'DataFeed';
                    message = log.replace(/\[DAG\]|\[DATA\]/g, '').trim();
                  } else if (log.includes('[FEAT]') || log.includes('[LABEL]')) {
                    source = 'FXForge Engine';
                    message = log.replace(/\[FEAT\]|\[LABEL\]/g, '').trim();
                  } else if (log.includes('[TRAIN]') || log.includes('[ONNX]')) {
                    source = 'ONNX Policy';
                    message = log.replace(/\[TRAIN\]|\[ONNX\]/g, '').trim();
                    msgColor = isLight ? 'text-[#b25e00]' : 'text-[#ffd60a]';
                  } else if (log.includes('[BACKTEST]') || log.includes('[TRADE]') || log.includes('[READY]')) {
                    source = 'FXForge Expert';
                    message = log.replace(/\[BACKTEST\]|\[TRADE\]|\[READY\]/g, '').trim();
                    msgColor = isLight ? 'text-[#28cd41] font-semibold' : 'text-[#30d158] font-semibold';
                  } else if (log.includes('[ERROR]')) {
                    source = 'Expert';
                    message = log.replace('[ERROR]', '').trim();
                    msgColor = isLight ? 'text-[#d70015] font-semibold' : 'text-[#ff453a] font-semibold';
                  }

                  return (
                    <div
                      key={index}
                      className={`flex items-center min-h-[26px] py-1 transition-colors ${
                        isLight ? 'hover:bg-black/[0.03]' : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Time Column */}
                      <div
                        className={`w-[220px] pr-4 border-r flex items-center flex-shrink-0 ${
                          isLight ? 'border-black/[0.06] text-[#1d1d1f]' : 'border-white/[0.06] text-[#d1d1d6]'
                        }`}
                        style={{ paddingLeft: isMaximized ? '27px' : '21px' }}
                      >
                        <span>{timeStr}</span>
                      </div>

                      {/* Source Column */}
                      <div
                        className={`w-[160px] px-4 border-r flex-shrink-0 truncate font-medium ${
                          isLight ? 'border-black/[0.06] text-[#6e6e73]' : 'border-white/[0.06] text-[#a1a1aa]'
                        }`}
                      >
                        {source}
                      </div>

                      {/* Message Column */}
                      <div className={`flex-1 px-4 ${msgColor} truncate pr-6`}>
                        {message}
                      </div>
                    </div>
                  );
                })}
                <div ref={logEndRef} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
