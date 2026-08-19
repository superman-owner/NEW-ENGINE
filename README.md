# ⚡ FXFORGE NEW ENGINE
### Institutional PPO Deep Reinforcement Learning Trading Engine (12-Feature Quant Studio)

A high-performance algorithmic trading studio powered by **Proximal Policy Optimization (PPO)** Actor-Critic Deep Reinforcement Learning, **Generalized Advantage Estimation (GAE)**, Walk-Forward Cross Validation, and 1-Click **ONNX & MetaTrader 5 (MQL5)** deployment.

---

## 🌟 Key Features

1. **🧠 Institutional PPO Actor-Critic Core:**
   - **Actor Policy Network**: 12 Quant Features $\to$ 128 (GELU) $\to$ Dropout(0.1) $\to$ 64 $\to$ 3 Actions (`HOLD`, `BUY`, `SELL`).
   - **Critic Value Network**: 12 Quant Features $\to$ 128 (GELU) $\to$ 64 $\to$ 1 Value Estimate $V(s)$.
   - **Generalized Advantage Estimation (GAE)** ($\gamma = 0.99, \lambda = 0.95, \epsilon = 0.20$).

2. **📊 12 Normalized Stationary Quant Features:**
   - Multi-Horizon Momentum (`Ret1`, `Ret3`, `Ret8`, `Ret21`)
   - Momentum Oscillators (`RSI-14` normalized to $[-1.0, +1.0]$)
   - Realized Volatility (`ATR-14` / Price)
   - Trend Divergence (`EMA-50 Distance`)
   - Bandwidth Volatility (`Bollinger %B`)
   - Intraday Cyclical Time Embeddings (`SinT`, `CosT`)
   - Position & Floating Profit/Loss (`Position State`, `Unrealized PnL %`)

3. **📈 Multi-Tab Cockpit Visualizer:**
   - **Tab 1: 📈 RL Reward Curve & Telemetry**: In-Sample Train Reward vs Out-of-Sample Test Curve + 10-Ep Moving Average.
   - **Tab 2: 🔮 3D Neural Link**: Real-time 3D Matrix showing 12 inputs, latent activations, and firing synapses.
   - **Tab 3: 📋 Live Execution Journal**: Simulated fill prices, trade durations, return %, PnL USD, and export to CSV.
   - **Tab 4: 🛡️ Monte Carlo Stress Test**: 1,000 Permutations Risk Distribution & 95% Value at Risk (VaR).

4. **🚀 1-Click MetaTrader 5 & ONNX Export:**
   - Export standalone `rl_trading_model.onnx`
   - Export production `ONNX_RL_Trader_EA.mq5`

---

## 🛠️ Quick Start

```bash
# Install dependencies
npm install

# Start Dev Server
npm run dev

# Or run Standalone Python PPO Engine
python engine_ppo.py
```
