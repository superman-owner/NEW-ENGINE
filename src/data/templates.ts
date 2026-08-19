import type { Node, Edge } from '@xyflow/react';

export interface PipelineTemplate {
  id: string;
  name: string;
  badge: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
}

export const TEMPLATES: PipelineTemplate[] = [
  {
    id: 'bpnn_quant_alpha',
    name: '1. BPNN 4-Layer Alpha Strategy (5➔6➔6➔3)',
    badge: 'Deep Learning',
    description: '5-Pillar Features to 4-Layer Backpropagation Neural Network & MT5 Bot',
    nodes: [
      {
        id: 'node-data-1',
        type: 'customTrading',
        position: { x: 80, y: 160 },
        data: {
          nodeId: 'mt5_binance_feed',
          title: 'MT5 / Binance Feed',
          category: 'data',
          icon: 'Globe',
          status: 'completed',
          params: {
            broker: 'MT5 / Binance',
            symbol: 'BTC/USDT',
            timeframe: 'M15',
            spreadMaxPips: 2.5,
            barsHistory: 50000,
          },
        },
      },
      {
        id: 'node-feature-1',
        type: 'customTrading',
        position: { x: 340, y: 160 },
        data: {
          nodeId: 'tech_indicators',
          title: 'Technical Indicators',
          category: 'feature',
          icon: 'Sparkles',
          status: 'completed',
          params: {
            returnPeriods: [5, 10, 20],
            rsiPeriod: 14,
            macdFast: 12,
            macdSlow: 26,
            atrPeriod: 14,
          },
        },
      },
      {
        id: 'node-model-1',
        type: 'customTrading',
        position: { x: 600, y: 160 },
        data: {
          nodeId: 'standalone_bpnn_mql5',
          title: 'Standalone BPNN',
          category: 'model',
          icon: 'Zap',
          status: 'running',
          params: {
            topology: '5x6x6x3',
            trainingAlgorithm: 'Rprop_Plus',
            activationFunction: 'Tanh_Softmax',
            mqlExportHeader: true,
          },
        },
      },
      {
        id: 'node-exec-1',
        type: 'customTrading',
        position: { x: 860, y: 160 },
        data: {
          nodeId: 'mt5_live_bot',
          title: 'MT5 Live Bot (ONNX)',
          category: 'execution',
          icon: 'Rocket',
          status: 'completed',
          params: {
            expertAdvisorName: 'AlphaFlow_BPNN_v1',
            onnxBatchSize: 1,
            targetMqlDirectory: 'MT5/MQL5/Experts/AlphaFlow',
            autoHotReload: true,
          },
        },
      },
    ],
    edges: [
      {
        id: 'e1-2',
        source: 'node-data-1',
        target: 'node-feature-1',
        animated: true,
        style: { stroke: '#0a84ff', strokeWidth: 1.8 },
      },
      {
        id: 'e2-3',
        source: 'node-feature-1',
        target: 'node-model-1',
        animated: true,
        style: { stroke: '#0a84ff', strokeWidth: 1.8 },
      },
      {
        id: 'e3-4',
        source: 'node-model-1',
        target: 'node-exec-1',
        animated: true,
        style: { stroke: '#0a84ff', strokeWidth: 1.8 },
      },
    ],
  },
  {
    id: 'lgbm_triple_barrier',
    name: '2. LightGBM + Triple Barrier Alpha',
    badge: 'Institutional Grade',
    description: 'Triple-Barrier labeling with Purged Walk-Forward CV & LightGBM',
    nodes: [
      {
        id: 'node-data-1',
        type: 'customTrading',
        position: { x: 60, y: 160 },
        data: {
          nodeId: 'binance_feed',
          title: 'Binance Feed',
          category: 'data',
          icon: 'Layers',
          status: 'completed',
          params: {
            symbol: 'BTC/USDT',
            timeframe: '15m',
            limit: 50000,
            lookbackDays: 180,
          },
        },
      },
      {
        id: 'node-feature-1',
        type: 'customTrading',
        position: { x: 280, y: 60 },
        data: {
          nodeId: 'tech_indicators',
          title: 'Indicators',
          category: 'feature',
          icon: 'Sliders',
          status: 'completed',
          params: {
            rsiPeriod: 14,
            macdFast: 12,
            macdSlow: 26,
            atrPeriod: 14,
          },
        },
      },
      {
        id: 'node-feature-2',
        type: 'customTrading',
        position: { x: 280, y: 260 },
        data: {
          nodeId: 'fractional_diff',
          title: 'Fractional Diff',
          category: 'feature',
          icon: 'GitCommit',
          status: 'error', //  Demonstration of Error State (Red Cross Mark)
          params: {
            d_order: 0.45,
            threshold: 0.0001,
          },
        },
      },
      {
        id: 'node-label-1',
        type: 'customTrading',
        position: { x: 500, y: 160 },
        data: {
          nodeId: 'triple_barrier',
          title: 'Triple Barrier',
          category: 'label',
          icon: 'Target',
          status: 'completed',
          params: {
            ptMultiplier: 2.0,
            slMultiplier: 1.5,
            verticalBarrierBars: 24,
          },
        },
      },
      {
        id: 'node-model-1',
        type: 'customTrading',
        position: { x: 720, y: 160 },
        data: {
          nodeId: 'lightgbm_model',
          title: 'LightGBM AI',
          category: 'model',
          icon: 'Cpu',
          status: 'completed',
          params: {
            nEstimators: 600,
            learningRate: 0.03,
            maxDepth: 6,
            objective: 'binary',
          },
        },
      },
      {
        id: 'node-backtest-1',
        type: 'customTrading',
        position: { x: 940, y: 160 },
        data: {
          nodeId: 'vector_backtest',
          title: 'Backtest',
          category: 'backtest',
          icon: 'TrendingUp',
          status: 'completed',
          params: {
            initialCapital: 10000,
            takerFee: 0.0004,
            slippageBps: 2.5,
          },
        },
      },
      {
        id: 'node-export-1',
        type: 'customTrading',
        position: { x: 1160, y: 160 },
        data: {
          nodeId: 'python_bot_export',
          title: 'Live Bot',
          category: 'export',
          icon: 'FileCode',
          status: 'idle',
          params: {
            exchange: 'binance_futures',
            runMode: 'paper_trade',
            killSwitchMaxDD: 8.0,
          },
        },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'node-data-1', target: 'node-feature-1', sourceHandle: 'out_true', targetHandle: 'in', animated: true, style: { stroke: '#30d158', strokeWidth: 1.8 } },
      { id: 'e1-3', source: 'node-data-1', target: 'node-feature-2', sourceHandle: 'out_true', targetHandle: 'in', animated: true, style: { stroke: '#ff453a', strokeWidth: 1.8 } },
      { id: 'e1-4', source: 'node-data-1', target: 'node-label-1', sourceHandle: 'out_true', targetHandle: 'in', animated: true, style: { stroke: '#30d158', strokeWidth: 1.8 } },
      { id: 'e2-5', source: 'node-feature-1', target: 'node-model-1', sourceHandle: 'out_true', targetHandle: 'in', animated: true, style: { stroke: '#30d158', strokeWidth: 1.8 } },
      { id: 'e4-5', source: 'node-label-1', target: 'node-model-1', sourceHandle: 'out_true', targetHandle: 'in', animated: true, style: { stroke: '#30d158', strokeWidth: 1.8 } },
      { id: 'e5-6', source: 'node-model-1', target: 'node-backtest-1', sourceHandle: 'out_true', targetHandle: 'in', animated: true, style: { stroke: '#30d158', strokeWidth: 1.8 } },
      { id: 'e6-7', source: 'node-backtest-1', target: 'node-export-1', sourceHandle: 'out_true', targetHandle: 'in', animated: false, style: { stroke: 'rgba(255,255,255,0.25)', strokeWidth: 1.8 } },
    ],
  },
  {
    id: 'lstm_deep_sequence',
    name: '2. PyTorch Neural Sequence (LSTM)',
    badge: 'Deep Learning',
    description: 'Multi-scale sequence modeling with Lookback Window of 60 bars',
    nodes: [
      {
        id: 'node-data-1',
        type: 'customTrading',
        position: { x: 80, y: 160 },
        data: {
          nodeId: 'bybit_feed',
          title: 'Bybit Feed',
          category: 'data',
          icon: 'Activity',
          status: 'completed',
          params: { symbol: 'ETHUSDT.P', timeframe: '1h', limit: 30000 },
        },
      },
      {
        id: 'node-feature-1',
        type: 'customTrading',
        position: { x: 360, y: 160 },
        data: {
          nodeId: 'tech_indicators',
          title: 'Indicators',
          category: 'feature',
          icon: 'Sliders',
          status: 'completed',
          params: { indicators: ['RSI', 'MACD', 'ATR', 'EMA_20', 'EMA_50'] },
        },
      },
      {
        id: 'node-model-1',
        type: 'customTrading',
        position: { x: 640, y: 160 },
        data: {
          nodeId: 'pytorch_lstm',
          title: 'PyTorch LSTM',
          category: 'model',
          icon: 'Boxes',
          status: 'completed',
          params: { lookbackSeq: 60, hiddenDim: 128, numLayers: 2, epochs: 80 },
        },
      },
      {
        id: 'node-backtest-1',
        type: 'customTrading',
        position: { x: 920, y: 160 },
        data: {
          nodeId: 'vector_backtest',
          title: 'Backtest',
          category: 'backtest',
          icon: 'TrendingUp',
          status: 'completed',
          params: { initialCapital: 10000, takerFee: 0.0004 },
        },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'node-data-1', target: 'node-feature-1', sourceHandle: 'out_true', targetHandle: 'in', animated: true, style: { stroke: '#30d158', strokeWidth: 1.8 } },
      { id: 'e2-3', source: 'node-feature-1', target: 'node-model-1', sourceHandle: 'out_true', targetHandle: 'in', animated: true, style: { stroke: '#30d158', strokeWidth: 1.8 } },
      { id: 'e3-4', source: 'node-model-1', target: 'node-backtest-1', sourceHandle: 'out_true', targetHandle: 'in', animated: true, style: { stroke: '#30d158', strokeWidth: 1.8 } },
    ],
  },
];
