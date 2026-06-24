import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameButton } from '../../components/game_ui/game_button'
import { GameShell } from '../../components/game_ui/game_shell'
import { PageHeader } from '../../components/game_ui/page_header'
import { SlotCard } from '../../components/slot_card'
import { useGamesStore } from '../../stores/games.store'
import { slotsGridVariants } from './model/animation'

export function SlotsPage() {
  const navigate = useNavigate()
  const { slots, loading, error, loadSlots } = useGamesStore()

  useEffect(() => {
    void loadSlots()
  }, [loadSlots])

  const slot = (n: number) => slots.find((s) => s.slot === n)

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
    </GameShell>
  )
}
