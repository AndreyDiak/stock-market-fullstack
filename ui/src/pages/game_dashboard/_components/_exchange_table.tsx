import { MoneyValue } from "../../../components/money/money_value";
import type { portfolio_row } from "../_model/types";
import { format_change } from "../_model/utils";
import { PortfolioSummary } from "./_portfolio_summary";
import { TrendArrow } from "./_trend_arrow";
import type { GameDashboardThemeTokens } from "./game_dashboard_theme";

export function ExchangeTable({
  portfolio,
  availableCash,
  theme,
}: {
  portfolio: portfolio_row[];
  availableCash: number;
  theme: GameDashboardThemeTokens;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2
            className={`text-xl font-bold tracking-wider ${theme.primaryText}`}
          >
            Портфель
          </h2>
          <p className={`mt-1 text-sm ${theme.secondaryText}`}>
            Биржевые позиции
          </p>
        </div>
        <span className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/20">
          {portfolio.length} позиций
        </span>
      </div>

      <PortfolioSummary portfolio={portfolio} availableCash={availableCash} />

      <div className="min-h-0 flex-1 overflow-auto rounded-[24px] border border-slate-700/40 shadow-inner shadow-black/20 ring-1 ring-slate-700/20">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-900/95 text-xs uppercase tracking-wider text-slate-400 backdrop-blur-sm">
            <tr>
              <th className="px-4 py-3 font-bold">Тикер</th>
              <th className="px-4 py-3 font-bold">Компания</th>
              <th className="px-4 py-3 text-right font-bold">Кол-во</th>
              <th className="px-4 py-3 text-right font-bold">Цена</th>
              <th className="px-4 py-3 text-right font-bold">Доходность</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.map((row) => (
              <tr
                key={row.ticker}
                className="border-t border-slate-700/30 transition-colors duration-200 hover:bg-white/5"
              >
                <td className="px-4 py-3 font-mono font-bold text-emerald-400/90">
                  {row.ticker}
                </td>
                <td className={`px-4 py-3 ${theme.secondaryText}`}>
                  {row.name}
                </td>
                <td className="px-4 py-3 text-right font-medium text-white">
                  {row.qty}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end">
                    <MoneyValue amount={row.price} size="sm" color="white" />
                  </div>
                </td>
                <td
                  className={`px-4 py-3 text-right font-bold ${
                    row.changePct >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  <span className="inline-flex items-center justify-end gap-1">
                    {format_change(row.changePct)}
                    <TrendArrow up={row.changePct >= 0} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
