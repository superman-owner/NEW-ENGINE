export interface NodeFieldDef {
  key: string;
  label: string;
  default: string | number | boolean;
  type?: 'string' | 'number' | 'boolean' | 'select';
  options?: string[];
}

export interface NodeDef {
  group: string;
  label: string;
  fields: NodeFieldDef[];
  hasInput: boolean;
  hasOutput: boolean;
  decision?: boolean;
}

export interface NodeGroup {
  id: string;
  label: string;
  color: string;
  icon?: string;
}

export interface NodeItem {
  type: string;
  label: string;
  group: string;
}

export const GROUPS: NodeGroup[] = [
  { id: 'input', label: 'Input & Strategy', color: '#0a84ff' },
  { id: 'fc1', label: 'Feature Expansion', color: '#ff9f0a' },
  { id: 'regularization', label: 'Regularization & Norm', color: '#30d158' },
  { id: 'fc2', label: 'Bottleneck Synthesis', color: '#bf5af2' },
  { id: 'reward', label: 'Reward & Shaping Rules', color: '#ffd60a' },
  { id: 'output', label: 'Output & Deployment', color: '#0a84ff' },
];

export interface PipelinePresetSettings {
  timeframe: string;
  bars_count: number;
  ret_lookbacks: string;
  target_episodes: string;
  // Volatility
  vol_window: number;
  sma_period: number;
  metric: string;
  // MTF & Filters
  higher_tf: string;
  news_filter: boolean;
  active_session: string;
  // Expansion
  units_fc1: string;
  activation_fc1: string;
  attention_heads: string;
  // Regularization
  dropout_rate: number;
  dropout_mode: string;
  norm_type: string;
  l2_decay: string;
  gradient_clip: number;
  // Bottleneck
  units_fc2: string;
  activation_fc2: string;
  residual: boolean;
  // Reward
  spread_pip: number;
  idle_penalty: number;
  opp_cost_multiplier: string;
  max_dd_limit: number;
  dd_penalty_mult: number;
  // Execution & Sizing
  sizing_mode: string;
  risk_per_trade: number;
  be_trigger_rr: number;
  trailing_step_atr: number;
  // Policy Head
  entropy_beta: number;
  // Stress Test & Validation
  monte_carlo_sims: number;
  walk_forward_splits: number;
  onnx_model_name: string;
}

export const STRATEGY_PRESET_CONFIGS: Record<string, PipelinePresetSettings> = {
  'Standard Quant': {
    timeframe: 'M15',
    bars_count: 10000,
    ret_lookbacks: '5, 10, 20',
    target_episodes: '400',
    vol_window: 10,
    sma_period: 20,
    metric: 'ATR Normalized',
    higher_tf: 'H4',
    news_filter: true,
    active_session: 'London & New York',
    units_fc1: '64',
    activation_fc1: 'LeakyReLU',
    attention_heads: '4',
    dropout_rate: 0.15,
    dropout_mode: 'Standard Dropout',
    norm_type: 'LayerNorm',
    l2_decay: '1e-4',
    gradient_clip: 1.0,
    units_fc2: '32',
    activation_fc2: 'LeakyReLU',
    residual: true,
    spread_pip: 0.15,
    idle_penalty: -0.0005,
    opp_cost_multiplier: '0.50x',
    max_dd_limit: 5.0,
    dd_penalty_mult: 3.0,
    sizing_mode: 'Risk % of Equity',
    risk_per_trade: 1.0,
    be_trigger_rr: 1.5,
    trailing_step_atr: 1.2,
    entropy_beta: 0.08,
    monte_carlo_sims: 200,
    walk_forward_splits: 5,
    onnx_model_name: 'rl_standard_quant.onnx',
  },
  'Fibonacci Scale': {
    timeframe: 'M30',
    bars_count: 15000,
    ret_lookbacks: '3, 8, 21',
    target_episodes: '500',
    vol_window: 14,
    sma_period: 34,
    metric: 'ATR Normalized',
    higher_tf: 'D1',
    news_filter: true,
    active_session: 'London & New York',
    units_fc1: '64',
    activation_fc1: 'LeakyReLU',
    attention_heads: '4',
    dropout_rate: 0.15,
    dropout_mode: 'Standard Dropout',
    norm_type: 'LayerNorm',
    l2_decay: '1e-4',
    gradient_clip: 1.0,
    units_fc2: '32',
    activation_fc2: 'LeakyReLU',
    residual: true,
    spread_pip: 0.15,
    idle_penalty: -0.0004,
    opp_cost_multiplier: '0.50x',
    max_dd_limit: 6.0,
    dd_penalty_mult: 2.5,
    sizing_mode: 'Risk % of Equity',
    risk_per_trade: 0.8,
    be_trigger_rr: 1.6,
    trailing_step_atr: 1.5,
    entropy_beta: 0.08,
    monte_carlo_sims: 300,
    walk_forward_splits: 5,
    onnx_model_name: 'rl_fibonacci_m30.onnx',
  },
  'Ultra-Fast Scalper': {
    timeframe: 'M1',
    bars_count: 50000,
    ret_lookbacks: '2, 5, 10',
    target_episodes: '500',
    vol_window: 5,
    sma_period: 10,
    metric: 'ATR Normalized',
    higher_tf: 'M15',
    news_filter: true,
    active_session: 'London Only',
    units_fc1: '64',
    activation_fc1: 'LeakyReLU',
    attention_heads: '4',
    dropout_rate: 0.05,
    dropout_mode: 'Standard Dropout',
    norm_type: 'LayerNorm',
    l2_decay: '1e-5',
    gradient_clip: 0.5,
    units_fc2: '32',
    activation_fc2: 'LeakyReLU',
    residual: false,
    spread_pip: 0.08,
    idle_penalty: -0.0010,
    opp_cost_multiplier: '0.75x',
    max_dd_limit: 3.5,
    dd_penalty_mult: 5.0,
    sizing_mode: 'ATR Volatility-Adjusted',
    risk_per_trade: 0.5,
    be_trigger_rr: 1.2,
    trailing_step_atr: 0.8,
    entropy_beta: 0.05,
    monte_carlo_sims: 500,
    walk_forward_splits: 10,
    onnx_model_name: 'rl_scalper_m1.onnx',
  },
  'Macro Trend Follower': {
    timeframe: 'H4',
    bars_count: 5000,
    ret_lookbacks: '10, 25, 50',
    target_episodes: '300',
    vol_window: 20,
    sma_period: 50,
    metric: 'ATR Normalized',
    higher_tf: 'D1',
    news_filter: false,
    active_session: 'All Sessions',
    units_fc1: '128',
    activation_fc1: 'LeakyReLU',
    attention_heads: '8',
    dropout_rate: 0.20,
    dropout_mode: 'Standard Dropout',
    norm_type: 'LayerNorm',
    l2_decay: '1e-3',
    gradient_clip: 2.0,
    units_fc2: '64',
    activation_fc2: 'LeakyReLU',
    residual: true,
    spread_pip: 0.25,
    idle_penalty: -0.0001,
    opp_cost_multiplier: '0.25x',
    max_dd_limit: 8.0,
    dd_penalty_mult: 2.0,
    sizing_mode: 'Risk % of Equity',
    risk_per_trade: 1.5,
    be_trigger_rr: 2.0,
    trailing_step_atr: 2.0,
    entropy_beta: 0.10,
    monte_carlo_sims: 100,
    walk_forward_splits: 3,
    onnx_model_name: 'rl_macro_trend_h4.onnx',
  },
};

export const NODE_DEFS: Record<string, NodeDef> = {
  // =========================================================================
  // 1. หมวด INPUT & STATE NODES (ป้อนข้อมูลและตัวกรองตลาด)
  // =========================================================================
  strategy_preset_return: {
    group: 'input',
    label: 'Strategy & Return Window',
    fields: [
      {
        key: 'preset',
        label: 'Strategy Preset',
        default: 'Standard Quant',
        type: 'select',
        options: [
          'Standard Quant',
          'Fibonacci Scale',
          'Ultra-Fast Scalper',
          'Macro Trend Follower',
          'Custom Configuration',
        ],
      },
      {
        key: 'timeframe',
        label: 'Timeframe',
        default: 'M15',
        type: 'select',
        options: ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'],
      },
      { key: 'symbol', label: 'Asset Symbol', default: 'XAUUSD', type: 'string' },
      {
        key: 'bars_count',
        label: 'Bars Count',
        default: 10000,
        type: 'number',
      },
    ],
    hasInput: false,
    hasOutput: true,
  },
  volatility_indicator: {
    group: 'input',
    label: 'Volatility & Indicator',
    fields: [
      { key: 'vol_window', label: 'Volatility Window', default: 10, type: 'number' },
      { key: 'sma_period', label: 'SMA Baseline Period', default: 20, type: 'number' },
      {
        key: 'metric',
        label: 'Formula Metric',
        default: 'ATR Normalized',
        type: 'select',
        options: ['Standard Deviation %', 'ATR Normalized', 'Bollinger %B'],
      },
    ],
    hasInput: false,
    hasOutput: true,
  },
  position_feedback: {
    group: 'input',
    label: 'Position Feedback',
    fields: [
      {
        key: 'encoding',
        label: 'Position Encoding',
        default: 'Discrete',
        type: 'select',
        options: ['Discrete', 'Continuous'],
      },
    ],
    hasInput: false,
    hasOutput: true,
  },
  training_episodes_config: {
    group: 'input',
    label: 'Training Episodes & Target',
    fields: [
      {
        key: 'target_episodes',
        label: 'Target Episodes',
        default: '400',
        type: 'select',
        options: ['100', '300', '400', '500', '1,000', '2,000', '3,000', '5,000', '10,000', '20,000', '50,000'],
      },
      {
        key: 'batch_size',
        label: 'Batch Size',
        default: '64',
        type: 'select',
        options: ['32', '64', '128', '256'],
      },
      {
        key: 'max_steps',
        label: 'Max Episode Steps',
        default: 32,
        type: 'number',
      },
      {
        key: 'checkpoint_interval',
        label: 'Save Checkpoint (Ep)',
        default: 1000,
        type: 'number',
      },
    ],
    hasInput: false,
    hasOutput: true,
  },
  multi_timeframe_fusion: {
    group: 'input',
    label: 'Multi-Timeframe Fusion',
    fields: [
      {
        key: 'higher_tf',
        label: 'Higher Timeframe',
        default: 'H4',
        type: 'select',
        options: ['M30', 'H1', 'H4', 'D1', 'W1'],
      },
      {
        key: 'trend_indicator',
        label: 'Higher Trend Filter',
        default: 'EMA 200 + SuperTrend',
        type: 'select',
        options: ['EMA 200 + SuperTrend', 'MACD Higher Trend', 'Multi-Fractal Trend'],
      },
      { key: 'confluence_weight', label: 'Confluence Weight %', default: 35, type: 'number' },
    ],
    hasInput: false,
    hasOutput: true,
  },
  news_impact_filter: {
    group: 'input',
    label: 'News Impact Filter',
    fields: [
      { key: 'filter_high_impact', label: 'Filter High-Impact News', default: true, type: 'boolean' },
      { key: 'blackout_mins_before', label: 'Blackout Mins Before', default: 15, type: 'number' },
      { key: 'blackout_mins_after', label: 'Blackout Mins After', default: 30, type: 'number' },
      { key: 'auto_close_on_red_news', label: 'Auto-Close on Red News', default: false, type: 'boolean' },
    ],
    hasInput: false,
    hasOutput: true,
  },
  session_time_filter: {
    group: 'input',
    label: 'Session & Day Filter',
    fields: [
      {
        key: 'active_session',
        label: 'Active Market Session',
        default: 'London & New York',
        type: 'select',
        options: ['London & New York', 'London Only', 'New York Only', 'Asian Session', 'All Sessions'],
      },
      { key: 'no_friday_weekend_gap', label: 'Close Before Friday Close', default: true, type: 'boolean' },
      { key: 'friday_close_hour_gmt', label: 'Friday Exit Hour (GMT)', default: 21, type: 'number' },
    ],
    hasInput: false,
    hasOutput: true,
  },

  // =========================================================================
  // 2. หมวด HIDDEN LAYER 1 NODES (สกัดฟีเจอร์ย่อย)
  // =========================================================================
  fc1_dense_expansion: {
    group: 'fc1',
    label: 'Dense Feature Expansion',
    fields: [
      {
        key: 'units',
        label: 'Neuron Count',
        default: '64',
        type: 'select',
        options: ['32', '64', '128'],
      },
      {
        key: 'activation',
        label: 'Activation Function',
        default: 'LeakyReLU',
        type: 'select',
        options: ['LeakyReLU', 'GELU', 'ReLU', 'Mish'],
      },
      { key: 'bias', label: 'Learnable Bias', default: true, type: 'boolean' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  fc1_attention_weights: {
    group: 'fc1',
    label: 'Attention Feature Saliency',
    fields: [
      {
        key: 'heads',
        label: 'Attention Heads',
        default: '4',
        type: 'select',
        options: ['2', '4', '8'],
      },
      { key: 'temperature', label: 'Softmax Temperature', default: 1.0, type: 'number' },
    ],
    hasInput: true,
    hasOutput: true,
  },

  // =========================================================================
  // 3. หมวด REGULARIZATION & NORM NODES (ป้องกัน Overfitting)
  // =========================================================================
  spatial_dropout_regularization: {
    group: 'regularization',
    label: 'Spatial Feature Dropout',
    fields: [
      { key: 'rate', label: 'Dropout Rate (0.0-0.5)', default: 0.15, type: 'number' },
      {
        key: 'mode',
        label: 'Dropout Mode',
        default: 'Standard Dropout',
        type: 'select',
        options: ['Standard Dropout', 'DropConnect', 'AlphaDropout'],
      },
    ],
    hasInput: true,
    hasOutput: true,
  },
  layer_normalization: {
    group: 'regularization',
    label: 'Layer Normalization',
    fields: [
      {
        key: 'norm_type',
        label: 'Normalization Type',
        default: 'LayerNorm',
        type: 'select',
        options: ['LayerNorm', 'RMSNorm', 'BatchNorm1D'],
      },
      { key: 'epsilon', label: 'Epsilon Stability', default: '1e-5', type: 'string' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  gradient_clipping: {
    group: 'regularization',
    label: 'Gradient Clipping',
    fields: [
      { key: 'max_norm', label: 'Max Gradient Norm', default: 1.0, type: 'number' },
    ],
    hasInput: true,
    hasOutput: true,
  },

  // =========================================================================
  // 4. หมวด HIDDEN LAYER 2 NODES (สังเคราะห์ภาพรวมกลยุทธ์)
  // =========================================================================
  fc2_bottleneck_synthesizer: {
    group: 'fc2',
    label: 'Strategy Synthesizer',
    fields: [
      {
        key: 'units',
        label: 'Neuron Count',
        default: '32',
        type: 'select',
        options: ['16', '32', '64'],
      },
      {
        key: 'activation',
        label: 'Activation Function',
        default: 'LeakyReLU',
        type: 'select',
        options: ['LeakyReLU', 'GELU', 'Tanh'],
      },
      {
        key: 'residual',
        label: 'Residual Connection',
        default: true,
        type: 'boolean',
      },
    ],
    hasInput: true,
    hasOutput: true,
  },

  // =========================================================================
  // 5. หมวด REWARD & SHAPING NODES (กฎเกณฑ์และการคุม Drawdown)
  // =========================================================================
  friction_spread_cost: {
    group: 'reward',
    label: 'Friction Cost & Spread',
    fields: [
      { key: 'spread_pip', label: 'Spread', default: 0.15, type: 'number' },
      { key: 'commission', label: 'Commission', default: 0.00, type: 'number' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  anti_inactivity_reward: {
    group: 'reward',
    label: 'Inactivity & Opp Cost',
    fields: [
      { key: 'idle_penalty', label: 'Idle Penalty', default: -0.0005, type: 'number' },
      { key: 'opp_cost_multiplier', label: 'Opportunity Cost Multiplier', default: '0.50x', type: 'string' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  drawdown_guard_penalty: {
    group: 'reward',
    label: 'Drawdown Guard & Penalty',
    fields: [
      { key: 'max_dd_limit', label: 'Max Drawdown Limit %', default: 5.0, type: 'number' },
      { key: 'daily_dd_limit', label: 'Daily Drawdown Limit %', default: 4.0, type: 'number' },
      { key: 'dd_penalty_mult', label: 'Penalty Multiplier (x)', default: 3.0, type: 'number' },
      { key: 'hard_stop_on_breach', label: 'Hard Stop on DD Breach', default: true, type: 'boolean' },
    ],
    hasInput: true,
    hasOutput: true,
  },

  // =========================================================================
  // 6. หมวด OUTPUT & DEPLOY NODES (เคาะออเดอร์, Dynamic Lot, Trailing, Webhook)
  // =========================================================================
  fc3_policy_action_head: {
    group: 'output',
    label: 'Policy Action Head',
    fields: [
      {
        key: 'classes',
        label: 'Output Classes',
        default: '3',
        type: 'string',
      },
      { key: 'entropy_beta', label: 'Entropy Regularization Bonus', default: 0.08, type: 'number' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  dynamic_lot_sizer: {
    group: 'output',
    label: 'Dynamic Position Sizer',
    fields: [
      {
        key: 'sizing_mode',
        label: 'Sizing Algorithm',
        default: 'Risk % of Equity',
        type: 'select',
        options: ['Risk % of Equity', 'ATR Volatility-Adjusted', 'Kelly Criterion', 'AI Confidence Scale'],
      },
      { key: 'risk_per_trade_pct', label: 'Risk % per Trade', default: 1.0, type: 'number' },
      { key: 'min_lot', label: 'Minimum Lot', default: 0.01, type: 'number' },
      { key: 'max_lot', label: 'Maximum Lot', default: 10.0, type: 'number' },
      { key: 'atr_multiplier', label: 'ATR Multiplier', default: 1.5, type: 'number' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  trailing_stop_breakeven: {
    group: 'output',
    label: 'Trailing Stop & Breakeven',
    fields: [
      { key: 'breakeven_trigger_rr', label: 'Breakeven Trigger (R:R)', default: 1.5, type: 'number' },
      { key: 'breakeven_lock_pips', label: 'Breakeven Lock Pips', default: 1.0, type: 'number' },
      { key: 'trailing_step_atr', label: 'Trailing Step (x ATR)', default: 1.2, type: 'number' },
      { key: 'partial_take_profit_pct', label: 'Partial TP (% Lot)', default: 50, type: 'number' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  telegram_webhook_alert: {
    group: 'output',
    label: 'Telegram & Webhook Alert',
    fields: [
      {
        key: 'webhook_channel',
        label: 'Notification Channel',
        default: 'Telegram Bot',
        type: 'select',
        options: ['Telegram Bot', 'Discord Webhook', 'MQL5 Push Notification'],
      },
      { key: 'bot_token_or_url', label: 'Bot Token / Webhook URL', default: 'https://api.telegram.org/bot...', type: 'string' },
      { key: 'notify_on_trade', label: 'Notify on New Trade', default: true, type: 'boolean' },
      { key: 'notify_on_dd_alert', label: 'Notify on Drawdown Alert', default: true, type: 'boolean' },
      { key: 'notify_daily_summary', label: 'Daily PnL Summary', default: true, type: 'boolean' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  onnx_mt5_compiler: {
    group: 'output',
    label: 'ONNX MT5 Compiler',
    fields: [
      {
        key: 'target_folder',
        label: 'Target Folder',
        default: 'MQL5/Files/',
        type: 'string',
      },
      { key: 'opset', label: 'Opset Version', default: 14, type: 'number' },
    ],
    hasInput: true,
    hasOutput: false,
  },
};

export function nodesByGroup(groupId: string): NodeItem[] {
  return Object.entries(NODE_DEFS)
    .filter(([_, def]) => def.group === groupId)
    .map(([type, def]) => ({
      type,
      label: def.label,
      group: def.group,
    }));
}
