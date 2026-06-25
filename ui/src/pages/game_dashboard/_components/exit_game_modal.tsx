import { GameModal } from '../../../components/game_ui/floating'
import { GameButton } from '../../../components/game_ui/game_button'
import type { GameDashboardThemeTokens } from './game_dashboard_theme'

interface ExitGameModalProps {
  open: boolean
  theme: GameDashboardThemeTokens
  onCancel: () => void
  onConfirm: () => void
}

export function ExitGameModal({ open, theme, onCancel, onConfirm }: ExitGameModalProps) {
  return (
    <GameModal
      open={open}
      onClose={onCancel}
      labelledBy="exit-game-title"
      overlayClassName={theme.modalBackdrop}
      panelClassName={`pointer-events-auto relative w-full max-w-md rounded-[28px] border p-6 outline-none ${theme.modalPanel}`}
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
    </GameModal>
  )
}
