//+--------------------------------------------------------------------------------------+
//|                                                          ONNX_RL_Trader_EA.mq5      |
//|                                             Copyright (c) 2026, FXFORGE AI Quant     |
//|                                                                 https://www.mql5.com |
//+--------------------------------------------------------------------------------------+
#property copyright   "Copyright (c) 2026, FXFORGE AI Quant"
#property link        "https://www.mql5.com"
#property version     "3.00"
#property description "Institutional PPO Actor-Critic DRL EA for Gold (12 Features)"

#include <Trade\Trade.mqh>
#include <Trade\PositionInfo.mqh>
#include <Trade\AccountInfo.mqh>
#include <Trade\SymbolInfo.mqh>

//--- Resource Embedding: Embeds ONNX model directly inside the EA binary
#resource "\\Files\\rl_trading_model.onnx" as uchar ExtModelBuffer[];

//+--------------------------------------------------------------------------------------+
//| INPUT PARAMETERS                                                                     |
//+--------------------------------------------------------------------------------------+
input group "=== [1] AI / Model Parameters ==="
input double   InpConfidenceThreshold = 0.40;   // Min Probability to Trigger Trade (e.g. > 40%)

input group "=== [2] Risk & Money Management ==="
input double   InpFixedLot            = 0.01;   // Fixed Lot Size
input int      InpStopLossPoints      = 400;    // Stop Loss in Points ($4 on Gold)
input int      InpTakeProfitPoints    = 800;    // Take Profit in Points ($8 on Gold)
input int      InpMaxSpreadPoints     = 50;     // Max Allowed Spread in Points

input group "=== [3] Trailing Stop ==="
input bool     InpUseTrailing         = true;   // Enable Trailing Stop
input int      InpTrailingStart       = 250;    // Trailing Start (Points in profit)
input int      InpTrailingStep        = 50;     // Trailing Step (Points)

input group "=== [4] System Settings ==="
input ulong    InpMagicNumber         = 112233; // EA Magic Number
input string   InpTradeComment        = "PPO_ONNX_GOLD_12F";

//+--------------------------------------------------------------------------------------+
//| GLOBAL VARIABLES                                                                     |
//+--------------------------------------------------------------------------------------+
CTrade         m_trade;
CPositionInfo  m_position;
CAccountInfo   m_account;
CSymbolInfo    m_symbol;

long           m_onnx_handle   = INVALID_HANDLE;
datetime       m_last_bar_time = 0;

//+--------------------------------------------------------------------------------------+
//| INITIALIZATION                                                                       |
//+--------------------------------------------------------------------------------------+
int OnInit()
{
   if(!m_symbol.Name(_Symbol)) return INIT_FAILED;
   m_symbol.Refresh();

   m_trade.SetExpertMagicNumber(InpMagicNumber);
   m_trade.SetDeviationInPoints(15);
   m_trade.SetTypeFillingBySymbol(_Symbol);

   // 1. Create ONNX Model from Embedded Buffer
   m_onnx_handle = OnnxCreateFromBuffer(ExtModelBuffer, ONNX_DEFAULT);
   if(m_onnx_handle == INVALID_HANDLE)
   {
      PrintFormat("Error: Failed to create ONNX handle (Err: %d). Ensure 'rl_trading_model.onnx' is in MQL5/Files!", GetLastError());
      return INIT_FAILED;
   }

   // 2. Set Tensor Shapes: Input [1, 12], Output [1, 3]
   const long in_shape[]  = {1, 12};
   const long out_shape[] = {1, 3};

   if(!OnnxSetInputShape(m_onnx_handle, 0, in_shape))
   {
      Print("Error: Failed to set ONNX input shape [1, 12].");
      return INIT_FAILED;
   }
   if(!OnnxSetOutputShape(m_onnx_handle, 0, out_shape))
   {
      Print("Error: Failed to set ONNX output shape [1, 3].");
      return INIT_FAILED;
   }

   Print("✅ Institutional PPO DRL Model (12 Features) Loaded Successfully.");
   return INIT_SUCCEEDED;
}

//+--------------------------------------------------------------------------------------+
//| DEINITIALIZATION                                                                     |
//+--------------------------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   if(m_onnx_handle != INVALID_HANDLE)
   {
      OnnxRelease(m_onnx_handle);
      m_onnx_handle = INVALID_HANDLE;
   }
   Comment("");
}

//+--------------------------------------------------------------------------------------+
//| ON TICK HANDLER                                                                      |
//+--------------------------------------------------------------------------------------+
void OnTick()
{
   // Execute Trailing Stop on every tick
   if(InpUseTrailing)
      ManageTrailingStop();

   // Only evaluate AI Inference on Bar Open (M15 Bar Transition)
   datetime current_bar_time = (datetime)SeriesInfoInteger(_Symbol, _Period, SERIES_LASTBAR_DATE);
   if(current_bar_time == m_last_bar_time)
      return;

   m_last_bar_time = current_bar_time;

   // Check Spread
   m_symbol.Refresh();
   if(m_symbol.Spread() > InpMaxSpreadPoints)
   {
      PrintFormat("Warning: Current spread %d exceeds maximum allowed %d. Skipping bar.", m_symbol.Spread(), InpMaxSpreadPoints);
      return;
   }

   // 1. Copy Historical Bars for 12 Feature Extraction
   MqlRates rates[];
   ArraySetAsSeries(rates, true);
   if(CopyRates(_Symbol, _Period, 0, 60, rates) < 60)
      return;

   // 2. Extract 12 Institutional Quant Features
   double p0  = rates[0].close;
   double p1  = rates[1].close;
   double p3  = rates[3].close;
   double p8  = rates[8].close;
   double p21 = rates[21].close;

   // [0..3] Multi-Horizon Log Returns
   float ret1  = (float)(MathLog(p0 / p1) * 100.0);
   float ret3  = (float)(MathLog(p0 / p3) * 100.0);
   float ret8  = (float)(MathLog(p0 / p8) * 100.0);
   float ret21 = (float)(MathLog(p0 / p21) * 100.0);

   // [4] RSI-14 Normalized to [-1.0, +1.0]
   double sumGain = 0.0, sumLoss = 0.0;
   for(int i = 0; i < 14; i++)
   {
      double diff = rates[i].close - rates[i+1].close;
      if(diff > 0) sumGain += diff;
      else         sumLoss += -diff;
   }
   double rs = (sumLoss > 0) ? (sumGain / sumLoss) : 1.0;
   double rsi = 100.0 - (100.0 / (1.0 + rs));
   float rsi_norm = (float)((rsi - 50.0) / 50.0);

   // [5] Realized Volatility / ATR
   double sumVol = 0.0;
   for(int i = 0; i < 14; i++) sumVol += rates[i].close;
   double meanVol = sumVol / 14.0;
   double varVol = 0.0;
   for(int i = 0; i < 14; i++) varVol += MathPow(rates[i].close - meanVol, 2.0);
   float vol_atr = (float)((MathSqrt(varVol / 14.0) / p0) * 100.0);

   // [6] Distance to EMA-50
   double sumEMA = 0.0;
   for(int i = 0; i < 50; i++) sumEMA += rates[i].close;
   double ema50 = sumEMA / 50.0;
   float dist_sma = (float)(((p0 - ema50) / p0) * 100.0);

   // [7] Bollinger %B
   double sumBB = 0.0;
   for(int i = 0; i < 20; i++) sumBB += rates[i].close;
   double meanBB = sumBB / 20.0;
   double varBB = 0.0;
   for(int i = 0; i < 20; i++) varBB += MathPow(rates[i].close - meanBB, 2.0);
   double stdBB = MathSqrt(varBB / 20.0) + 1e-7;
   double upperBB = meanBB + 2.0 * stdBB;
   double lowerBB = meanBB - 2.0 * stdBB;
   float bollinger_pct_b = (float)((p0 - lowerBB) / (upperBB - lowerBB + 1e-7) - 0.5);

   // [8..9] Cyclic Time Embedding
   MqlDateTime dt;
   TimeToStruct(rates[0].time, dt);
   int bar_of_day = (dt.hour * 60 + dt.min) / 15;
   float session_sin = (float)MathSin(2.0 * M_PI * bar_of_day / 96.0);
   float session_cos = (float)MathCos(2.0 * M_PI * bar_of_day / 96.0);

   // [10..11] Position State & Unrealized PnL %
   float current_pos = 0.0f;
   float unrealized_pnl = 0.0f;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(m_position.SelectByIndex(i) && m_position.Magic() == InpMagicNumber && m_position.Symbol() == _Symbol)
      {
         current_pos = (m_position.PositionType() == POSITION_TYPE_BUY) ? 1.0f : -1.0f;
         double open_price = m_position.PriceOpen();
         if(open_price > 0)
         {
            if(current_pos == 1.0f)
               unrealized_pnl = (float)(((p0 - open_price) / open_price) * 100.0);
            else
               unrealized_pnl = (float)(((open_price - p0) / open_price) * 100.0);
         }
         break;
      }
   }

   // 3. Prepare 12-Dimensional Input Tensor
   matrixf input_tensor(1, 12);
   input_tensor[0][0] = ret1;
   input_tensor[0][1] = ret3;
   input_tensor[0][2] = ret8;
   input_tensor[0][3] = ret21;
   input_tensor[0][4] = rsi_norm;
   input_tensor[0][5] = vol_atr;
   input_tensor[0][6] = dist_sma;
   input_tensor[0][7] = bollinger_pct_b;
   input_tensor[0][8] = session_sin;
   input_tensor[0][9] = session_cos;
   input_tensor[0][10]= current_pos;
   input_tensor[0][11]= unrealized_pnl;

   vectorf output_tensor(3); // [P(Hold), P(Buy), P(Sell)]

   // 4. Run Model Inference
   if(!OnnxRun(m_onnx_handle, ONNX_NO_CONVERSION, input_tensor, output_tensor))
   {
      Print("Error: OnnxRun execution failed (Err: ", GetLastError(), ")");
      return;
   }

   float pHold = output_tensor[0];
   float pBuy  = output_tensor[1];
   float pSell = output_tensor[2];

   // 5. Select Action
   int action = 0; // 0 = Hold, 1 = Buy, 2 = Sell
   if(pBuy > InpConfidenceThreshold && pBuy > pSell && pBuy > pHold)
      action = 1;
   else if(pSell > InpConfidenceThreshold && pSell > pBuy && pSell > pHold)
      action = 2;

   ExecuteTrade(action);

   // 6. Realtime Dashboard
   string actionStr = "● HOLD / FLAT";
   if(action == 1) actionStr = "▲ BUY SIGNAL (PPO BULLISH)";
   if(action == 2) actionStr = "▼ SELL SIGNAL (PPO BEARISH)";

   double openPL = 0.0;
   int openTrades = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(m_position.SelectByIndex(i) && m_position.Magic() == InpMagicNumber && m_position.Symbol() == _Symbol)
      {
         openPL += m_position.Profit() + m_position.Swap();
         openTrades++;
      }
   }

   Comment(StringFormat(
      "============================================\n" +
      "   INSTITUTIONAL PPO GOLD (XAUUSD) AI EA   \n" +
      "============================================\n" +
      "Model Inputs     : 12 Quant Multi-Regime Vector\n" +
      "AI Probabilities : Hold: %.1f%% | Buy: %.1f%% | Sell: %.1f%%\n" +
      "AI Decision      : %s\n" +
      "Active Trades    : %d | Floating P/L: $%.2f\n" +
      "Account Balance  : $%.2f (Equity: $%.2f)\n" +
      "============================================",
      pHold * 100.0f, pBuy * 100.0f, pSell * 100.0f,
      actionStr,
      openTrades, openPL,
      m_account.Balance(), m_account.Equity()
   ));
}

//+--------------------------------------------------------------------------------------+
//| ORDER EXECUTION                                                                      |
//+--------------------------------------------------------------------------------------+
void ExecuteTrade(int action)
{
   bool hasBuy  = false;
   bool hasSell = false;
   ulong buyTicket  = 0;
   ulong sellTicket = 0;

   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(m_position.SelectByIndex(i) && m_position.Magic() == InpMagicNumber && m_position.Symbol() == _Symbol)
      {
         if(m_position.PositionType() == POSITION_TYPE_BUY)  { hasBuy  = true; buyTicket  = m_position.Ticket(); }
         if(m_position.PositionType() == POSITION_TYPE_SELL) { hasSell = true; sellTicket = m_position.Ticket(); }
      }
   }

   // Signal Reversal Closure
   if(action == 2 && hasBuy)  m_trade.PositionClose(buyTicket);
   if(action == 1 && hasSell) m_trade.PositionClose(sellTicket);

   double point = m_symbol.Point();

   if(action == 1 && !hasBuy)
   {
      double ask = m_symbol.Ask();
      double sl = (InpStopLossPoints > 0)   ? (ask - InpStopLossPoints * point)   : 0;
      double tp = (InpTakeProfitPoints > 0) ? (ask + InpTakeProfitPoints * point) : 0;
      m_trade.Buy(InpFixedLot, _Symbol, ask, sl, tp, InpTradeComment);
   }
   else if(action == 2 && !hasSell)
   {
      double bid = m_symbol.Bid();
      double sl = (InpStopLossPoints > 0)   ? (bid + InpStopLossPoints * point)   : 0;
      double tp = (InpTakeProfitPoints > 0) ? (bid - InpTakeProfitPoints * point) : 0;
      m_trade.Sell(InpFixedLot, _Symbol, bid, sl, tp, InpTradeComment);
   }
}

//+--------------------------------------------------------------------------------------+
//| TRAILING STOP MANAGEMENT                                                             |
//+--------------------------------------------------------------------------------------+
void ManageTrailingStop()
{
   double point = m_symbol.Point();
   double start = InpTrailingStart * point;
   double step  = InpTrailingStep  * point;

   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(m_position.SelectByIndex(i) && m_position.Magic() == InpMagicNumber && m_position.Symbol() == _Symbol)
      {
         ulong ticket = m_position.Ticket();
         double openPrice = m_position.PriceOpen();
         double currentSL = m_position.StopLoss();

         if(m_position.PositionType() == POSITION_TYPE_BUY)
         {
            double bid = m_symbol.Bid();
            if((bid - openPrice) >= start)
            {
               double newSL = bid - start;
               if(newSL > currentSL + step || currentSL == 0)
                  m_trade.PositionModify(ticket, newSL, m_position.TakeProfit());
            }
         }
         else if(m_position.PositionType() == POSITION_TYPE_SELL)
         {
            double ask = m_symbol.Ask();
            if((openPrice - ask) >= start)
            {
               double newSL = ask + start;
               if(newSL < currentSL - step || currentSL == 0)
                  m_trade.PositionModify(ticket, newSL, m_position.TakeProfit());
            }
         }
      }
   }
}
