import type { EquityPoint, LossPoint, FeatureImportanceItem, MetricSummary } from '../types/flow';

export const MOCK_METRICS: MetricSummary = {
  sharpeRatio: 2.84,
  sortinoRatio: 3.42,
  maxDrawdown: 9.2,
  totalReturn: 184.2,
  winRate: 63.4,
  profitFactor: 2.18,
  totalTrades: 342,
  avgTradeReturn: 0.84,
};

export interface RLRewardPoint {
  episode: string;
  cumulativeReward: number;
  rewardMa10: number;
  marketBaseline: number;
  rMarket: number;
  rSpread: number;
  rInactivity: number;
  rOppCost: number;
}

// Generate realistic simulated RL Reward Curve
export const generateRLRewardData = (): RLRewardPoint[] => {
  const points: RLRewardPoint[] = [];
  let cumReward = 0;
  let cumMarket = 0;
  const recentRewards: number[] = [];

  for (let ep = 1; ep <= 60; ep++) {
    const stepPriceDelta = (Math.random() - 0.45) * 0.025;
    const isLong = Math.random() > 0.35;
    const rMarket = isLong ? 10.0 * stepPriceDelta * 4 : 0;
    const rSpread = Math.random() < 0.25 ? 0.15 : 0;
    const rInactivity = isLong ? 0 : 0.005;
    const rOppCost = !isLong && Math.abs(stepPriceDelta) > 0.012 ? 0.5 * Math.abs(stepPriceDelta) * 10 : 0;

    const stepReward = rMarket - rSpread - rInactivity - rOppCost + (ep > 15 ? 0.42 : 0.15);
    cumReward += stepReward;
    cumMarket += stepPriceDelta * 80;

    recentRewards.push(stepReward);
    if (recentRewards.length > 10) recentRewards.shift();
    const ma10 = recentRewards.reduce((a, b) => a + b, 0) / recentRewards.length;

    points.push({
      episode: `Ep ${ep}`,
      cumulativeReward: Number(cumReward.toFixed(2)),
      rewardMa10: Number((cumReward * 0.94 + ma10).toFixed(2)),
      marketBaseline: Number(cumMarket.toFixed(2)),
      rMarket: Number(rMarket.toFixed(3)),
      rSpread: Number(rSpread.toFixed(3)),
      rInactivity: Number(rInactivity.toFixed(4)),
      rOppCost: Number(rOppCost.toFixed(3)),
    });
  }

  return points;
};

// Generate realistic simulated Equity Curve
export const generateEquityData = (): EquityPoint[] => {
  const points: EquityPoint[] = [];
  let portfolioVal = 10000;
  let benchmarkVal = 10000;
  let peak = 10000;
  const startDate = new Date('2024-01-01');

  for (let i = 0; i < 90; i++) {
    const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = currentDate.toISOString().split('T')[0];

    // Benchmark has higher volatility
    const btcDailyReturn = (Math.random() - 0.48) * 0.04;
    benchmarkVal = benchmarkVal * (1 + btcDailyReturn);

    // Strategy has controlled volatility and steady edge
    const stratDailyReturn = (Math.random() - 0.42) * 0.025;
    portfolioVal = portfolioVal * (1 + stratDailyReturn);

    if (portfolioVal > peak) {
      peak = portfolioVal;
    }
    const dd = ((portfolioVal - peak) / peak) * 100;

    points.push({
      date: dateStr,
      portfolio: Math.round(portfolioVal),
      benchmark: Math.round(benchmarkVal),
      drawdown: Number(dd.toFixed(2)),
    });
  }

  return points;
};

// Generate Loss & Metric curves for AI Training
export const generateLossData = (): LossPoint[] => {
  const points: LossPoint[] = [];
  let trainLoss = 0.693;
  let valLoss = 0.695;
  let auc = 0.50;

  for (let epoch = 1; epoch <= 60; epoch++) {
    trainLoss = Math.max(0.18, trainLoss * 0.965 + (Math.random() - 0.5) * 0.01);
    valLoss = Math.max(0.24, valLoss * 0.972 + (Math.random() - 0.45) * 0.015);
    auc = Math.min(0.765, 0.50 + (1 - Math.exp(-epoch / 18)) * 0.25 + (Math.random() - 0.5) * 0.008);

    points.push({
      epoch,
      trainLoss: Number(trainLoss.toFixed(4)),
      valLoss: Number(valLoss.toFixed(4)),
      metricValue: Number(auc.toFixed(3)),
    });
  }

  return points;
};

export const FEATURE_IMPORTANCE: FeatureImportanceItem[] = [
  { feature: 'frac_diff_d045', importance: 0.234, category: 'Stationary' },
  { feature: 'rsi_14_divergence', importance: 0.182, category: 'Momentum' },
  { feature: 'atr_volatility_ratio', importance: 0.145, category: 'Volatility' },
  { feature: 'funding_rate_zscore', importance: 0.118, category: 'Alternative' },
  { feature: 'macd_hist_slope', importance: 0.095, category: 'Trend' },
  { feature: 'bb_percent_b', importance: 0.078, category: 'Mean Reversion' },
  { feature: 'volume_surge_ratio', importance: 0.065, category: 'Liquidity' },
  { feature: 'ema_20_50_spread', importance: 0.048, category: 'Trend' },
  { feature: 'orderbook_imbalance_l2', importance: 0.035, category: 'Microstructure' },
];

export interface MT5LogItem {
  id: string;
  time: string;
  source: string;
  message: string;
  level?: 'info' | 'trade' | 'warn' | 'error';
}

export const INITIAL_MT5_LOGS: MT5LogItem[] = [
  {
    id: 'log-1',
    time: '2026.08.16 20:29:08.112',
    source: 'Terminal',
    message: 'MetaTrader 5 x64 build 4360 started (MetaQuotes Software Corp.)',
    level: 'info',
  },
  {
    id: 'log-2',
    time: '2026.08.16 20:29:08.450',
    source: 'Network',
    message: 'Authorized on Binance-Direct-Server via WebSocket IPC',
    level: 'info',
  },
  {
    id: 'log-3',
    time: '2026.08.16 20:29:09.012',
    source: 'Tester',
    message: 'FXFORGE Deep RL Policy Engine loaded from buffer: rl_trading_model.onnx',
    level: 'info',
  },
  {
    id: 'log-4',
    time: '2026.08.16 20:29:09.048',
    source: 'Tester',
    message: 'ONNX input tensor [1, 6] float32 mapped to State Vector s_t',
    level: 'info',
  },
  {
    id: 'log-5',
    time: '2026.08.16 20:29:09.048',
    source: 'Tester',
    message: 'Local network farm connected (CUDA 12.4 Device: RTX 4090 active)',
    level: 'info',
  },
  {
    id: 'log-6',
    time: '2026.08.16 20:29:10.155',
    source: 'FXForge Expert',
    message: 'M15 BTCUSDT tick received (Spread: 1.2 pips). Computing State: [0.45, 0.82, 1.15, 0.28, 0.35, 0.0]',
    level: 'info',
  },
  {
    id: 'log-7',
    time: '2026.08.16 20:29:10.162',
    source: 'FXForge Expert',
    message: '[ONNX RUN] Action Probabilities: BUY=84.5%, HOLD=10.2%, SELL=5.3% -> Decision: BUY (Confidence: 84.5%)',
    level: 'trade',
  },
  {
    id: 'log-8',
    time: '2026.08.16 20:29:10.198',
    source: 'FXForge Expert',
    message: 'OrderSend: BUY 0.10 BTCUSDT at market 65,420.00 (Slippage: 0.2 pips, Magic: 888666)',
    level: 'trade',
  },
  {
    id: 'log-9',
    time: '2026.08.16 20:29:11.520',
    source: 'FXForge Expert',
    message: 'Deal #489102 BUY 0.10 executed at 65,420.00. Reward R_market: +0.48 R (Spread Cost: -0.015 R)',
    level: 'trade',
  },
  {
    id: 'log-10',
    time: '2026.08.16 20:29:12.804',
    source: 'Tester',
    message: 'Annualized Sharpe: 2.84 | Sortino: 3.42 | Max DD: -9.2% | Win Rate: 63.4%',
    level: 'info',
  },
];

export const INITIAL_LOGS: string[] = [
  '[SYSTEM] FXFORGE LAB Engine Standby (Idle Baseline).',
  '[PIPELINE] Node Pipeline architecture loaded and verified.',
  '[READY] Ready to train. Click "START" on the top navigation bar to begin Deep RL Training.',
];
