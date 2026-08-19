import React, { useState } from 'react';
import { Download, Search, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { TradeRecord } from '../types/ppo';

interface TradesJournalProps {
  trades: TradeRecord[];
}

export const TradesJournal: React.FC<TradesJournalProps> = ({ trades }) => {
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');

  const filteredTrades = trades.filter((t) => {
    if (filter === 'BUY') return t.type === 'BUY';
    if (filter === 'SELL') return t.type === 'SELL';
    return true;
  });

  const exportCSV = () => {
    if (!trades.length) return;
    const headers = ['Step', 'Type', 'EntryPrice', 'ExitPrice', 'ReturnPct', 'PnL_USD', 'Equity', 'Timestamp'];
    const rows = trades.map((t) => [
      t.step,
      t.type,
      t.entryPrice.toFixed(2),
      t.exitPrice.toFixed(2),
      t.returnPct.toFixed(2),
      t.pnlUsd.toFixed(2),
      t.equity.toFixed(2),
      t.timestamp,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PPO_Trades_Log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#0c0c10] border border-[#1c1c24] rounded-2xl p-4 flex flex-col h-full select-none">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00c7be]" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Real-time PPO Execution Journal
          </h3>
          <span className="text-xs px-2 py-0.5 rounded bg-[#121217] text-[#86868b] font-mono">
            {trades.length} Records
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Action Filter */}
          <div className="flex bg-[#121217] rounded-lg p-0.5 border border-[#1c1c24] text-[11px] font-bold">
            {(['ALL', 'BUY', 'SELL'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filter === f ? 'bg-[#007aff] text-white' : 'text-[#86868b] hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Export CSV Button */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#121217] hover:bg-[#1c1c24] border border-[#1c1c24] text-xs font-semibold text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#86868b]" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-x-auto overflow-y-auto min-h-[260px] border border-[#1c1c24] rounded-xl bg-[#060608]">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#0c0c10] text-[#86868b] border-b border-[#1c1c24] sticky top-0 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Step</th>
              <th className="py-2.5 px-3">Action</th>
              <th className="py-2.5 px-3 text-right">Entry Price</th>
              <th className="py-2.5 px-3 text-right">Exit Price</th>
              <th className="py-2.5 px-3 text-right">Return %</th>
              <th className="py-2.5 px-3 text-right">P&L (USD)</th>
              <th className="py-2.5 px-3 text-right">Account Equity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1c1c24]/40">
            {filteredTrades.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#86868b]">
                  No trade executions logged yet. Start training to stream simulated fills.
                </td>
              </tr>
            ) : (
              filteredTrades.map((t) => (
                <tr key={t.id} className="hover:bg-[#0e0e14] transition-colors">
                  <td className="py-2 px-3 text-[#86868b]">#{t.step}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[10px] ${
                        t.type === 'BUY'
                          ? 'bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/30'
                          : 'bg-[#ff453a]/10 text-[#ff453a] border border-[#ff453a]/30'
                      }`}
                    >
                      {t.type === 'BUY' ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {t.type}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-medium text-white">
                    ${t.entryPrice.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-right font-medium text-white">
                    ${t.exitPrice.toFixed(2)}
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-bold ${
                      t.returnPct >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'
                    }`}
                  >
                    {t.returnPct >= 0 ? '+' : ''}
                    {t.returnPct.toFixed(2)}%
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-bold ${
                      t.pnlUsd >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'
                    }`}
                  >
                    {t.pnlUsd >= 0 ? '+' : ''}${t.pnlUsd.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-white">
                    ${t.equity.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
