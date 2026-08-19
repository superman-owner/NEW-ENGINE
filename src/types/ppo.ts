export interface QuantFeatures {
  ret1: number;
  ret5: number;
  rsiNorm: number;
  distSma: number;
  posState: number;
  pnlPct: number;
}

export interface TradeRecord {
  id: string;
  step: number;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  returnPct: number;
  pnlUsd: number;
  equity: number;
  timestamp: string;
  durationBars: number;
}

export interface EpochTelemetry {
  epoch: number;
  trainReward: number;
  valReward: number;
  ma10Reward: number;
  actorLoss: number;
  criticLoss: number;
  entropy: number;
  winRate: number;
  cumReturn: number;
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  profitFactor: number;
  totalTrades: number;
  actionDist: {
    hold: number;
    buy: number;
    sell: number;
  };
}

export interface StrategyPreset {
  id: string;
  name: string;
  symbol: string;
  timeframe: string;
  bars: string;
  episodes: number;
  modelType: string;
  description: string;
  spread: number;
  actorLr: number;
  criticLr: number;
  clipEps: number;
  gamma: number;
  gaeLambda: number;
}

export interface EngineSettings {
  spreadPips: number;
  slippagePips: number;
  maxDrawdownLimit: number;
  idlePenalty: number;
  opportunityCost: number;
  mt5Directory: string;
  autoDeployOnComplete: boolean;
}
