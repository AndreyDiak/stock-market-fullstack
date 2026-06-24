import { AnimatePresence, motion } from 'framer-motion'
import { GameButton } from '../game_ui/game_button'
import { AssetCard } from './asset_card'
import { InstallmentBar } from './installment_bar'
import { StatRow } from './stat_row'
import { getProfessionAvatar } from '../../constants/professionImages'
import type { CharacterItem, CharacterRosterItem } from '../../stores/characters.store'

interface CharacterSidebarProps {
  character: CharacterRosterItem
  professionLabel: string
  netMonthlyIncome: number
  installmentSlots: Array<CharacterItem | null>
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

const panelClass =
  'rounded-2xl border border-emerald-400/10 bg-slate-800/80 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'

export function CharacterSidebar({
  character,
  professionLabel,
  netMonthlyIncome,
  installmentSlots,
  getItemImage,
  creating,
  onBack,
  onStart,
}: CharacterSidebarProps) {
  return (
    <aside className="flex min-h-0 flex-col overflow-hidden">
      <motion.div
        className="flex h-full min-h-0 flex-col gap-5 rounded-3xl border border-emerald-400/15 bg-[rgb(15,23,42)]/95 p-5 shadow-[0_12px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl md:gap-6 md:p-6"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={character.profession}
            className="flex min-h-0 flex-1 flex-col gap-5 md:gap-6"
            variants={sidebarVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <div className="grid w-full shrink-0 grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <motion.header
                variants={blockVariants}
                className={`flex items-center gap-4 ${panelClass}`}
              >
                <motion.div
                  className="relative h-16 w-16 shrink-0"
                  initial={{ scale: 0.75, rotate: -8 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.05 }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full bg-emerald-400/20 blur-md"
                    animate={{ opacity: [0.35, 0.65, 0.35], scale: [0.9, 1.08, 0.9] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <div className="relative h-full w-full overflow-hidden rounded-full bg-gradient-to-b from-[#0c1824] to-[#0a2a1f] ring-2 ring-emerald-400/30 ring-offset-2 ring-offset-slate-900/80">
                    <img
                      src={getProfessionAvatar(character.profession)}
                      alt={professionLabel}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </motion.div>
                <div className="min-w-0 flex-1">
                  <motion.h2
                    className="truncate text-2xl font-bold text-white"
                    layout
                  >
                    {character.name}
                  </motion.h2>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {professionLabel}
                  </p>
                </div>
              </motion.header>

              <motion.section variants={blockVariants} className={`space-y-4 ${panelClass}`}>
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

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto md:grid-cols-2 md:items-start">
              <motion.section variants={blockVariants} className="flex min-w-0 flex-col gap-4">
                <SectionTitle>Имущество</SectionTitle>

                <div className="grid grid-cols-2 gap-4">
                  {installmentSlots.map((item, index) => (
                    <motion.div key={item?.itemRef ?? `empty-${index}`} variants={cardVariants}>
                      {item ? (
                        <AssetCard
                          name={item.name}
                          image={getItemImage(item.itemRef)}
                          price={item.basePrice}
                        />
                      ) : (
                        <AssetCard name="" empty />
                      )}
                    </motion.div>
                  ))}
                </div>

                {character.items.length > 0 && (
                  <div className="flex flex-col gap-4">
                    {character.items.map((item) => (
                      <motion.div key={item.itemRef} variants={blockVariants}>
                        <InstallmentBar
                          name={item.name}
                          basePrice={item.basePrice}
                          monthlyPayment={item.monthlyPayment}
                          installmentsPaid={item.installmentsPaid}
                          installmentsTotal={item.installmentsTotal}
                          animateProgress
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.section>

              <motion.section variants={blockVariants} className="flex min-w-0 flex-col gap-4">
                <SectionTitle>Мечты</SectionTitle>

                <div className="grid grid-cols-2 gap-4">
                  {character.dreams.map((dream) => (
                    <motion.div key={dream.itemRef} variants={cardVariants}>
                      <AssetCard
                        name={dream.name}
                        image={getItemImage(dream.itemRef)}
                        price={dream.basePrice}
                        badge="Цель"
                        variant="dream"
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            </div>

            <motion.footer
              variants={blockVariants}
              className="mt-auto grid w-full shrink-0 grid-cols-1 gap-4 border-t border-emerald-400/10 pt-5 sm:grid-cols-2"
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
