import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameButton } from '../../components/game_ui/game_button'
import { GameShell } from '../../components/game_ui/game_shell'
import { PageHeader } from '../../components/game_ui/page_header'
import { SlotCard } from '../../components/card/slot_card'
import { useSavesStore } from '../../stores/saves.store'
import { DeleteSlotModal } from './_components/_delete_slot_modal'
import {
  slotsFooterVariants,
  slotsGridVariants,
  slotsHeaderVariants,
  slotsPageVariants,
} from './_model/animation'

interface DeleteTarget {
  id: string
  slot: number
  characterName?: string
}

export function SlotsPage() {
  const navigate = useNavigate()
  const { slots, loading, error, loadSlots, deleteGame } = useSavesStore()
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [entranceReady, setEntranceReady] = useState(false)

  useEffect(() => {
    void loadSlots()
  }, [loadSlots])

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntranceReady(true))
    return () => cancelAnimationFrame(frame)
  }, [])

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
      <motion.div
        className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-center p-4 md:p-6"
        variants={slotsPageVariants}
        initial="hidden"
        animate={entranceReady ? 'show' : 'hidden'}
      >
        <motion.div variants={slotsHeaderVariants}>
          <PageHeader
            eyebrow="Night Session"
            title="Выбор сейва"
            subtitle="Выберите слот для загрузки или начните новую игру"
          />
        </motion.div>

        {loading && (
          <p className="mb-4 text-center text-sm text-slate-400">Загрузка...</p>
        )}
        {error && (
          <p className="mb-4 text-center text-sm text-red-400">{error}</p>
        )}

        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
          variants={slotsGridVariants}
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
                isPlayable={data?.status !== 'COMPLETED'}
                onLoad={() => {
                  if (data?.id && data?.status !== 'COMPLETED') navigate(`/game?id=${data.id}`)
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

        <motion.div className="mt-8 flex justify-center" variants={slotsFooterVariants}>
          <GameButton variant="ghost" fullWidth={false} onClick={() => navigate('/menu')}>
            Назад в меню
          </GameButton>
        </motion.div>
      </motion.div>

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
