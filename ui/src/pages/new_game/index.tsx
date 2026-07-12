import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CharacterCard } from '../../components/card/character_card'
import { CharacterSidebar } from './_components/character_sidebar'
import { GameShell } from '../../components/game_ui/game_shell'
import { PageHeader } from '../../components/game_ui/page_header'
import { PROFESSION_LABELS } from '../../constants/professions'
import { getRealEstateImage } from '../../constants/realEstateImages'
import { useCharactersStore, type CharacterRosterItem } from '../../stores/characters.store'
import { useSavesStore } from '../../stores/saves.store'
import { useTutorialStore } from '../../stores/tutorial.store'
import {
  LOCKED_PLACEHOLDERS,
  calcNetMonthlyIncome,
  characterGridVariants,
  getCharacterImage,
} from './_model/utils'

export function NewGamePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const slot = Number(searchParams.get('slot')) || 1
  const { characters, loading, error, loadCharacters } = useCharactersStore()
  const [selected, setSelected] = useState<CharacterRosterItem | null>(null)
  const [creating, setCreating] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const { completeOnboarding, resetOnboarding } = useTutorialStore()
  const createGame = useSavesStore((s) => s.createGame)

  useEffect(() => {
    void loadCharacters()
  }, [loadCharacters])

  const activeCharacter = selected ?? characters[0] ?? null
  const awaitingCharacters = characters.length === 0 && !error
  const netMonthlyIncome = activeCharacter ? calcNetMonthlyIncome(activeCharacter) : 0

  if (loading || awaitingCharacters) {
    return (
      <GameShell fixedHeight>
        <div className="flex h-full items-center justify-center p-4">
          <p className="rounded-xl border border-emerald-400/20 bg-slate-800/80 px-6 py-4 text-emerald-200/90 shadow-[0_0_24px_rgba(77,196,141,0.15)] backdrop-blur-md">
            Загрузка персонажей...
          </p>
        </div>
      </GameShell>
    )
  }

  if (error || !activeCharacter) {
    return (
      <GameShell fixedHeight>
        <div className="flex h-full items-center justify-center p-4">
          <div className="rounded-xl border border-emerald-400/20 bg-slate-800/80 px-6 py-4 text-center backdrop-blur-md">
            <p className="text-emerald-100/90">{error ?? 'Персонажи не найдены'}</p>
            <button
              type="button"
              onClick={() => navigate('/slots')}
              className="mt-3 text-sm font-medium text-emerald-400 underline underline-offset-2"
            >
              Назад
            </button>
          </div>
        </div>
      </GameShell>
    )
  }

  return (
    <GameShell fixedHeight>
      <div className="flex h-full flex-col overflow-hidden p-3 md:p-4">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[88rem] flex-col">
          <PageHeader
            eyebrow="Night Session"
            title="Выбор персонажа"
            aside={`SLOT ${slot} / 3`}
          />

          <div className="grid min-h-0 flex-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(28rem,38rem)] lg:gap-5">
            <motion.div
              className="grid h-full min-h-0 auto-rows-fr grid-cols-3 grid-rows-3 gap-1.5 sm:gap-2.5"
              variants={characterGridVariants}
              initial="hidden"
              animate="show"
            >
              {characters.map((char) => (
                <CharacterCard
                  key={char.profession}
                  name={char.name}
                  professionLabel={PROFESSION_LABELS[char.profession]}
                  image={getCharacterImage(char)}
                  selected={activeCharacter.profession === char.profession}
                  onClick={() => setSelected(char)}
                />
              ))}
              {LOCKED_PLACEHOLDERS.map((placeholder, index) => (
                <CharacterCard
                  key={`locked-${index}`}
                  name={placeholder.name}
                  professionLabel={placeholder.professionLabel}
                  locked
                />
              ))}
            </motion.div>

            <CharacterSidebar
              character={activeCharacter}
              professionLabel={PROFESSION_LABELS[activeCharacter.profession]}
              netMonthlyIncome={netMonthlyIncome}
              getItemImage={getRealEstateImage}
              creating={creating}
              onBack={() => navigate('/slots')}
              showOnboarding={showOnboarding}
              onToggleOnboarding={() => setShowOnboarding((v) => !v)}
              onStart={async () => {
                setCreating(true)
                if (showOnboarding) {
                  resetOnboarding()
                } else {
                  completeOnboarding()
                }
                const game = await createGame(slot, activeCharacter.name, activeCharacter.profession)
                setCreating(false)
                if (game?.id) {
                  navigate(`/game?id=${game.id}`, {
                    state: { initialGame: game, showWelcomeNews: true },
                  })
                }
              }}
            />
          </div>
        </div>
      </div>
    </GameShell>
  )
}
