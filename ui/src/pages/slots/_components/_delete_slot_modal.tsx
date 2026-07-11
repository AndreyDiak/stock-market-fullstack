import { GameModal } from '../../../components/game_ui/floating'
import { GameButton } from '../../../components/game_ui/game_button'

interface DeleteSlotModalProps {
  open: boolean
  slot: number
  characterName?: string
  deleting?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteSlotModal({
  open,
  slot,
  characterName,
  deleting = false,
  onCancel,
  onConfirm,
}: DeleteSlotModalProps) {
  return (
    <GameModal
      open={open}
      onClose={onCancel}
      labelledBy="delete-slot-title"
      overlayClassName="bg-black/65"
      panelClassName="pointer-events-auto relative w-full max-w-md rounded-[28px] border border-slate-600/50 bg-slate-900 p-6 text-white shadow-2xl shadow-black/60 outline-none"
    >
      <h2 id="delete-slot-title" className="text-xl font-bold text-white">
        Удалить слот {slot}?
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        {characterName ? (
          <>Сохранение «{characterName}» будет удалено без возможности восстановления.</>
        ) : (
          <>Сохранение в этом слоте будет удалено без возможности восстановления.</>
        )}
      </p>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <GameButton variant="ghost" onClick={onCancel} disabled={deleting}>
          Отмена
        </GameButton>
        <GameButton variant="danger" onClick={onConfirm} disabled={deleting}>
          {deleting ? 'Удаление...' : 'Удалить'}
        </GameButton>
      </div>
    </GameModal>
  )
}
