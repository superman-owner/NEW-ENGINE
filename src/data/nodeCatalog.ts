import type { TradingNodeConfig } from '../types/flow';

export const SOCKET_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  dataframe: { bg: '#64d2ff', border: '#38bdf8', text: '#64d2ff' }, // Apple Cyan
  features: { bg: '#ff9f0a', border: '#f59e0b', text: '#ff9f0a' },  // Apple Orange
  labels: { bg: '#ffd60a', border: '#eab308', text: '#ffd60a' },    // Apple Yellow
  model: { bg: '#bf5af2', border: '#a855f7', text: '#bf5af2' },     // Apple Purple
  backtest: { bg: '#30d158', border: '#10b981', text: '#30d158' },  // Apple Green
  signal: { bg: '#0a84ff', border: '#0284c7', text: '#0a84ff' },    // Apple Blue
  export: { bg: '#ff375f', border: '#ff453a', text: '#ff375f' },    // Apple Rose
};

export interface CatalogGroup {
  id: string;
  name: string;
  accentColor: string;
  icon: string;
  nodeIds: string[];
}

export const CATALOG_GROUPS: CatalogGroup[] = [
  {
    id: 'data',
    name: '1. DATA INGESTION',
    accentColor: '#64d2ff', // Cyan
    icon: 'Download',
    nodeIds: [
      'mt5_binance_feed',
      'synthetic_data_lab',
      'multi_tf_sync',
      'order_flow_imbalance',
    ],
  },
  {
    id: 'feature',
    name: '2. FEATURE ENGINEERING',
    accentColor: '#ff9f0a', // Orange
    icon: 'Cog',
    nodeIds: [
      'tech_indicators',
      'fractional_diff',
      'feature_normalizer',
      'market_regime_filter',
      'wavelet_denoising',
    ],
  },
  {
    id: 'reward',
    name: '3. REWARD & SHAPING',
    accentColor: '#ffd60a', // Yellow
    icon: 'Target',
    nodeIds: [
      'triple_barrier_method',
      'anti_inactivity_penalty',
      'spread_friction_cost',
    ],
  },
  {
    id: 'model',
    name: '4. AI & ML MODELS',
    accentColor: '#bf5af2', // Purple
    icon: 'Brain',
    nodeIds: [
      'deep_rl_ppo',
      'lightgbm_model',
      'standalone_bpnn_mql5',
    ],
  },
  {
    id: 'execution',
    name: '5. VALIDATION & DEPLOY',
    accentColor: '#30d158', // Green
    icon: 'Rocket',
    nodeIds: [
      'monte_carlo_stress_test',
      'walk_forward_robustness',
      'backtest_telemetry',
      'dynamic_risk_manager',
      'mt5_live_bot',
    ],
  },
];

export const NODE_CATALOG: TradingNodeConfig[] = [
  // 1. DATA INGESTION
  {
    id: 'mt5_binance_feed',
    category: 'data',
    title: 'MT5 / Binance Feed',
    subtitle: 'Real-time M15 Bars & Spread',
    icon: 'Globe',
    inputs: [],
    outputs: [{ id: 'out_df', label: 'M15 Bars', type: 'dataframe' }],
    params: {
      broker: 'MT5 / Binance',
      symbol: 'BTC/USDT',
      timeframe: 'M15',
      spreadMaxPips: 2.5,
      barsHistory: 50000,
    },
  },
  {
    id: 'synthetic_data_lab',
    category: 'data',
    title: 'Synthetic Data Lab',
    subtitle: 'GBM & Jump Diffusion',
    icon: 'FlaskConical',
    inputs: [],
    outputs: [{ id: 'out_df', label: 'Synthetic Series', type: 'dataframe' }],
    params: {
      processType: 'JumpDiffusion',
      drift: 0.05,
      volatility: 0.25,
      jumpIntensity: 0.1,
    },
  },
  {
    id: 'multi_tf_sync',
    category: 'data',
    title: 'Multi-Timeframe Sync',
    subtitle: 'Align M5, M15, H1, H4',
    icon: 'Clock',
    inputs: [{ id: 'in_df', label: 'Raw Bars', type: 'dataframe' }],
    outputs: [{ id: 'out_df', label: 'Aligned Data', type: 'dataframe' }],
    params: {
      timeframes: ['M5', 'M15', 'H1', 'H4'],
      alignmentMode: 'RightClose',
    },
  },
  {
    id: 'order_flow_imbalance',
    category: 'data',
    title: 'Order Flow Imbalance',
    subtitle: 'VPIN & Volume Delta',
    icon: 'BarChart2',
    inputs: [{ id: 'in_df', label: 'OrderBook Stream', type: 'dataframe' }],
    outputs: [{ id: 'out_features', label: 'OFI Features', type: 'features' }],
    params: {
      bucketVolume: 500,
      vpinThreshold: 0.75,
      deltaWindowSec: 60,
    },
  },

  // 2. FEATURE ENGINEERING
  {
    id: 'tech_indicators',
    category: 'feature',
    title: 'Technical Indicators',
    subtitle: 'Returns 5,10,20 & ATR',
    icon: 'Sparkles',
    inputs: [{ id: 'in_df', label: 'Market Data', type: 'dataframe' }],
    outputs: [{ id: 'out_features', label: 'Technical Matrix', type: 'features' }],
    params: {
      returnPeriods: [5, 10, 20],
      rsiPeriod: 14,
      macdFast: 12,
      macdSlow: 26,
      atrPeriod: 14,
    },
  },
  {
    id: 'fractional_diff',
    category: 'feature',
    title: 'Fractional Diff',
    subtitle: 'Stationary Price Memory',
    icon: 'GitCommit',
    inputs: [{ id: 'in_df', label: 'Price Series', type: 'dataframe' }],
    outputs: [{ id: 'out_features', label: 'Fractional Series', type: 'features' }],
    params: {
      d_order: 0.45,
      threshold: 0.0001,
      stationarityTest: 'ADF',
    },
  },
  {
    id: 'feature_normalizer',
    category: 'feature',
    title: 'Feature Normalizer',
    subtitle: 'Z-Score & Robust Scaler',
    icon: 'Scale',
    inputs: [{ id: 'in_features', label: 'Raw Features', type: 'features' }],
    outputs: [{ id: 'out_features', label: 'Normalized Scaled', type: 'features' }],
    params: {
      scalerType: 'RobustScaler',
      quantileRange: [5, 95],
      clipOutliers: true,
    },
  },
  {
    id: 'market_regime_filter',
    category: 'feature',
    title: 'Market Regime Filter',
    subtitle: 'HMM & Volatility Clustering',
    icon: 'Sliders',
    inputs: [{ id: 'in_features', label: 'Features', type: 'features' }],
    outputs: [{ id: 'out_features', label: 'Regime Filtered', type: 'features' }],
    params: {
      nRegimes: 3,
      modelType: 'GaussianHMM',
      covariance: 'full',
    },
  },
  {
    id: 'wavelet_denoising',
    category: 'feature',
    title: 'Wavelet Denoising',
    subtitle: 'Multi-Scale Decomposition',
    icon: 'Activity',
    inputs: [{ id: 'in_df', label: 'Noisy Data', type: 'dataframe' }],
    outputs: [{ id: 'out_features', label: 'Denoised Signal', type: 'features' }],
    params: {
      waveletFamily: 'db4',
      decompositionLevel: 3,
      thresholding: 'soft',
    },
  },

  // 3. REWARD & SHAPING
  {
    id: 'triple_barrier_method',
    category: 'reward',
    title: 'Triple Barrier Method',
    subtitle: 'TakeProfit, StopLoss & Time',
    icon: 'Target',
    inputs: [
      { id: 'in_df', label: 'Price Data', type: 'dataframe' },
      { id: 'in_features', label: 'Features', type: 'features' },
    ],
    outputs: [{ id: 'out_labels', label: 'Barrier Targets', type: 'labels' }],
    params: {
      takeProfitMult: 2.0,
      stopLossMult: 1.5,
      verticalBarrierBars: 24,
    },
  },
  {
    id: 'anti_inactivity_penalty',
    category: 'reward',
    title: 'Anti-Inactivity Penalty',
    subtitle: 'Idle Penalty 5e-5 & Opp. Cost',
    icon: 'Hourglass',
    inputs: [{ id: 'in_labels', label: 'Raw Rewards', type: 'labels' }],
    outputs: [{ id: 'out_labels', label: 'Shaped Rewards', type: 'labels' }],
    params: {
      idlePenaltyRate: 0.00005,
      opportunityCostWeight: 0.12,
      maxIdleBars: 100,
    },
  },
  {
    id: 'spread_friction_cost',
    category: 'reward',
    title: 'Spread Friction Cost',
    subtitle: 'Deduct Slippage & Commission',
    icon: 'Coins',
    inputs: [{ id: 'in_labels', label: 'Net Returns', type: 'labels' }],
    outputs: [{ id: 'out_labels', label: 'Friction Adjusted', type: 'labels' }],
    params: {
      spreadPips: 1.2,
      commissionPerLot: 3.5,
      slippageModel: 'DynamicExponential',
    },
  },

  // 4. AI & ML MODELS
  {
    id: 'deep_rl_ppo',
    category: 'model',
    title: 'Deep RL Policy (PPO)',
    subtitle: 'Actor MLP 64x32 LeakyReLU',
    icon: 'Brain',
    inputs: [
      { id: 'in_features', label: 'State Obs', type: 'features' },
      { id: 'in_labels', label: 'Rewards', type: 'labels' },
    ],
    outputs: [{ id: 'out_model', label: 'RL Policy', type: 'model' }],
    params: {
      actorArchitecture: '64x32_LeakyReLU',
      learningRate: 0.0003,
      gammaDiscount: 0.99,
      clipRange: 0.2,
      entropyCoef: 0.01,
    },
  },
  {
    id: 'lightgbm_model',
    category: 'model',
    title: 'LightGBM Model',
    subtitle: 'Gradient Boosted Alpha Tree',
    icon: 'Trees',
    inputs: [
      { id: 'in_features', label: 'Features', type: 'features' },
      { id: 'in_labels', label: 'Labels', type: 'labels' },
    ],
    outputs: [{ id: 'out_model', label: 'Trained Trees', type: 'model' }],
    params: {
      nEstimators: 600,
      learningRate: 0.03,
      maxDepth: 6,
      numLeaves: 31,
    },
  },
  {
    id: 'standalone_bpnn_mql5',
    category: 'model',
    title: 'Standalone BPNN (MQL5)',
    subtitle: 'Fibonacci Rprop Predictor',
    icon: 'Zap',
    inputs: [
      { id: 'in_features', label: 'Input Vector', type: 'features' },
      { id: 'in_labels', label: 'Target Output', type: 'labels' },
    ],
    outputs: [{ id: 'out_model', label: 'BPNN Weights', type: 'model' }],
    params: {
      topology: '5x6x6x3',
      trainingAlgorithm: 'Rprop_Plus',
      activationFunction: 'Tanh_Softmax',
      mqlExportHeader: true,
    },
  },

  // 5. VALIDATION & DEPLOY
  {
    id: 'monte_carlo_stress_test',
    category: 'execution',
    title: 'Monte Carlo Stress Test',
    subtitle: '1,000-Path Resample & P(Ruin)',
    icon: 'Activity',
    inputs: [{ id: 'in_model', label: 'Policy Model', type: 'model' }],
    outputs: [{ id: 'out_backtest', label: 'Stress Report', type: 'backtest' }],
    params: {
      numSimulations: 1000,
      confidenceInterval: 95,
      horizonSessions: 50,
      maxDrawdownLimitPct: 5.0,
      bootstrapMethod: 'StationaryBlockResample',
    },
  },
  {
    id: 'walk_forward_robustness',
    category: 'execution',
    title: 'Walk-Forward Robustness',
    subtitle: 'OOS Sharpe & Overfit Guard',
    icon: 'ShieldCheck',
    inputs: [{ id: 'in_model', label: 'Candidate Model', type: 'model' }],
    outputs: [{ id: 'out_model', label: 'Robust Policy', type: 'model' }],
    params: {
      oosWindowsCount: 5,
      trainRatioPct: 70,
      minOosSharpeRatio: 1.20,
      parameterStabilityThresholdPct: 85,
    },
  },
  {
    id: 'backtest_telemetry',
    category: 'execution',
    title: 'Backtest Telemetry',
    subtitle: 'Equity Curve & Quant Stats',
    icon: 'TrendingUp',
    inputs: [{ id: 'in_model', label: 'Model Prediction', type: 'model' }],
    outputs: [{ id: 'out_backtest', label: 'Telemetry Report', type: 'backtest' }],
    params: {
      initialCapital: 100000,
      riskPerTradePct: 1.5,
      enableMonteCarlo: true,
    },
  },
  {
    id: 'mt5_live_bot',
    category: 'execution',
    title: 'MT5 Live Bot (ONNX)',
    subtitle: '1-Click Auto Deploy to Files/',
    icon: 'Rocket',
    inputs: [{ id: 'in_model', label: 'Trained Weights', type: 'model' }],
    outputs: [{ id: 'out_export', label: 'EA Package', type: 'export' }],
    params: {
      expertAdvisorName: 'AlphaFlow_BPNN_v1',
      onnxBatchSize: 1,
      targetMqlDirectory: 'MT5/MQL5/Experts/AlphaFlow',
      autoHotReload: true,
    },
  },
  {
    id: 'dynamic_risk_manager',
    category: 'execution',
    title: 'Dynamic Risk Manager',
    subtitle: 'Trailing Stop & Spread Guard',
    icon: 'ShieldCheck',
    inputs: [{ id: 'in_model', label: 'Signals', type: 'model' }],
    outputs: [{ id: 'out_signal', label: 'Shielded Orders', type: 'signal' }],
    params: {
      atrTrailingMult: 2.2,
      maxSpreadPipsGuard: 3.0,
      dailyDrawdownLimitPct: 4.0,
    },
  },
];
