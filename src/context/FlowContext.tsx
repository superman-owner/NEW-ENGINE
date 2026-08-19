import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { fxforgeEngine } from '../services/fxforgeEngine';

export interface ArchitectureSpec {
  symbol: string;
  timeframe: string;
  barsCount: number;
  strategyPreset: string;
  totalEpisodes: number;
  
  // Output & Deployment Target Configuration
  targetFolder: string;
  opsetVersion: number;
  exportName: string;

  // Layer dimensions
  inputDimension: number;
  inputLabels: string[];
  hidden1Units: number;
  hidden1Activation: string;
  hidden2Units: number;
  hidden2Activation: string;
  outputClasses: string[];

  // Regularization & Mechanics
  hasDropout: boolean;
  dropoutRate: number;
  hasLayerNorm: boolean;
  hasL2Decay: boolean;
  l2DecayRate: number;
  hasResidual: boolean;

  // Reward parameters
  spreadPips: number;
  inactivityPenalty: number;
  entropyBeta: number;
}

export const DEFAULT_ARCHITECTURE_SPEC: ArchitectureSpec = {
  symbol: 'XAUUSD',
  timeframe: 'M15',
  barsCount: 10000,
  strategyPreset: 'Standard Quant',
  totalEpisodes: 400,
  targetFolder: 'MQL5/Files/',
  opsetVersion: 14,
  exportName: 'rl_trading_model.onnx',
  inputDimension: 6,
  inputLabels: ['Ret (5d)', 'Ret (10d)', 'Ret (20d)', 'Vol (10d)', 'Dist SMA', 'Position'],
  hidden1Units: 64,
  hidden1Activation: 'LeakyReLU',
  hidden2Units: 32,
  hidden2Activation: 'LeakyReLU',
  outputClasses: ['BUY', 'HOLD', 'SELL'],
  hasDropout: true,
  dropoutRate: 0.15,
  hasLayerNorm: true,
  hasL2Decay: true,
  l2DecayRate: 0.0001,
  hasResidual: true,
  spreadPips: 0.15,
  inactivityPenalty: 0.0005,
  entropyBeta: 0.08,
};

interface FlowContextType {
  nodes: Node[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  architectureSpec: ArchitectureSpec;
  syncArchitectureToEngine: (nodesList: Node[]) => void;
}

const FlowContext = createContext<FlowContextType | null>(null);

export function parseArchitecturePure(nodesList: Node[]): ArchitectureSpec {
  let spec = { ...DEFAULT_ARCHITECTURE_SPEC };
  if (!Array.isArray(nodesList)) return spec;

  nodesList.forEach((node) => {
    const type = node.data?.nodeType || node.type;
    const d = (node.data || {}) as Record<string, any>;

    switch (type) {
      case 'strategy_preset_return':
        if (d.symbol) spec.symbol = String(d.symbol);
        if (d.timeframe) spec.timeframe = String(d.timeframe);
        if (d.bars_count) spec.barsCount = Number(d.bars_count) || 10000;
        if (d.preset) spec.strategyPreset = String(d.preset);
        break;

      case 'lookback_returns_window':
        if (d.lookbacks) {
          const lbs = String(d.lookbacks).split(',').map((x) => x.trim()).filter(Boolean);
          if (lbs.length > 0) {
            spec.inputLabels = lbs.map((lb) => `Ret (${lb}d)`).concat(['Vol (10d)', 'Dist SMA', 'Position']);
            spec.inputDimension = spec.inputLabels.length;
          }
        }
        break;

      case 'training_episodes_config':
        if (d.target_episodes !== undefined && d.target_episodes !== null && String(d.target_episodes).trim() !== '') {
          const rawVal = String(d.target_episodes).replace(/,/g, '').trim();
          spec.totalEpisodes = Number(rawVal) || 400;
        } else if (d.checkpoint_interval !== undefined && d.checkpoint_interval !== null) {
          spec.totalEpisodes = Number(d.checkpoint_interval) || 400;
        }
        break;

      case 'fc1_dense_expansion':
        if (d.units) spec.hidden1Units = Number(d.units) || 64;
        if (d.activation) spec.hidden1Activation = String(d.activation);
        break;

      case 'spatial_dropout':
        spec.hasDropout = d.executionMode !== 'off';
        if (d.rate !== undefined) spec.dropoutRate = Number(d.rate) || 0.15;
        break;

      case 'layer_normalization':
        spec.hasLayerNorm = d.executionMode !== 'off';
        break;

      case 'l2_weight_decay':
        spec.hasL2Decay = d.executionMode !== 'off';
        if (d.decay !== undefined) spec.l2DecayRate = Number(d.decay) || 0.0001;
        break;

      case 'fc2_bottleneck_synthesizer':
        if (d.units) spec.hidden2Units = Number(d.units) || 32;
        if (d.activation) spec.hidden2Activation = String(d.activation);
        if (d.residual !== undefined) spec.hasResidual = Boolean(d.residual);
        break;

      case 'friction_spread_cost':
        if (d.spread_pip !== undefined || d.spread_pips !== undefined) {
          spec.spreadPips = Number(d.spread_pip ?? d.spread_pips) || 1.2;
        }
        break;

      case 'anti_inactivity_reward':
        if (d.idle_penalty !== undefined || d.inactivity_penalty !== undefined) {
          spec.inactivityPenalty = Math.abs(Number(d.idle_penalty ?? d.inactivity_penalty)) || 0.0005;
        }
        break;

      case 'fc3_policy_action_head':
        if (d.entropy_beta !== undefined) spec.entropyBeta = Number(d.entropy_beta) || 0.08;
        break;

      case 'onnx_mt5_compiler':
      case 'export_onnx_compiler':
        if (d.target_folder !== undefined || d.targetFolder !== undefined) {
          spec.targetFolder = String(d.target_folder ?? d.targetFolder);
        }
        if (d.opset !== undefined || d.opset_version !== undefined || d.opsetVersion !== undefined) {
          spec.opsetVersion = Number(d.opset ?? d.opset_version ?? d.opsetVersion) || 14;
        }
        if (d.export_name !== undefined || d.exportName !== undefined) {
          spec.exportName = String(d.export_name ?? d.exportName);
        }
        break;

      default:
        break;
    }
  });

  return spec;
}

export const FlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nodes, setNodes] = useState<Node[]>(() => {
    try {
      const saved = localStorage.getItem('fxforge_flow_nodes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  const [edges, setEdges] = useState<Edge[]>([]);
  const [architectureSpec, setArchitectureSpec] = useState<ArchitectureSpec>(() => {
    try {
      const saved = localStorage.getItem('fxforge_flow_nodes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parseArchitecturePure(parsed);
        }
      }
    } catch {}
    return DEFAULT_ARCHITECTURE_SPEC;
  });

  const parseArchitecture = useCallback((nodesList: Node[]): ArchitectureSpec => {
    return parseArchitecturePure(nodesList);
  }, []);

  const syncArchitectureToEngine = useCallback((nodesList: Node[]) => {
    const spec = parseArchitecture(nodesList);
    setArchitectureSpec((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(spec)) return prev;
      return spec;
    });

    // Synchronize parameters into the active deep RL simulation engine
    fxforgeEngine.updateConfig({
      symbol: spec.symbol,
      primaryTimeframe: spec.timeframe,
      targetEpisodes: spec.totalEpisodes,
      spreadPips: spec.spreadPips,
      inactivityPenalty: spec.inactivityPenalty,
      entropyCoef: spec.entropyBeta,
      hidden1Units: spec.hidden1Units,
      hidden1Activation: spec.hidden1Activation,
      hidden2Units: spec.hidden2Units,
      hidden2Activation: spec.hidden2Activation,
      hasResidual: spec.hasResidual,
      hasDropout: spec.hasDropout,
      dropoutRate: spec.dropoutRate,
      hasLayerNorm: spec.hasLayerNorm,
      hasL2Decay: spec.hasL2Decay,
    });
  }, [parseArchitecture]);

  const value = useMemo(
    () => ({
      nodes,
      edges,
      setNodes,
      setEdges,
      architectureSpec,
      syncArchitectureToEngine,
    }),
    [nodes, edges, architectureSpec, syncArchitectureToEngine]
  );

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
};

export const useFlow = () => {
  const context = useContext(FlowContext);
  if (!context) {
    throw new Error('useFlow must be used within a FlowProvider');
  }
  return context;
};
