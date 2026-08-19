import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import * as LucideIcons from 'lucide-react';
import type { SocketDefinition } from '../../types/flow';

interface NodeData {
  nodeId: string;
  title: string;
  subtitle?: string;
  category: 'data' | 'feature' | 'label' | 'model' | 'risk' | 'backtest' | 'export';
  icon: string;
  status?: 'idle' | 'running' | 'completed' | 'error';
  params?: Record<string, any>;
  inputs?: SocketDefinition[];
  outputs?: SocketDefinition[];
}

//  Apple Pro Quiet Luxury Themes
const LUXURY_PRO_THEMES: Record<
  string,
  {
    bg: string;
    border: string;
    highlightBorder: string;
    glowShadow: string;
    glyphColor: string;
    handleColor: string;
  }
> = {
  data: {
    bg: 'linear-gradient(160deg, #1c2738 0%, #0d141e 100%)',
    border: 'rgba(100, 210, 255, 0.22)',
    highlightBorder: '#70d7ff',
    glowShadow: '0 0 16px 2px rgba(112, 215, 255, 0.4)',
    glyphColor: '#70d7ff',
    handleColor: '#70d7ff',
  },
  feature: {
    bg: 'linear-gradient(160deg, #2b221a 0%, #15100c 100%)',
    border: 'rgba(255, 159, 10, 0.22)',
    highlightBorder: '#ffb340',
    glowShadow: '0 0 16px 2px rgba(255, 179, 64, 0.4)',
    glyphColor: '#ffb340',
    handleColor: '#ffb340',
  },
  label: {
    bg: 'linear-gradient(160deg, #28261c 0%, #14120c 100%)',
    border: 'rgba(255, 214, 10, 0.22)',
    highlightBorder: '#ffd84d',
    glowShadow: '0 0 16px 2px rgba(255, 216, 77, 0.4)',
    glyphColor: '#ffd84d',
    handleColor: '#ffd84d',
  },
  model: {
    bg: 'linear-gradient(160deg, #261c33 0%, #120d1a 100%)',
    border: 'rgba(191, 90, 242, 0.22)',
    highlightBorder: '#cf7fff',
    glowShadow: '0 0 16px 2px rgba(207, 127, 255, 0.4)',
    glyphColor: '#cf7fff',
    handleColor: '#cf7fff',
  },
  risk: {
    bg: 'linear-gradient(160deg, #162438 0%, #0c1420 100%)',
    border: 'rgba(10, 132, 255, 0.25)',
    highlightBorder: '#409cff',
    glowShadow: '0 0 16px 2px rgba(64, 156, 255, 0.4)',
    glyphColor: '#409cff',
    handleColor: '#409cff',
  },
  backtest: {
    bg: 'linear-gradient(160deg, #132a22 0%, #091712 100%)',
    border: 'rgba(48, 209, 88, 0.22)',
    highlightBorder: '#4cd964',
    glowShadow: '0 0 16px 2px rgba(76, 217, 100, 0.4)',
    glyphColor: '#4cd964',
    handleColor: '#4cd964',
  },
  export: {
    bg: 'linear-gradient(160deg, #33141a 0%, #1a080c 100%)',
    border: 'rgba(255, 55, 95, 0.25)',
    highlightBorder: '#ff375f',
    glowShadow: '0 0 16px 2px rgba(255, 55, 95, 0.45)',
    glyphColor: '#ff453a',
    handleColor: '#ff375f',
  },
};

//  Category Header Icons matching Sidebar 1-to-1
const CATEGORY_HEADER_ICONS: Record<string, string> = {
  data: 'Layers',
  feature: 'Sparkles',
  label: 'Target',
  model: 'Brain',
  risk: 'ShieldAlert',
  backtest: 'TrendingUp',
  export: 'Rocket',
};

export const CustomTradingNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as NodeData;
  const theme = LUXURY_PRO_THEMES[nodeData.category] || LUXURY_PRO_THEMES.data;
  
  // Resolve icon matching Category Header icon
  const categoryIconName = CATEGORY_HEADER_ICONS[nodeData.category] || nodeData.icon || 'Box';
  const IconComponent = (LucideIcons as any)[categoryIconName] || (LucideIcons as any)[nodeData.icon] || LucideIcons.Box;

  const isDataNode = nodeData.category === 'data';
  const isExportNode = nodeData.category === 'export';
  const isError = nodeData.status === 'error';

  return (
    <div
      className={`ios-node-wrapper flex flex-col items-center justify-center select-none w-[120px] ${
        selected ? 'selected' : ''
      }`}
    >
      {/*  1. Static Squircle Tile (No movement / No scale on hover) */}
      <div
        className="ios-app-tile relative"
        style={{
          background: theme.bg,
          border: selected
            ? `1.5px solid ${isError ? '#ff453a' : theme.highlightBorder}`
            : isError
            ? '1px solid rgba(255, 69, 58, 0.45)'
            : `1px solid ${theme.border}`,
          boxShadow: selected
            ? `${isError ? '0 0 16px 2px rgba(255, 69, 58, 0.45)' : theme.glowShadow}, 0 14px 28px -6px rgba(0, 0, 0, 0.8)`
            : isError
            ? '0 0 12px 1px rgba(255, 69, 58, 0.25), 0 14px 28px -6px rgba(0, 0, 0, 0.8)'
            : '0 14px 28px -6px rgba(0, 0, 0, 0.8)',
        }}
      >
        {/* Left Input Handle (50% Center) */}
        {!isDataNode && (
          <Handle
            type="target"
            position={Position.Left}
            id="in"
            style={{ top: '50%', backgroundColor: theme.handleColor }}
          />
        )}

        {/*  Static Muted Metallic / Titanium Glyph */}
        <div className="flex items-center justify-center w-full h-full pointer-events-none">
          <IconComponent
            size={34}
            color={isError ? '#ff6961' : theme.glyphColor}
            strokeWidth={2}
            className="drop-shadow-sm"
          />
        </div>

        {/* Lock Badge if Node is frozen/locked */}
        {(nodeData as any).locked && (
          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-black/70 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-sm">
            <LucideIcons.Lock size={9} />
          </div>
        )}

        {/* Right Dual Outputs (True: Green 30% | False: Red 70%) */}
        {!isExportNode && (
          <>
            {/* Top Green True Pin */}
            <Handle
              type="source"
              position={Position.Right}
              id="out_true"
              style={{ top: '30%', backgroundColor: '#30d158' }}
            />

            {/* Bottom Red False Pin */}
            <Handle
              type="source"
              position={Position.Right}
              id="out_false"
              style={{ top: '70%', backgroundColor: '#ff453a' }}
            />
          </>
        )}

        {/*  1. Live Running Status Dot */}
        {nodeData.status === 'running' && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 z-20 pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-black shadow-md" />
          </span>
        )}

        {/*  2. Completed Success Badge (100% Solid Opaque Apple Green Checkmark) */}
        {nodeData.status === 'completed' && (
          <div className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-[#34c759] border-2 border-black flex items-center justify-center z-20 shadow-md pointer-events-none">
            <svg
              className="w-2.5 h-2.5 text-black"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}

        {/*  3. Error Failed Badge (100% Solid Opaque Apple Red Cross Mark) */}
        {nodeData.status === 'error' && (
          <div className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-[#ff453a] border-2 border-black flex items-center justify-center z-20 shadow-md pointer-events-none">
            <svg
              className="w-2.5 h-2.5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        )}
      </div>

      {/*  2. Clean Single Line App Name */}
      <div className="w-full text-center mt-6 px-1">
        <h4 className="text-[13px] font-medium text-[#f2f2f7] tracking-tight leading-tight truncate drop-shadow-sm">
          {nodeData.title}
        </h4>
      </div>
    </div>
  );
});

CustomTradingNode.displayName = 'CustomTradingNode';
