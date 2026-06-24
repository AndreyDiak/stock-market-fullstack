import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameButton } from '../../components/game_ui/game_button'
import { GameShell } from '../../components/game_ui/game_shell'
import { PageHeader } from '../../components/game_ui/page_header'
import { SlotCard } from '../../components/slot_card'
import { useGamesStore } from '../../stores/games.store'
import { DeleteSlotModal } from './_delete_slot_modal'
import { slotsGridVariants } from './model/animation'

interface DeleteTarget {
  id: string
  slot: number
  characterName?: string
}

export function SlotsPage() {
  const navigate = useNavigate()
  const { slots, loading, error, loadSlots, deleteGame } = useGamesStore()
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    void loadSlots()
  }, [loadSlots])

  const slot = (n: number) => slots.find((s) => s.slot === n)

  async function handleConfirmDelete() {
    if (!deleteTarget) return

    setDeleting(true)
    const ok = await deleteGame(deleteTarget.id)
    setDeleting(false)

    if (ok) {
      setDeleteTarget(null)
    }
  }

  return (
    <GameShell>
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-center p-4 md:p-6">
        <PageHeader
          eyebrow="Night Session"
          title="Выбор сейва"
          subtitle="Выберите слот для загрузки или начните новую игру"
        />

        {loading && (
          <p className="mb-4 text-center text-sm text-slate-400">Загрузка...</p>
        )}
        {error && (
          <p className="mb-4 text-center text-sm text-red-400">{error}</p>
        )}

        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
          variants={slotsGridVariants}
          initial="hidden"
          animate="show"
        >
          {[1, 2, 3].map((n) => {
            const data = slot(n)

            return (
              <SlotCard
                key={n}
                slot={n}
                filled={data?.filled}
                characterName={data?.characterName}
                profession={data?.profession}
                balance={data?.balance}
                day={data?.day}
                onLoad={() => {
                  if (data?.id) navigate(`/game?id=${data.id}`)
                  else navigate('/game')
                }}
                onNewGame={() => navigate(`/new-game?slot=${n}`)}
                onDelete={() => {
                  if (data?.id) {
                    setDeleteTarget({
                      id: data.id,
                      slot: n,
                      characterName: data.characterName,
                    })
                  }
                }}
              />
            )
          })}
        </motion.div>

        <div className="mt-8 flex justify-center">
          <GameButton variant="ghost" fullWidth={false} onClick={() => navigate('/menu')}>
            Назад в меню
          </GameButton>
        </div>
      </div>

      <DeleteSlotModal
        open={deleteTarget != null}
        slot={deleteTarget?.slot ?? 0}
        characterName={deleteTarget?.characterName}
        deleting={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </GameShell>
  )
}
