import { GameButton } from '../game_ui/game_button'
import type { GameDashboardThemeTokens } from './game_dashboard_theme'

interface ExitGameModalProps {
  open: boolean
  theme: GameDashboardThemeTokens
  onCancel: () => void
  onConfirm: () => void
}

export function ExitGameModal({ open, theme, onCancel, onConfirm }: ExitGameModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className={`absolute inset-0 ${theme.modalBackdrop} backdrop-blur-sm`}
        aria-label="Закрыть"
        onClick={onCancel}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-game-title"
        className={`relative w-full max-w-md rounded-[28px] border p-6 ${theme.modalPanel}`}
      >
        <h2 id="exit-game-title" className={`text-xl font-bold ${theme.primaryText}`}>
          Выйти из игры?
        </h2>
        <p className={`mt-3 text-sm leading-relaxed ${theme.secondaryText}`}>
          Сохранение происходит по завершении последнего хода. Некоторые действия персонажа,
          совершённые после этого, могут не сохраниться.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <GameButton variant="ghost" onClick={onCancel}>
            Остаться
          </GameButton>
          <GameButton variant="muted" onClick={onConfirm}>
            Выйти в меню
          </GameButton>
        </div>
      </div>
    </div>
  )
}
