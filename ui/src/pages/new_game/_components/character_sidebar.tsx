import { AnimatePresence, motion } from 'framer-motion'
import { GameButton } from '../../../components/game_ui/game_button'
import { AssetCard } from '../../../components/card/asset_card'
import { InstallmentBar } from './installment_bar'
import { StatRow } from './stat_row'
import { DreamPathPreview } from './dream_path_preview'
import { getProfessionAvatar } from '../../../constants/professionImages'
import type { CharacterRosterItem } from '../../../stores/characters.store'

interface CharacterSidebarProps {
  character: CharacterRosterItem
  professionLabel: string
  netMonthlyIncome: number
  getItemImage: (itemRef: string) => string | undefined
  creating: boolean
  onBack: () => void
  onStart: () => void
}

const sidebarVariants = {
  hidden: { opacity: 0, x: 20 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.055,
      delayChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    x: -14,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
}

const blockVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 340, damping: 28 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 380, damping: 26 },
  },
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="min-h-5 text-xs font-bold uppercase tracking-[0.22em] text-emerald-400/80">
      {children}
    </h3>
  )
}

const compactPanelClass =
  'rounded-2xl border border-emerald-400/10 bg-slate-800/80 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'

export function CharacterSidebar({
  character,
  professionLabel,
  netMonthlyIncome,
  getItemImage,
  creating,
  onBack,
  onStart,
}: CharacterSidebarProps) {
  const starterProperty = character.items[0]

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden">
      <motion.div
        className="flex h-full min-h-0 flex-col gap-4 rounded-3xl border border-emerald-400/15 bg-[rgb(15,23,42)]/95 p-4 shadow-[0_12px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl md:gap-5 md:p-5"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={character.profession}
            className="flex min-h-0 flex-1 flex-col gap-4 md:gap-5"
            variants={sidebarVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <div className="grid w-full shrink-0 grid-cols-1 gap-3 md:grid-cols-2">
              <motion.header
                variants={blockVariants}
                className={`flex items-center gap-3 ${compactPanelClass}`}
              >
                <motion.div
                  className="relative h-14 w-14 shrink-0"
                  initial={{ scale: 0.75, rotate: -8 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.05 }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full bg-emerald-400/20 blur-md"
                    animate={{ opacity: [0.35, 0.65, 0.35], scale: [0.9, 1.08, 0.9] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <div className="relative h-full w-full overflow-hidden rounded-full bg-gradient-to-b from-[#0c1824] to-[#0a2a1f] ring-2 ring-emerald-400/30 ring-offset-1 ring-offset-slate-900/80">
                    <img
                      src={getProfessionAvatar(character.profession)}
                      alt={professionLabel}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </motion.div>
                <div className="min-w-0 flex-1">
                  <motion.h2 className="truncate text-2xl font-bold text-white" layout>
                    {character.name}
                  </motion.h2>
                  <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {professionLabel}
                  </p>
                </div>
              </motion.header>

              <motion.section variants={blockVariants} className={`space-y-2 ${compactPanelClass}`}>
                <StatRow label="Зарплата" amount={character.salary} suffix="/мес" />
                <StatRow
                  label="После выплат"
                  amount={netMonthlyIncome}
                  suffix="/мес"
                  negative={netMonthlyIncome < 0}
                  bordered
                />
                <StatRow label="Баланс" amount={character.balance} bordered />
              </motion.section>
            </div>

            <motion.section variants={blockVariants} className="shrink-0">
              <SectionTitle>Стартовое имущество</SectionTitle>
              {starterProperty ? (
                <>
                  <p className="mt-1 text-[10px] leading-snug text-slate-500">
                    Куплено в кредит — платёж списывается каждый ход из зарплаты
                  </p>
                  <motion.div
                    variants={cardVariants}
                    className="mt-2 flex items-center gap-2.5 rounded-xl border border-amber-500/15 bg-slate-800/55 px-2.5 py-2"
                  >
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-amber-400/20">
                      <AssetCard
                        name={starterProperty.name}
                        image={getItemImage(starterProperty.itemRef)}
                        variant="thumb"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <p className="truncate text-xs font-bold text-white">{starterProperty.name}</p>
                        <span className="shrink-0 rounded bg-amber-500/12 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-amber-300/90">
                          В кредите
                        </span>
                      </div>
                      <InstallmentBar
                      name={starterProperty.name}
                      basePrice={starterProperty.basePrice}
                      monthlyPayment={starterProperty.monthlyPayment}
                      installmentsPaid={starterProperty.installmentsPaid}
                      installmentsTotal={starterProperty.installmentsTotal}
                      animateProgress
                      compact
                    />
                  </div>
                </motion.div>
                </>
              ) : (
                <motion.div className="mt-2 h-11" variants={cardVariants}>
                  <AssetCard name="" empty />
                </motion.div>
              )}
            </motion.section>

            <motion.div variants={blockVariants} className="flex min-h-0 flex-1 flex-col">
              <DreamPathPreview preview={character.dreamPreview} dreamStages={character.dreamStages} />
            </motion.div>

            <motion.footer
              variants={blockVariants}
              className="mt-auto grid w-full shrink-0 grid-cols-1 gap-3 border-t border-emerald-400/10 pt-4 sm:grid-cols-2"
            >
              <GameButton fullWidth variant="muted" onClick={onBack}>
                Назад
              </GameButton>
              <GameButton
                fullWidth
                variant="action"
                disabled={creating}
                onClick={onStart}
              >
                {creating ? 'Создание...' : 'Начать игру'}
              </GameButton>
            </motion.footer>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </aside>
  )
}
