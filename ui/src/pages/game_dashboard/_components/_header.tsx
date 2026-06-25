import type { ReactNode } from "react";
import logo from "../../../assets/logo.webp";
import { GameButton } from "../../../components/game_ui/game_button";
import { Spinner } from "../../../components/game_ui/spinner";
import { MoneyValue } from "../../../components/money/money_value";
import { StarIcon, TradingChartIcon } from "../../../shared/icons";
import type { header_props } from "../_model/types";

function HeaderStat({
  icon,
  label,
  value,
  secondaryText,
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  secondaryText: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className={`text-xs font-medium ${secondaryText}`}>{label}</span>
      {value}
    </div>
  );
}

export function Header({
  turn,
  balance,
  passiveIncome: _passiveIncome,
  reputation,
  tradingLevel,
  onEndTurn,
  endingTurn,
  theme,
}: header_props) {
  return (
    <header
      className={`flex shrink-0 flex-wrap items-center justify-between gap-4 px-4 py-3 md:px-5 ${theme.frame}`}
    >
      <div className="flex flex-wrap items-center gap-5 md:gap-6">
        <img
          src={logo}
          alt="Stock Market"
          className="h-10 w-10 shrink-0 rounded-full object-cover shadow-[0_0_16px_rgba(16,185,129,0.35)] ring-2 ring-emerald-400/25 md:h-11 md:w-11"
        />

        <HeaderStat
          label="Баланс"
          secondaryText={theme.secondaryText}
          value={<MoneyValue amount={balance} size="lg" color="amber" />}
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-5 md:gap-6">
        <HeaderStat
          icon={<StarIcon className="h-5 w-5 shrink-0 text-amber-400" />}
          label="Репутация"
          secondaryText={theme.secondaryText}
          value={
            <span className="text-lg font-bold tabular-nums leading-none text-amber-300">
              {reputation}
            </span>
          }
        />

        <HeaderStat
          icon={<TradingChartIcon className="h-5 w-5 shrink-0 text-cyan-400" />}
          label="Трейдинг"
          secondaryText={theme.secondaryText}
          value={
            <span className="text-lg font-bold tabular-nums leading-none text-cyan-300">
              Lv.{tradingLevel}
            </span>
          }
        />

        <div
          className={`hidden h-8 w-px shrink-0 sm:block ${theme.headerDivider}`}
        />

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium uppercase tracking-wider ${theme.secondaryText}`}
          >
            Ход
          </span>
          <span
            className={`text-2xl font-black tabular-nums leading-none ${theme.primaryText}`}
          >
            {turn}
          </span>
        </div>

        <GameButton
          size="lg"
          onClick={onEndTurn}
          disabled={endingTurn}
          aria-busy={endingTurn}
          className="shrink-0"
        >
          <span className="relative inline-flex min-w-[10.5rem] items-center justify-center">
            <span className={endingTurn ? "invisible" : undefined}>
              Завершить ход
            </span>
            {endingTurn ? (
              <span className="absolute inset-0 flex items-center justify-center">
                <Spinner className="text-amber-950" label="Завершение хода" />
              </span>
            ) : null}
          </span>
        </GameButton>
      </div>
    </header>
  );
}
