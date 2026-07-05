import type { CreateGameBody } from '../../../../api/types'
import { GameButton } from '../../../../components/game_ui/game_button'
import { Spinner } from '../../../../components/game_ui/spinner'
import { BalanceCoinFx } from '../../../../components/money/balance_coin_fx'
import { MoneyValue } from '../../../../components/money/money_value'
import { getProfessionAvatar } from '../../../../constants/professionImages'
import { gameAudio } from '../../../../lib/audio/game_audio'
import { useGameStore } from '../../../../stores/game.store'
import { useDashboardTheme } from '../../_model/use_dashboard_theme'
import { HeaderStats } from './_header_stats'
import { HeaderNextNewsPreview } from './_header_next_news'
import './_header.css'

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
    <header className={`header relative z-30 shrink-0 ${theme.frame}`}>
      <div className="header__player">
        <div className="header__avatar">
          <div className="header__avatar-ring" aria-hidden />
          <div className="header__avatar-image">
            <img
              src={avatarSrc}
              alt={characterProfile.name}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <HeaderStats />
      </div>

      <div className="header__session">
        <HeaderNextNewsPreview />

        <div className={`header__divider ${theme.headerDivider}`} aria-hidden />

        <div className="header__balance-group">
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

        <div className={`header__divider ${theme.headerDivider}`} aria-hidden />

        <div className="header__turn-group">
          <span className={`text-xs font-medium ${theme.secondaryText}`}>Ход</span>
          <span className={`header__turn-value ${theme.primaryText}`}>{turn}</span>
        </div>
      </div>

      <div className="header__primary-action">
        <GameButton
          size="lg"
          onClick={() => {
            gameAudio.playSfx('buttonClick')
            void endTurn()
          }}
          disabled={endingTurn}
          aria-busy={endingTurn}
          className="header__finish-turn"
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
