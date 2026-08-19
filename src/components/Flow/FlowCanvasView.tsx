import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  SelectionMode,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Connection, Edge, Node } from '@xyflow/react';
import NodeCard from '../nodes/NodeCard';
import { NODE_DEFS, GROUPS, STRATEGY_PRESET_CONFIGS } from '../../data/nodeRegistry';
import * as LucideIcons from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useFlow } from '../../context/FlowContext';

const nodeTypes = {
  nodeCard: NodeCard,
};

export const INITIAL_NODES: Node[] = [
  // ==========================================
  // Column 1: Input & Strategy (x: 50)
  // ==========================================
  {
    id: 'node-1',
    type: 'nodeCard',
    position: { x: 50, y: 20 },
    data: {
      nodeType: 'strategy_preset_return',
      preset: 'Standard Quant',
      timeframe: 'M15',
      symbol: 'XAUUSD',
      bars_count: 10000,
      execution: { status: 'passed', detail: 'Strategy Feed: XAUUSD M15' },
    },
  },
  {
    id: 'node-2',
    type: 'nodeCard',
    position: { x: 50, y: 180 },
    data: {
      nodeType: 'volatility_indicator',
      vol_window: 10,
      sma_period: 20,
      metric: 'ATR Normalized',
      execution: { status: 'passed', detail: 'ATR Filter: 0.0018' },
    },
  },
  {
    id: 'node-3',
    type: 'nodeCard',
    position: { x: 50, y: 340 },
    data: {
      nodeType: 'position_feedback',
      encoding: 'Discrete',
      execution: { status: 'passed', detail: 'State Vector: 8 Dimensions' },
    },
  },
  {
    id: 'node-4',
    type: 'nodeCard',
    position: { x: 50, y: 500 },
    data: {
      nodeType: 'multi_timeframe_fusion',
      higher_tf: 'H4',
      trend_indicator: 'EMA 200 + SuperTrend',
      confluence_weight: 35,
      execution: { status: 'passed', detail: 'MTF Trend H4 Confluence' },
    },
  },
  {
    id: 'node-5',
    type: 'nodeCard',
    position: { x: 50, y: 660 },
    data: {
      nodeType: 'news_impact_filter',
      filter_high_impact: true,
      blackout_mins_before: 15,
      blackout_mins_after: 30,
      auto_close_on_red_news: false,
      execution: { status: 'passed', detail: 'News Blackout Filter Active' },
    },
  },
  {
    id: 'node-6',
    type: 'nodeCard',
    position: { x: 50, y: 820 },
    data: {
      nodeType: 'session_time_filter',
      active_session: 'London & New York',
      no_friday_weekend_gap: true,
      friday_close_hour_gmt: 21,
      execution: { status: 'passed', detail: 'London & NY Session Filter' },
    },
  },
  {
    id: 'node-7',
    type: 'nodeCard',
    position: { x: 50, y: 980 },
    data: {
      nodeType: 'training_episodes_config',
      target_episodes: '400',
      batch_size: '64',
      max_steps: 32,
      checkpoint_interval: 1000,
      execution: { status: 'passed', detail: '400 Episodes @ Batch 64' },
    },
  },

  // ==========================================
  // Column 2: Feature Expansion (x: 410)
  // ==========================================
  {
    id: 'node-8',
    type: 'nodeCard',
    position: { x: 410, y: 400 },
    data: {
      nodeType: 'fc1_dense_expansion',
      units: '64',
      activation: 'LeakyReLU',
      bias: true,
      execution: { status: 'passed', detail: 'FC1 Linear Expansion: 8 to 64' },
    },
  },
  {
    id: 'node-9',
    type: 'nodeCard',
    position: { x: 410, y: 600 },
    data: {
      nodeType: 'fc1_attention_weights',
      heads: '4',
      temperature: 1.0,
      execution: { status: 'passed', detail: 'Multi-Head Attention Saliency' },
    },
  },

  // ==========================================
  // Column 3: Regularization & Norm (x: 770)
  // ==========================================
  {
    id: 'node-10',
    type: 'nodeCard',
    position: { x: 770, y: 280 },
    data: {
      nodeType: 'spatial_dropout_regularization',
      rate: 0.15,
      mode: 'Standard Dropout',
      execution: { status: 'passed', detail: 'Dropout Active: 0.15' },
    },
  },
  {
    id: 'node-11',
    type: 'nodeCard',
    position: { x: 770, y: 480 },
    data: {
      nodeType: 'layer_normalization',
      norm_type: 'LayerNorm',
      epsilon: '1e-5',
      execution: { status: 'passed', detail: 'Normalized Variance: 1.0' },
    },
  },
  {
    id: 'node-12',
    type: 'nodeCard',
    position: { x: 770, y: 680 },
    data: {
      nodeType: 'gradient_clipping',
      max_norm: 1.0,
      execution: { status: 'passed', detail: 'Max Gradient Norm: 1.0' },
    },
  },

  // ==========================================
  // Column 4: Bottleneck Synthesis (x: 1130)
  // ==========================================
  {
    id: 'node-13',
    type: 'nodeCard',
    position: { x: 1130, y: 480 },
    data: {
      nodeType: 'fc2_bottleneck_synthesizer',
      units: '32',
      activation: 'LeakyReLU',
      residual: true,
      execution: { status: 'passed', detail: 'FC2 Bottleneck: 64 to 32 (Res)' },
    },
  },

  // ==========================================
  // Column 5: Reward Formulation & Capital Defense (x: 1490)
  // ==========================================
  {
    id: 'node-14',
    type: 'nodeCard',
    position: { x: 1490, y: 280 },
    data: {
      nodeType: 'friction_spread_cost',
      spread_pip: 0.15,
      commission: 0.00,
      execution: { status: 'passed', detail: 'Friction Adjusted: Spread 0.15' },
    },
  },
  {
    id: 'node-15',
    type: 'nodeCard',
    position: { x: 1490, y: 480 },
    data: {
      nodeType: 'anti_inactivity_reward',
      idle_penalty: -0.0005,
      opp_cost_multiplier: '0.50x',
      execution: { status: 'passed', detail: 'Inactivity Penalty Active' },
    },
  },
  {
    id: 'node-16',
    type: 'nodeCard',
    position: { x: 1490, y: 680 },
    data: {
      nodeType: 'drawdown_guard_penalty',
      max_dd_limit: 5.0,
      daily_dd_limit: 4.0,
      dd_penalty_mult: 3.0,
      hard_stop_on_breach: true,
      execution: { status: 'passed', detail: 'Drawdown Defense: Max 5.0%' },
    },
  },

  // ==========================================
  // Column 6: Output & Deployment (x: 1850)
  // ==========================================
  {
    id: 'node-17',
    type: 'nodeCard',
    position: { x: 1850, y: 120 },
    data: {
      nodeType: 'fc3_policy_action_head',
      classes: '3',
      entropy_beta: 0.08,
      execution: { status: 'passed', detail: 'Policy Softmax: 3 Actions' },
    },
  },
  {
    id: 'node-18',
    type: 'nodeCard',
    position: { x: 1850, y: 320 },
    data: {
      nodeType: 'dynamic_lot_sizer',
      sizing_mode: 'Risk % of Equity',
      risk_per_trade_pct: 1.0,
      min_lot: 0.01,
      max_lot: 10.0,
      atr_multiplier: 1.5,
      execution: { status: 'passed', detail: 'Dynamic Lot: 1% Equity Risk' },
    },
  },
  {
    id: 'node-19',
    type: 'nodeCard',
    position: { x: 1850, y: 520 },
    data: {
      nodeType: 'trailing_stop_breakeven',
      breakeven_trigger_rr: 1.5,
      breakeven_lock_pips: 1.0,
      trailing_step_atr: 1.2,
      partial_take_profit_pct: 50,
      execution: { status: 'passed', detail: 'Breakeven @ 1.5R, Trail 1.2 ATR' },
    },
  },
  {
    id: 'node-20',
    type: 'nodeCard',
    position: { x: 1850, y: 720 },
    data: {
      nodeType: 'telegram_webhook_alert',
      webhook_channel: 'Telegram Bot',
      bot_token_or_url: 'https://api.telegram.org/bot...',
      notify_on_trade: true,
      notify_on_dd_alert: true,
      notify_daily_summary: true,
      execution: { status: 'passed', detail: 'Telegram & Webhook Alert Ready' },
    },
  },
  {
    id: 'node-21',
    type: 'nodeCard',
    position: { x: 1850, y: 920 },
    data: {
      nodeType: 'onnx_mt5_compiler',
      target_folder: 'MQL5/Files/',
      opset: 14,
      execution: { status: 'passed', detail: 'Compiled ONNX Standalone Ready' },
    },
  },
];

export const INITIAL_EDGES: Edge[] = [
  // 1. Column 1 (Inputs 1-7) -> Column 2 (FC1 Dense node-8 & Attention node-9)
  { id: 'e1-8', source: 'node-1', target: 'node-8', type: 'smoothstep', animated: false, style: { stroke: '#0a84ff', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(10,132,255,0.55))' } },
  { id: 'e2-8', source: 'node-2', target: 'node-8', type: 'smoothstep', animated: false, style: { stroke: '#0a84ff', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(10,132,255,0.55))' } },
  { id: 'e3-8', source: 'node-3', target: 'node-8', type: 'smoothstep', animated: false, style: { stroke: '#0a84ff', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(10,132,255,0.55))' } },
  { id: 'e4-8', source: 'node-4', target: 'node-8', type: 'smoothstep', animated: false, style: { stroke: '#0a84ff', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(10,132,255,0.55))' } },
  { id: 'e5-8', source: 'node-5', target: 'node-8', type: 'smoothstep', animated: false, style: { stroke: '#0a84ff', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(10,132,255,0.55))' } },
  { id: 'e6-8', source: 'node-6', target: 'node-8', type: 'smoothstep', animated: false, style: { stroke: '#0a84ff', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(10,132,255,0.55))' } },
  { id: 'e7-8', source: 'node-7', target: 'node-8', type: 'smoothstep', animated: false, style: { stroke: '#0a84ff', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(10,132,255,0.55))' } },
  { id: 'e2-9', source: 'node-2', target: 'node-9', type: 'smoothstep', animated: false, style: { stroke: '#0a84ff', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(10,132,255,0.55))' } },
  { id: 'e4-9', source: 'node-4', target: 'node-9', type: 'smoothstep', animated: false, style: { stroke: '#0a84ff', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(10,132,255,0.55))' } },

  // 2. Column 2 (FC1 nodes 8, 9) -> Column 3 (Regularization nodes 10, 11, 12)
  { id: 'e8-10', source: 'node-8', target: 'node-10', type: 'smoothstep', animated: false, style: { stroke: '#ff9f0a', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(255,159,10,0.55))' } },
  { id: 'e8-11', source: 'node-8', target: 'node-11', type: 'smoothstep', animated: false, style: { stroke: '#ff9f0a', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(255,159,10,0.55))' } },
  { id: 'e8-12', source: 'node-8', target: 'node-12', type: 'smoothstep', animated: false, style: { stroke: '#ff9f0a', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(255,159,10,0.55))' } },
  { id: 'e9-11', source: 'node-9', target: 'node-11', type: 'smoothstep', animated: false, style: { stroke: '#ff9f0a', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(255,159,10,0.55))' } },

  // 3. Column 3 (Regularization nodes 10, 11, 12) -> Column 4 (FC2 Bottleneck node-13)
  { id: 'e10-13', source: 'node-10', target: 'node-13', type: 'smoothstep', animated: false, style: { stroke: '#30d158', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(48,209,88,0.55))' } },
  { id: 'e11-13', source: 'node-11', target: 'node-13', type: 'smoothstep', animated: false, style: { stroke: '#30d158', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(48,209,88,0.55))' } },
  { id: 'e12-13', source: 'node-12', target: 'node-13', type: 'smoothstep', animated: false, style: { stroke: '#30d158', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(48,209,88,0.55))' } },

  // 4. Column 4 (FC2 Bottleneck node-13) -> Column 5 (Reward nodes 14, 15, 16)
  { id: 'e13-14', source: 'node-13', target: 'node-14', type: 'smoothstep', animated: false, style: { stroke: '#bf5af2', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(191,90,242,0.55))' } },
  { id: 'e13-15', source: 'node-13', target: 'node-15', type: 'smoothstep', animated: false, style: { stroke: '#bf5af2', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(191,90,242,0.55))' } },
  { id: 'e13-16', source: 'node-13', target: 'node-16', type: 'smoothstep', animated: false, style: { stroke: '#bf5af2', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(191,90,242,0.55))' } },

  // 5. Column 5 (Reward nodes 14, 15, 16) -> Column 6 (FC3 Policy Head node-17)
  { id: 'e14-17', source: 'node-14', target: 'node-17', type: 'smoothstep', animated: false, style: { stroke: '#ffd60a', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(255,214,10,0.55))' } },
  { id: 'e15-17', source: 'node-15', target: 'node-17', type: 'smoothstep', animated: false, style: { stroke: '#ffd60a', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(255,214,10,0.55))' } },
  { id: 'e16-17', source: 'node-16', target: 'node-17', type: 'smoothstep', animated: false, style: { stroke: '#ffd60a', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(255,214,10,0.55))' } },

  // 6. Column 6 (FC3 Policy Head node-17) -> Execution & Deployment (nodes 18, 19, 20, 21)
  { id: 'e17-18', source: 'node-17', target: 'node-18', type: 'smoothstep', animated: false, style: { stroke: '#0a84ff', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(10,132,255,0.55))' } },
  { id: 'e17-19', source: 'node-17', target: 'node-19', type: 'smoothstep', animated: false, style: { stroke: '#0a84ff', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(10,132,255,0.55))' } },
  { id: 'e17-20', source: 'node-17', target: 'node-20', type: 'smoothstep', animated: false, style: { stroke: '#0a84ff', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(10,132,255,0.55))' } },
  { id: 'e17-21', source: 'node-17', target: 'node-21', type: 'smoothstep', animated: false, style: { stroke: '#0a84ff', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(10,132,255,0.55))' } },
];

// ==========================================
// 1. กำหนดค่าเริ่มต้นของทุกเส้นเป็น "smoothstep" แบบไม่มีหัวลูกศร (Static เมื่อ Standby)
// ==========================================
const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: false,
  style: {
    stroke: '#0a84ff',
    strokeWidth: 2,
    filter: 'drop-shadow(0 0 6px rgba(10, 132, 255, 0.45))',
  },
  pathOptions: {
    borderRadius: 16,
  },
};

const LOCAL_STORAGE_KEY_NODES = 'fxforge_dag_nodes_v9';
const LOCAL_STORAGE_KEY_EDGES = 'fxforge_dag_edges_v9';

const getInitialNodes = (): Node[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_NODES);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Filter out any corrupted stray nodes without valid nodeType or with NaN coordinates
        return parsed.filter(
          (n: any) =>
            n &&
            n.data?.nodeType &&
            typeof n.position?.x === 'number' &&
            !isNaN(n.position.x) &&
            typeof n.position?.y === 'number' &&
            !isNaN(n.position.y)
        );
      }
    }
  } catch (e) {
    console.error('Failed to load saved DAG nodes from local storage:', e);
  }
  return INITIAL_NODES;
};

const getInitialEdges = (): Edge[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_EDGES);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load saved DAG edges from local storage:', e);
  }
  return INITIAL_EDGES;
};

export const autoTunePipelineNodes = (presetName: string, currentNodes: Node[]): Node[] => {
  const cfg = STRATEGY_PRESET_CONFIGS[presetName];
  if (!cfg) return currentNodes;

  return currentNodes.map((node) => {
    const type = node.data?.nodeType || node.type;
    const currentData = (node.data || {}) as Record<string, any>;

    switch (type) {
      case 'strategy_preset_return':
        return {
          ...node,
          data: {
            ...currentData,
            preset: presetName,
            timeframe: cfg.timeframe,
            bars_count: cfg.bars_count,
            execution: {
              status: 'passed',
              detail: `Auto-tuned: ${currentData.symbol || 'XAUUSD'} ${cfg.timeframe} (${cfg.bars_count.toLocaleString()} bars)`,
            },
          },
        };

      case 'lookback_returns_window':
        return {
          ...node,
          data: {
            ...currentData,
            lookbacks: cfg.ret_lookbacks,
            execution: {
              status: 'passed',
              detail: `Auto-tuned Lookbacks: [${cfg.ret_lookbacks}]`,
            },
          },
        };

      case 'volatility_indicator':
        return {
          ...node,
          data: {
            ...currentData,
            vol_window: cfg.vol_window,
            sma_period: cfg.sma_period,
            metric: cfg.metric,
            execution: {
              status: 'passed',
              detail: `Auto-tuned: Win ${cfg.vol_window} / SMA ${cfg.sma_period}`,
            },
          },
        };

      case 'multi_timeframe_fusion':
        return {
          ...node,
          data: {
            ...currentData,
            higher_tf: cfg.higher_tf,
            execution: {
              status: 'passed',
              detail: `Auto-tuned MTF: ${cfg.higher_tf}`,
            },
          },
        };

      case 'news_impact_filter':
        return {
          ...node,
          data: {
            ...currentData,
            filter_high_impact: cfg.news_filter,
            execution: {
              status: 'passed',
              detail: `Auto-tuned News Filter: ${cfg.news_filter ? 'Active' : 'Bypassed'}`,
            },
          },
        };

      case 'session_time_filter':
        return {
          ...node,
          data: {
            ...currentData,
            active_session: cfg.active_session,
            execution: {
              status: 'passed',
              detail: `Auto-tuned Session: ${cfg.active_session}`,
            },
          },
        };

      case 'training_episodes_config':
        return {
          ...node,
          data: {
            ...currentData,
            target_episodes: cfg.target_episodes,
            execution: {
              status: 'passed',
              detail: `Auto-tuned: ${cfg.target_episodes} Target Episodes`,
            },
          },
        };

      case 'fc1_dense_expansion':
        return {
          ...node,
          data: {
            ...currentData,
            units: cfg.units_fc1,
            activation: cfg.activation_fc1,
            execution: {
              status: 'passed',
              detail: `Auto-tuned: 6 to ${cfg.units_fc1} (${cfg.activation_fc1})`,
            },
          },
        };

      case 'fc1_attention_weights':
        return {
          ...node,
          data: {
            ...currentData,
            heads: cfg.attention_heads,
            execution: {
              status: 'passed',
              detail: `Auto-tuned: ${cfg.attention_heads} Attention Heads`,
            },
          },
        };

      case 'spatial_dropout':
        return {
          ...node,
          data: {
            ...currentData,
            rate: cfg.dropout_rate,
            mode: cfg.dropout_mode,
            execution: {
              status: 'passed',
              detail: `Auto-tuned Rate: ${cfg.dropout_rate}`,
            },
          },
        };

      case 'layer_normalization':
        return {
          ...node,
          data: {
            ...currentData,
            norm_type: cfg.norm_type,
            execution: {
              status: 'passed',
              detail: `Auto-tuned: ${cfg.norm_type}`,
            },
          },
        };

      case 'l2_weight_decay':
        return {
          ...node,
          data: {
            ...currentData,
            decay: cfg.l2_decay,
            execution: {
              status: 'passed',
              detail: `Auto-tuned Decay: ${cfg.l2_decay}`,
            },
          },
        };

      case 'gradient_clipping':
        return {
          ...node,
          data: {
            ...currentData,
            max_norm: cfg.gradient_clip,
            execution: {
              status: 'passed',
              detail: `Auto-tuned Max Norm: ${cfg.gradient_clip}`,
            },
          },
        };

      case 'fc2_bottleneck_synthesizer':
        return {
          ...node,
          data: {
            ...currentData,
            units: cfg.units_fc2,
            activation: cfg.activation_fc2,
            residual: cfg.residual,
            execution: {
              status: 'passed',
              detail: `Auto-tuned: ${cfg.units_fc2} (${cfg.activation_fc2}${cfg.residual ? ' + Res' : ''})`,
            },
          },
        };

      case 'friction_spread_cost':
        return {
          ...node,
          data: {
            ...currentData,
            spread_pip: cfg.spread_pip,
            execution: {
              status: 'passed',
              detail: `Auto-tuned Spread: ${cfg.spread_pip} pips`,
            },
          },
        };

      case 'anti_inactivity_reward':
        return {
          ...node,
          data: {
            ...currentData,
            idle_penalty: cfg.idle_penalty,
            opp_cost_multiplier: cfg.opp_cost_multiplier,
            execution: {
              status: 'passed',
              detail: `Auto-tuned Idle: ${cfg.idle_penalty}`,
            },
          },
        };

      case 'fc3_policy_action_head':
        return {
          ...node,
          data: {
            ...currentData,
            entropy_beta: cfg.entropy_beta,
            execution: {
              status: 'passed',
              detail: `Auto-tuned Entropy Beta: ${cfg.entropy_beta}`,
            },
          },
        };

      case 'drawdown_guard_penalty':
        return {
          ...node,
          data: {
            ...currentData,
            max_dd_limit: cfg.max_dd_limit,
            dd_penalty_mult: cfg.dd_penalty_mult,
            execution: {
              status: 'passed',
              detail: `Auto-tuned DD Guard: ${cfg.max_dd_limit}%`,
            },
          },
        };

      case 'dynamic_lot_sizer':
        return {
          ...node,
          data: {
            ...currentData,
            sizing_mode: cfg.sizing_mode,
            risk_per_trade_pct: cfg.risk_per_trade,
            execution: {
              status: 'passed',
              detail: `Auto-tuned Sizer: ${cfg.sizing_mode} (${cfg.risk_per_trade}%)`,
            },
          },
        };

      case 'trailing_stop_breakeven':
        return {
          ...node,
          data: {
            ...currentData,
            breakeven_trigger_rr: cfg.be_trigger_rr,
            trailing_step_atr: cfg.trailing_step_atr,
            execution: {
              status: 'passed',
              detail: `Auto-tuned Breakeven: ${cfg.be_trigger_rr}R, Trail: ${cfg.trailing_step_atr} ATR`,
            },
          },
        };

      case 'monte_carlo_stress_test':
        return {
          ...node,
          data: {
            ...currentData,
            simulations: cfg.monte_carlo_sims,
            execution: {
              status: 'passed',
              detail: `Auto-tuned: ${cfg.monte_carlo_sims} Stress Paths`,
            },
          },
        };

      case 'walk_forward_robustness':
        return {
          ...node,
          data: {
            ...currentData,
            splits: cfg.walk_forward_splits,
            execution: {
              status: 'passed',
              detail: `Auto-tuned: ${cfg.walk_forward_splits}-Fold Walk-Forward`,
            },
          },
        };

      case 'onnx_mt5_compiler':
        return {
          ...node,
          data: {
            ...currentData,
            model_name: cfg.onnx_model_name,
            execution: {
              status: 'passed',
              detail: `Auto-tuned Export: ${cfg.onnx_model_name}`,
            },
          },
        };

      case 'telegram_webhook_alert':
        return {
          ...node,
          data: {
            ...currentData,
            execution: {
              status: 'passed',
              detail: `Auto-tuned Alert: ${presetName}`,
            },
          },
        };

      default:
        return node;
    }
  });
};

interface ContextMenuState {
  x: number;
  y: number;
  flowPos: { x: number; y: number };
  targetNodeId: string | null;
}

interface InspectorState {
  nodeId: string;
  x: number;
  y: number;
}

const InspectorTextField: React.FC<{
  label: string;
  value: string | number | boolean;
  defaultValue?: string | number | boolean;
  type?: 'string' | 'text' | 'number' | 'select' | 'boolean';
  options?: string[];
  onChange: (val: any) => void;
  isOpen?: boolean;
  onToggleOpen?: (open: boolean) => void;
}> = ({ label, value, defaultValue, type, options, onChange, isOpen = false, onToggleOpen }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [isFocused, setIsFocused] = useState(false);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isBoolean = type === 'boolean' || typeof defaultValue === 'boolean';
  const isSelect = !isBoolean && (type === 'select' || (options && options.length > 0));
  const isNumber = !isBoolean && !isSelect && (type === 'number' || typeof defaultValue === 'number');

  const toggleDropdown = () => {
    onToggleOpen?.(!isOpen);
  };

  // Close dropdown on click outside anywhere
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsidePointerDown = (e: PointerEvent | MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        (triggerButtonRef.current && triggerButtonRef.current.contains(target)) ||
        (menuRef.current && menuRef.current.contains(target))
      ) {
        return;
      }
      onToggleOpen?.(false);
    };

    window.addEventListener('pointerdown', handleOutsidePointerDown, { capture: true });
    window.addEventListener('mousedown', handleOutsidePointerDown, { capture: true });
    return () => {
      window.removeEventListener('pointerdown', handleOutsidePointerDown, { capture: true });
      window.removeEventListener('mousedown', handleOutsidePointerDown, { capture: true });
    };
  }, [isOpen, onToggleOpen]);

  //  Frameless Apple Settings Toggle Switch (Borderless, Clean Text Align)
  if (isBoolean) {
    const isChecked = Boolean(value ?? defaultValue);
    return (
      <div
        className="flex items-center justify-between nodrag nopan select-none"
        style={{
          pointerEvents: 'all',
          height: '24px',
          paddingLeft: '0px',
          paddingRight: '0px',
          backgroundColor: 'transparent',
          border: 'none',
          marginTop: '2px',
          marginBottom: '2px',
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span
          className={`text-[12px] font-medium tracking-tight ${isLight ? 'text-[#1d1d1f]' : 'text-[#f5f5f7]'}`}
          style={{ fontFamily: 'var(--font-apple-text)' }}
        >
          {label}
        </span>
        <button
          type="button"
          onClick={() => onChange(!isChecked)}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer nodrag nopan pointer-events-auto flex-shrink-0 ${
            isChecked
              ? isLight ? 'bg-[#28cd41]' : 'bg-[#30d158]'
              : isLight ? 'bg-[#d1d1d6]' : 'bg-[#3a3a44]'
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
              isChecked ? 'left-[18px]' : 'left-0.5'
            }`}
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
          />
        </button>
      </div>
    );
  }

  // State checks matching Apple/Figma specs
  const strVal = value !== undefined && value !== null ? String(value) : '';
  const isInvalidNumber = isNumber && (strVal.trim() === '' || isNaN(Number(strVal)));
  const isError = isInvalidNumber;
  const isFilled = strVal.trim() !== '';
  const selectOptions = options || ['32', '64', '128'];

  return (
    <div className="flex flex-col gap-1.5 group nodrag nopan relative" style={{ pointerEvents: 'all' }}>
      {/* Label above */}
      <label
        className={`text-[11px] font-medium select-none tracking-tight ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}
        style={{
          fontFamily: 'var(--font-apple-text)',
          cursor: 'var(--mac-cursor-default)',
        }}
      >
        {label}
      </label>

      {/*  macOS Apple Dropdown Select (Instant 1-Click Switchable, In-Canvas Scaled) */}
      {isSelect ? (
        <div className="relative w-full">
          <button
            ref={triggerButtonRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleDropdown();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              fontFamily: 'var(--font-apple-text)',
              pointerEvents: 'all',
              paddingLeft: '10px',
              paddingRight: '10px',
            }}
            className={`w-full h-[25px] rounded-[6px] flex items-center justify-between transition-all border text-left cursor-pointer nodrag nopan pointer-events-auto select-none ${
              isLight
                ? isOpen
                  ? 'border-[#0071e3] ring-2 ring-[#0071e3]/20 bg-[#e8e8ed]'
                  : 'bg-[#f0f0f2] hover:bg-[#e8e8ed] border-black/[0.08] hover:border-black/[0.16]'
                : isOpen
                ? 'border-[#0a84ff] ring-2 ring-[#0a84ff]/25 bg-white/[0.12]'
                : 'bg-white/[0.07] hover:bg-white/[0.11] border-white/[0.14] hover:border-white/[0.22]'
            }`}
          >
            <span className={`text-[12px] font-medium truncate ${isLight ? 'text-[#1d1d1f]' : 'text-[#f5f5f7]'}`}>
              {strVal || selectOptions[0]}
            </span>
            <LucideIcons.ChevronsUpDown size={12} className={`flex-shrink-0 ml-1.5 ${isLight ? 'text-black/40' : 'text-white/50'}`} />
          </button>

          {/*  macOS Floating Dark/Light Glass Menu (Positioned Absolutely within Canvas, Zero Zoom Distortion) */}
          {isOpen && (
            <div
              ref={menuRef}
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                width: '100%',
                backgroundColor: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(28, 28, 34, 0.98)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                borderRadius: '8px',
                border: isLight ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.16)',
                boxShadow: isLight
                  ? '0 16px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                  : '0 20px 48px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.4)',
                padding: '4px',
                zIndex: 999999,
                maxHeight: '180px',
                overflowY: 'auto',
              }}
              className="custom-scrollbar nodrag nopan nowheel select-none"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
            >
              {selectOptions.map((opt) => {
                const isSelected = opt === (strVal || selectOptions[0]);
                return (
                  <div
                    key={opt}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(opt);
                      onToggleOpen?.(false);
                    }}
                    style={{
                      fontFamily: 'var(--font-apple-text)',
                      paddingLeft: '8px',
                      paddingRight: '10px',
                      height: '28px',
                    }}
                    className={`flex items-center gap-2 rounded-[5px] text-[12px] cursor-pointer transition-colors select-none ${
                      isSelected
                        ? isLight ? 'bg-[#0071e3] text-white font-medium shadow-sm' : 'bg-[#0a84ff] text-white font-medium shadow-sm'
                        : isLight ? 'text-[#1d1d1f] hover:bg-black/[0.05] hover:text-[#0071e3] font-normal' : 'text-[#e5e5ea] hover:bg-white/[0.08] hover:text-white font-normal'
                    }`}
                  >
                    <span className="w-3.5 flex items-center justify-center flex-shrink-0">
                      {isSelected && <LucideIcons.Check size={12} strokeWidth={2.5} className="text-white" />}
                    </span>
                    <span className="truncate">{opt}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Text / Number Input Container */
        <div
          style={{ pointerEvents: 'all', paddingLeft: '10px', paddingRight: '10px' }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className={`h-[25px] w-full rounded-[6px] flex items-center transition-all duration-150 pointer-events-auto relative ${
            isError
              ? isLight ? 'border border-[#d70015] ring-2 ring-[#d70015]/20 bg-[#ffeff0]' : 'border border-[#ff453a] ring-2 ring-[#ff453a]/25 bg-[#261c1e]'
              : isFocused
              ? isLight ? 'border border-[#0071e3] ring-2 ring-[#0071e3]/20 bg-[#ffffff]' : 'border border-[#0a84ff] ring-2 ring-[#0a84ff]/25 bg-white/[0.09]'
              : isFilled
              ? isLight ? 'bg-[#f0f0f2] border border-black/[0.12] hover:border-black/[0.2]' : 'bg-white/[0.05] border border-white/[0.14] hover:border-white/[0.22]'
              : isLight ? 'bg-[#f0f0f2] border border-black/[0.08] hover:border-black/[0.16]' : 'bg-white/[0.05] border border-white/[0.10] hover:border-white/[0.18]'
          }`}
        >
          <input
            type={isNumber ? 'number' : 'text'}
            value={strVal}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => {
              if (isNumber) {
                const val = e.target.value;
                const parsed = parseFloat(val);
                onChange(isNaN(parsed) ? val : parsed);
              } else {
                onChange(e.target.value);
              }
            }}
            placeholder={`Enter ${label.toLowerCase()}...`}
            style={{
              fontFamily: 'var(--font-apple-text)',
              fontVariantNumeric: isNumber ? 'tabular-nums' : 'normal',
              pointerEvents: 'all',
            }}
            className={`w-full bg-transparent text-[12px] font-medium focus:outline-none nodrag nopan pointer-events-auto cursor-text px-0 ${
              isLight ? 'text-[#1d1d1f] placeholder:text-[#8e8e93]' : 'text-[#f5f5f7] placeholder:text-[#71717a]'
            }`}
          />
        </div>
      )}

      {/* Error message indicator */}
      {isError && (
        <span
          className="text-[10px] text-[#ff453a] font-medium tracking-tight -mt-0.5"
          style={{ fontFamily: 'var(--font-apple-text)' }}
        >
          Invalid numeric value
        </span>
      )}
    </div>
  );
};

//  Draggable Floating Inspector Component (Pinned to Canvas Layer with GPU Direct Transforms)
interface FloatingInspectorProps {
  node: Node;
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
  onClose: () => void;
  toLocal: (clientX: number, clientY: number) => { x: number; y: number };
  updateNodeData: (nodeId: string, keyOrObj: string | Record<string, any>, value?: any) => void;
  deleteNode: () => void;
}

const FloatingInspector = React.memo<FloatingInspectorProps>(({
  node,
  position,
  onPositionChange,
  onClose,
  toLocal,
  updateNodeData,
  deleteNode,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const currentPosRef = useRef(position);
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  // Sync position prop to ref and DOM when not actively dragging
  useEffect(() => {
    currentPosRef.current = position;
    if (containerRef.current && !isDraggingRef.current) {
      containerRef.current.style.left = `${position.x}px`;
      containerRef.current.style.top = `${position.y}px`;
    }
  }, [position.x, position.y]);

  const onHeaderPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, textarea')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}

    isDraggingRef.current = true;
    setIsDragging(true);

    const startLocal = toLocal(e.clientX, e.clientY);
    dragRef.current = {
      dx: startLocal.x - currentPosRef.current.x,
      dy: startLocal.y - currentPosRef.current.y,
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current || !dragRef.current) return;
      const nextLocal = toLocal(event.clientX, event.clientY);
      const nextX = nextLocal.x - dragRef.current.dx;
      const nextY = nextLocal.y - dragRef.current.dy;
      currentPosRef.current = { x: nextX, y: nextY };

      // Ultra-sharp vector positioning: Zero blurriness on zoom
      if (containerRef.current) {
        containerRef.current.style.left = `${nextX}px`;
        containerRef.current.style.top = `${nextY}px`;
      }
    };

    const onPointerUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);
      dragRef.current = null;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      // Commit final position to parent state once when dragging finishes
      onPositionChange(currentPosRef.current);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { once: true });
  };

  const [activeDropdownKey, setActiveDropdownKey] = useState<string | null>(null);

  // 📝 Local Draft State: Parameters only apply to Node Card upon clicking "Update"
  const [draftData, setDraftData] = useState<Record<string, any>>(() => ({ ...(node.data || {}) }));

  useEffect(() => {
    setDraftData({ ...(node.data || {}) });
  }, [node.id, node.data]);

  const handleFieldChange = useCallback((key: string, newVal: any) => {
    if (key === 'preset' && STRATEGY_PRESET_CONFIGS[String(newVal)]) {
      const presetData = STRATEGY_PRESET_CONFIGS[String(newVal)];
      const updatedDraft = {
        ...draftData,
        preset: newVal,
        timeframe: presetData.timeframe,
        bars_count: presetData.bars_count,
      };
      setDraftData(updatedDraft);
      // Instantly tune the entire DAG pipeline so all nodes update in real time
      updateNodeData(node.id, updatedDraft);
    } else {
      setDraftData((prev) => ({
        ...prev,
        [key]: newVal,
      }));
    }
  }, [draftData, node.id, updateNodeData]);

  const handleCommitUpdate = useCallback(() => {
    updateNodeData(node.id, draftData);
    onClose();
  }, [node.id, draftData, updateNodeData, onClose]);

  const nodeType = node.data?.nodeType as string;
  const def = NODE_DEFS[nodeType];
  const group = GROUPS.find((g) => g.id === def?.group) || { label: 'Node', color: '#007aff' };
  const nodeLabel = String(def?.label || node.data?.label || nodeType);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: 265,
        backgroundColor: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(22, 22, 28, 0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        zIndex: 9999,
        padding: '12px 14px 10px 14px',
        pointerEvents: 'all',
        cursor: 'var(--mac-cursor-default)',
        boxShadow: isLight
          ? '0 20px 50px rgba(0, 0, 0, 0.12), 0 1px 0 rgba(255, 255, 255, 0.8) inset'
          : '0 24px 48px rgba(0, 0, 0, 0.6), 0 1px 0 rgba(255, 255, 255, 0.08) inset',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'geometricPrecision',
      }}
      className={`border rounded-2xl text-xs select-none nodrag nopan nowheel pointer-events-auto transition-colors duration-150 ${
        isLight ? 'border-black/[0.12] text-[#1d1d1f]' : 'border-white/[0.12] text-slate-200'
      }`}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      {/* 🟢 DRAGGABLE HEADER BAR */}
      <div
        onPointerDown={onHeaderPointerDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          cursor: isDragging ? 'var(--mac-cursor-grabbing)' : 'var(--mac-cursor-grab)',
          userSelect: 'none',
          borderBottom: 'none',
          pointerEvents: 'all',
        }}
        className="nodrag nopan pointer-events-auto"
      >
        <div className="flex items-center gap-2 pointer-events-none min-w-0 flex-1 pr-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: group.color, boxShadow: `0 0 8px ${group.color}` }}
          />
          <div className="min-w-0 flex-1">
            <span
              className="text-[9px] font-bold tracking-wider uppercase block truncate"
              style={{
                color: group.color,
                fontFamily: 'var(--font-apple-text)',
                whiteSpace: 'nowrap',
              }}
            >
              {group.label}
            </span>
            <span
              className={`text-[12px] font-semibold block truncate ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}
              style={{
                fontFamily: 'var(--font-apple-text)',
                letterSpacing: '-0.015em',
                whiteSpace: 'nowrap',
              }}
            >
              {nodeLabel}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ pointerEvents: 'all', cursor: 'var(--mac-cursor-pointer)' }}
          className={`transition-colors duration-150 pointer-events-auto nodrag nopan flex-shrink-0 ${
            isLight ? 'text-black/40 hover:text-[#1d1d1f]' : 'text-white/40 hover:text-white'
          }`}
        >
          <LucideIcons.X size={13} />
        </button>
      </div>

      {/* 📝 BODY: Parameter Inputs (Guaranteed 10px Spacing) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          overflow: 'visible',
          pointerEvents: 'all',
          cursor: 'var(--mac-cursor-default)',
        }}
        className="nodrag nopan"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {def?.fields.map((f) => {
          const val = (draftData?.[f.key] ?? f.default) as string | number | boolean;
          return (
            <InspectorTextField
              key={f.key}
              label={f.label}
              value={val}
              defaultValue={f.default}
              type={f.type}
              options={f.options}
              onChange={(newVal) => handleFieldChange(f.key, newVal)}
              isOpen={activeDropdownKey === f.key}
              onToggleOpen={(open) => setActiveDropdownKey(open ? f.key : null)}
            />
          );
        })}
      </div>

      {/* 🟢 FOOTER: Centered Apple Action Buttons with 20px Gap */}
      <div
        style={{
          marginTop: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          pointerEvents: 'all',
          cursor: 'var(--mac-cursor-default)',
        }}
        className="nodrag nopan pointer-events-auto px-1 select-none"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleCommitUpdate();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            fontFamily: 'var(--font-apple-text)',
            pointerEvents: 'all',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'var(--mac-cursor-pointer)',
          }}
          className={`text-[12px] flex items-center gap-1.5 font-medium transition-colors duration-150 pointer-events-auto nodrag nopan select-none group ${
            isLight
              ? 'text-[#111827] hover:text-[#28cd41]'
              : 'text-white/90 hover:text-[#30d158]'
          }`}
        >
          <LucideIcons.Check
            size={13}
            className={`${isLight ? 'text-[#28cd41]' : 'text-[#30d158]'} flex-shrink-0 group-hover:drop-shadow-[0_0_6px_rgba(48,209,88,0.6)] transition-colors duration-150`}
          />
          <span className="group-hover:drop-shadow-[0_0_6px_rgba(48,209,88,0.6)]">Update</span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            deleteNode();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            fontFamily: 'var(--font-apple-text)',
            pointerEvents: 'all',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'var(--mac-cursor-pointer)',
          }}
          className={`text-[12px] flex items-center gap-1.5 font-medium transition-colors duration-150 pointer-events-auto nodrag nopan select-none group ${
            isLight
              ? 'text-[#111827] hover:text-[#ff453a]'
              : 'text-white/90 hover:text-[#ff453a]'
          }`}
        >
          <LucideIcons.Trash2
            size={13}
            className="text-[#ff453a] flex-shrink-0 group-hover:drop-shadow-[0_0_6px_rgba(255,69,58,0.6)] transition-colors duration-150"
          />
          <span className="group-hover:drop-shadow-[0_0_6px_rgba(255,69,58,0.6)]">Delete Node</span>
        </button>
      </div>
    </div>
  );
});

const FlowContent: React.FC<{ isTraining?: boolean }> = ({ isTraining = false }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { syncArchitectureToEngine, setNodes: setContextNodes, setEdges: setContextEdges } = useFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(getInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(getInitialEdges());
  const { screenToFlowPosition } = useReactFlow();

  // Floating Context Menu & Inspector States
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [inspectors, setInspectors] = useState<InspectorState[]>([]);

  // 🔒 Lock: Close any active inspector modals and context menus immediately when training starts
  useEffect(() => {
    if (isTraining) {
      setInspectors([]);
      setContextMenu(null);
    }
  }, [isTraining]);

  // Persistent auto-save and synchronization of nodes to localStorage & FlowContext
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_NODES, JSON.stringify(nodes));
    } catch {}
    setContextNodes(nodes);
    syncArchitectureToEngine(nodes);
  }, [nodes, setContextNodes, syncArchitectureToEngine]);

  // Persistent auto-save and synchronization of edges to localStorage & FlowContext
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_EDGES, JSON.stringify(edges));
    } catch {}
    setContextEdges(edges);
  }, [edges, setContextEdges]);

  //  Listen to blueprint load events from Strategy Vault Sidebar & AI Copilot
  useEffect(() => {
    const handleLoadBlueprint = (e: any) => {
      if (e.detail?.nodes !== undefined && e.detail?.edges !== undefined) {
        // Filter out any corrupted nodes without valid nodeType or with NaN coordinates
        const validNodes = (e.detail.nodes as Node[]).filter(
          (n: any) =>
            n &&
            n.data?.nodeType &&
            typeof n.position?.x === 'number' &&
            !isNaN(n.position.x) &&
            typeof n.position?.y === 'number' &&
            !isNaN(n.position.y)
        );

        const targetNodes = Array.isArray(e.detail.nodes) ? validNodes : INITIAL_NODES;
        const targetEdges = Array.isArray(e.detail.edges) ? e.detail.edges : INITIAL_EDGES;

        setNodes(targetNodes);
        setEdges(targetEdges);
        syncArchitectureToEngine(targetNodes);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY_NODES, JSON.stringify(targetNodes));
          localStorage.setItem(LOCAL_STORAGE_KEY_EDGES, JSON.stringify(targetEdges));
        } catch {}
      } else if (e.detail?.preset) {
        setNodes((curr) => {
          const updated = autoTunePipelineNodes(e.detail.preset, curr);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY_NODES, JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    };

    const handleUpdateNodes = (e: any) => {
      if (Array.isArray(e.detail?.nodes)) {
        const validNodes = (e.detail.nodes as Node[]).filter(
          (n: any) => n && n.data?.nodeType
        );
        setNodes(validNodes);
        syncArchitectureToEngine(validNodes);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY_NODES, JSON.stringify(validNodes));
        } catch {}
      }
      if (Array.isArray(e.detail?.edges)) {
        setEdges(e.detail.edges);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY_EDGES, JSON.stringify(e.detail.edges));
        } catch {}
      }
    };

    window.addEventListener('fxforge-load-blueprint', handleLoadBlueprint);
    window.addEventListener('fxforge-update-nodes', handleUpdateNodes);
    return () => {
      window.removeEventListener('fxforge-load-blueprint', handleLoadBlueprint);
      window.removeEventListener('fxforge-update-nodes', handleUpdateNodes);
    };
  }, [setNodes, setEdges, syncArchitectureToEngine]);



  // Clipboard Reference for Multi-Node Copy / Cut / Paste
  const [hasClipboard, setHasClipboard] = useState(false);
  const clipboardRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const pasteCountRef = useRef(0);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 400, y: 300 });

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  // Get currently selected nodes helper
  const selectedNodes = useCallback((specificNodeId: string | null = null) => {
    const allSelected = nodesRef.current.filter((n) => n.selected);
    if (specificNodeId) {
      const specific = nodesRef.current.find((n) => n.id === specificNodeId);
      if (specific && specific.selected && allSelected.length > 0) {
        return allSelected;
      }
      return specific ? [specific] : allSelected;
    }
    return allSelected;
  }, []);

  // ==========================================
  // 2. จัดการเมื่อผู้ใช้ลากสายเชื่อมต่อ (onConnect)
  // ==========================================
  const onConnect = useCallback(
    (connection: Connection) => {
      // 🔒 Block connecting edges when training is active
      if (isTraining) return;

      // 🎨 กำหนดสีตามขาที่ลากออกมา
      let edgeColor = '#38bdf8'; // สีฟ้าปกติ
      if (connection.sourceHandle === 'true' || connection.sourceHandle === 'pass') {
        edgeColor = '#10b981'; // 🟢 ขาผ่าน/สัญญาณซื้อ = สีเขียว Emerald
      } else if (connection.sourceHandle === 'false' || connection.sourceHandle === 'fail') {
        edgeColor = '#f43f5e'; // 🔴 ขาไม่ผ่าน/สัญญาณหยุด = สีแดง Rose
      }

      const newEdge: Edge = {
        ...connection,
        id: `e-${connection.source}-${connection.target}-${Date.now()}`,
        type: 'smoothstep', // 🟢 กำหนดเป็น smoothstep
        animated: true,     // เส้นไฟวิ่ง
        style: {
          stroke: edgeColor,
          strokeWidth: 2,
          filter: `drop-shadow(0 0 6px ${edgeColor}88)`, // แสงนีออนฟุ้งเรืองแสง
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [isTraining, setEdges]
  );

  // ==========================================
  // 2. การ COPY (คัดลอก NODE + EDGES ที่เชื่อมกัน)
  // ==========================================
  const copyNodes = useCallback(
    (nodesToCopy: Node[] | null = null) => {
      const targets = nodesToCopy && nodesToCopy.length ? nodesToCopy : selectedNodes();
      if (!targets.length) return false;
      const selectedIds = new Set(targets.map((n) => n.id));

      // เก็บทั้ง Node และสาย Edges ที่เชื่อมต่อกันภายในกลุ่ม
      clipboardRef.current = {
        nodes: targets.map((node) => ({
          ...node,
          selected: false,
          data: { ...node.data },
        })),
        edges: edgesRef.current
          .filter((edge) => selectedIds.has(edge.source) && selectedIds.has(edge.target))
          .map((edge) => ({ ...edge })),
      };
      pasteCountRef.current = 0;
      setHasClipboard(true);
      return true;
    },
    [selectedNodes]
  );

  // ==========================================
  // 3. การ DELETE (ลบ NODE + EDGES)
  // ==========================================
  const deleteNodes = useCallback(
    (nodesToDelete: Node[] | null = null) => {
      const targets = nodesToDelete && nodesToDelete.length ? nodesToDelete : selectedNodes();
      if (!targets.length) return;
      const targetIds = new Set(targets.map((n) => n.id));

      setNodes((nds) => {
        const updated = nds.filter((n) => !targetIds.has(n.id));
        syncArchitectureToEngine(updated);
        return updated;
      });
      setEdges((eds) => eds.filter((e) => !targetIds.has(e.source) && !targetIds.has(e.target)));
      setInspectors((ins) => ins.filter((i) => !targetIds.has(i.nodeId)));
    },
    [selectedNodes, setEdges, setNodes, syncArchitectureToEngine]
  );

  // ==========================================
  // 4. การ CUT (ตัด NODE)
  // ==========================================
  const cutNodes = useCallback(
    (nodesToCut: Node[] | null = null) => {
      const targets = nodesToCut && nodesToCut.length ? nodesToCut : selectedNodes();
      if (!targets.length) return;
      copyNodes(targets);
      deleteNodes(targets);
      setHasClipboard(true);
    },
    [copyNodes, deleteNodes, selectedNodes]
  );

  // ==========================================
  // 5. การ PASTE (วาง ณ ตำแหน่ง CURSOR เมาส์)
  // ==========================================
  const pasteAt = useCallback(
    (targetFlowPos: { x: number; y: number } | null = null) => {
      const clip = clipboardRef.current;
      if (!clip || !clip.nodes.length) return;

      pasteCountRef.current += 1;
      const offset = pasteCountRef.current * 24;

      let basePos = { x: offset, y: offset };
      if (targetFlowPos) {
        const minX = Math.min(...clip.nodes.map((n) => n.position.x));
        const minY = Math.min(...clip.nodes.map((n) => n.position.y));
        basePos = { x: targetFlowPos.x - minX, y: targetFlowPos.y - minY };
      }

      // สร้าง ID ใหม่ให้กับ Node และสาย Edges ทั้งหมด
      const idMap = new Map<string, string>();
      const newNodes = clip.nodes.map((node) => {
        const newId = `n-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        idMap.set(node.id, newId);
        return {
          ...node,
          id: newId,
          selected: true,
          position: { x: node.position.x + basePos.x, y: node.position.y + basePos.y },
        };
      });

      const newEdges = clip.edges.map((edge) => ({
        ...edge,
        id: `e-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        source: idMap.get(edge.source) || edge.source,
        target: idMap.get(edge.target) || edge.target,
      }));

      setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);
    },
    [setEdges, setNodes]
  );

  // ==========================================
  // 6. การ DUPLICATE (ทำสำเนาทันที)
  // ==========================================
  const duplicateNodes = useCallback(
    (nodesToDup: Node[] | null = null) => {
      const targets = nodesToDup && nodesToDup.length ? nodesToDup : selectedNodes();
      if (!targets.length) return;
      copyNodes(targets);
      pasteAt(null);
    },
    [copyNodes, pasteAt, selectedNodes]
  );

  // ==========================================
  // 7. การ DISCONNECT (ตัดสาย EDGES ทั้งหมดของ NODE)
  // ==========================================
  const disconnectNodes = useCallback(
    (nodesToDisconnect: Node[] | null = null) => {
      const targets = nodesToDisconnect && nodesToDisconnect.length ? nodesToDisconnect : selectedNodes();
      if (!targets.length) return;
      const ids = new Set(targets.map((n) => n.id));

      // กรองลบเฉพาะสายที่ต่อเข้าหรือออกจาก Node เหล่านี้ (ตัว Node ไม่ถูกลบ)
      setEdges((eds) => eds.filter((edge) => !ids.has(edge.source) && !ids.has(edge.target)));
    },
    [selectedNodes, setEdges]
  );

  // ==========================================
  // 8. การ INSPECT (เปิดแผงลอยปรับพารามิเตอร์)
  // ==========================================
  // 🎯 คำนวณจุดเกิดข้างขวาของ Node ห่าง 10px ไม่ทับบน Node
  const openInspectorForNode = useCallback((node: Node, index = 0) => {
    // 🔒 Block opening inspector modal when training is active
    if (isTraining) return;

    const nodeWidth = (node.measured?.width as number) || (typeof node.width === 'number' ? node.width : 270);
    const spawnX = node.position.x + nodeWidth + 10 + (index * 14);
    const spawnY = node.position.y + (index * 14);

    setInspectors((prev) => {
      const exists = prev.find((item) => item.nodeId === node.id);
      if (exists) {
        // ถ้าเปิดอยู่แล้ว ให้เลื่อนมาโฟกัสที่ตำแหน่งข้างขวาของ Node
        return prev.map((item) => (item.nodeId === node.id ? { ...item, x: spawnX, y: spawnY } : item));
      }
      // ถ้ายังไม่เปิด ให้เพิ่มหน้าต่างใหม่ ณ จุดเกิดข้างขวาของ Node
      return [...prev, { nodeId: node.id, x: spawnX, y: spawnY }];
    });
  }, [isTraining]);

  const moveInspector = useCallback((nodeId: string, pos: { x: number; y: number }) => {
    setInspectors((prev) =>
      prev.map((item) => (item.nodeId === nodeId ? { ...item, ...pos } : item))
    );
  }, []);

  const closeInspector = useCallback((nodeId: string) => {
    setInspectors((ins) => ins.filter((item) => item.nodeId !== nodeId));
  }, []);

  const updateNodeData = useCallback(
    (nodeId: string, keyOrObj: string | Record<string, any>, value?: any) => {
      if (isTraining) return;

      setNodes((nds) => {
        let updated = nds.map((n) => {
          if (n.id === nodeId) {
            const updates = typeof keyOrObj === 'object' ? keyOrObj : { [keyOrObj]: value };
            return {
              ...n,
              data: {
                ...n.data,
                ...updates,
              },
            };
          }
          return n;
        });

        // 🌟 Smart Pipeline Auto-Tune: When user selects/updates Preset, auto-tune all DAG nodes!
        const targetNode = nds.find((n) => n.id === nodeId);
        const targetType = targetNode?.data?.nodeType || targetNode?.type;
        const newPreset = typeof keyOrObj === 'object' ? keyOrObj.preset : (keyOrObj === 'preset' ? value : undefined);

        if (targetType === 'strategy_preset_return' && newPreset && STRATEGY_PRESET_CONFIGS[newPreset]) {
          updated = autoTunePipelineNodes(newPreset, updated);
        }

        syncArchitectureToEngine(updated);
        return updated;
      });
    },
    [isTraining, setNodes, syncArchitectureToEngine]
  );

  // 🖱️ Event เมื่อดับเบิลคลิกที่ Node
  const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.stopPropagation();
      // 🔒 Block opening inspector modal when training is active
      if (isTraining) return;
      openInspectorForNode(node);
    },
    [isTraining, openInspectorForNode]
  );

  const [viewportElement, setViewportElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const findViewport = () => {
      const el = document.querySelector('.react-flow__viewport') as HTMLElement | null;
      if (el) setViewportElement(el);
    };
    findViewport();
    const timer = setTimeout(findViewport, 50);
    return () => clearTimeout(timer);
  }, []);

  // ==========================================
  // 9. Right-Click Context Menus & Multi-Selection
  // ==========================================
  const onSelectionChange = useCallback(({ nodes: selectedNodesList }: { nodes: Node[] }) => {
    const selectedIds = new Set(selectedNodesList.map((n) => n.id));
    setNodes((nds) =>
      nds.map((n) => {
        const isSelected = selectedIds.has(n.id);
        if (n.selected !== isSelected) {
          return { ...n, selected: isSelected };
        }
        return n;
      })
    );
  }, [setNodes]);

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      // 🔒 Block context menu editing when training is active
      if (isTraining) return;

      // If right-clicked node is NOT in the selection, select only this node.
      // If it IS in the selection, keep the entire multi-selection intact!
      if (!node.selected) {
        setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === node.id })));
      }
      const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        flowPos,
        targetNodeId: node.id,
      });
    },
    [isTraining, screenToFlowPosition, setNodes]
  );

  const onPaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.preventDefault();
      // 🔒 Block context menu editing when training is active
      if (isTraining) return;

      const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        flowPos,
        targetNodeId: null,
      });
    },
    [isTraining, screenToFlowPosition]
  );

  // ✂️ Event เมื่อคลิกขวาที่เส้น Edge เพื่อตัดสายเชื่อมต่อทันที (Disconnect Edge)
  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      event.stopPropagation();
      setContextMenu(null);
      // 🔒 Block disconnecting edge when training is active
      if (isTraining) return;

      // ตัดสายสัญญาณนี้ทันที (Disconnect Edge)
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    },
    [isTraining, setEdges]
  );

  // Close context menu on click elsewhere or zoom/wheel scroll
  useEffect(() => {
    const handleDismiss = () => setContextMenu(null);
    window.addEventListener('click', handleDismiss);
    window.addEventListener('wheel', handleDismiss, { passive: true });
    return () => {
      window.removeEventListener('click', handleDismiss);
      window.removeEventListener('wheel', handleDismiss);
    };
  }, []);

  // Track Mouse Movement for Cursor-based Pasting
  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      mousePosRef.current = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    },
    [screenToFlowPosition]
  );

  // ==========================================
  // 10. Global Keyboard Shortcuts (Supports all keyboard layouts & codes)
  // ==========================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input / textarea / editable fields
      const activeEl = document.activeElement as HTMLElement | null;
      const targetEl = e.target as HTMLElement | null;
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(targetEl?.tagName || '') ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl?.tagName || '') ||
        targetEl?.isContentEditable ||
        activeEl?.isContentEditable
      ) {
        return;
      }

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      const code = e.code;

      if (isCmdOrCtrl && (code === 'KeyC' || key === 'c')) {
        e.preventDefault();
        copyNodes();
      } else if (isCmdOrCtrl && (code === 'KeyX' || key === 'x')) {
        e.preventDefault();
        cutNodes();
      } else if (isCmdOrCtrl && (code === 'KeyV' || key === 'v')) {
        e.preventDefault();
        pasteAt(mousePosRef.current);
      } else if (isCmdOrCtrl && (code === 'KeyD' || key === 'd')) {
        e.preventDefault();
        duplicateNodes();
      } else if (isCmdOrCtrl && (code === 'KeyK' || key === 'k')) {
        e.preventDefault();
        disconnectNodes();
      } else if (isCmdOrCtrl && (code === 'KeyA' || key === 'a')) {
        e.preventDefault();
        setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
      } else if (e.key === 'Delete' || e.key === 'Backspace' || code === 'Delete' || code === 'Backspace') {
        e.preventDefault();
        deleteNodes();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copyNodes, cutNodes, pasteAt, duplicateNodes, disconnectNodes, deleteNodes, setNodes]);

  // Drag-and-Drop from Palette onto Canvas
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);

  // Listen to custom Pointer-based Drag & Drop for 100% Theme-locked Mac Cursors
  useEffect(() => {
    const handleCustomDrop = (e: Event) => {
      // 🔒 Block dropping new nodes when training is active
      if (isTraining) return;

      const customEvent = e as CustomEvent<{ nodeType: string; clientX: number; clientY: number }>;
      if (
        !customEvent.detail ||
        !customEvent.detail.nodeType ||
        typeof customEvent.detail.clientX !== 'number' ||
        typeof customEvent.detail.clientY !== 'number'
      ) {
        return;
      }
      const { nodeType, clientX, clientY } = customEvent.detail;
      const position = screenToFlowPosition({ x: clientX, y: clientY });
      if (isNaN(position.x) || isNaN(position.y)) return;

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'nodeCard',
        position,
        data: {
          nodeType,
          execution: { status: 'queued', detail: 'Ready for execution' },
        },
      };
      setNodes((nds) => nds.concat(newNode));
      setIsDragOverCanvas(false);
    };

    const handleCustomHover = (e: Event) => {
      if (isTraining) return;
      const customEvent = e as CustomEvent<{ isOver: boolean }>;
      if (customEvent.detail) {
        setIsDragOverCanvas(Boolean(customEvent.detail.isOver));
      }
    };

    window.addEventListener('fxforge-drop-node', handleCustomDrop);
    window.addEventListener('fxforge-drag-hover', handleCustomHover);
    return () => {
      window.removeEventListener('fxforge-drop-node', handleCustomDrop);
      window.removeEventListener('fxforge-drag-hover', handleCustomHover);
    };
  }, [isTraining, screenToFlowPosition, setNodes]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (isTraining) return;
    event.dataTransfer.dropEffect = 'move';
    setIsDragOverCanvas(true);
  }, [isTraining]);

  const onDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOverCanvas(false);
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragOverCanvas(false);
      document.body.classList.remove('is-dragging-node');
      // 🔒 Block dropping new nodes when training is active
      if (isTraining) return;

      // Strict Boundary Check: Must cross divider line into Canvas
      const sidebarEl = document.querySelector('aside');
      const sidebarRect = sidebarEl?.getBoundingClientRect();
      const hasCrossedDivider = sidebarRect ? event.clientX > sidebarRect.right : true;
      if (!hasCrossedDivider) return;

      const nodeType = event.dataTransfer.getData('application/fxforge-node');
      if (!nodeType) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'nodeCard',
        position,
        data: {
          nodeType,
          execution: { status: 'queued', detail: 'Ready for execution' },
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  // Calculate connected node IDs dynamically in real-time
  const connectedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    edges.forEach((edge) => {
      ids.add(edge.source);
      ids.add(edge.target);
    });
    return ids;
  }, [edges]);

  // Inject isConnected into nodes data for NodeCard rendering
  const augmentedNodes = useMemo(() => {
    return nodes.map((node) => {
      const isConnected = connectedNodeIds.has(node.id);
      if (node.data?.isConnected === isConnected) return node;
      return {
        ...node,
        data: {
          ...node.data,
          isConnected,
        },
      };
    });
  }, [nodes, connectedNodeIds]);

  const activeNodesCount = useMemo(() => {
    return nodes.filter((n) => connectedNodeIds.has(n.id)).length;
  }, [nodes, connectedNodeIds]);

  // Only animate edges when RL training is actively running! When stopped/standby, edges are completely STATIC and STILL!
  const renderedEdges = useMemo(() => {
    return edges.map((e) => ({
      ...e,
      animated: isTraining,
    }));
  }, [edges, isTraining]);

  return (
    <div
      style={{
        boxShadow: isDragOverCanvas
          ? isLight
            ? 'inset 0 0 0 2.5px #0071e3, inset 0 0 30px rgba(0, 113, 227, 0.15)'
            : 'inset 0 0 0 2.5px #0a84ff, inset 0 0 40px rgba(10, 132, 255, 0.25)'
          : 'none',
        transition: 'box-shadow 0.2s ease',
      }}
      className={`w-full h-full relative overflow-hidden transition-colors duration-200 ${
        isLight ? 'bg-[#f5f5f7]' : 'bg-[#040407]'
      } ${isTraining ? 'is-training-locked' : ''}`}
      onMouseMove={onMouseMove}
      onDragLeave={onDragLeave}
      onContextMenu={(e) => e.preventDefault()}
    >
      <ReactFlow
        nodes={augmentedNodes}
        edges={renderedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeDragStart={() => {
          document.documentElement.classList.add('is-dragging-node');
          document.body.classList.add('is-dragging-node');
        }}
        onNodeDragStop={() => {
          document.documentElement.classList.remove('is-dragging-node');
          document.body.classList.remove('is-dragging-node');
        }}
        onSelectionChange={onSelectionChange}
        onSelectionStart={() => {
          document.documentElement.classList.add('is-selecting-canvas');
          document.body.classList.add('is-selecting-canvas');
        }}
        onSelectionEnd={() => {
          document.documentElement.classList.remove('is-selecting-canvas');
          document.body.classList.remove('is-selecting-canvas');
        }}
        onConnectStart={() => {
          document.documentElement.classList.add('is-connecting');
          document.body.classList.add('is-connecting');
        }}
        onConnectEnd={() => {
          document.documentElement.classList.remove('is-connecting');
          document.body.classList.remove('is-connecting');
        }}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onMoveStart={() => setContextMenu(null)}
        onPaneClick={() => setContextMenu(null)}
        onPaneScroll={() => setContextMenu(null)}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{
          stroke: isLight ? '#0071e3' : '#0a84ff',
          strokeWidth: 2.5,
          filter: isLight
            ? 'drop-shadow(0 0 8px rgba(0, 113, 227, 0.75))'
            : 'drop-shadow(0 0 10px rgba(10, 132, 255, 0.9))',
        }}
        nodesDraggable={!isTraining}
        nodesConnectable={!isTraining}
        elementsSelectable={!isTraining}
        deleteKeyCode={isTraining ? null : ['Backspace', 'Delete']}
        selectionOnDrag={!isTraining}
        selectionMode={SelectionMode.Partial}
        panOnDrag={[1, 2]}
        minZoom={0.4}
        maxZoom={1.8}
        fitView
        fitViewOptions={{ padding: 0.18, minZoom: 0.9, maxZoom: 1.15 }}
        noWheelClassName="nowheel"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.2}
          color={isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.06)'}
        />
        <Controls
          position="bottom-left"
          className={
            isLight
              ? 'bg-white/90 border border-black/[0.08] text-[#1d1d1f] fill-[#1d1d1f] rounded-lg shadow-lg'
              : 'bg-[#0f0f18] border border-white/[0.08] text-white fill-white rounded-lg shadow-xl'
          }
          showInteractive={false}
        />
        <MiniMap
          position="bottom-left"
          nodeColor={(n) => {
            const nodeType = n.data?.nodeType as string;
            const def = NODE_DEFS[nodeType];
            const group = GROUPS.find((g) => g.id === def?.group);
            return group?.color || (isLight ? '#0071e3' : '#0a84ff');
          }}
          nodeStrokeColor={isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.2)'}
          nodeStrokeWidth={1}
          nodeBorderRadius={5}
          maskColor={isLight ? 'rgba(240, 240, 245, 0.65)' : 'rgba(8, 8, 14, 0.72)'}
          maskStrokeColor={isLight ? '#0071e3' : '#0a84ff'}
          maskStrokeWidth={1.5}
          pannable={true}
          zoomable={true}
          style={{
            width: 175,
            height: 110,
            marginLeft: 52,
            borderRadius: '14px',
            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(16, 16, 24, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: isLight
              ? '0 12px 30px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.9) inset'
              : '0 16px 36px rgba(0, 0, 0, 0.55), 0 1px 0 rgba(255, 255, 255, 0.1) inset',
            border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.10)',
          }}
        />
      </ReactFlow>

      {/* Real-time Status Indicator (Top-Left, Clean Typography, Zero Capsule Frame) */}
      <div className="absolute top-4 left-5 z-10 flex items-center gap-2 select-none pointer-events-none">
        <div className="w-2 h-2 rounded-full bg-[#30d158] animate-pulse flex-shrink-0" />
        <span
          className={`text-[12px] font-semibold tracking-tight ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}
          style={{ fontFamily: 'var(--font-apple-text)' }}
        >
          {activeNodesCount} Nodes Active
        </span>
        {nodes.length > activeNodesCount && (
          <span
            className={`text-[11px] font-medium ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}
            style={{ fontFamily: 'var(--font-apple-text)' }}
          >
            ({nodes.length - activeNodesCount} Idle)
          </span>
        )}
      </div>

      {/* Floating Right-Click Context Menu (Apple Native Context Menu, Pure Glow Text, Zero Background Capsule) */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: Math.min(contextMenu.y, window.innerHeight - 260),
            left: Math.min(contextMenu.x, window.innerWidth - 240),
            zIndex: 100,
            minWidth: contextMenu.targetNodeId ? '190px' : '150px',
            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(20, 20, 28, 0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '4px',
            borderRadius: '8px',
            border: isLight ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: isLight
              ? '0 12px 30px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.06)'
              : '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 1px rgba(255, 255, 255, 0.2)',
          }}
          className={`text-xs select-none animate-in fade-in duration-75 flex flex-col gap-0.5 ${
            isLight ? 'text-[#111827]' : 'text-slate-200'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.targetNodeId ? (
            <>
              {/* Duplicate */}
              <button
                onClick={() => {
                  const targets = selectedNodes(contextMenu.targetNodeId);
                  duplicateNodes(targets.length ? targets : null);
                  setContextMenu(null);
                }}
                className={`group w-full px-2 py-1.5 rounded-none bg-transparent hover:bg-transparent flex items-center justify-between transition-colors text-left ${
                  isLight
                    ? 'text-[#111827] hover:text-[#d97706]'
                    : 'text-white/90 hover:text-[#ffd60a]'
                }`}
                style={{ cursor: 'var(--mac-cursor-default)' }}
              >
                <span className="flex items-center gap-2 text-[12px] font-medium">
                  <LucideIcons.CopyPlus size={13.5} className="text-[#ffd60a] flex-shrink-0 group-hover:drop-shadow-[0_0_6px_rgba(255,214,10,0.6)]" />
                  <span className="group-hover:drop-shadow-[0_0_6px_rgba(255,214,10,0.6)]">Duplicate</span>
                </span>
                <span className={`text-[11px] font-sans font-medium pl-3 flex-shrink-0 transition-colors ${
                  isLight ? 'text-black/40 group-hover:text-[#d97706]' : 'text-white/40 group-hover:text-[#ffd60a]'
                }`}>
                  Ctrl+D
                </span>
              </button>

              {/* Copy (Matching Paste with Blue Icon and White/Blue Typography) */}
              <button
                onClick={() => {
                  const targets = selectedNodes(contextMenu.targetNodeId);
                  copyNodes(targets.length ? targets : null);
                  setContextMenu(null);
                }}
                className={`group w-full px-2 py-1.5 rounded-none bg-transparent hover:bg-transparent flex items-center justify-between transition-colors text-left ${
                  isLight
                    ? 'text-[#111827] hover:text-[#0071e3]'
                    : 'text-white/90 hover:text-[#0a84ff]'
                }`}
                style={{ cursor: 'var(--mac-cursor-default)' }}
              >
                <span className="flex items-center gap-2 text-[12px] font-medium">
                  <LucideIcons.Copy
                    size={13.5}
                    className={`${isLight ? 'text-[#0071e3]' : 'text-[#0a84ff]'} flex-shrink-0 group-hover:drop-shadow-[0_0_6px_rgba(10,132,255,0.6)]`}
                  />
                  <span className="group-hover:drop-shadow-[0_0_6px_rgba(10,132,255,0.6)]">Copy</span>
                </span>
                <span className={`text-[11px] font-sans font-medium pl-3 flex-shrink-0 transition-colors ${
                  isLight ? 'text-black/40 group-hover:text-[#0071e3]' : 'text-white/40 group-hover:text-[#0a84ff]'
                }`}>
                  Ctrl+C
                </span>
              </button>

              {/* Cut (Matching Paste with Blue Icon and White/Blue Typography) */}
              <button
                onClick={() => {
                  const targets = selectedNodes(contextMenu.targetNodeId);
                  cutNodes(targets.length ? targets : null);
                  setContextMenu(null);
                }}
                className={`group w-full px-2 py-1.5 rounded-none bg-transparent hover:bg-transparent flex items-center justify-between transition-colors text-left ${
                  isLight
                    ? 'text-[#111827] hover:text-[#0071e3]'
                    : 'text-white/90 hover:text-[#0a84ff]'
                }`}
                style={{ cursor: 'var(--mac-cursor-default)' }}
              >
                <span className="flex items-center gap-2 text-[12px] font-medium">
                  <LucideIcons.Scissors
                    size={13.5}
                    className={`${isLight ? 'text-[#0071e3]' : 'text-[#0a84ff]'} flex-shrink-0 group-hover:drop-shadow-[0_0_6px_rgba(10,132,255,0.6)]`}
                  />
                  <span className="group-hover:drop-shadow-[0_0_6px_rgba(10,132,255,0.6)]">Cut</span>
                </span>
                <span className={`text-[11px] font-sans font-medium pl-3 flex-shrink-0 transition-colors ${
                  isLight ? 'text-black/40 group-hover:text-[#0071e3]' : 'text-white/40 group-hover:text-[#0a84ff]'
                }`}>
                  Ctrl+X
                </span>
              </button>

              {/* Paste (Grayed out if clipboard is empty) */}
              <button
                disabled={!hasClipboard}
                onClick={() => {
                  if (!hasClipboard) return;
                  pasteAt(contextMenu.flowPos);
                  setContextMenu(null);
                }}
                style={{ cursor: hasClipboard ? 'var(--mac-cursor-default)' : 'not-allowed' }}
                className={`group w-full px-2 py-1.5 rounded-none bg-transparent hover:bg-transparent flex items-center justify-between transition-colors text-left ${
                  !hasClipboard
                    ? isLight
                      ? 'opacity-35 text-black/30 cursor-not-allowed pointer-events-none'
                      : 'opacity-35 text-white/30 cursor-not-allowed pointer-events-none'
                    : isLight
                    ? 'text-[#111827] hover:text-[#0071e3]'
                    : 'text-white/90 hover:text-[#0a84ff]'
                }`}
              >
                <span className="flex items-center gap-2 text-[12px] font-medium">
                  <LucideIcons.ClipboardPaste
                    size={13.5}
                    className={`${
                      !hasClipboard
                        ? isLight
                          ? 'text-black/30'
                          : 'text-white/30'
                        : isLight
                        ? 'text-[#0071e3]'
                        : 'text-[#0a84ff]'
                    } flex-shrink-0 ${hasClipboard ? 'group-hover:drop-shadow-[0_0_6px_rgba(10,132,255,0.6)]' : ''}`}
                  />
                  <span className={hasClipboard ? 'group-hover:drop-shadow-[0_0_6px_rgba(10,132,255,0.6)]' : ''}>Paste</span>
                </span>
                <span
                  className={`text-[11px] font-sans font-medium pl-3 flex-shrink-0 transition-colors ${
                    !hasClipboard
                      ? isLight
                        ? 'text-black/20'
                        : 'text-white/20'
                      : isLight
                      ? 'text-black/40 group-hover:text-[#0071e3]'
                      : 'text-white/40 group-hover:text-[#0a84ff]'
                  }`}
                >
                  Ctrl+V
                </span>
              </button>

              {/* Divider */}
              <div className={`my-1 border-t mx-1 ${isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'}`} />

              {/* Disconnect */}
              <button
                onClick={() => {
                  const targets = selectedNodes(contextMenu.targetNodeId);
                  disconnectNodes(targets.length ? targets : null);
                  setContextMenu(null);
                }}
                className={`group w-full px-2 py-1.5 rounded-none bg-transparent hover:bg-transparent flex items-center justify-between transition-colors text-left ${
                  isLight
                    ? 'text-[#111827] hover:text-[#ff9f0a]'
                    : 'text-white/90 hover:text-[#ff9f0a]'
                }`}
                style={{ cursor: 'var(--mac-cursor-default)' }}
              >
                <span className="flex items-center gap-2 text-[12px] font-medium">
                  <LucideIcons.Unlink size={13.5} className="text-[#ff9f0a] flex-shrink-0 group-hover:drop-shadow-[0_0_6px_rgba(255,159,10,0.6)]" />
                  <span className="group-hover:drop-shadow-[0_0_6px_rgba(255,159,10,0.6)]">Disconnect Edges</span>
                </span>
                <span className={`text-[11px] font-sans font-medium pl-3 flex-shrink-0 transition-colors ${
                  isLight ? 'text-black/40 group-hover:text-[#ff9f0a]' : 'text-white/40 group-hover:text-[#ff9f0a]'
                }`}>
                  Ctrl+K
                </span>
              </button>

              {/* Delete */}
              <button
                onClick={() => {
                  const targets = selectedNodes(contextMenu.targetNodeId);
                  deleteNodes(targets.length ? targets : null);
                  setContextMenu(null);
                }}
                className={`group w-full px-2 py-1.5 rounded-none bg-transparent hover:bg-transparent flex items-center justify-between transition-colors text-left ${
                  isLight
                    ? 'text-[#111827] hover:text-[#ff453a]'
                    : 'text-white/90 hover:text-[#ff453a]'
                }`}
                style={{ cursor: 'var(--mac-cursor-default)' }}
              >
                <span className="flex items-center gap-2 text-[12px] font-medium">
                  <LucideIcons.Trash2 size={13.5} className="text-[#ff453a] flex-shrink-0 group-hover:drop-shadow-[0_0_6px_rgba(255,69,58,0.6)]" />
                  <span className="group-hover:drop-shadow-[0_0_6px_rgba(255,69,58,0.6)]">Delete</span>
                </span>
                <span className={`text-[11px] font-sans font-medium pl-3 flex-shrink-0 transition-colors ${
                  isLight ? 'text-black/40 group-hover:text-[#ff453a]' : 'text-white/40 group-hover:text-[#ff453a]'
                }`}>
                  Del
                </span>
              </button>
            </>
          ) : (
            /* Paste Here (Grayed out if clipboard is empty, Zero Hover Background) */
            <button
              disabled={!hasClipboard}
              onClick={() => {
                if (!hasClipboard) return;
                pasteAt(contextMenu.flowPos);
                setContextMenu(null);
              }}
              style={{ cursor: hasClipboard ? 'var(--mac-cursor-default)' : 'not-allowed' }}
              className={`w-full px-2 py-1.5 rounded-none bg-transparent hover:bg-transparent flex items-center justify-between transition-colors text-left ${
                !hasClipboard
                  ? isLight
                    ? 'opacity-35 text-black/30 cursor-not-allowed pointer-events-none'
                    : 'opacity-35 text-white/30 cursor-not-allowed pointer-events-none'
                  : isLight
                  ? 'text-[#111827] hover:text-[#0071e3]'
                  : 'text-white/90 hover:text-[#0a84ff]'
              }`}
            >
              <span className="flex items-center gap-2 text-[12px] font-medium">
                <LucideIcons.ClipboardPaste
                  size={13.5}
                  className={`${
                    !hasClipboard
                      ? isLight
                        ? 'text-black/30'
                        : 'text-white/30'
                      : isLight
                      ? 'text-[#0071e3]'
                      : 'text-[#0a84ff]'
                  } flex-shrink-0`}
                />
                <span>Paste Here</span>
              </span>
              <span
                className={`text-[11px] font-sans font-medium pl-3 flex-shrink-0 ${
                  !hasClipboard
                    ? isLight
                      ? 'text-black/20'
                      : 'text-white/20'
                    : isLight
                    ? 'text-black/40'
                    : 'text-white/40'
                }`}
              >
                Ctrl+V
              </span>
            </button>
          )}
        </div>
      )}

        {/* Floating Parameter Inspectors (Rendered on Canvas Layer via Portal) */}
        {viewportElement &&
          createPortal(
            inspectors.map((insp) => {
              const node = nodes.find((n) => n.id === insp.nodeId);
              if (!node) return null;

              return (
                <FloatingInspector
                  key={insp.nodeId}
                  node={node}
                  position={{ x: insp.x, y: insp.y }}
                  onPositionChange={(pos) => moveInspector(insp.nodeId, pos)}
                  onClose={() => closeInspector(insp.nodeId)}
                  toLocal={(cx, cy) => screenToFlowPosition({ x: cx, y: cy })}
                  updateNodeData={updateNodeData}
                  deleteNode={() => {
                    closeInspector(insp.nodeId);
                    deleteNodes([node]);
                  }}
                />
              );
            }),
            viewportElement
          )}
      </div>
  );
};

export interface FlowCanvasViewProps {
  isTraining?: boolean;
}

export const FlowCanvasView: React.FC<FlowCanvasViewProps> = ({ isTraining = false }) => {
  return (
    <ReactFlowProvider>
      <FlowContent isTraining={isTraining} />
    </ReactFlowProvider>
  );
};
