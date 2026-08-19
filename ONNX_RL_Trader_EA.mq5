//+--------------------------------------------------------------------------------------+
//|                                                          ONNX_RL_Trader_EA.mq5      |
//|                                             Copyright (c) 2026, AI Trading Systems   |
//|                                                                 https://www.mql5.com |
//+--------------------------------------------------------------------------------------+
#property copyright   "Copyright (c) 2026, AI Trading Systems"
#property link        "https://www.mql5.com"
#property version     "2.00"
#property description "Active Deep Reinforcement Learning EA for Gold (XAUUSD)"

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
input string   InpTradeComment        = "RL_ONNX_GOLD";

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

   // 2. Set Tensor Shapes: Input [1, 6], Output [1, 3]
   const long in_shape[]  = {1, 6};
   const long out_shape[] = {1, 3};

   if(!OnnxSetInputShape(m_onnx_handle, 0, in_shape))
   {
      Print("Error: Failed to set ONNX input shape.");
      return INIT_FAILED;
   }
   if(!OnnxSetOutputShape(m_onnx_handle, 0, out_shape))
   {
      Print("Error: Failed to set ONNX output shape.");
      return INIT_FAILED;
   }

   Print("Active ONNX RL Agent for Gold Loaded Successfully.");
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
//| ON TICK EVENT                                                                        |
//+--------------------------------------------------------------------------------------+
void OnTick()
{
   if(InpUseTrailing)
      ManageTrailingStop();

   // Run Decision Cycle on Bar Open
   if(!IsNewBar())
      return;

   m_symbol.RefreshRates();

   if(m_symbol.Spread() > InpMaxSpreadPoints)
      return;

   // 1. Copy 25 Historical Bars for Feature Extraction
   MqlRates rates[];
   ArraySetAsSeries(rates, true);
   if(CopyRates(_Symbol, _Period, 0, 25, rates) < 25)
      return;

   // 2. Extract 6 Scaled Features Matching Python RL Environment (Scaled by 100)
   double p0 = rates[0].close;
   double p5 = rates[5].close;
   double p10= rates[10].close;
   double p20= rates[20].close;

   float ret5  = (float)(((p0 - p5) / p5) * 100.0);
   float ret10 = (float)(((p0 - p10) / p10) * 100.0);
   float ret20 = (float)(((p0 - p20) / p20) * 100.0);

   // Volatility (10-bar StdDev / Price * 100)
   double sum = 0.0;
   for(int i = 0; i <= 10; i++) sum += rates[i].close;
   double mean = sum / 11.0;
   double var = 0.0;
   for(int i = 0; i <= 10; i++) var += MathPow(rates[i].close - mean, 2.0);
   float volatility = (float)((MathSqrt(var / 11.0) / p0) * 100.0);

   // SMA 20 Distance (* 100)
   double sum20 = 0.0;
   for(int i = 0; i <= 20; i++) sum20 += rates[i].close;
   double sma20 = sum20 / 21.0;
   float dist_sma = (float)(((p0 - sma20) / p0) * 100.0);

   // Current Position Status (-1 = Short, 0 = Flat, 1 = Long)
   float current_pos = 0.0f;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(m_position.SelectByIndex(i) && m_position.Magic() == InpMagicNumber && m_position.Symbol() == _Symbol)
      {
         current_pos = (m_position.PositionType() == POSITION_TYPE_BUY) ? 1.0f : -1.0f;
         break;
      }
   }

   // 3. Prepare Input Tensor
   matrixf input_tensor(1, 6);
   input_tensor[0][0] = ret5;
   input_tensor[0][1] = ret10;
   input_tensor[0][2] = ret20;
   input_tensor[0][3] = volatility;
   input_tensor[0][4] = dist_sma;
   input_tensor[0][5] = current_pos;

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

   // 5. Select Action with Highest Probability Passing Threshold
   int action = 0; // 0 = Hold, 1 = Buy, 2 = Sell
   if(pBuy > InpConfidenceThreshold && pBuy > pSell && pBuy > pHold)
      action = 1;
   else if(pSell > InpConfidenceThreshold && pSell > pBuy && pSell > pHold)
      action = 2;

   ExecuteTrade(action);

   // 6. Realtime Dashboard
   string actionStr = "● HOLD / FLAT";
   if(action == 1) actionStr = "▲ BUY SIGNAL (BULLISH)";
   if(action == 2) actionStr = "▼ SELL SIGNAL (BEARISH)";

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
      "      ACTIVE ONNX GOLD (XAUUSD) AI EA       \n" +
      "============================================\n" +
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
      double sl  = (InpStopLossPoints > 0)   ? (ask - InpStopLossPoints * point) : 0.0;
      double tp  = (InpTakeProfitPoints > 0) ? (ask + InpTakeProfitPoints * point) : 0.0;
      m_trade.Buy(InpFixedLot, _Symbol, ask, sl, tp, InpTradeComment);
   }
   else if(action == 2 && !hasSell)
   {
      double bid = m_symbol.Bid();
      double sl  = (InpStopLossPoints > 0)   ? (bid + InpStopLossPoints * point) : 0.0;
      double tp  = (InpTakeProfitPoints > 0) ? (bid - InpTakeProfitPoints * point) : 0.0;
      m_trade.Sell(InpFixedLot, _Symbol, bid, sl, tp, InpTradeComment);
   }
}

//+--------------------------------------------------------------------------------------+
//| TRAILING STOP                                                                        |
//+--------------------------------------------------------------------------------------+
void ManageTrailingStop()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(m_position.SelectByIndex(i) && m_position.Magic() == InpMagicNumber && m_position.Symbol() == _Symbol)
      {
         m_symbol.RefreshRates();
         double point = m_symbol.Point();

         if(m_position.PositionType() == POSITION_TYPE_BUY)
         {
            double bid = m_symbol.Bid();
            double profitPts = (bid - m_position.PriceOpen()) / point;
            if(profitPts >= InpTrailingStart)
            {
               double newSL = NormalizeDouble(bid - InpTrailingStart * point, m_symbol.Digits());
               if(newSL > m_position.StopLoss() + InpTrailingStep * point || m_position.StopLoss() == 0.0)
                  m_trade.PositionModify(m_position.Ticket(), newSL, m_position.TakeProfit());
            }
         }
         else if(m_position.PositionType() == POSITION_TYPE_SELL)
         {
            double ask = m_symbol.Ask();
            double profitPts = (m_position.PriceOpen() - ask) / point;
            if(profitPts >= InpTrailingStart)
            {
               double newSL = NormalizeDouble(ask + InpTrailingStart * point, m_symbol.Digits());
               if(newSL < m_position.StopLoss() - InpTrailingStep * point || m_position.StopLoss() == 0.0)
                  m_trade.PositionModify(m_position.Ticket(), newSL, m_position.TakeProfit());
            }
         }
      }
   }
}

bool IsNewBar()
{
   datetime currentBarTime = iTime(_Symbol, _Period, 0);
   if(currentBarTime != m_last_bar_time)
   {
      m_last_bar_time = currentBarTime;
      return true;
   }
   return false;
}
