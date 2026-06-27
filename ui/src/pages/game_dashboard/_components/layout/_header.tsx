import type { CreateGameBody } from '../../../../api/types'
import { GameButton } from '../../../../components/game_ui/game_button'
import { Spinner } from '../../../../components/game_ui/spinner'
import { BalanceCoinFx } from '../../../../components/money/balance_coin_fx'
import { MoneyValue } from '../../../../components/money/money_value'
import { getProfessionAvatar } from '../../../../constants/professionImages'
import { useGameStore } from '../../../../stores/game.store'
import { useDashboardTheme } from '../../_model/use_dashboard_theme'
import { HeaderStats } from './_header_stats'

function HeaderDivider({ className }: { className: string }) {
  return <div aria-hidden className={`h-8 w-px shrink-0 ${className}`} />
}

export function Header() {
  const theme = useDashboardTheme()
  const turn = useGameStore((state) => state.turn)
  const balance = useGameStore((state) => state.balance)
  const balanceFx = useGameStore((state) => state.balanceFx)
  const endingTurn = useGameStore((state) => state.endingTurn)
  const endTurn = useGameStore((state) => state.endTurn)
  const clearBalanceFx = useGameStore((state) => state.clearBalanceFx)
  const characterProfile = useGameStore((state) => state.characterProfile)
  const avatarSrc = getProfessionAvatar(
    characterProfile.profession as CreateGameBody['profession'],
  )

  return (
    <header
      className={`relative z-30 flex shrink-0 flex-wrap items-center gap-3 px-4 py-3 md:gap-4 md:px-5 ${theme.frame}`}
    >
      <div className="relative h-10 w-10 shrink-0 md:h-11 md:w-11">
        <div
          className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-amber-300/70 via-emerald-400/60 to-cyan-500/60 opacity-90"
          aria-hidden
        />
        <div className="relative h-full w-full overflow-hidden rounded-full ring-2 ring-slate-900/80 ring-offset-1 ring-offset-slate-900/50">
          <img
            src={avatarSrc}
            alt={characterProfile.name}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <HeaderStats />

      <div className="ml-auto flex flex-wrap items-center justify-end gap-4 md:gap-5">
        <div className="relative flex items-center gap-2">
          <span className={`text-xs font-medium ${theme.secondaryText}`}>Баланс</span>
          <div className="relative">
            {balanceFx ? (
              <BalanceCoinFx
                key={balanceFx.id}
                delta={balanceFx.delta}
                onComplete={clearBalanceFx}
              />
            ) : null}
            <MoneyValue amount={balance} size="lg" color="amber" />
          </div>
        </div>

        <HeaderDivider className={theme.headerDivider} />

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
          onClick={() => void endTurn()}
          disabled={endingTurn}
          aria-busy={endingTurn}
          className="shrink-0"
        >
          <span className="relative inline-flex min-w-[10.5rem] items-center justify-center">
            <span className={endingTurn ? 'invisible' : undefined}>Завершить ход</span>
            {endingTurn ? (
              <span className="absolute inset-0 flex items-center justify-center">
                <Spinner className="text-amber-950" label="Завершение хода" />
              </span>
            ) : null}
          </span>
        </GameButton>
      </div>
    </header>
  )
}
