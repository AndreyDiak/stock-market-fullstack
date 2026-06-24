import type { ReactNode } from 'react'
import logo from '../../assets/logo.webp'
import { MoneyValue } from '../../components/money_value'
import { GameButton } from '../../components/game_ui/game_button'
import type { header_props } from './model/types'

function HeaderStat({
  icon,
  label,
  value,
  secondaryText,
}: {
  icon?: ReactNode
  label: string
  value: ReactNode
  secondaryText: string
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className={`text-xs font-medium ${secondaryText}`}>{label}</span>
      {value}
    </div>
  )
}

export function Header({
  turn,
  balance,
  passiveIncome,
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

        <HeaderStat
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path strokeLinecap="round" d="M4 18h16M6 14l3-8 4 6 3-4 2 6" />
            </svg>
          }
          label="Пассивный доход"
          secondaryText={theme.secondaryText}
          value={<MoneyValue amount={passiveIncome} size="lg" prefix="+" suffix="/мес" />}
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-5 md:gap-6">
        <HeaderStat
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-amber-400" fill="currentColor" aria-hidden>
              <path d="M12 2l2.9 6.9 7.5.6-5.7 4.9 1.7 7.3L12 18.8 7.6 21.7l1.7-7.3L3.6 9.5l7.5-.6L12 2z" />
            </svg>
          }
          label="Репутация"
          secondaryText={theme.secondaryText}
          value={<span className="text-lg font-bold tabular-nums leading-none text-amber-300">{reputation}</span>}
        />

        <HeaderStat
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path strokeLinecap="round" d="M4 18h16M6 14l3-8 4 6 3-4 2 6" />
            </svg>
          }
          label="Трейдинг"
          secondaryText={theme.secondaryText}
          value={<span className="text-lg font-bold tabular-nums leading-none text-cyan-300">Lv.{tradingLevel}</span>}
        />

        <div className={`hidden h-8 w-px shrink-0 sm:block ${theme.headerDivider}`} />

        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium uppercase tracking-wider ${theme.secondaryText}`}>Ход</span>
          <span className={`text-2xl font-black tabular-nums leading-none ${theme.primaryText}`}>{turn}</span>
        </div>

        <GameButton size="lg" onClick={onEndTurn} disabled={endingTurn} className="shrink-0">
          {endingTurn ? '...' : 'Завершить ход'}
        </GameButton>
      </div>
    </header>
  )
}
