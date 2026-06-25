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
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        aria-label="Закрыть"
        onClick={onCancel}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-slot-title"
        className="relative w-full max-w-md rounded-[28px] border border-slate-600/50 bg-slate-900 p-6 text-white shadow-2xl shadow-black/60"
      >
        <h2 id="delete-slot-title" className="text-xl font-bold text-white">
          Удалить слот {slot}?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          {characterName ? (
            <>
              Сохранение «{characterName}» будет удалено без возможности восстановления.
            </>
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
      </div>
    </div>
  )
}
