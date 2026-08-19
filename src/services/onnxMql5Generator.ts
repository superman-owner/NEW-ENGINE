export function generateMQL5Expert(symbol: string = "XAUUSD", magic: number = 112233): string {
  return `//+--------------------------------------------------------------------------------------+
//|                                                          ONNX_RL_Trader_EA.mq5      |
//|                                             Copyright (c) 2026, FXFORGE RL Engine   |
//|                                                                 https://www.mql5.com |
//+--------------------------------------------------------------------------------------+
#property copyright   "Copyright (c) 2026, FXFORGE RL Engine"
#property link        "https://www.mql5.com"
#property version     "2.00"
#property description "Active RL Trading EA for ${symbol} (6 Core Quant Features)"

#include <Trade\\Trade.mqh>
#include <Trade\\PositionInfo.mqh>
#include <Trade\\AccountInfo.mqh>
#include <Trade\\SymbolInfo.mqh>

#resource "\\\\Files\\\\rl_trading_model.onnx" as uchar ExtModelBuffer[];

input group "=== [1] AI / Model Parameters ==="
input double   InpConfidenceThreshold = 0.45;   // Min Probability to Trigger Trade (> 45%)

input group "=== [2] Risk & Money Management ==="
input double   InpFixedLot            = 0.01;   // Fixed Lot Size
input int      InpStopLossPoints      = 400;    // Stop Loss in Points
input int      InpTakeProfitPoints    = 800;    // Take Profit in Points
input int      InpMaxSpreadPoints     = 50;     // Max Allowed Spread in Points

input group "=== [3] Trailing Stop ==="
input bool     InpUseTrailing         = true;   // Enable Trailing Stop
input int      InpTrailingStart       = 250;    // Trailing Start (Points in profit)
input int      InpTrailingStep        = 50;     // Trailing Step (Points)

input group "=== [4] System Settings ==="
input ulong    InpMagicNumber         = ${magic}; // EA Magic Number
input string   InpTradeComment        = "RL_ONNX_6F";

CTrade         m_trade;
CPositionInfo  m_position;
CAccountInfo   m_account;
CSymbolInfo    m_symbol;

long           m_onnx_handle   = INVALID_HANDLE;
datetime       m_last_bar_time = 0;

int OnInit()
{
   if(!m_symbol.Name(_Symbol)) return INIT_FAILED;
   m_symbol.Refresh();

   m_trade.SetExpertMagicNumber(InpMagicNumber);
   m_trade.SetDeviationInPoints(15);
   m_trade.SetTypeFillingBySymbol(_Symbol);

   m_onnx_handle = OnnxCreateFromBuffer(ExtModelBuffer, ONNX_DEFAULT);
   if(m_onnx_handle == INVALID_HANDLE)
   {
      PrintFormat("Error: Failed to create ONNX handle (Err: %d). Ensure 'rl_trading_model.onnx' is in MQL5/Files!", GetLastError());
      return INIT_FAILED;
   }

   const long in_shape[]  = {1, 6};
   const long out_shape[] = {1, 3};

   if(!OnnxSetInputShape(m_onnx_handle, 0, in_shape) || !OnnxSetOutputShape(m_onnx_handle, 0, out_shape))
   {
      Print("Error: Failed to set ONNX tensor shapes.");
      return INIT_FAILED;
   }

   Print("✅ 6-Feature Active RL Model Loaded Successfully.");
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
   if(m_onnx_handle != INVALID_HANDLE)
   {
      OnnxRelease(m_onnx_handle);
      m_onnx_handle = INVALID_HANDLE;
   }
   Comment("");
}

void OnTick()
{
   if(InpUseTrailing) ManageTrailingStop();

   datetime current_bar_time = (datetime)SeriesInfoInteger(_Symbol, _Period, SERIES_LASTBAR_DATE);
   if(current_bar_time == m_last_bar_time) return;
   m_last_bar_time = current_bar_time;

   m_symbol.Refresh();
   if(m_symbol.Spread() > InpMaxSpreadPoints) return;

   MqlRates rates[];
   ArraySetAsSeries(rates, true);
   if(CopyRates(_Symbol, _Period, 0, 30, rates) < 30) return;

   double p0 = rates[0].close;
   float ret1 = (float)((p0 - rates[1].close) / rates[1].close);
   float ret5 = (float)((p0 - rates[5].close) / rates[5].close);

   // RSI-14
   double sumGain = 0, sumLoss = 0;
   for(int i = 0; i < 14; i++) {
      double diff = rates[i].close - rates[i+1].close;
      if(diff > 0) sumGain += diff; else sumLoss += -diff;
   }
   double rs = (sumLoss > 0) ? (sumGain / sumLoss) : 1.0;
   float rsi_norm = (float)(( (100.0 - (100.0 / (1.0 + rs))) - 50.0) / 50.0);

   // Distance to SMA-20
   double sumSMA = 0;
   for(int i = 0; i < 20; i++) sumSMA += rates[i].close;
   float dist_sma = (float)((p0 - (sumSMA / 20.0)) / p0);

   // Position Status & Unrealized PnL
   float current_pos = 0.0f;
   float unrealized_pnl = 0.0f;
   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      if(m_position.SelectByIndex(i) && m_position.Magic() == InpMagicNumber && m_position.Symbol() == _Symbol) {
         current_pos = (m_position.PositionType() == POSITION_TYPE_BUY) ? 1.0f : -1.0f;
         double open_price = m_position.PriceOpen();
         if(open_price > 0) {
            unrealized_pnl = (float)((current_pos == 1.0f ? (p0 - open_price) : (open_price - p0)) / open_price);
         }
         break;
      }
   }

   matrixf input_tensor(1, 6);
   input_tensor[0][0] = ret1;
   input_tensor[0][1] = ret5;
   input_tensor[0][2] = rsi_norm;
   input_tensor[0][3] = dist_sma;
   input_tensor[0][4] = current_pos;
   input_tensor[0][5] = unrealized_pnl;

   vectorf output_tensor(3);
   if(!OnnxRun(m_onnx_handle, ONNX_NO_CONVERSION, input_tensor, output_tensor)) return;

   float pHold = output_tensor[0];
   float pBuy  = output_tensor[1];
   float pSell = output_tensor[2];

   int action = 0;
   if(pBuy > InpConfidenceThreshold && pBuy > pSell && pBuy > pHold) action = 1;
   else if(pSell > InpConfidenceThreshold && pSell > pBuy && pSell > pHold) action = 2;

   ExecuteTrade(action);

   string actionStr = action == 1 ? "▲ BUY SIGNAL (RL)" : (action == 2 ? "▼ SELL SIGNAL (RL)" : "● HOLD / FLAT");
   Comment(StringFormat(
      "============================================\\n" +
      "          FXFORGE 6-FEATURE ACTIVE RL EA    \\n" +
      "============================================\\n" +
      "AI Probabilities : Hold: %.1f%% | Buy: %.1f%% | Sell: %.1f%%\\n" +
      "AI Decision      : %s\\n" +
      "Account Balance  : $%.2f (Equity: $%.2f)\\n" +
      "============================================",
      pHold * 100.0f, pBuy * 100.0f, pSell * 100.0f, actionStr, m_account.Balance(), m_account.Equity()
   ));
}

void ExecuteTrade(int action)
{
   bool hasBuy = false, hasSell = false;
   ulong buyTicket = 0, sellTicket = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      if(m_position.SelectByIndex(i) && m_position.Magic() == InpMagicNumber && m_position.Symbol() == _Symbol) {
         if(m_position.PositionType() == POSITION_TYPE_BUY)  { hasBuy  = true; buyTicket  = m_position.Ticket(); }
         if(m_position.PositionType() == POSITION_TYPE_SELL) { hasSell = true; sellTicket = m_position.Ticket(); }
      }
   }

   if(action == 2 && hasBuy)  m_trade.PositionClose(buyTicket);
   if(action == 1 && hasSell) m_trade.PositionClose(sellTicket);

   double point = m_symbol.Point();
   if(action == 1 && !hasBuy) {
      double ask = m_symbol.Ask();
      double sl = InpStopLossPoints > 0 ? (ask - InpStopLossPoints * point) : 0;
      double tp = InpTakeProfitPoints > 0 ? (ask + InpTakeProfitPoints * point) : 0;
      m_trade.Buy(InpFixedLot, _Symbol, ask, sl, tp, InpTradeComment);
   } else if(action == 2 && !hasSell) {
      double bid = m_symbol.Bid();
      double sl = InpStopLossPoints > 0 ? (bid + InpStopLossPoints * point) : 0;
      double tp = InpTakeProfitPoints > 0 ? (bid - InpTakeProfitPoints * point) : 0;
      m_trade.Sell(InpFixedLot, _Symbol, bid, sl, tp, InpTradeComment);
   }
}

void ManageTrailingStop()
{
   double point = m_symbol.Point();
   double start = InpTrailingStart * point;
   double step  = InpTrailingStep  * point;

   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      if(m_position.SelectByIndex(i) && m_position.Magic() == InpMagicNumber && m_position.Symbol() == _Symbol) {
         ulong ticket = m_position.Ticket();
         double openPrice = m_position.PriceOpen();
         double currentSL = m_position.StopLoss();
         if(m_position.PositionType() == POSITION_TYPE_BUY) {
            double bid = m_symbol.Bid();
            if((bid - openPrice) >= start && (bid - start > currentSL + step || currentSL == 0))
               m_trade.PositionModify(ticket, bid - start, m_position.TakeProfit());
         } else if(m_position.PositionType() == POSITION_TYPE_SELL) {
            double ask = m_symbol.Ask();
            if((openPrice - ask) >= start && (ask + start < currentSL - step || currentSL == 0))
               m_trade.PositionModify(ticket, ask + start, m_position.TakeProfit());
         }
      }
   }
}
`;
}
