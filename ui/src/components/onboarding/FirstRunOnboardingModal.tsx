import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XIcon, 
  CheckIcon, 
  BookOpenIcon,
  BriefcaseIcon,
  GraduationCapIcon,
  TradingChartIcon,
  RealEstateIcon
} from '../../shared/icons'
import { gameAudio } from '../../lib/audio/game_audio'
import { useDashboardTheme } from '../../pages/game_dashboard/_model/use_dashboard_theme'
import { useTutorialStore } from '../../stores/tutorial.store'

const ONBOARDING_CARD_ICONS = {
  briefcase: BriefcaseIcon,
  graduation_cap: GraduationCapIcon,
  trading_chart: TradingChartIcon,
  real_estate: RealEstateIcon,
} as const

function renderCardIcon(iconKey?: string) {
  if (!iconKey) return null
  const IconComponent = ONBOARDING_CARD_ICONS[iconKey as keyof typeof ONBOARDING_CARD_ICONS]
  if (!IconComponent) return null
  return <IconComponent className="h-6 w-6 text-emerald-400" aria-hidden />
}

const ONBOARDING_STEPS = [
  {
    title: 'Добро пожаловать в игру',
    icon: '🎮',
    text: 'Вы управляете персонажем, развиваете его карьеру и капитал, чтобы исполнить его главную мечту. Игра пошаговая — каждый ваш ход меняет баланс, рынок и события.',
    points: [
      'У каждого персонажа своя мечта',
      'Мечта состоит из этапов',
      'Когда все этапы выполнены — игра завершается победой',
    ],
  },
  {
    title: 'Ваша главная цель — мечта',
    icon: '⭐',
    text: 'Мечта — это ваш главный путь прохождения. В ней указаны этапы и требования: деньги, активы, навыки, репутация или пассивный доход.',
    points: [
      'Текущий этап активен — работайте над его требованиями',
      'Выполненные этапы не откатываются назад',
      'Финальный этап завершает игру победой',
    ],
    tip: 'Открывайте раздел «Мечта» (звезда в меню), чтобы понимать, что делать дальше.',
  },
  {
    title: 'Каждый ход меняет экономику',
    icon: '📅',
    text: 'Когда вы завершаете ход, игра начисляет доходы, списывает платежи, обновляет рынок и создаёт новые события.',
    points: [
      'Зарплата — каждый 3-й ход (рост зависит от квалификации)',
      'Расходы на жизнь — случайные чеки каждый ход',
      'Платежи по рассрочке — ежемесячно по ипотеке/кредитам',
      'Пассивный доход — с недвижимости (склады, караваны, яхты)',
    ],
    warning: 'Следите за балансом: если после хода он уйдёт в минус, можно проиграть.',
  },
  {
    title: 'Как растить капитал',
    icon: '📈',
    text: 'Деньги можно усиливать через работу, навыки, биржу, недвижимость и выгодные предложения.',
    cards: [
      { title: 'Работа', text: 'Стабильный доход, растёт с навыком Квалификация', icon: 'briefcase' },
      { title: 'Навыки', text: 'Открывают новые возможности и снижают издержки', icon: 'graduation_cap' },
      { title: 'Биржа', text: 'Рост капитала и дивиденды — риск и награда', icon: 'trading_chart' },
      { title: 'Недвижимость', text: 'Активы и пассивный доход через рассрочку', icon: 'real_estate' },
      { title: 'Сделки', text: 'Редкие выгодные обмены с NPC', icon: 'briefcase' },
    ],
  },
  {
    title: 'Руководство всегда рядом',
    icon: '📖',
    text: 'Если что-то непонятно, откройте раздел «Руководство» в левой навигации (иконка книги). Там подробные объяснения всех механик.',
    ctaPrimary: 'Начать играть',
    ctaSecondary: 'Открыть руководство',
  },
]

export function FirstRunOnboardingModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const theme = useDashboardTheme()
  const { completeOnboarding, skipOnboarding } = useTutorialStore()
  const [step, setStep] = useState(0)

  const current = ONBOARDING_STEPS[step]
  const isLast = step === ONBOARDING_STEPS.length - 1

  const handleNext = useCallback(() => {
    gameAudio.playSfx('buttonClick')
    if (isLast) {
      completeOnboarding()
      onClose()
    } else {
      setStep((s) => s + 1)
    }
  }, [isLast, completeOnboarding, onClose])

  const handleBack = useCallback(() => {
    gameAudio.playSfx('buttonClick')
    setStep((s) => Math.max(0, s - 1))
  }, [])

  const handleSkip = useCallback(() => {
    gameAudio.playSfx('buttonClick')
    skipOnboarding()
    onClose()
  }, [skipOnboarding, onClose])

  const handleOpenGuide = useCallback(() => {
    gameAudio.playSfx('buttonClick')
    completeOnboarding()
    onClose()
    // The guide will be opened via the tutorial store
    useTutorialStore.getState().openGuideSection('quick-start')
  }, [completeOnboarding, onClose])

  if (!isOpen) return null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-hidden
      />

      <motion.div
        className={`relative w-full max-w-2xl rounded-3xl overflow-hidden ${
          theme.isLight
            ? 'bg-white border border-slate-200 shadow-[0_0_60px_rgba(0,0,0,0.15)]'
            : 'bg-slate-900/95 border border-slate-700/50 shadow-[0_0_60px_rgba(0,0,0,0.5)]'
        }`}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="absolute top-4 right-4">
          <button
            type="button"
            onClick={handleSkip}
            aria-label="Пропустить знакомство"
            className={`p-2 rounded-xl transition-colors ${
              theme.isLight
                ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <XIcon className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="px-6 py-8">
          <div className="mb-6 text-center">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400/15 text-3xl" aria-hidden>
              {current.icon}
            </span>
            <h2 id="onboarding-title" className="mt-4 text-2xl font-bold tracking-tight text-white">
              {current.title}
            </h2>
          </div>

          <p className="mb-6 text-base leading-relaxed text-slate-300">{current.text}</p>

          {current.points && (
            <ul className="mb-6 space-y-3" role="list">
              {current.points.map((point, i) => (
                <motion.li
                  key={i}
                  className="flex items-start gap-3 text-slate-300"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * i }}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400" aria-hidden>
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  <span>{point}</span>
                </motion.li>
              ))}
            </ul>
          )}

          {current.cards && (
            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              {current.cards.map((card, i) => (
                <motion.div
                  key={i}
                  className={`p-4 rounded-xl ${theme.isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/50 border border-slate-700/50'}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * i }}
                >
                  <div className="flex items-start gap-3">
                    {renderCardIcon(card.icon)}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-white">{card.title}</h4>
                      <p className="mt-1 text-sm text-slate-400">{card.text}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {current.tip && (
            <motion.div
              className={`mb-6 p-4 rounded-xl border-l-4 ${
                theme.isLight
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                  : 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'
              }`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400" aria-hidden>
                  💡
                </span>
                <p className="text-sm leading-relaxed">{current.tip}</p>
              </div>
            </motion.div>
          )}

          {current.warning && (
            <motion.div
              className={`mb-6 p-4 rounded-xl border-l-4 ${
                theme.isLight
                  ? 'bg-amber-50 border-amber-400 text-amber-800'
                  : 'bg-amber-500/10 border-amber-400/30 text-amber-300'
              }`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-amber-400" aria-hidden>
                  ⚠️
                </span>
                <p className="text-sm leading-relaxed">{current.warning}</p>
              </div>
            </motion.div>
          )}

          <div className="mb-6 flex items-center justify-center gap-2" role="group" aria-label="Прогресс шагов">
            {ONBOARDING_STEPS.map((_, i) => (
              <motion.button
                key={i}
                type="button"
                disabled
                aria-label={`Шаг ${i + 1} из ${ONBOARDING_STEPS.length}`}
                className={`h-2 w-2 rounded-full transition-all ${
                  i === step
                    ? 'w-6 bg-emerald-400'
                    : theme.isLight
                    ? 'bg-slate-300'
                    : 'bg-slate-600'
                }`}
                initial={{ scale: 0.8 }}
                animate={{ scale: i === step ? 1 : 0.8 }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 pt-4 border-t" style={{ borderColor: theme.headerDivider }}>
            <AnimatePresence mode="wait">
              {!isLast && (
                <motion.button
                  type="button"
                  onClick={handleBack}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                    theme.isLight
                      ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                      : 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  Назад
                </motion.button>
              )}
            </AnimatePresence>

            <div className="flex-1" />

            <AnimatePresence mode="wait">
              {isLast ? (
                <motion.button
                  type="button"
                  onClick={handleOpenGuide}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                    theme.isLight
                      ? 'border-slate-300 text-slate-700 hover:bg-slate-50'
                      : 'border-slate-600 text-slate-300 hover:bg-slate-800'
                  }`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <span className="flex items-center gap-2">
                    <BookOpenIcon className="h-4 w-4" aria-hidden />
                    {current.ctaSecondary}
                  </span>
                </motion.button>
              ) : null}
            </AnimatePresence>

            <motion.button
              type="button"
              onClick={handleNext}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.3)]`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {isLast ? current.ctaPrimary : 'Далее'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}