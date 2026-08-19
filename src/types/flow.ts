export type SocketType = 'dataframe' | 'features' | 'labels' | 'model' | 'backtest' | 'signal' | 'export';

export interface SocketDefinition {
  id: string;
  label: string;
  type: SocketType;
  description?: string;
}

export type NodeCategory = 
  | 'data'
  | 'feature'
  | 'reward'
  | 'model'
  | 'execution'
  | 'label'
  | 'ai_brain'
  | 'risk'
  | 'mt5'
  | 'trainer'
  | 'qc'
  | 'tournament'
  | 'live_safety'
  | 'backtest'
  | 'export';

export interface TradingNodeConfig {
  id: string;
  category: NodeCategory;
  title: string;
  subtitle: string;
  icon: string;
  inputs: SocketDefinition[];
  outputs: SocketDefinition[];
  params: Record<string, any>;
  status?: 'idle' | 'running' | 'completed' | 'error';
  metrics?: Record<string, string | number>;
}

export interface MetricSummary {
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  totalReturn: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  avgTradeReturn: number;
}

export interface EquityPoint {
  date: string;
  portfolio: number;
  benchmark: number;
  drawdown: number;
}

export interface LossPoint {
  epoch: number;
  trainLoss: number;
  valLoss: number;
  metricValue: number;
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
  category: string;
}
