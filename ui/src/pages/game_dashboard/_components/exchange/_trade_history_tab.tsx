import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchTradeHistory, type StockTrade } from '../../../../api/stocks';
import { useGameStore } from '../../../../stores/game.store';
import { getSectorIcon } from './_sector_icons';
import { formatSectorLabel } from './_stock_grade_config';
import { formatMoney } from '../../../../components/money/money_value';

const SECTOR_COLORS: Record<string, string> = {
  TECHNOLOGY: '#38bdf8',
  HEALTHCARE: '#fb7185',
  FINANCE: '#fbbf24',
  AGRICULTURE: '#34d399',
  ENERGY: '#a78bfa',
};

export function TradeHistoryTab() {
  const gameId = useGameStore((s) => s.gameId);
  const [trades, setTrades] = useState<StockTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;
    setLoading(true);
    fetchTradeHistory(gameId)
      .then((data) => setTrades(data.trades))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [gameId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-sm text-slate-500">Загрузка истории...</span>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-sm font-medium text-slate-400">История операций пуста</p>
        <p className="mt-1 text-xs text-slate-500">Совершите покупку или продажу</p>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.04 } },
      }}
    >
      <div className="overflow-clip rounded-[24px] border border-slate-700/40 shadow-inner shadow-black/20 ring-1 ring-slate-700/20">
        <table className="w-full min-w-lg text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-900/95 text-xs uppercase tracking-wider text-slate-400 backdrop-blur-sm [&_th:first-child]:rounded-tl-[24px] [&_th:last-child]:rounded-tr-[24px]">
            <tr>
              <th className="px-4 py-3 font-bold">Ход</th>
              <th className="px-4 py-3 font-bold">Тикер</th>
              <th className="px-4 py-3 font-bold">Компания</th>
              <th className="px-4 py-3 font-bold">Сектор</th>
              <th className="px-4 py-3 font-bold">Тип</th>
              <th className="px-4 py-3 text-right font-bold">Цена</th>
              <th className="px-4 py-3 text-right font-bold">Кол-во</th>
              <th className="px-4 py-3 text-right font-bold">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade, i) => {
              const SectorIcon = getSectorIcon(trade.sector);
              const sectorColor = SECTOR_COLORS[trade.sector] ?? '#94a3b8';
              const isBuy = trade.operationType === 'buy';
              return (
                <motion.tr
                  key={trade.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.035, type: 'spring', stiffness: 280, damping: 26 }}
                  className="border-t border-slate-700/30 transition-colors duration-200 hover:bg-white/5"
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    #{trade.turn}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-400/90">
                    {trade.ticker}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {trade.companyName}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: sectorColor }} />
                      <SectorIcon className="h-3.5 w-3.5" aria-hidden style={{ color: sectorColor, opacity: 0.75 }} />
                      <span style={{ color: sectorColor }}>{formatSectorLabel(trade.sector)}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase leading-none ${
                        isBuy
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {isBuy ? 'Покупка' : 'Продажа'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-white">
                    {formatMoney(trade.price)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-white">
                    {trade.quantity}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-mono text-sm font-bold ${isBuy ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isBuy ? '−' : '+'}{formatMoney(trade.netTotal ?? trade.total)}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
