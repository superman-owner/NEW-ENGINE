import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { GROUPS, NODE_DEFS } from '../../data/nodeRegistry';
import { useTheme } from '../../context/ThemeContext';
import {
  Zap,
  Send,
  Layers,
  BarChart2,
  Sliders,
  Brain,
  Shield,
} from 'lucide-react';

const groupById = Object.fromEntries(GROUPS.map((g) => [g.id, g]));

const STATUS_COLOR: Record<string, string> = {
  passed: 'var(--accent-green, #5fd390)',
  failed: 'var(--accent-red, #e05d55)',
  queued: 'var(--accent-amber, #f59e0b)',
  skipped: 'var(--accent-blue, #5b8dbe)',
  blocked: 'var(--text-faint, #64748b)',
};

const GROUP_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  input: BarChart2,
  fc1: Sliders,
  regularization: Shield,
  fc2: Brain,
  reward: Zap,
  output: Send,
};

export default function NodeCard({ data, selected }: { data: any; selected?: boolean }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const def = NODE_DEFS[data.nodeType] || {
    group: 'fc1',
    label: data.label || data.nodeType || 'Node',
    fields: [],
    hasInput: true,
    hasOutput: true,
    decision: false,
  };
  const group = groupById[def.group] || { label: 'NODE', color: '#38bdf8' };
  const accent = group.color;
  const execution = data.execution;
  const isConnected = data.isConnected !== false;
  const statusColor = isConnected ? (STATUS_COLOR[execution?.status] || 'var(--accent-green, #5fd390)') : null;
  const executionMode = data.executionMode || 'on';
  const GroupIcon = GROUP_ICONS[def.group] || Layers;

  const displayTitle = (def.label || '').replace(/\s+Node$/i, '');

  return (
    <div
      className="nowheel"
      onWheel={(e) => {
        e.stopPropagation();
      }}
      style={{
        minWidth: 240,
        maxWidth: 270,
        position: 'relative',
        background: isLight ? '#ffffff' : '#14141a',
        opacity: executionMode === 'off' ? 0.55 : (isConnected ? 1 : 0.85),
        border: selected
          ? `1.5px solid ${accent}`
          : (isConnected
            ? (isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.12)')
            : (isLight ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.06)')),
        borderRadius: '10px',
        boxShadow: selected
          ? (isLight
              ? `0 0 0 1.5px ${accent}, 0 0 18px ${accent}70, 0 8px 24px rgba(0,0,0,0.12)`
              : `0 0 0 1.5px ${accent}, 0 0 20px ${accent}90, 0 0 36px ${accent}50, 0 8px 28px rgba(0,0,0,0.75)`)
          : (isLight ? '0 4px 20px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)' : '0 4px 16px rgba(0,0,0,0.45)'),
        fontFamily: 'var(--font-apple-text)',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
        transition: 'border 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, background 0.15s ease',
      }}
    >
      {/* Content Container (Layered above handles with zIndex 2) */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Node Header (Clean Minimalist, Zero Divider Line) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '7px 10px 3px 10px',
            background: 'transparent',
            borderBottom: 'none',
            borderTopLeftRadius: '9px',
            borderTopRightRadius: '9px',
          }}
        >
          <GroupIcon size={14} color={isConnected ? accent : (isLight ? '#6e6e73' : '#86868b')} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: isConnected ? accent : (isLight ? '#6e6e73' : '#86868b'),
                textTransform: 'uppercase',
                lineHeight: 1.35,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontFamily: 'var(--font-apple-text)',
              }}
            >
              {group.label}
            </div>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: isConnected ? (isLight ? '#1d1d1f' : '#ffffff') : (isLight ? '#6e6e73' : '#a1a1aa'),
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.4,
                paddingBottom: '1px',
                fontFamily: 'var(--font-apple-text)',
              }}
            >
              {displayTitle}
            </div>
          </div>

          {/* Execution Status Badge: Only lit green when isConnected is true */}
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: isConnected && statusColor ? statusColor : (isLight ? '#d1d1d6' : '#3f3f46'),
              boxShadow: isConnected && statusColor ? `0 0 4px ${statusColor}` : 'none',
              opacity: isConnected ? 1 : 0.4,
              flexShrink: 0,
              marginRight: 2,
            }}
            title={isConnected ? (execution?.detail || 'Connected & Active') : 'Disconnected / Standby (Not Active)'}
          />
        </div>

        {/* Node Body (พารามิเตอร์ย่อ) */}
        <div style={{ padding: '3px 10px 7px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {def.fields.map((f) => {
          const val = data[f.key] ?? f.default;
          return (
            <div
              key={f.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                fontSize: 11,
                letterSpacing: '-0.01em',
                fontFamily: 'var(--font-apple-text)',
              }}
            >
              <span style={{ color: isLight ? '#6e6e73' : '#86868b', fontWeight: 400, flexShrink: 0 }}>{f.label}:</span>
              <span
                style={{
                  color: isLight ? '#1d1d1f' : '#f5f5f7',
                  fontWeight: 500,
                  textAlign: 'right',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-apple-text)',
                  fontFeatureSettings: typeof val === 'number' ? '"tnum" 1' : 'normal',
                  letterSpacing: '-0.01em',
                }}
              >
                {typeof val === 'boolean' ? (val ? 'True' : 'False') : String(val)}
              </span>
            </div>
          );
        })}
        </div>
      </div>

      {/* =======================================================
          1. ขาเข้า IN (TARGET) - Micro Docking Port ฝั่งซ้าย (ลดขนาดลง 50%)
          ======================================================= */}
      {def.hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          id="in"
          style={{
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 4,
            height: 9,
            borderRadius: '4.5px 0 0 4.5px',
            backgroundColor: accent,
            border: 'none',
            boxShadow: `0 0 4px ${accent}60`,
            cursor: 'crosshair',
            zIndex: -1,
            ['--handle-color' as any]: accent,
          }}
        />
      )}

      {/* =======================================================
          2. ขาออก OUT (SOURCE) - Micro Docking Port ฝั่งขวา (ลดขนาดลง 50%)
          ======================================================= */}
      {def.hasOutput && !def.decision && (
        <Handle
          type="source"
          position={Position.Right}
          id="out"
          style={{
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 4,
            height: 9,
            borderRadius: '0 4.5px 4.5px 0',
            backgroundColor: accent,
            border: 'none',
            boxShadow: `0 0 4px ${accent}60`,
            cursor: 'crosshair',
            zIndex: -1,
            ['--handle-color' as any]: accent,
          }}
        />
      )}

      {/* =======================================================
          3. ขาออกแยก 2 ทาง (TRUE = เขียว / FALSE = แดง) Micro Docking Ports
          ======================================================= */}
      {def.hasOutput && def.decision && (
        <>
          {/* 🟢 ขาออก TRUE / PASS (ด้านขวาบน 30%) */}
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{
              top: '30%',
              transform: 'translateY(-50%)',
              right: 0,
              width: 4,
              height: 8,
              borderRadius: '0 4px 4px 0',
              backgroundColor: '#10b981',
              border: 'none',
              boxShadow: '0 0 4px rgba(16, 185, 129, 0.5)',
              cursor: 'crosshair',
              zIndex: -1,
              ['--handle-color' as any]: '#10b981',
            }}
          />

          {/* 🔴 ขาออก FALSE / FAIL (ด้านขวาล่าง 70%) */}
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{
              top: '70%',
              transform: 'translateY(-50%)',
              right: 0,
              width: 4,
              height: 8,
              borderRadius: '0 4px 4px 0',
              backgroundColor: '#f43f5e',
              border: 'none',
              boxShadow: '0 0 4px rgba(244, 63, 94, 0.5)',
              cursor: 'crosshair',
              zIndex: -1,
              ['--handle-color' as any]: '#f43f5e',
            }}
          />
        </>
      )}
    </div>
  );
}
