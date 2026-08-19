import React, { useState } from 'react';
import type { Node } from '@xyflow/react';
import * as LucideIcons from 'lucide-react';
import { SOCKET_COLORS } from '../../data/nodeCatalog';

interface NodeInspectorProps {
  selectedNode: Node | null;
  onUpdateParams: (nodeId: string, params: Record<string, any>) => void;
  onDeleteNode: (nodeId: string) => void;
  onClose: () => void;
}

//  Apple Category Themes
const CATEGORY_THEMES: Record<
  string,
  {
    gradient: string;
    neon: string;
    glow: string;
    label: string;
  }
> = {
  data: {
    gradient: 'from-[#007aff] to-[#0040dd]',
    neon: '#007aff',
    glow: 'rgba(0, 122, 255, 0.4)',
    label: 'DATA FEED',
  },
  feature: {
    gradient: 'from-[#ff9500] to-[#c93400]',
    neon: '#ff9f0a',
    glow: 'rgba(255, 159, 10, 0.4)',
    label: 'FEATURE ENG',
  },
  label: {
    gradient: 'from-[#ffd60a] to-[#b38600]',
    neon: '#ffd60a',
    glow: 'rgba(255, 214, 10, 0.4)',
    label: 'LABELING LOGIC',
  },
  model: {
    gradient: 'from-[#af52de] to-[#5856d6]',
    neon: '#bf5af2',
    glow: 'rgba(191, 90, 242, 0.4)',
    label: 'AI / RL MODEL',
  },
  risk: {
    gradient: 'from-[#0a84ff] to-[#005bb5]',
    neon: '#0a84ff',
    glow: 'rgba(10, 132, 255, 0.4)',
    label: 'RISK & POSITION SHIELD',
  },
  backtest: {
    gradient: 'from-[#30d158] to-[#1b8a38]',
    neon: '#30d158',
    glow: 'rgba(48, 209, 88, 0.4)',
    label: 'EXECUTION & BACKTEST',
  },
  export: {
    gradient: 'from-[#ff375f] to-[#cc143b]',
    neon: '#ff375f',
    glow: 'rgba(255, 55, 95, 0.45)',
    label: 'DEPLOYMENT & EXPORT',
  },
};

const CATEGORY_HEADER_ICONS: Record<string, string> = {
  data: 'Layers',
  feature: 'Sparkles',
  label: 'Target',
  model: 'Brain',
  risk: 'ShieldAlert',
  backtest: 'TrendingUp',
  export: 'Rocket',
};

const TIMEFRAME_OPTIONS = ['1m', '5m', '15m', '1h', '4h', '1d'];
const SYMBOL_PRESETS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'NVDA', 'SPY'];

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  selectedNode,
  onUpdateParams,
  onDeleteNode,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'params' | 'telemetry' | 'ports'>('params');

  if (!selectedNode) {
    return null;
  }

  const data = selectedNode.data as any;
  const params = data.params || {};
  const theme = CATEGORY_THEMES[data.category] || CATEGORY_THEMES.data;
  const categoryIconName = CATEGORY_HEADER_ICONS[data.category] || data.icon || 'Cpu';
  const IconComponent = (LucideIcons as any)[categoryIconName] || (LucideIcons as any)[data.icon] || LucideIcons.Cpu;
  const isError = data.status === 'error';

  const handleParamChange = (key: string, value: any) => {
    const updated = { ...params, [key]: value };
    onUpdateParams(selectedNode.id, updated);
  };

  const handleNumericStep = (key: string, currentVal: number, delta: number) => {
    const newVal = Math.round((currentVal + delta) * 1000) / 1000;
    handleParamChange(key, newVal);
  };

  return (
    /*  Outer Window Chassis: 450px Wide with 32px Insets */
    <div
      key={selectedNode.id}
      style={{ cursor: 'var(--mac-cursor-default)' }}
      className="absolute right-6 top-6 w-[450px] max-h-[calc(100%-48px)] z-30 flex flex-col bg-[#0d0d16]/96 backdrop-blur-3xl rounded-[32px] overflow-hidden animate-ios-app-launch select-none shadow-[0_30px_90px_rgba(0,0,0,0.95)] border border-white/[0.14]"
    >
      {/*  1. Window App Header (Generous 32px Insets) */}
      <div
        className="border-b border-white/[0.08] relative overflow-hidden flex-shrink-0"
        style={{ padding: '24px 32px 18px 32px' }}
      >
        {/* Specular Ambient Glow */}
        <div
          className="absolute -top-10 left-6 w-40 h-28 rounded-full blur-3xl opacity-35 pointer-events-none"
          style={{ backgroundColor: theme.glow }}
        />

        <div className="flex items-center justify-between relative z-10">
          {/* App Squircle & Title */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white shadow-[0_6px_16px_rgba(0,0,0,0.5)] border border-white/20 flex-shrink-0`}
            >
              <IconComponent size={22} strokeWidth={2.2} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: theme.neon }}>
                  {theme.label}
                </span>
                <span className="text-white/30 text-xs">•</span>
                <span className="text-[10px] font-sans font-medium text-white/40">{selectedNode.id}</span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight leading-tight truncate mt-0.5">
                {data.title}
              </h3>
            </div>
          </div>

          {/* Close Circle Button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.18] active:scale-90 text-white/60 hover:text-white flex items-center justify-center transition-all border border-white/10"
            title="Close"
          >
            <LucideIcons.X size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/*  2. Error Diagnostic Alert (if error) */}
      {isError && (
        <div
          className="rounded-2xl bg-[#ff453a]/12 border border-[#ff453a]/30 flex items-start gap-2.5 text-xs text-[#ff453a] flex-shrink-0 shadow-md"
          style={{ margin: '14px 32px 0 32px', padding: '12px 16px' }}
        >
          <LucideIcons.AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold">Stationarity Test Failed (ADF)</div>
            <div className="text-[10px] text-[#ff8077] mt-0.5 leading-relaxed">
              Order parameter `d_order` is below threshold. Set `d_order &ge; 0.45` for stationary memory.
            </div>
          </div>
        </div>
      )}

      {/*  3. Segmented Tab Switcher (Frameless with Underline equal to text length) */}
      <div className="flex-shrink-0 border-b border-white/[0.08]" style={{ padding: '0 32px' }}>
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('params')}
            className={`py-3 text-xs transition-all flex items-center gap-1.5 cursor-pointer relative ${
              activeTab === 'params'
                ? 'text-white font-bold'
                : 'text-white/45 hover:text-white font-medium'
            }`}
          >
            <LucideIcons.Sliders size={13} />
            <span className="relative">
              Parameters
              {activeTab === 'params' && (
                <span className="absolute -bottom-[5px] left-0 right-0 h-[2px] bg-[#007aff] rounded-full shadow-[0_0_8px_#007aff]" />
              )}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`py-3 text-xs transition-all flex items-center gap-1.5 cursor-pointer relative ${
              activeTab === 'telemetry'
                ? 'text-white font-bold'
                : 'text-white/45 hover:text-white font-medium'
            }`}
          >
            <LucideIcons.Activity size={13} />
            <span className="relative">
              Telemetry
              {activeTab === 'telemetry' && (
                <span className="absolute -bottom-[5px] left-0 right-0 h-[2px] bg-[#007aff] rounded-full shadow-[0_0_8px_#007aff]" />
              )}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ports')}
            className={`py-3 text-xs transition-all flex items-center gap-1.5 cursor-pointer relative ${
              activeTab === 'ports'
                ? 'text-white font-bold'
                : 'text-white/45 hover:text-white font-medium'
            }`}
          >
            <LucideIcons.Cable size={13} />
            <span className="relative">
              Ports ({data.inputs?.length || 0}/{data.outputs?.length || 0})
              {activeTab === 'ports' && (
                <span className="absolute -bottom-[5px] left-0 right-0 h-[2px] bg-[#007aff] rounded-full shadow-[0_0_8px_#007aff]" />
              )}
            </span>
          </button>
        </div>
      </div>

      {/*  4. Main Parameters Content Area with Generous Vertical & Side Breathing Room */}
      <div
        className="flex-1 overflow-y-auto custom-scrollbar space-y-6 text-xs min-h-0"
        style={{ padding: '20px 32px 24px 32px' }}
      >
        {/* TAB 1: PARAMETERS */}
        {activeTab === 'params' && (
          <div className="space-y-6">
            {Object.entries(params).length === 0 ? (
              <div className="py-8 text-center text-white/40 italic">
                No configurable parameters for this node.
              </div>
            ) : (
              Object.entries(params).map(([key, val]) => {
                const isNumber = typeof val === 'number';
                const isBoolean = typeof val === 'boolean';
                const isArray = Array.isArray(val);
                const isSymbol = key.toLowerCase().includes('symbol') || key.toLowerCase().includes('ticker');
                const isTimeframe = key.toLowerCase().includes('timeframe') || key.toLowerCase().includes('interval');

                return (
                  <div key={key} className="flex flex-col gap-2.5">
                    {/* Header Row: Label on Left, Colored Value Badge on Right (with proper line height) */}
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold text-white capitalize tracking-tight leading-snug">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>

                      {!isTimeframe && (
                        <span
                          className="font-sans tabular-nums text-xs font-semibold px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10"
                          style={{ color: theme.neon }}
                        >
                          {isBoolean ? (val ? 'TRUE' : 'FALSE') : isArray ? `[${val.length}]` : String(val)}
                        </span>
                      )}
                    </div>

                    {/* Interactive Inline Controls with ample vertical margins */}
                    {isBoolean ? (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/[0.08] mt-1">
                        <span className="text-[11px] text-white/60">State trigger</span>
                        <div
                          onClick={() => handleParamChange(key, !val)}
                          className={`apple-toggle ${val ? 'active' : ''}`}
                        >
                          <div className="apple-toggle-knob" />
                        </div>
                      </div>
                    ) : isTimeframe ? (
                      <div className="flex items-center gap-2 mt-1 py-1">
                        {TIMEFRAME_OPTIONS.map((tf) => (
                          <button
                            key={tf}
                            onClick={() => handleParamChange(key, tf)}
                            className={`py-1 px-2.5 rounded-md text-[11px] font-semibold font-sans transition-all cursor-pointer ${
                              val === tf
                                ? 'bg-[#007aff] text-white'
                                : 'text-white/40 hover:text-white hover:bg-white/[0.06]'
                            }`}
                          >
                            {tf}
                          </button>
                        ))}
                      </div>
                    ) : isSymbol ? (
                      <div className="space-y-2 mt-1">
                        <input
                          type="text"
                          value={String(val ?? '')}
                          onChange={(e) => handleParamChange(key, e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white font-sans font-medium focus:outline-none focus:border-[#007aff]"
                        />
                        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                          {SYMBOL_PRESETS.map((sym) => (
                            <button
                              key={sym}
                              onClick={() => handleParamChange(key, sym)}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold font-sans whitespace-nowrap transition-all cursor-pointer ${
                                val === sym
                                  ? 'bg-[#007aff]/20 text-[#64d2ff]'
                                  : 'text-white/40 hover:text-white hover:bg-white/[0.06]'
                              }`}
                            >
                              {sym}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : isArray ? (
                      <div className="space-y-2 mt-1">
                        <div className="flex flex-wrap gap-1.5">
                          {val.map((item: any, idx: number) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 rounded-md bg-white/[0.06] text-white font-sans font-medium text-[10px]"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={val.join(', ')}
                          onChange={(e) =>
                            handleParamChange(
                              key,
                              e.target.value.split(',').map((s) => s.trim())
                            )
                          }
                          className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white font-sans font-medium focus:outline-none focus:border-[#007aff]"
                          placeholder="Comma separated values"
                        />
                      </div>
                    ) : isNumber ? (
                      <div className="space-y-3 mt-1">
                        {/* Stepper Box */}
                        <div className="flex items-center justify-between bg-black/40 px-3 py-1.5 rounded-xl border border-white/[0.08]">
                          <button
                            onClick={() => handleNumericStep(key, Number(val), val < 1 ? -0.01 : -1)}
                            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.12] active:scale-90 text-white font-bold flex items-center justify-center text-sm transition-all"
                          >
                            -
                          </button>

                          <input
                            type="number"
                            step={val < 1 ? '0.01' : '1'}
                            value={Number(val)}
                            onChange={(e) => handleParamChange(key, parseFloat(e.target.value) || 0)}
                            className="flex-1 text-center bg-transparent font-sans tabular-nums text-xs text-white font-semibold focus:outline-none"
                          />

                          <button
                            onClick={() => handleNumericStep(key, Number(val), val < 1 ? 0.01 : 1)}
                            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.12] active:scale-90 text-white font-bold flex items-center justify-center text-sm transition-all"
                          >
                            +
                          </button>
                        </div>

                        {/* Precision Slider if float */}
                        {val <= 1 && val >= 0 && (
                          <div className="pt-1.5 pb-1">
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={Number(val)}
                              onChange={(e) => handleParamChange(key, parseFloat(e.target.value))}
                              className="w-full accent-[#007aff] cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={String(val ?? '')}
                        onChange={(e) => handleParamChange(key, e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#007aff] mt-1"
                      />
                    )}
                  </div>
                );
              })
            )}

            {/* Quick Auto-Tuning Presets (No Capsule) */}
            <div className="pt-4 mt-4 border-t border-white/[0.08] flex items-center justify-between text-xs px-1">
              <span className="text-[11px] text-white/50 font-medium">Auto-Tuning:</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleParamChange('d_order', 0.48)}
                  className="py-1 px-2 text-xs font-semibold text-white/70 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <LucideIcons.Zap size={13} className="text-amber-400" />
                  <span>Fast</span>
                </button>
                <span className="text-white/20">•</span>
                <button
                  onClick={() => handleParamChange('d_order', 0.65)}
                  className="py-1 px-2 text-xs font-semibold text-[#64d2ff] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <LucideIcons.Target size={13} className="text-[#64d2ff]" />
                  <span>Optimal</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TELEMETRY & MATH */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold tracking-wider uppercase text-white/40 px-1">
                Mathematical Kernel
              </span>
              <div
                className="rounded-2xl bg-black/50 font-mono text-xs text-emerald-400 border border-white/[0.08] overflow-x-auto custom-scrollbar leading-relaxed"
                style={{ padding: '16px 20px' }}
              >
                {data.category === 'feature'
                  ? '(1 - B)^d X_t = \\sum_{k=0}^\\infty (-1)^k \\binom{d}{k} X_{t-k}'
                  : data.category === 'model'
                  ? '\\mathcal{L}_{GRPO}(\\theta) = \\hat{\\mathbb{E}}_t \\left[ \\min(r_t(\\theta)\\hat{A}_t, \\text{clip}(r_t) \\hat{A}_t) \\right]'
                  : 'S = \\frac{\\mathbb{E}[R_p - R_f]}{\\sigma_p}'}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold tracking-wider uppercase text-white/40 px-1">
                Hardware & Compute Allocation
              </span>
              <div
                className="rounded-2xl bg-black/50 border border-white/[0.08] space-y-3 text-xs"
                style={{ padding: '16px 20px' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Execution Latency</span>
                  <span className="font-sans tabular-nums text-white font-semibold">12.4 ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">VRAM Allocation</span>
                  <span className="font-sans tabular-nums text-white font-semibold">24.8 MB (CUDA)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Stationarity Degree</span>
                  <span className="font-sans tabular-nums text-[#30d158] font-semibold">99.4% (p &lt; 0.01)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PORTS */}
        {activeTab === 'ports' && (
          <div className="space-y-6">
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold tracking-wider uppercase text-white/40 px-1">
                Input Ports (Left Center 50%)
              </span>
              {data.inputs && data.inputs.length > 0 ? (
                <div className="space-y-2">
                  {data.inputs.map((inp: any) => (
                    <div
                      key={inp.id}
                      className="rounded-2xl bg-black/50 border border-white/[0.08] flex items-center justify-between"
                      style={{ padding: '12px 18px' }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full shadow-[0_0_6px_currentColor]"
                          style={{ color: SOCKET_COLORS[inp.type]?.bg || '#007aff', backgroundColor: SOCKET_COLORS[inp.type]?.bg || '#007aff' }}
                        />
                        <span className="text-white font-semibold text-xs">{inp.label}</span>
                      </div>
                      <span className="font-sans text-[9px] font-semibold uppercase px-2.5 py-0.5 rounded-md bg-white/10 text-white/80 border border-white/10">
                        {inp.type}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-white/40 italic p-3">Root source (No upstream inputs)</div>
              )}
            </div>

            <div className="space-y-2.5">
              <span className="text-[10px] font-bold tracking-wider uppercase text-white/40 px-1">
                Output Ports (Right 30% True / 70% False)
              </span>
              {data.outputs && data.outputs.length > 0 ? (
                <div className="space-y-2">
                  {data.outputs.map((out: any) => (
                    <div
                      key={out.id}
                      className="rounded-2xl bg-black/50 border border-white/[0.08] flex items-center justify-between"
                      style={{ padding: '12px 18px' }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full shadow-[0_0_6px_currentColor]"
                          style={{ color: SOCKET_COLORS[out.type]?.bg || '#30d158', backgroundColor: SOCKET_COLORS[out.type]?.bg || '#30d158' }}
                        />
                        <span className="text-white font-semibold text-xs">{out.label}</span>
                      </div>
                      <span className="font-sans text-[9px] font-semibold uppercase px-2.5 py-0.5 rounded-md bg-white/10 text-white/80 border border-white/10">
                        {out.type}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-white/40 italic p-3">Terminal sink (No downstream outputs)</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/*  5. Action Footer with Safe 32px Insets */}
      <div
        className="border-t border-white/[0.08] bg-[#0c0c14]/90 flex items-center gap-3 flex-shrink-0"
        style={{ padding: '16px 32px 24px 32px' }}
      >
        <button
          onClick={onClose}
          className="flex-1 py-3 px-5 rounded-2xl bg-[#007aff] hover:bg-[#0062cc] active:scale-98 text-white text-xs font-bold transition-all shadow-[0_4px_14px_rgba(0,122,255,0.4)] flex items-center justify-center gap-1.5"
        >
          <LucideIcons.Check size={15} strokeWidth={2.5} />
          Done
        </button>

        <button
          onClick={() => onDeleteNode(selectedNode.id)}
          className="py-3 px-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 active:scale-95 text-[#ff453a] border border-red-500/25 flex items-center justify-center transition-all"
          title="Delete Node"
        >
          <LucideIcons.Trash2 size={15} />
        </button>
      </div>
    </div>
  );
};
