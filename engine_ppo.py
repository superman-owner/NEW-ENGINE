# ==============================================================================
# train_rl_trader.py
# Institutional PPO (Proximal Policy Optimization) Actor-Critic Trading Engine
# 12 Quant Features | Generalized Advantage Estimation (GAE) | Walk-Forward Validation
# ==============================================================================
import os
import sys
import math
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim

os.environ["PYTHONIOENCODING"] = "utf-8"
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
except ImportError:
    MT5_AVAILABLE = False

# ==============================================================================
# 1. QUANT CONFIGURATION & HYPERPARAMETERS (XAUUSD / Gold)
# ==============================================================================
PRIMARY_SYMBOL      = "XAUUSD"
FALLBACK_SYMBOLS    = ["XAUUSD", "GOLD", "XAUUSDm", "XAUUSD.a", "XAUUSD.raw", "XAUUSD_i"]
BARS_COUNT          = 10000          # Total historical bars to fetch
TIMEFRAME           = "M15"          # 15-minute timeframe
WALK_FORWARD_SPLIT  = 0.70           # 70% In-Sample (Train), 30% Out-of-Sample (Test)

# PPO Hyperparameters
PPO_EPOCHS          = 4              # Optimization epochs per rollout
PPO_CLIP_EPS        = 0.20           # Clipping parameter epsilon
PPO_LR_ACTOR        = 0.0003         # Actor learning rate (Adam)
PPO_LR_CRITIC       = 0.0010         # Critic learning rate (Adam)
PPO_GAMMA           = 0.99           # Discount factor
PPO_GAE_LAMBDA      = 0.95           # Generalized Advantage Estimation lambda
ENTROPY_COEF        = 0.02           # Entropy exploration bonus
VALUE_LOSS_COEF     = 0.50           # Value function loss weight
MAX_EPISODES        = 300            # Total training iterations

# Trading Environment Frictions & Incentives
SPREAD_COST         = 0.00015        # Spread friction for Gold (~1.5-2.0 pips)
IDLE_PENALTY        = 0.00003        # Anti-laziness penalty
OPPORTUNITY_COST    = 0.35           # Penalty for missing momentum breakout
MAX_DRAWDOWN_LIMIT  = 0.03           # 3.0% Max Drawdown Circuit Breaker

# ==============================================================================
# 2. 12-DIMENSIONAL QUANT FEATURE EXTRACTOR
# ==============================================================================
def compute_quant_features(prices, current_step, position, entry_price):
    """
    Computes 12 Normalized Stationary Institutional Quant Features:
    [0]  ret_1: 1-bar log return
    [1]  ret_3: 3-bar momentum return
    [2]  ret_8: 8-bar momentum return
    [3]  ret_21: 21-bar trend return
    [4]  rsi_14: Normalized RSI [-1, 1]
    [5]  volatility_atr: Normalized 14-bar Realized Volatility
    [6]  sma_distance: Distance to 50 EMA
    [7]  bollinger_pct_b: Normalized Bollinger %B [-0.5, +0.5]
    [8]  session_sin: Cyclical Intraday Time Sin (0 to 96 bars)
    [9]  session_cos: Cyclical Intraday Time Cos (0 to 96 bars)
    [10] current_pos: Position State (-1.0=Short, 0.0=Flat, +1.0=Long)
    [11] unrealized_pnl: Open Trade PnL %
    """
    idx = current_step
    p = prices
    price_now = p[idx]

    # [0..3] Multi-Horizon Momentum & Returns
    ret1  = np.log(price_now / p[idx - 1]) * 100.0
    ret3  = np.log(price_now / p[idx - 3]) * 100.0
    ret8  = np.log(price_now / p[idx - 8]) * 100.0
    ret21 = np.log(price_now / p[idx - 21]) * 100.0

    # [4] RSI-14 (Relative Strength Index)
    deltas = np.diff(p[idx - 14 : idx + 1])
    gains = np.where(deltas > 0, deltas, 0.0)
    losses = np.where(deltas < 0, -deltas, 0.0)
    avg_gain = np.mean(gains) if len(gains) > 0 else 1e-7
    avg_loss = np.mean(losses) if len(losses) > 0 else 1e-7
    rs = avg_gain / (avg_loss + 1e-7)
    rsi = 100.0 - (100.0 / (1.0 + rs))
    rsi_norm = (rsi - 50.0) / 50.0  # Normalized to [-1.0, +1.0]

    # [5] Realized Volatility / Normalized ATR
    window_vol = p[idx - 14 : idx + 1]
    vol_atr = (np.std(window_vol) / price_now) * 100.0

    # [6] Distance to EMA-50
    ema_window = p[max(0, idx - 50) : idx + 1]
    ema50 = np.mean(ema_window)
    sma_dist = ((price_now - ema50) / price_now) * 100.0

    # [7] Bollinger %B
    bb_window = p[idx - 20 : idx + 1]
    bb_mean = np.mean(bb_window)
    bb_std = np.std(bb_window) + 1e-7
    upper = bb_mean + 2.0 * bb_std
    lower = bb_mean - 2.0 * bb_std
    pct_b = (price_now - lower) / (upper - lower + 1e-7) - 0.5

    # [8..9] Intraday Cyclic Session Encoding (96 M15 bars per 24-hr day)
    bar_in_day = idx % 96
    session_sin = np.sin(2.0 * np.pi * bar_in_day / 96.0)
    session_cos = np.cos(2.0 * np.pi * bar_in_day / 96.0)

    # [10] Current Position
    pos_state = float(position)

    # [11] Unrealized PnL %
    if position != 0 and entry_price > 0:
        if position == 1:
            unrealized = ((price_now - entry_price) / entry_price) * 100.0
        else:
            unrealized = ((entry_price - price_now) / entry_price) * 100.0
    else:
        unrealized = 0.0

    return np.array([
        ret1, ret3, ret8, ret21,
        rsi_norm, vol_atr, sma_dist, pct_b,
        session_sin, session_cos,
        pos_state, unrealized
    ], dtype=np.float32)

# ==============================================================================
# 3. HIGH-FIDELITY TRADING ENVIRONMENT
# ==============================================================================
class QuantTradingEnvironment:
    def __init__(self, prices, spread=SPREAD_COST):
        self.prices = prices
        self.spread = spread
        self.n_steps = len(prices)
        self.reset()

    def reset(self):
        self.current_step = 55
        self.position = 0  # -1 = Short, 0 = Flat, 1 = Long
        self.entry_price = 0.0
        self.trades = []
        self.equity = 10000.0
        self.peak_equity = 10000.0
        self.equity_curve = [10000.0]
        return compute_quant_features(self.prices, self.current_step, self.position, self.entry_price)

    def step(self, action):
        # Actions: 0 = HOLD, 1 = BUY, 2 = SELL
        price_now = self.prices[self.current_step]
        self.current_step += 1
        price_next = self.prices[self.current_step]

        target_pos = 0
        if action == 1: target_pos = 1
        elif action == 2: target_pos = -1

        # Execute Position Transitions
        if target_pos != self.position:
            # Closing previous trade
            if self.position != 0:
                exit_price = price_now - (self.spread if self.position == 1 else -self.spread)
                if self.position == 1:
                    trade_ret = (exit_price - self.entry_price) / self.entry_price
                else:
                    trade_ret = (self.entry_price - exit_price) / self.entry_price
                self.trades.append(trade_ret)
                self.equity *= (1.0 + trade_ret)
                self.equity_curve.append(self.equity)
                self.peak_equity = max(self.peak_equity, self.equity)

            # Opening new position
            if target_pos != 0:
                self.entry_price = price_now + (self.spread if target_pos == 1 else -self.spread)

        market_move = (price_next - price_now) / price_now
        reward = 0.0

        # Risk-Adjusted Reward Formulation
        if target_pos == 1:
            trade_pnl = market_move
            reward += trade_pnl * 12.0
        elif target_pos == -1:
            trade_pnl = -market_move
            reward += trade_pnl * 12.0
        else:
            # Idle cost & Opportunity Cost
            reward -= IDLE_PENALTY * 10.0
            if abs(market_move) > 0.0015:
                reward -= (abs(market_move) * OPPORTUNITY_COST) * 10.0

        # Spread transaction cost deduction
        if target_pos != self.position:
            reward -= self.spread * 10.0

        # Drawdown circuit breaker penalty
        current_dd = (self.peak_equity - self.equity) / self.peak_equity
        if current_dd > MAX_DRAWDOWN_LIMIT:
            reward -= (current_dd * 5.0)

        self.position = target_pos
        done = (self.current_step >= self.n_steps - 2)
        next_state = compute_quant_features(self.prices, self.current_step, self.position, self.entry_price)
        return next_state, reward, done

    def evaluate_performance(self):
        if not self.trades:
            return {
                "win_rate": 0.0,
                "sharpe": 0.0,
                "total_trades": 0,
                "return_pct": 0.0,
                "max_drawdown": 0.0
            }

        t_arr = np.array(self.trades)
        wins = np.sum(t_arr > 0)
        total = len(t_arr)
        win_rate = (wins / total) * 100.0
        ret_pct = ((self.equity - 10000.0) / 10000.0) * 100.0

        std = np.std(t_arr) + 1e-7
        sharpe = (np.mean(t_arr) / std) * np.sqrt(252.0 * (96.0 / 4.0))

        eq = np.array(self.equity_curve)
        peaks = np.maximum.accumulate(eq)
        dds = (peaks - eq) / peaks
        max_dd = float(np.max(dds)) * 100.0 if len(dds) > 0 else 0.0

        return {
            "win_rate": win_rate,
            "sharpe": sharpe,
            "total_trades": total,
            "return_pct": ret_pct,
            "max_drawdown": max_dd
        }

# ==============================================================================
# 4. PPO ACTOR-CRITIC NEURAL ARCHITECTURE
# ==============================================================================
class ActorCriticPPO(nn.Module):
    def __init__(self, state_dim=12, action_dim=3):
        super(ActorCriticPPO, self).__init__()

        # Actor Network (Policy Head - Outputs Probabilities [Hold, Buy, Sell])
        self.actor = nn.Sequential(
            nn.Linear(state_dim, 128),
            nn.GELU(),
            nn.Dropout(p=0.10),
            nn.Linear(128, 64),
            nn.GELU(),
            nn.Linear(64, action_dim),
            nn.Softmax(dim=-1)
        )

        # Critic Network (Value Head - Estimates State Value V(s))
        self.critic = nn.Sequential(
            nn.Linear(state_dim, 128),
            nn.GELU(),
            nn.Linear(128, 64),
            nn.GELU(),
            nn.Linear(64, 1)
        )

        # Orthogonal Layer Weight Initialization
        self.apply(self._init_weights)

    def _init_weights(self, m):
        if isinstance(m, nn.Linear):
            nn.init.orthogonal_(m.weight, gain=np.sqrt(2))
            nn.init.constant_(m.bias, 0.0)

    def forward(self, state):
        # Forward pass used for ONNX export & deployment
        return self.actor(state)

    def get_action_and_value(self, state, action=None):
        probs = self.actor(state)
        dist = torch.distributions.Categorical(probs)
        if action is None:
            action = dist.sample()
        value = self.critic(state)
        return action, dist.log_prob(action), dist.entropy(), value

# ==============================================================================
# 5. DATA INGESTION ENGINE (MT5 or Realistic Geometric Brownian Motion)
# ==============================================================================
def load_market_data(n_bars=BARS_COUNT):
    print("--------------------------------------------------")
    print(f"[INFO] Ingesting Market Data for Symbol: {PRIMARY_SYMBOL} ({TIMEFRAME})...")

    if MT5_AVAILABLE and mt5.initialize():
        try:
            terminal_info = mt5.terminal_info()
            term_name = terminal_info.name if terminal_info else "MetaTrader 5"
            print(f"[OK] Connected to {term_name} Terminal Engine.")

            sym_selected = None
            for sym in FALLBACK_SYMBOLS:
                if mt5.symbol_info(sym) is not None:
                    sym_selected = sym
                    break

            if sym_selected is None:
                sym_selected = PRIMARY_SYMBOL

            mt5.symbol_select(sym_selected, True)
            rates = mt5.copy_rates_from_pos(sym_selected, mt5.TIMEFRAME_M15, 0, n_bars)
            mt5.shutdown()

            if rates is not None and len(rates) > 500:
                prices = rates['close'].astype(np.float64)
                print(f"[OK] Ingested {len(prices)} Live Historical Bars for {sym_selected}")
                print(f"     Price Span: ${prices.min():.2f} - ${prices.max():.2f} (Latest: ${prices[-1]:.2f})")
                return prices
        except Exception as e:
            print(f"[WARN] MT5 Ingestion Exception: {e}")
            try: mt5.shutdown()
            except: pass

    # High-Resolution Synthetic Gold Regime Simulation
    print("[SIMULATION] Generating Institutional Geometric Brownian Motion for Gold...")
    np.random.seed(42)
    dt = 1.0 / (252.0 * 96.0)
    mu = 0.05
    sigma = 0.18
    returns = np.random.normal(loc=(mu - 0.5 * sigma**2) * dt, scale=sigma * np.sqrt(dt), size=n_bars)
    prices = 2450.0 * np.cumprod(1.0 + returns)
    return prices

# ==============================================================================
# 6. PPO TRAINING LOOP WITH GENERALIZED ADVANTAGE ESTIMATION (GAE)
# ==============================================================================
def train_ppo_agent():
    print("==================================================================")
    print("  🚀 FXFORGE INSTITUTIONAL PPO ACTOR-CRITIC DRL TRAINER (12 FEATURES) ")
    print("==================================================================")

    all_prices = load_market_data(BARS_COUNT)
    split_idx = int(len(all_prices) * WALK_FORWARD_SPLIT)

    train_prices = all_prices[:split_idx]
    val_prices = all_prices[split_idx:]

    print(f"\n[WALK-FORWARD PARTITIONING]")
    print(f"  • In-Sample (Train) Dataset : {len(train_prices)} bars (70%)")
    print(f"  • Out-of-Sample (Test) Data  : {len(val_prices)} bars (30%)")

    train_env = QuantTradingEnvironment(train_prices, spread=SPREAD_COST)
    val_env   = QuantTradingEnvironment(val_prices, spread=SPREAD_COST)

    agent = ActorCriticPPO(state_dim=12, action_dim=3)
    optimizer = optim.Adam([
        {'params': agent.actor.parameters(), 'lr': PPO_LR_ACTOR},
        {'params': agent.critic.parameters(), 'lr': PPO_LR_CRITIC}
    ])

    print(f"\n[NEURAL SPECIFICATION]")
    print(f"  • State Dimension : 12 Quant Multi-Regime Inputs")
    print(f"  • Action Space     : 3 Actions (0=HOLD, 1=BUY, 2=SELL)")
    print(f"  • Actor Architecture: 12 -> 128 (GELU) -> Dropout(0.1) -> 64 -> 3 (Softmax)")
    print(f"  • Critic Architecture: 12 -> 128 (GELU) -> 64 -> 1 (Value)")
    print(f"  • PPO Clip Epsilon: {PPO_CLIP_EPS} | GAE Lambda: {PPO_GAE_LAMBDA} | Gamma: {PPO_GAMMA}")
    print("\nStarting PPO Rollouts...")

    best_val_sharpe = -999.0

    for ep in range(1, MAX_EPISODES + 1):
        state = train_env.reset()
        states, actions, log_probs, rewards, values, dones = [], [], [], [], [], []
        done = False
        action_hist = {0: 0, 1: 0, 2: 0}

        # 1. Rollout Trajectory Collection
        while not done:
            state_tensor = torch.FloatTensor(state).unsqueeze(0)
            with torch.no_grad():
                action, log_prob, _, value = agent.get_action_and_value(state_tensor)

            next_state, reward, done = train_env.step(action.item())

            states.append(state)
            actions.append(action.item())
            log_probs.append(log_prob.item())
            rewards.append(reward)
            values.append(value.item())
            dones.append(done)

            action_hist[action.item()] += 1
            state = next_state

        # 2. Generalized Advantage Estimation (GAE)
        with torch.no_grad():
            last_state_t = torch.FloatTensor(state).unsqueeze(0)
            next_val = agent.critic(last_state_t).item()

        advantages = np.zeros(len(rewards), dtype=np.float32)
        last_gae = 0.0
        for t in reversed(range(len(rewards))):
            next_non_terminal = 1.0 - float(dones[t])
            next_value = next_val if t == len(rewards) - 1 else values[t + 1]
            delta = rewards[t] + PPO_GAMMA * next_value * next_non_terminal - values[t]
            last_gae = delta + PPO_GAMMA * PPO_GAE_LAMBDA * next_non_terminal * last_gae
            advantages[t] = last_gae

        returns = advantages + np.array(values)
        adv_tensor = torch.FloatTensor(advantages)
        adv_tensor = (adv_tensor - adv_tensor.mean()) / (adv_tensor.std() + 1e-8)

        states_t   = torch.FloatTensor(np.array(states))
        actions_t  = torch.LongTensor(actions)
        old_lp_t   = torch.FloatTensor(log_probs)
        returns_t  = torch.FloatTensor(returns)

        # 3. PPO Surrogate Objective Optimization (Mini-Epochs)
        dataset_size = len(states)
        batch_size = 256

        for _ in range(PPO_EPOCHS):
            indices = np.random.permutation(dataset_size)
            for start in range(0, dataset_size, batch_size):
                end = start + batch_size
                m_idx = indices[start:end]

                b_states = states_t[m_idx]
                b_actions = actions_t[m_idx]
                b_old_lp = old_lp_t[m_idx]
                b_adv = adv_tensor[m_idx]
                b_returns = returns_t[m_idx]

                _, new_lp, entropy, new_values = agent.get_action_and_value(b_states, b_actions)

                # Ratio: r(theta) = exp(new_lp - old_lp)
                ratio = torch.exp(new_lp - b_old_lp)

                # Clipped Policy Objective
                surr1 = ratio * b_adv
                surr2 = torch.clamp(ratio, 1.0 - PPO_CLIP_EPS, 1.0 + PPO_CLIP_EPS) * b_adv
                actor_loss = -torch.min(surr1, surr2).mean()

                # Value Function Loss
                value_loss = 0.5 * ((new_values.squeeze(-1) - b_returns) ** 2).mean()

                # Entropy Exploration Loss
                entropy_loss = entropy.mean()

                total_loss = actor_loss + VALUE_LOSS_COEF * value_loss - ENTROPY_COEF * entropy_loss

                optimizer.zero_grad()
                total_loss.backward()
                nn.utils.clip_grad_norm_(agent.parameters(), 0.5)
                optimizer.step()

        # 4. Out-of-Sample (Walk-Forward) Validation Evaluation
        if ep % 20 == 0 or ep == 1 or ep == MAX_EPISODES:
            train_metrics = train_env.evaluate_performance()

            # Run deterministic test on unseen 30% test dataset
            agent.eval()
            val_state = val_env.reset()
            val_done = False
            while not val_done:
                val_state_t = torch.FloatTensor(val_state).unsqueeze(0)
                with torch.no_grad():
                    probs = agent.actor(val_state_t)
                    act = torch.argmax(probs, dim=-1).item()
                val_state, _, val_done = val_env.step(act)

            val_metrics = val_env.evaluate_performance()
            agent.train()

            total_act = sum(action_hist.values())
            pct_buy = (action_hist[1] / total_act) * 100.0
            pct_sell = (action_hist[2] / total_act) * 100.0
            pct_hold = (action_hist[0] / total_act) * 100.0

            print(f"Epoch [{ep:03d}/{MAX_EPISODES}] | Train Sharpe: {train_metrics['sharpe']:+5.2f} (WR: {train_metrics['win_rate']:4.1f}%) | "
                  f"Out-of-Sample Sharpe: {val_metrics['sharpe']:+5.2f} (WR: {val_metrics['win_rate']:4.1f}%, DD: {val_metrics['max_drawdown']:4.1f}%) | "
                  f"B/S/H: {pct_buy:3.0f}%/{pct_sell:3.0f}%/{pct_hold:3.0f}%")

            if val_metrics['sharpe'] > best_val_sharpe:
                best_val_sharpe = val_metrics['sharpe']

    # ==============================================================================
    # 7. EXPORT DEPLOYMENT ONNX FOR METATRADER 5 (12 FEATURES)
    # ==============================================================================
    onnx_filename = "rl_trading_model.onnx"
    print(f"\n==================================================================")
    print(f"Exporting Production 12-Feature PPO ONNX Model to '{onnx_filename}'...")
    agent.eval()
    dummy_input = torch.randn(1, 12, dtype=torch.float32)

    try:
        torch.onnx.export(
            agent,
            dummy_input,
            onnx_filename,
            export_params=True,
            opset_version=14,
            do_constant_folding=True,
            input_names=['state_input_12'],
            output_names=['action_probabilities'],
            dynamic_axes=None,
            dynamo=False
        )
    except TypeError:
        torch.onnx.export(
            agent,
            dummy_input,
            onnx_filename,
            export_params=True,
            opset_version=14,
            do_constant_folding=True,
            input_names=['state_input_12'],
            output_names=['action_probabilities'],
            dynamic_axes=None
        )

    print(f"✅ [SUCCESS] Institutional PPO Model Saved: {os.path.abspath(onnx_filename)}")
    print(f"   Inputs: 12-dim Normalized Quant Vector | Outputs: [P(Hold), P(Buy), P(Sell)]")
    print("==================================================================")

if __name__ == "__main__":
    train_ppo_agent()
