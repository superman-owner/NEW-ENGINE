import type { Node } from '@xyflow/react';

export const generatePythonScript = (nodes: Node[]): string => {
  const dataNode = nodes.find((n) => (n.data as any)?.category === 'data');
  const modelNode = nodes.find((n) => (n.data as any)?.category === 'model');
  const backtestNode = nodes.find((n) => (n.data as any)?.category === 'backtest');

  const symbol = (dataNode?.data?.params as any)?.symbol || 'BTC/USDT';
  const timeframe = (dataNode?.data?.params as any)?.timeframe || '15m';
  const lr = (modelNode?.data?.params as any)?.learningRate || 0.03;
  const nEst = (modelNode?.data?.params as any)?.nEstimators || 600;
  const depth = (modelNode?.data?.params as any)?.maxDepth || 6;
  const fee = (backtestNode?.data?.params as any)?.takerFee || 0.0004;

  return `"""
=============================================================================
  AlphaFlow AI - Automated Production Quantitative Strategy
  Generated from Node Flow Pipeline DAG
  Symbol: ${symbol} | Timeframe: ${timeframe}
=============================================================================
"""

import sys
import time
import ccxt
import numpy as np
import pandas as pd
import pandas_ta as ta
import lightgbm as lgb
from datetime import datetime

# ---------------------------------------------------------------------------
# 1. DATA INGESTION (CCXT Exchange Connector)
# ---------------------------------------------------------------------------
def fetch_market_data(symbol="${symbol}", timeframe="${timeframe}", limit=5000):
    print(f"[*] Ingesting {symbol} ({timeframe}) market data from Binance...")
    exchange = ccxt.binance({
        'enableRateLimit': True,
        'options': {'defaultType': 'future'}
    })
    
    ohlcv = exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
    df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
    df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
    df.set_index('timestamp', inplace=True)
    return df

# ---------------------------------------------------------------------------
# 2. FEATURE ENGINEERING (Stationary Memory + Technical Dynamics)
# ---------------------------------------------------------------------------
def compute_features(df: pd.DataFrame) -> pd.DataFrame:
    print("[*] Computing Technical Indicators and Feature Transforms...")
    df = df.copy()
    
    # Momentum & Trend
    df['rsi_14'] = ta.rsi(df['close'], length=14)
    macd = ta.macd(df['close'], fast=12, slow=26, signal=9)
    df['macd_hist'] = macd['MACDh_12_26_9']
    
    # Volatility
    df['atr_14'] = ta.atr(df['high'], df['low'], df['close'], length=14)
    df['atr_ratio'] = df['atr_14'] / df['close']
    
    # Moving Averages Spread
    df['ema_20'] = ta.ema(df['close'], length=20)
    df['ema_50'] = ta.ema(df['close'], length=50)
    df['ema_spread'] = (df['ema_20'] - df['ema_50']) / df['close']
    
    # Log Returns
    df['log_ret_1'] = np.log(df['close'] / df['close'].shift(1))
    df['log_ret_5'] = np.log(df['close'] / df['close'].shift(5))
    
    # Clean NaNs
    df.dropna(inplace=True)
    return df

# ---------------------------------------------------------------------------
# 3. TRIPLE BARRIER LABELING (Marcos López de Prado)
# ---------------------------------------------------------------------------
def generate_triple_barrier_labels(df: pd.DataFrame, pt_mult=2.0, sl_mult=1.5, vertical_bars=24):
    print("[*] Applying Triple Barrier Labeling (TP / SL / Time)...")
    daily_vol = df['atr_ratio']
    
    labels = []
    close_prices = df['close'].values
    n = len(df)
    
    for i in range(n - vertical_bars):
        pt = close_prices[i] * (1 + pt_mult * daily_vol.iloc[i])
        sl = close_prices[i] * (1 - sl_mult * daily_vol.iloc[i])
        future_window = close_prices[i+1 : i+1+vertical_bars]
        
        hit_pt = np.where(future_window >= pt)[0]
        hit_sl = np.where(future_window <= sl)[0]
        
        first_pt = hit_pt[0] if len(hit_pt) > 0 else 999
        first_sl = hit_sl[0] if len(hit_sl) > 0 else 999
        
        if first_pt < first_sl:
            labels.append(1)   # Profit Target Hit (Long)
        elif first_sl < first_pt:
            labels.append(0)   # Stop Loss Hit
        else:
            labels.append(0)   # Vertical Barrier expired
            
    # Pad remainder
    labels.extend([0] * (n - len(labels)))
    df['label'] = labels
    return df

# ---------------------------------------------------------------------------
# 4. MODEL TRAINING (LightGBM Walk-Forward Purged Pipeline)
# ---------------------------------------------------------------------------
def train_alpha_model(df: pd.DataFrame):
    print("[*] Training LightGBM Alpha Classifier...")
    feature_cols = ['rsi_14', 'macd_hist', 'atr_ratio', 'ema_spread', 'log_ret_1', 'log_ret_5']
    
    # 80% Train, 20% Out-Of-Sample Validation
    split_idx = int(len(df) * 0.8)
    X_train, y_train = df[feature_cols].iloc[:split_idx], df['label'].iloc[:split_idx]
    X_val, y_val = df[feature_cols].iloc[split_idx:], df['label'].iloc[split_idx:]
    
    train_data = lgb.Dataset(X_train, label=y_train)
    val_data = lgb.Dataset(X_val, label=y_val, reference=train_data)
    
    params = {
        'objective': 'binary',
        'metric': 'auc',
        'learning_rate': ${lr},
        'num_leaves': 31,
        'max_depth': ${depth},
        'verbosity': -1,
        'seed': 42
    }
    
    model = lgb.train(
        params,
        train_data,
        num_boost_round=${nEst},
        valid_sets=[val_data],
        callbacks=[lgb.early_stopping(50)]
    )
    
    # Predict probabilities
    df['pred_prob'] = model.predict(df[feature_cols])
    return model, df

# ---------------------------------------------------------------------------
# 5. EXECUTION & SIMULATED RUNNER
# ---------------------------------------------------------------------------
if __name__ == '__main__':
    print("=== STARTING ALPHAFLOW AI ENGINE ===")
    raw_df = fetch_market_data()
    feat_df = compute_features(raw_df)
    labeled_df = generate_triple_barrier_labels(feat_df)
    model, final_df = train_alpha_model(labeled_df)
    
    # Save model weights
    model.save_model('alpha_lightgbm_model.txt')
    print("[+] Model saved to alpha_lightgbm_model.txt successfully.")
    print("[✓] Ready for live paper trading with Fee: ${fee * 100}%")
`;
};
