import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { QuantTelemetry, RLEnvironmentStep } from '../../services/fxforgeEngine';
import { useTheme } from '../../context/ThemeContext';

interface TopNavProps {
  activeView?: 'studio' | 'bpnn';
  onViewChange?: (view: 'studio' | 'bpnn') => void;
  rlStatus?: 'running' | 'paused' | 'stopped';
  onStartRL?: () => void;
  onPauseRL?: () => void;
  onStopRL?: () => void;
  rlTelemetry?: QuantTelemetry | null;
  rlLatestStep?: RLEnvironmentStep | null;
  onOpenMT5Deploy?: () => void;
  onResetCamera?: () => void;
  onOpenProjectManager?: () => void;
  onOpenSaveProject?: () => void;
  onSaveProject?: () => void;
  onNewProject?: () => void;
  onExportProject?: () => void;
  onImportProject?: () => void;
  projectName?: string;
  onProjectNameChange?: (name: string) => void;
  nodesCount?: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeView = 'bpnn',
  onViewChange,
  rlStatus = 'running',
  onStartRL,
  onPauseRL,
  onStopRL,
  rlTelemetry,
  rlLatestStep,
  onOpenMT5Deploy,
  onOpenProjectManager,
  onOpenSaveProject,
  onSaveProject,
  onNewProject,
  onExportProject,
  onImportProject,
  projectName = 'Untitled Project',
  onProjectNameChange,
  nodesCount = 0,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const [isProjectsOpen, setIsProjectsOpen] = React.useState(false);
  const projectsMenuRef = React.useRef<HTMLDivElement>(null);

  // In-place inline rename state (FxDreema style)
  const [editingName, setEditingName] = React.useState(projectName);
  const [isEditing, setIsEditing] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setEditingName(projectName);
  }, [projectName]);

  const handleCommitRename = () => {
    setIsEditing(false);
    const trimmed = editingName.trim();
    const finalName = trimmed || 'Untitled Project';
    setEditingName(finalName);
    if (finalName !== projectName) {
      onProjectNameChange?.(finalName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setEditingName(projectName);
      setIsEditing(false);
    }
  };

  React.useEffect(() => {
    if (!isProjectsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (projectsMenuRef.current && !projectsMenuRef.current.contains(e.target as Node)) {
        setIsProjectsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProjectsOpen]);

  return (
    <header
      style={{ paddingLeft: '12px', paddingRight: '12px', height: '38px' }}
      className={`h-[38px] w-full border-b flex items-center justify-between z-40 select-none overflow-visible relative transition-colors duration-200 ${
        isLight
          ? 'bg-white/85 border-black/[0.08] text-[#1d1d1f] shadow-sm backdrop-blur-xl'
          : 'vision-glass apple-specular border-white/[0.08] text-slate-200'
      }`}
    >
      {/* Left: macOS Traffic Lights + Brand + Projects Dropdown + Divider + Active Project Name + Divider + View Switchers */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
        <div className="flex items-center gap-1.5 pr-0.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e]/50 cursor-pointer hover:opacity-80 transition-opacity" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]/50 cursor-pointer hover:opacity-80 transition-opacity" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]/50 cursor-pointer hover:opacity-80 transition-opacity" />
        </div>

        <div className="flex items-center gap-1.5">
          <span
            style={{
              fontFamily: 'var(--font-apple-text)',
              letterSpacing: '-0.025em',
            }}
            className={`text-[11.5px] font-semibold tracking-tight ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}
          >
            FXFORGE <span className={isLight ? 'text-[#0071e3]' : 'text-[#007aff]'}>LAB</span>
          </span>
        </div>

        {/*  Vertical Divider */}
        <div className={`h-3.5 w-[1px] flex-shrink-0 ${isLight ? 'bg-black/15' : 'bg-white/15'}`} />

        {/*  macOS / Figma Native Dropdown Menu */}
        <div className="relative" ref={projectsMenuRef}>
          <button
            onClick={() => setIsProjectsOpen(!isProjectsOpen)}
            className={`flex items-center gap-1 text-[11.5px] font-medium transition-colors cursor-pointer select-none py-0.5 px-1.5 rounded-[4px] ${
              isProjectsOpen
                ? isLight
                  ? 'bg-black/8 text-[#0071e3]'
                  : 'bg-white/12 text-white'
                : isLight
                ? 'text-[#1d1d1f] hover:bg-black/5'
                : 'text-white/85 hover:bg-white/8 hover:text-white'
            }`}
          >
            <span>Projects</span>
            <LucideIcons.ChevronDown size={9.5} className={`transition-transform duration-150 opacity-60 ${isProjectsOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProjectsOpen && (
            <div
              style={{
                borderRadius: '6px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                boxShadow: isLight
                  ? '0 12px 30px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.2)'
                  : '0 16px 36px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.2)',
              }}
              className={`absolute left-0 top-[calc(100%+4px)] w-[205px] p-[4px] z-50 backdrop-blur-2xl backdrop-saturate-150 animate-in fade-in duration-100 select-none ${
                isLight
                  ? 'bg-[#f6f6f6]/92 border border-black/10 text-[#1d1d1f]'
                  : 'bg-[#2b2b32]/88 border border-white/15 text-[#f5f5f7]'
              }`}
            >
              {/* 1. New Project */}
              <button
                onClick={() => {
                  setIsProjectsOpen(false);
                  onNewProject?.();
                }}
                style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '3.5px', paddingBottom: '3.5px' }}
                className={`group w-full rounded-[4px] text-[13px] font-normal leading-[18px] flex items-center justify-between transition-colors cursor-pointer text-left ${
                  isLight
                    ? 'hover:bg-[#0071e3] hover:text-white text-[#1d1d1f]'
                    : 'hover:bg-[#007aff] hover:text-white text-white'
                }`}
              >
                <span>New Project</span>
                <span className={`text-[11px] font-mono tracking-wider transition-colors ${
                  isLight ? 'text-black/40 group-hover:text-white' : 'text-white/45 group-hover:text-white'
                }`}>Ctrl+N</span>
              </button>

              {/* 2. Load Project... */}
              <button
                onClick={() => {
                  setIsProjectsOpen(false);
                  onOpenProjectManager?.();
                }}
                style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '3.5px', paddingBottom: '3.5px' }}
                className={`group w-full rounded-[4px] text-[13px] font-normal leading-[18px] flex items-center justify-between transition-colors cursor-pointer text-left ${
                  isLight
                    ? 'hover:bg-[#0071e3] hover:text-white text-[#1d1d1f]'
                    : 'hover:bg-[#007aff] hover:text-white text-white'
                }`}
              >
                <span>Load Project...</span>
                <span className={`text-[11px] font-mono tracking-wider transition-colors ${
                  isLight ? 'text-black/40 group-hover:text-white' : 'text-white/45 group-hover:text-white'
                }`}>Ctrl+O</span>
              </button>

              {/* 3. Save Project */}
              <button
                onClick={() => {
                  setIsProjectsOpen(false);
                  if (onSaveProject) onSaveProject();
                  else if (onOpenSaveProject) onOpenSaveProject();
                }}
                style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '3.5px', paddingBottom: '3.5px' }}
                className={`group w-full rounded-[4px] text-[13px] font-normal leading-[18px] flex items-center justify-between transition-colors cursor-pointer text-left ${
                  isLight
                    ? 'hover:bg-[#0071e3] hover:text-white text-[#1d1d1f]'
                    : 'hover:bg-[#007aff] hover:text-white text-white'
                }`}
              >
                <span>Save Project</span>
                <span className={`text-[11px] font-mono tracking-wider transition-colors ${
                  isLight ? 'text-black/40 group-hover:text-white' : 'text-white/45 group-hover:text-white'
                }`}>Ctrl+S</span>
              </button>

              <div className={`my-[4px] mx-[6px] h-[1px] ${isLight ? 'bg-black/[0.08]' : 'bg-white/[0.12]'}`} />

              {/* 4. Import Project (.json) */}
              <button
                onClick={() => {
                  setIsProjectsOpen(false);
                  onImportProject?.();
                }}
                style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '3.5px', paddingBottom: '3.5px' }}
                className={`group w-full rounded-[4px] text-[13px] font-normal leading-[18px] flex items-center justify-between transition-colors cursor-pointer text-left ${
                  isLight
                    ? 'hover:bg-[#0071e3] hover:text-white text-[#1d1d1f]'
                    : 'hover:bg-[#007aff] hover:text-white text-white'
                }`}
              >
                <span>Import Project (.json)</span>
                <span className={`text-[11px] font-mono tracking-wider transition-colors ${
                  isLight ? 'text-black/40 group-hover:text-white' : 'text-white/45 group-hover:text-white'
                }`}>Ctrl+I</span>
              </button>

              {/* 5. Export Project (.json) */}
              <button
                onClick={() => {
                  setIsProjectsOpen(false);
                  onExportProject?.();
                }}
                style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '3.5px', paddingBottom: '3.5px' }}
                className={`group w-full rounded-[4px] text-[13px] font-normal leading-[18px] flex items-center justify-between transition-colors cursor-pointer text-left ${
                  isLight
                    ? 'hover:bg-[#0071e3] hover:text-white text-[#1d1d1f]'
                    : 'hover:bg-[#007aff] hover:text-white text-white'
                }`}
              >
                <span>Export Project (.json)</span>
                <span className={`text-[11px] font-mono tracking-wider transition-colors ${
                  isLight ? 'text-black/40 group-hover:text-white' : 'text-white/45 group-hover:text-white'
                }`}>Ctrl+E</span>
              </button>
            </div>
          )}
        </div>

        {/* 1.  Vertical Divider between Projects and Active Project Name */}
        <div
          style={{ marginLeft: '6px', marginRight: '6px' }}
          className={`h-3.5 w-[1px] flex-shrink-0 ${isLight ? 'bg-black/15' : 'bg-white/15'}`}
        />

        {/* 2.  Frameless In-place Editable Project Name (Strict 120px Locked Slot) */}
        <div
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", sans-serif',
            width: '120px',
            maxWidth: '120px',
            minWidth: '120px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onFocus={(e) => {
              setIsEditing(true);
              e.target.select();
            }}
            onBlur={handleCommitRename}
            onKeyDown={handleKeyDown}
            placeholder="Untitled Project"
            style={{
              width: '100%',
              maxWidth: '100%',
              minWidth: '0',
              height: '26px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              padding: '0',
              margin: '0',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              textOverflow: isEditing ? 'clip' : 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              cursor: 'text',
              boxSizing: 'border-box',
            }}
            className={`transition-colors select-text truncate ${
              isLight
                ? isEditing
                  ? 'text-[#0071e3]'
                  : 'text-[#1d1d1f] hover:text-[#0071e3]'
                : isEditing
                ? 'text-[#007aff]'
                : 'text-white/90 hover:text-white'
            }`}
          />
        </div>

        {/*  Vertical Divider between Active Project Name and Flow DAG */}
        <div
          style={{ marginLeft: '8px', marginRight: '8px' }}
          className={`h-3.5 w-[1px] flex-shrink-0 ${isLight ? 'bg-black/15' : 'bg-white/15'}`}
        />

        {/* 3.  Pure Frameless Glowing View Switcher (Flow DAG & Live 3D BPNN) */}
        {onViewChange && (
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={() => onViewChange('studio')}
              className={`flex items-center gap-1 text-[11.5px] transition-all cursor-pointer ${
                activeView === 'studio'
                  ? isLight
                    ? 'text-[#0071e3] font-bold drop-shadow-[0_0_6px_rgba(0,113,227,0.4)]'
                    : 'text-[#007aff] font-bold drop-shadow-[0_0_8px_rgba(0,122,255,0.7)]'
                  : isLight
                  ? 'text-[#6e6e73] hover:text-[#1d1d1f] font-medium'
                  : 'text-white/50 hover:text-white font-medium'
              }`}
            >
              <LucideIcons.Network size={12} />
              <span>Flow DAG</span>
            </button>
            <button
              onClick={() => onViewChange('bpnn')}
              className={`flex items-center gap-1 text-[11.5px] transition-all cursor-pointer ${
                activeView === 'bpnn'
                  ? isLight
                    ? 'text-[#0071e3] font-bold drop-shadow-[0_0_6px_rgba(0,113,227,0.4)]'
                    : 'text-[#0a84ff] font-bold drop-shadow-[0_0_8px_rgba(10,132,255,0.7)]'
                  : isLight
                  ? 'text-[#6e6e73] hover:text-[#1d1d1f] font-medium'
                  : 'text-white/50 hover:text-white font-medium'
              }`}
            >
              <LucideIcons.Brain size={12} />
              <span>3D BPNN</span>
            </button>
          </div>
        )}

        {/* 4.  Vertical Divider right AFTER 3D BPNN with 8px spacing on left and right */}
        <div
          style={{ marginLeft: '8px', marginRight: '8px' }}
          className={`h-3.5 w-[1px] flex-shrink-0 ${isLight ? 'bg-black/15' : 'bg-white/15'}`}
        />

        {/* 5.  Controls: Shared START / PAUSE Slot + STOP Button */}
        <div className="flex items-center gap-2 text-xs flex-shrink-0">
          {/* Combined START / PAUSE Button */}
          {rlStatus === 'running' ? (
            <button
              id="btn-pause-rl"
              onClick={onPauseRL}
              className={`w-[60px] inline-flex items-center gap-1.5 text-[11.5px] font-bold transition-all cursor-pointer flex-shrink-0 whitespace-nowrap select-none ${
                isLight
                  ? 'text-[#d97706] hover:text-[#b45309]'
                  : 'text-[#ffd60a] hover:text-[#ffe047] drop-shadow-[0_0_8px_rgba(255,214,10,0.85)]'
              }`}
            >
              <LucideIcons.Pause size={10.5} className={`flex-shrink-0 ${isLight ? 'fill-[#d97706]' : 'fill-[#ffd60a]'}`} />
              <span>PAUSE</span>
            </button>
          ) : (
            <button
              id="btn-start-rl"
              onClick={nodesCount === 0 ? undefined : onStartRL}
              disabled={nodesCount === 0}
              title={
                nodesCount === 0
                  ? 'Canvas has 0 nodes. Add strategy nodes to canvas to start simulation.'
                  : 'Start RL Simulation'
              }
              className={`w-[60px] inline-flex items-center gap-1.5 text-[11.5px] font-bold transition-all flex-shrink-0 whitespace-nowrap select-none ${
                nodesCount === 0
                  ? isLight
                    ? 'text-black/30 opacity-40 cursor-not-allowed'
                    : 'text-white/25 opacity-35 cursor-not-allowed'
                  : isLight
                  ? 'text-[#28cd41] hover:text-[#1e9a31] cursor-pointer active:scale-95'
                  : 'text-[#30d158] hover:text-[#4cd964] drop-shadow-[0_0_8px_rgba(48,209,88,0.85)] cursor-pointer active:scale-95'
              }`}
            >
              <LucideIcons.Play
                size={10.5}
                className={`flex-shrink-0 ${
                  nodesCount === 0 ? '' : isLight ? 'fill-[#28cd41]' : 'fill-[#30d158]'
                }`}
              />
              <span>START</span>
            </button>
          )}

          {/* STOP Button */}
          <button
            id="btn-stop-rl"
            onClick={onStopRL}
            disabled={rlStatus === 'stopped'}
            className={`w-[50px] inline-flex items-center gap-1.5 text-[11.5px] font-bold transition-all flex-shrink-0 whitespace-nowrap select-none ${
              rlStatus !== 'stopped'
                ? isLight
                  ? 'text-[#d70015] hover:text-[#b40010] cursor-pointer active:scale-95'
                  : 'text-[#ff453a] hover:text-[#ff6961] drop-shadow-[0_0_8px_rgba(255,69,58,0.85)] cursor-pointer active:scale-95'
                : isLight
                ? 'text-black/30 cursor-not-allowed opacity-50'
                : 'text-white/25 cursor-not-allowed opacity-40'
            }`}
          >
            <LucideIcons.Square
              size={10}
              className={`flex-shrink-0 ${
                rlStatus !== 'stopped' ? (isLight ? 'fill-[#d70015]' : 'fill-[#ff453a]') : ''
              }`}
            />
            <span>STOP</span>
          </button>
        </div>

        {/*  Vertical Divider between Controls and Telemetry */}
        <div
          style={{ marginLeft: '8px', marginRight: '8px' }}
          className={`h-3.5 w-[1px] flex-shrink-0 ${isLight ? 'bg-black/15' : 'bg-white/15'}`}
        />

        {/* 6.  Live Telemetry Stats (Compact Proportional Spacing - Zero Overflow) */}
        {rlTelemetry && (
          <div className={`flex items-center gap-2.5 sm:gap-3 text-[11px] select-none flex-shrink-0 ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
            {/* Win Rate */}
            <div className="inline-flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
              <span className="whitespace-nowrap">Win Rate:</span>
              <strong className={`tabular-nums font-mono whitespace-nowrap min-w-[34px] text-left ${isLight ? 'text-[#28cd41]' : 'text-[#30d158] drop-shadow-[0_0_6px_rgba(48,209,88,0.5)]'}`}>
                {rlStatus === 'stopped'
                  ? '--'
                  : `${typeof rlTelemetry.winRate === 'number' ? rlTelemetry.winRate.toFixed(1) : rlTelemetry.winRate}%`}
              </strong>
            </div>

            {/* Sharpe */}
            <div className="inline-flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
              <span className="whitespace-nowrap">Sharpe:</span>
              <strong className={`tabular-nums font-mono whitespace-nowrap min-w-[28px] text-left ${isLight ? 'text-[#0071e3]' : 'text-[#00c7be] drop-shadow-[0_0_6px_rgba(0,199,190,0.5)]'}`}>
                {rlStatus === 'stopped'
                  ? '--'
                  : typeof rlTelemetry.annualizedSharpe === 'number'
                  ? rlTelemetry.annualizedSharpe.toFixed(2)
                  : rlTelemetry.annualizedSharpe}
              </strong>
            </div>

            {/* Reward */}
            <div className="inline-flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
              <span className="whitespace-nowrap">Reward:</span>
              <strong className={`tabular-nums font-mono whitespace-nowrap min-w-[38px] text-left ${isLight ? 'text-[#d97706]' : 'text-[#ffd60a] drop-shadow-[0_0_6px_rgba(255,214,10,0.5)]'}`}>
                {rlStatus === 'stopped'
                  ? '--'
                  : typeof rlTelemetry.totalReward === 'number'
                  ? rlTelemetry.totalReward > 0
                    ? `+${rlTelemetry.totalReward.toFixed(2)}`
                    : rlTelemetry.totalReward.toFixed(2)
                  : rlTelemetry.totalReward}
              </strong>
            </div>
          </div>
        )}

        {/* 7.  Action Probability Indicator */}
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tabular-nums flex-shrink-0 whitespace-nowrap ml-1 min-w-[58px]">
          {rlLatestStep && rlStatus !== 'stopped' ? (
            <>
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  rlLatestStep.action === 0
                    ? isLight ? 'bg-[#28cd41]' : 'bg-[#30d158] shadow-[0_0_8px_#30d158]'
                    : rlLatestStep.action === 2
                    ? isLight ? 'bg-[#d70015]' : 'bg-[#ff453a] shadow-[0_0_8px_#ff453a]'
                    : isLight ? 'bg-[#d97706]' : 'bg-[#ffd60a] shadow-[0_0_8px_#ffd60a]'
                }`}
              />
              <span
                className={`truncate ${
                  rlLatestStep.action === 0
                    ? isLight ? 'text-[#28cd41]' : 'text-[#30d158] drop-shadow-[0_0_8px_rgba(48,209,88,0.8)]'
                    : rlLatestStep.action === 2
                    ? isLight ? 'text-[#d70015]' : 'text-[#ff453a] drop-shadow-[0_0_8px_rgba(255,69,58,0.8)]'
                    : isLight ? 'text-[#d97706]' : 'text-[#ffd60a] drop-shadow-[0_0_8px_rgba(255,214,10,0.8)]'
                }`}
              >
                {rlLatestStep.action === 0
                  ? 'BUY'
                  : rlLatestStep.action === 2
                  ? 'SELL'
                  : 'HOLD'}
              </span>
            </>
          ) : (
            <span className={`text-[10.5px] font-semibold tracking-wider ${isLight ? 'text-black/35' : 'text-white/35'}`}>
              STANDBY
            </span>
          )}
        </div>
      </div>

      {/* Right: ONNX Ready, MT5 Connected & Theme Toggle */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 ml-auto">
        {/*  Vertical Divider BEFORE ONNX Ready */}
        <div
          style={{ marginLeft: '4px', marginRight: '6px' }}
          className={`h-3.5 w-[1px] flex-shrink-0 ${isLight ? 'bg-black/15' : 'bg-white/15'}`}
        />

        {/* Deploy MT5 ONNX */}
        <button
          onClick={nodesCount === 0 ? undefined : onOpenMT5Deploy}
          disabled={nodesCount === 0}
          title={
            nodesCount === 0
              ? 'Canvas has 0 nodes. Build a strategy network to export ONNX.'
              : 'Deploy MT5 ONNX Expert Advisor'
          }
          className={`flex items-center gap-1.5 text-[11.5px] font-medium transition-colors duration-150 flex-shrink-0 group select-none ${
            nodesCount === 0
              ? isLight
                ? 'text-black/30 opacity-40 cursor-not-allowed'
                : 'text-white/30 opacity-40 cursor-not-allowed'
              : isLight
              ? 'text-[#6e6e73] hover:text-[#1d1d1f] cursor-pointer'
              : 'text-[#86868b] hover:text-white cursor-pointer'
          }`}
        >
          <LucideIcons.Rocket
            size={12.5}
            className={`transition-all duration-150 ${
              nodesCount === 0
                ? ''
                : isLight
                ? 'text-[#6e6e73] group-hover:text-[#28cd41]'
                : 'text-[#86868b] group-hover:text-[#30d158] group-hover:drop-shadow-[0_0_8px_rgba(48,209,88,0.85)]'
            }`}
          />
          <span>{nodesCount === 0 ? 'ONNX Standby' : 'ONNX Ready'}</span>
        </button>

        <div className={`h-3.5 w-[1px] flex-shrink-0 ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />

        {/* MT5 Connected */}
        <div className="flex items-center gap-1.5 text-[11px] flex-shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-[#28cd41]' : 'bg-[#30d158] shadow-[0_0_6px_#30d158]'}`} />
          <span className={`font-medium ${isLight ? 'text-[#1d1d1f]' : 'text-[#d1d1d6]'}`}>MT5 Connected</span>
        </div>

        <div className={`h-3.5 w-[1px] flex-shrink-0 ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />

        {/*  Minimal Vector Theme Switcher (Obsidian Glass / Apple Pro Minimalist Style) */}
        <button
          onClick={toggleTheme}
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'var(--mac-cursor-default)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className={`flex-shrink-0 transition-all active:scale-90 select-none ${
            isLight
              ? 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.06]'
              : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          {isLight ? (
            <LucideIcons.Sun
              size={13.5}
              strokeWidth={1.8}
              className="transition-transform duration-300 hover:rotate-45"
            />
          ) : (
            <LucideIcons.Moon
              size={13}
              strokeWidth={1.8}
              className="transition-transform duration-300 hover:-rotate-12 drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]"
            />
          )}
        </button>
      </div>
    </header>
  );
};

