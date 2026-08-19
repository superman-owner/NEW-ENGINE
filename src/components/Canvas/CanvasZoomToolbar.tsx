import React from 'react';
import * as LucideIcons from 'lucide-react';
import { useReactFlow, useViewport } from '@xyflow/react';
import { useTheme } from '../../context/ThemeContext';

interface CanvasZoomToolbarProps {
  isMiniMapOpen: boolean;
  onToggleMiniMap: () => void;
  onAutoLayout: () => void;
  selectedCount: number;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onAlignSelected: (direction: 'horizontal' | 'vertical') => void;
}

export const CanvasZoomToolbar: React.FC<CanvasZoomToolbarProps> = ({
  isMiniMapOpen,
  onToggleMiniMap,
  onAutoLayout,
  selectedCount,
  onDuplicateSelected,
  onDeleteSelected,
  onAlignSelected,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const { zoomIn, zoomOut, zoomTo, fitView } = useReactFlow();
  const { zoom } = useViewport();
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="absolute left-6 bottom-6 z-20 flex items-center gap-3 select-none pointer-events-auto">
      {/*  1. Floating Zoom & Viewport Bar */}
      <div
        className={`flex items-center gap-1 backdrop-blur-2xl rounded-xl p-1 shadow-lg transition-colors ${
          isLight
            ? 'bg-white/90 border border-black/[0.1] shadow-[0_10px_25px_rgba(0,0,0,0.08)] text-[#1d1d1f]'
            : 'bg-[#12121a]/90 border border-white/[0.12] shadow-[0_15px_35px_rgba(0,0,0,0.7)] text-white'
        }`}
      >
        {/* Zoom Out */}
        <button
          onClick={() => zoomOut({ duration: 250 })}
          title="Zoom Out (Ctrl + -)"
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isLight ? 'hover:bg-black/[0.06] text-[#4b5563] hover:text-[#1d1d1f]' : 'hover:bg-white/[0.1] text-white/70 hover:text-white'
          }`}
        >
          <LucideIcons.Minus size={14} />
        </button>

        {/* Zoom Percent / Reset 100% */}
        <button
          onClick={() => zoomTo(1, { duration: 250 })}
          title="Reset to 100% (Ctrl + 0)"
          className={`px-2 py-1 rounded-md text-[11.5px] font-sans tabular-nums font-semibold transition-colors cursor-pointer ${
            isLight ? 'text-[#1d1d1f] hover:bg-black/[0.06]' : 'text-white/90 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          {zoomPercent}%
        </button>

        {/* Zoom In */}
        <button
          onClick={() => zoomIn({ duration: 250 })}
          title="Zoom In (Ctrl + +)"
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isLight ? 'hover:bg-black/[0.06] text-[#4b5563] hover:text-[#1d1d1f]' : 'hover:bg-white/[0.1] text-white/70 hover:text-white'
          }`}
        >
          <LucideIcons.Plus size={14} />
        </button>

        <div className={`w-[1px] h-3.5 mx-0.5 ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />

        {/* Fit View */}
        <button
          onClick={() => fitView({ padding: 0.25, duration: 400 })}
          title="Fit to Screen (Ctrl + 1 / Space + F)"
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isLight ? 'hover:bg-black/[0.06] text-[#4b5563] hover:text-[#1d1d1f]' : 'hover:bg-white/[0.1] text-white/70 hover:text-white'
          }`}
        >
          <LucideIcons.Maximize size={14} />
        </button>

        {/* Auto Align DAG */}
        <button
          onClick={onAutoLayout}
          title="Auto-Align DAG Layout"
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isLight ? 'hover:bg-black/[0.06] text-purple-600 hover:text-purple-700' : 'hover:bg-white/[0.1] text-purple-400 hover:text-purple-300'
          }`}
        >
          <LucideIcons.Network size={14} />
        </button>

        {/* MiniMap Toggle */}
        <button
          onClick={onToggleMiniMap}
          title={isMiniMapOpen ? 'Hide MiniMap' : 'Show MiniMap'}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isMiniMapOpen
              ? 'bg-[#007aff]/20 text-[#007aff]'
              : isLight
              ? 'hover:bg-black/[0.06] text-[#4b5563] hover:text-[#1d1d1f]'
              : 'hover:bg-white/[0.1] text-white/60 hover:text-white'
          }`}
        >
          <LucideIcons.Map size={14} />
        </button>
      </div>

      {/*  2. Multi-Selection Batch Actions Bar (Reveals when > 1 node selected) */}
      {selectedCount > 1 && (
        <div
          className={`flex items-center gap-2 backdrop-blur-2xl border rounded-xl px-3 py-1.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            isLight
              ? 'bg-white/95 border-[#0071e3]/40 shadow-[0_10px_30px_rgba(0,113,227,0.15)] text-[#1d1d1f]'
              : 'bg-[#12121a]/95 border-[#007aff]/40 shadow-[0_15px_35px_rgba(0,122,255,0.25)] text-white'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[#0071e3] font-bold">
            <LucideIcons.CheckSquare size={13} />
            <span>{selectedCount} Nodes Selected</span>
          </div>

          <div className={`w-[1px] h-3.5 mx-1 ${isLight ? 'bg-black/10' : 'bg-white/15'}`} />

          {/* Duplicate Batch */}
          <button
            onClick={onDuplicateSelected}
            title="Duplicate Selected (Ctrl + D)"
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              isLight ? 'bg-black/[0.05] hover:bg-black/[0.1] text-[#1d1d1f]' : 'bg-white/[0.06] hover:bg-white/[0.12] text-white'
            }`}
          >
            <LucideIcons.CopyPlus size={12} className={isLight ? 'text-[#28cd41]' : 'text-[#30d158]'} />
            <span>Duplicate</span>
          </button>

          {/* Align Horizontal */}
          <button
            onClick={() => onAlignSelected('horizontal')}
            title="Align Horizontally"
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              isLight ? 'bg-black/[0.05] hover:bg-black/[0.1] text-[#1d1d1f]' : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/80 hover:text-white'
            }`}
          >
            <LucideIcons.AlignHorizontalJustifyCenter size={13} />
          </button>

          {/* Align Vertical */}
          <button
            onClick={() => onAlignSelected('vertical')}
            title="Align Vertically"
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              isLight ? 'bg-black/[0.05] hover:bg-black/[0.1] text-[#1d1d1f]' : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/80 hover:text-white'
            }`}
          >
            <LucideIcons.AlignVerticalJustifyCenter size={13} />
          </button>

          {/* Delete Batch */}
          <button
            onClick={onDeleteSelected}
            title="Delete Selected (Del)"
            className="p-1 rounded-md bg-red-500/15 hover:bg-red-500/25 text-[#ff453a] transition-colors cursor-pointer"
          >
            <LucideIcons.Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
};
