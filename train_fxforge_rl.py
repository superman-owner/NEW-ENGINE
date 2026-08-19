# ==============================================================================
# train_rl_trader.py
# Deep Reinforcement Learning with Active Trading Incentives & Inactivity Penalty
# ==============================================================================
import os
import sys
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
# CONFIGURATION SETTINGS (Gold / XAUUSD)
# ==============================================================================
PRIMARY_SYMBOL   = "XAUUSD"
FALLBACK_SYMBOLS = ["XAUUSD", "GOLD", "XAUUSDm", "XAUUSD.a", "XAUUSD.raw", "XAUUSD_i"]
BARS_COUNT       = 10000            # 10,000 แท่งเทียน
EPISODES         = 400              # จำนวนรอบการเทรน
LEARNING_RATE    = 0.002            # Learning Rate
SPREAD_COST      = 0.00015          # ค่า Spread สำหรับทองคำ
IDLE_PENALTY     = 0.00005          # บทลงโทษการ "อยู่เฉยๆ ไม่ทำอะไร" (Anti-Lazy Penalty)
OPPORTUNITY_COST = 0.50             # บทลงโทษเมื่อ "พลาดโอกาสกำไรก้อนใหญ่"
ENTROPY_WEIGHT   = 0.08             # บังคับกระจายความน่าจะเป็น ป้องกัน 100% Hold Collapse

# ------------------------------------------------------------------------------
# 1. Fetch Real Data from MetaTrader 5
# ------------------------------------------------------------------------------
def get_training_data(n_bars=BARS_COUNT):
    print("--------------------------------------------------")
    print(f"[INFO] Connecting to MetaTrader 5 to fetch Gold ({PRIMARY_SYMBOL}) data...")
    
    if MT5_AVAILABLE and mt5.initialize():
        try:
            terminal_info = mt5.terminal_info()
            terminal_name = terminal_info.name if terminal_info else "MT5"
            print(f"[OK] Connected to MT5 Terminal: {terminal_name}")
            
            selected_symbol = None
            for sym in FALLBACK_SYMBOLS:
                symbol_info = mt5.symbol_info(sym)
                if symbol_info is not None:
                    selected_symbol = sym
                    break
            
            if selected_symbol is None:
                selected_symbol = PRIMARY_SYMBOL
                
            mt5.symbol_select(selected_symbol, True)
            rates = mt5.copy_rates_from_pos(selected_symbol, mt5.TIMEFRAME_M15, 0, n_bars)
            mt5.shutdown()
            
            if rates is not None and len(rates) > 100:
                prices = rates['close'].astype(np.float64)
                print(f"[OK] Loaded {len(prices)} REAL historical bars of {selected_symbol} (M15)")
                print(f"     Price Range: Min=${prices.min():.2f} | Max=${prices.max():.2f} | Latest=${prices[-1]:.2f}")
                return prices
            else:
                print(f"[WARN] Symbol '{selected_symbol}' not found in Market Watch.")
        except Exception as e:
            print(f"[WARN] MT5 communication error: {e}")
            try:
                mt5.shutdown()
            except Exception:
                pass
    else:
        print("[WARN] Could not connect to active MT5 terminal.")

    # High-Volatility Fallback Simulation
    print("[FALLBACK] Simulating Gold (XAUUSD) Market Price Series...")
    np.random.seed(42)
    daily_vol = 0.0035
    returns = np.random.normal(0.0001, daily_vol, n_bars)
    prices = 2400.0 * np.cumprod(1 + returns)
    return prices

# ------------------------------------------------------------------------------
# 2. Trading Environment (With Inaction & Opportunity Penalties)
# ------------------------------------------------------------------------------
class TradingEnvironment:
    def __init__(self, prices, spread=SPREAD_COST):
        self.prices = prices
        self.spread = spread
        self.n_steps = len(prices)
        self.reset()

    def reset(self):
        self.current_step = 25
        self.position = 0  # -1 = Short, 0 = Flat, 1 = Long
        return self._get_state()

    def _get_state(self):
        p = self.prices
        idx = self.current_step
        
        # 6 Scaled Stationary Features
        ret5 = (p[idx] - p[idx-5]) / p[idx-5] * 100.0
        ret10 = (p[idx] - p[idx-10]) / p[idx-10] * 100.0
        ret20 = (p[idx] - p[idx-20]) / p[idx-20] * 100.0
        volatility = (np.std(p[idx-10:idx+1]) / p[idx]) * 100.0
        sma20 = np.mean(p[idx-20:idx+1])
        dist_sma = ((p[idx] - sma20) / p[idx]) * 100.0
        
        return np.array([ret5, ret10, ret20, volatility, dist_sma, float(self.position)], dtype=np.float32)

    def step(self, action):
        # Actions: 0 = HOLD / FLAT, 1 = BUY, 2 = SELL
        price_now = self.prices[self.current_step]
        self.current_step += 1
        price_next = self.prices[self.current_step]
        
        target_pos = 0
        if action == 1: target_pos = 1
        elif action == 2: target_pos = -1

        market_move = (price_next - price_now) / price_now

        reward = 0.0

        if target_pos == 1:
            # กำไร/ขาดทุนจากการ Buy
            trade_pnl = market_move
            reward += trade_pnl * 10.0
        elif target_pos == -1:
            # กำไร/ขาดทุนจากการ Sell
            trade_pnl = -market_move
            reward += trade_pnl * 10.0
        else:
            # [บทลงโทษเมื่ออยู่เฉยๆ ไม่ทำอะไร - IDLE PENALTY]
            reward -= IDLE_PENALTY * 10.0
            
            # [บทลงโทษเมื่อพลาดโอกาสกำไรก้อนใหญ่ - OPPORTUNITY COST]
            if abs(market_move) > 0.0015: # ถ้าตลาดวิ่งแรง (> 0.15%) แต่นั่งเฉยๆ โดนหักคะแนน
                reward -= (abs(market_move) * OPPORTUNITY_COST) * 10.0

        # ค่าธรรมเนียม Spread เมื่อเปลี่ยนสถานะ
        if target_pos != self.position:
            reward -= self.spread * 10.0

        self.position = target_pos
        done = (self.current_step >= self.n_steps - 2)
        next_state = self._get_state()
        return next_state, reward, done

# ------------------------------------------------------------------------------
# 3. Neural Network Policy (Actor Network)
# ------------------------------------------------------------------------------
class PolicyNetwork(nn.Module):
    def __init__(self, input_dim=6, action_dim=3):
        super(PolicyNetwork, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.LeakyReLU(0.1),
            nn.Linear(64, 32),
            nn.LeakyReLU(0.1),
            nn.Linear(32, action_dim),
            nn.Softmax(dim=-1) # คืนค่าความน่าจะเป็น [P(Hold), P(Buy), P(Sell)]
        )

    def forward(self, x):
        return self.net(x)

# ------------------------------------------------------------------------------
# 4. Training Loop with Entropy Regularization (Anti-100% Hold)
# ------------------------------------------------------------------------------
def train_agent():
    print("==================================================")
    print("    Training Active Deep RL Agent for Gold (XAU)  ")
    print("==================================================")
    
    prices = get_training_data(BARS_COUNT)
    env = TradingEnvironment(prices, spread=SPREAD_COST)
    model = PolicyNetwork(input_dim=6, action_dim=3)
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

    print(f"\nTraining Gold AI Agent across {EPISODES} market episodes...")
    print(f"Anti-Inactivity Penalty Active: IDLE_PENALTY={IDLE_PENALTY}, ENTROPY={ENTROPY_WEIGHT}")

    for ep in range(EPISODES):
        state = env.reset()
        log_probs = []
        rewards = []
        entropies = []
        done = False
        action_counts = {0: 0, 1: 0, 2: 0}

        while not done:
            state_t = torch.FloatTensor(state).unsqueeze(0)
            probs = model(state_t)
            
            dist = torch.distributions.Categorical(probs)
            action = dist.sample()

            log_prob = dist.log_prob(action)
            entropy = dist.entropy()
            next_state, reward, done = env.step(action.item())

            log_probs.append(log_prob)
            rewards.append(reward)
            entropies.append(entropy)
            action_counts[action.item()] += 1
            state = next_state

        # Discounted Cumulative Rewards
        discounted_rewards = []
        R = 0
        for r in reversed(rewards):
            R = r + 0.95 * R
            discounted_rewards.insert(0, R)

        discounted_rewards = torch.tensor(discounted_rewards, dtype=torch.float32)
        if len(discounted_rewards) > 1 and discounted_rewards.std() > 1e-7:
            discounted_rewards = (discounted_rewards - discounted_rewards.mean()) / (discounted_rewards.std() + 1e-7)

        # Policy Gradient Loss + ENTROPY BONUS (ป้องกันไม่ให้โมเดลติด Hold 100%)
        policy_loss = 0
        entropy_loss = torch.stack(entropies).mean()
        
        for log_p, r in zip(log_probs, discounted_rewards):
            policy_loss -= log_p * r

        total_loss = policy_loss - (ENTROPY_WEIGHT * entropy_loss)

        optimizer.zero_grad()
        total_loss.backward()
        optimizer.step()

        if (ep + 1) % 50 == 0 or ep == 0:
            total_r = sum(rewards)
            total_actions = sum(action_counts.values())
            pct_hold = (action_counts[0] / total_actions) * 100
            pct_buy  = (action_counts[1] / total_actions) * 100
            pct_sell = (action_counts[2] / total_actions) * 100
            print(f"Episode [{ep+1:03d}/{EPISODES}] | Reward: {total_r:+7.2f} | Hold: {pct_hold:4.1f}% | Buy: {pct_buy:4.1f}% | Sell: {pct_sell:4.1f}%")

    # --------------------------------------------------------------------------
    # 5. Export Active Trading Model to ONNX for MetaTrader 5
    # --------------------------------------------------------------------------
    onnx_filename = "rl_trading_model.onnx"
    print(f"\nExporting Active Gold model to '{onnx_filename}'...")
    model.eval()
    dummy_input = torch.randn(1, 6, dtype=torch.float32)

    try:
        torch.onnx.export(
            model,
            dummy_input,
            onnx_filename,
            export_params=True,
            opset_version=14,
            do_constant_folding=True,
            input_names=['state_input'],
            output_names=['action_probs'],
            dynamic_axes=None,
            dynamo=False
        )
    except TypeError:
        torch.onnx.export(
            model,
            dummy_input,
            onnx_filename,
            export_params=True,
            opset_version=14,
            do_constant_folding=True,
            input_names=['state_input'],
            output_names=['action_probs'],
            dynamic_axes=None
        )

    print(f"[SUCCESS] Active Gold Model trained and saved as '{onnx_filename}' (Ready for MT5!)")

if __name__ == "__main__":
    train_agent()
