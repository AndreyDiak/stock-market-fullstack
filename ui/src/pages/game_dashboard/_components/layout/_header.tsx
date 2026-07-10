import { type KeyboardEvent, useRef } from 'react'
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
  const showEndTurnWarning = useGameStore((state) => state.showEndTurnWarning)
  const prepareEndTurn = useGameStore((state) => state.prepareEndTurn)
  const confirmEndTurn = useGameStore((state) => state.confirmEndTurn)
  const dismissEndTurnWarning = useGameStore((state) => state.dismissEndTurnWarning)
  const clearBalanceFx = useGameStore((state) => state.clearBalanceFx)
  const characterProfile = useGameStore((state) => state.characterProfile)
  const nextTurnForecast = useGameStore((state) => state.nextTurnForecast)
  const avatarSrc = getProfessionAvatar(
    characterProfile.profession as CreateGameBody['profession'],
  )
  const overlayRef = useRef<HTMLDivElement>(null)

  const netChange = nextTurnForecast.netChange
  const forecastAfterTurn = balance + netChange

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      dismissEndTurnWarning()
    }
  }

  return (
    <>
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
              void prepareEndTurn()
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

      {showEndTurnWarning ? (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          <div
            className="mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-b from-slate-800 to-slate-900 p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="end-turn-warning-title"
          >
            <h2
              id="end-turn-warning-title"
              className="mb-2 text-center text-lg font-bold text-red-400"
            >
              Предупреждение
            </h2>
            <p className="mb-4 text-center text-sm text-slate-300">
              После завершения хода ваш баланс станет отрицательным.
            </p>

            <div className="mb-6 space-y-2 rounded-xl bg-black/30 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Текущий баланс</span>
                <MoneyValue amount={balance} size="sm" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Прогноз изменений</span>
                <span className={`font-mono text-sm font-semibold ${netChange < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {netChange > 0 ? '+' : ''}{netChange.toLocaleString('ru-RU')} ₽
                </span>
              </div>
              <div className="border-t border-slate-700/50 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-300">Баланс после хода</span>
                  <span className="font-mono text-sm font-bold text-red-400">
                    {forecastAfterTurn.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <GameButton
                  variant="muted"
                  fullWidth
                  onClick={dismissEndTurnWarning}
                >
                  Закрыть
                </GameButton>
              </div>
              <div className="flex-1">
                <GameButton
                  variant="danger"
                  fullWidth
                  onClick={() => void confirmEndTurn()}
                >
                  Продолжить
                </GameButton>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
