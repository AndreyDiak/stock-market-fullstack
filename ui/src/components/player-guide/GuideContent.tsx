import { motion, AnimatePresence } from 'framer-motion'
import { useTutorialStore } from '../../stores/tutorial.store'
import type { GameDashboardThemeTokens } from '../../pages/game_dashboard/_components/shared'
import type { GuideSection, GuideContentBlock } from './guide.types'
import { BookOpenIcon, StarIcon, ExchangeIcon, GraduationCapIcon, TradingChartIcon, RealEstateIcon, NewsIcon, BriefcaseIcon, SettingsIcon } from '../../shared/icons'
import { DreamProgressBar } from './DreamProgressBar'

function renderBlock(block: GuideContentBlock, theme: GameDashboardThemeTokens, index: number) {
  const baseCard = `rounded-2xl p-5 transition-colors ${
    theme.isLight
      ? 'bg-white/60 border-slate-200/80 text-slate-800'
      : 'bg-slate-800/40 border-slate-700/50 text-slate-100'
  }`

  switch (block.type) {
    case 'hero': {
      return (
        <motion.div
          key={index}
          className={`${baseCard} ${
            theme.isLight
              ? 'shadow-[0_0_30px_rgba(56,189,248,0.08)] border-sky-500/20'
              : 'border-emerald-400/15 bg-gradient-to-br from-emerald-500/5 via-slate-800/50 to-slate-800/30'
          } relative overflow-hidden`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(52,211,153,0.08),transparent_70%)]" aria-hidden />
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-400 text-2xl" aria-hidden>
              <span className="text-2xl">{block.icon ?? '💡'}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold leading-tight text-white">{block.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-slate-300">{block.text}</p>
            </div>
          </div>
        </motion.div>
      )
    }

    case 'intro': {
      return (
        <motion.div
          key={index}
          className={`${baseCard}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <p className="text-slate-300 leading-relaxed">{block.text}</p>
        </motion.div>
      )
    }

    case 'actionSteps': {
      return (
        <motion.div
          key={index}
          className={baseCard}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          {block.title && <h4 className="mb-3 font-bold text-white">{block.title}</h4>}
          <ol className="space-y-3" role="list">
            {block.items.map((item, i) => (
              <motion.li
                key={i}
                className="flex gap-3"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: 0.05 * i }}
              >
                <span
                  className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-emerald-400"
                  style={{ background: theme.isLight ? '#ecfdf5' : '#064e3b' }}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <span className="mt-0.5 text-slate-300 leading-relaxed">{item}</span>
              </motion.li>
            ))}
          </ol>
        </motion.div>
      )
    }

    case 'featureCards': {
      return (
        <motion.div
          key={index}
          className={baseCard}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          {block.title && <h4 className="mb-4 font-bold text-white">{block.title}</h4>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {block.cards.map((card, i) => (
              <motion.div
                key={i}
                className={`rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 ${
                  theme.isLight
                    ? 'bg-slate-50 border border-slate-200 hover:border-emerald-200 hover:shadow-md'
                    : 'bg-slate-900/50 border border-slate-700/50 hover:border-emerald-400/20'
                }`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.05 * i }}
              >
                <div className="flex items-start gap-3">
                  {card.badge && (
                    <span className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-emerald-400/15 text-emerald-400">
                      {card.badge}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <h5 className="font-semibold text-white">{card.title}</h5>
                    <p className="mt-1 text-sm text-slate-400 leading-relaxed">{card.text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )
    }

    case 'tip': {
      return (
        <motion.div
          key={index}
          className={`${baseCard} flex gap-3 ${
            theme.isLight
              ? 'bg-cyan-50 border-cyan-100'
              : 'bg-cyan-400/5 border-cyan-400/10'
          }`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400" aria-hidden>
              💡
            </span>
            <div className="min-w-0 flex-1">
              {block.title && <h4 className="font-bold text-emerald-300">{block.title}</h4>}
              <p className={block.title ? 'mt-1' : ''} style={{ color: theme.isLight ? '#0e7490' : '#a5f3fc' }}>
                {block.text}
              </p>
            </div>
          </div>
        </motion.div>
      )
    }

    case 'warning': {
      return (
        <motion.div
          key={index}
          className={`${baseCard} flex gap-3 ${
            theme.isLight
              ? 'bg-amber-50 border-amber-100'
              : 'bg-amber-400/5 border-amber-400/10'
          }`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-amber-400" aria-hidden>
              ⚠️
            </span>
            <div className="min-w-0 flex-1">
              {block.title && <h4 className="font-bold text-amber-300">{block.title}</h4>}
              <p className={block.title ? 'mt-1' : ''} style={{ color: theme.isLight ? '#92400e' : '#fde047' }}>
                {block.text}
              </p>
            </div>
          </div>
        </motion.div>
      )
    }

    case 'dreamProgress': {
      return (
        <motion.div
          key={index}
          className={`${baseCard} ${
            theme.isLight
              ? 'bg-gradient-to-br from-emerald-50 to-sky-50 border-emerald-200/50'
              : 'bg-gradient-to-br from-emerald-500/10 via-slate-800/50 to-slate-800/30 border-emerald-400/15'
          }`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <DreamProgressBar
            totalStages={block.totalStages}
            currentStage={block.currentStage}
            completedStages={block.completedStages}
            theme={theme}
          />
        </motion.div>
      )
    }

    case 'related': {
      return (
        <motion.div
          key={index}
          className={baseCard}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <h4 className="mb-3 font-bold text-white">{block.title}</h4>
          <div className="flex flex-wrap gap-2">
            {block.sectionKeys.map((key) => {
              const section = GUIDE_SECTIONS.find((s) => s.key === key)
              if (!section) return null
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => useTutorialStore.getState().openGuideSection(key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    theme.isLight
                      ? 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200'
                      : 'bg-slate-800/50 text-slate-300 hover:bg-emerald-400/10 hover:text-emerald-300 border border-slate-700/50'
                  }`}
                >
                  {section.title}
                </button>
              )
            })}
          </div>
        </motion.div>
      )
    }

    default:
      return null
  }
}

export function GuideContent({
  theme,
  section,
}: {
  theme: GameDashboardThemeTokens
  section: GuideSection
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={section.key}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="flex-1 min-h-0 overflow-y-auto pr-2 guide-content"
        role="region"
        aria-labelledby="guide-section-title"
      >
        <div className="mx-auto max-w-3xl space-y-6 py-4">
          <motion.header
            className="border-b pb-4 pt-4"
            style={{ borderColor: theme.headerDivider }}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 id="guide-section-title" className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              <span aria-hidden>{SECTION_ICONS[section.key]}</span>
              {section.title}
            </h1>
            <p className="mt-1 text-slate-400">{section.description}</p>
          </motion.header>

          <motion.div
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {section.blocks.map((block, i) => renderBlock(block, theme, i))}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  overview: <BookOpenIcon className="h-6 w-6" aria-label="overview" />,
  'quick-start': <TradingChartIcon className="h-6 w-6" aria-label="start" />,
  dream: <StarIcon className="h-6 w-6" aria-label="dream" />,
  'turn-economy': <ExchangeIcon className="h-6 w-6" aria-label="turn" />,
  skills: <GraduationCapIcon className="h-6 w-6" aria-label="skills" />,
  stocks: <TradingChartIcon className="h-6 w-6" aria-label="stocks" />,
  'real-estate-bank': <RealEstateIcon className="h-6 w-6" aria-label="real-estate" />,
  news: <NewsIcon className="h-6 w-6" aria-label="news" />,
  deals: <BriefcaseIcon className="h-6 w-6" aria-label="deals" />,
  'ui-tips': <SettingsIcon className="h-6 w-6" aria-label="ui" />,
}

const GUIDE_SECTIONS = [
  { key: 'overview', title: 'Обзор' },
  { key: 'quick-start', title: 'Старт' },
  { key: 'dream', title: 'Мечта' },
  { key: 'turn-economy', title: 'Экономика' },
  { key: 'skills', title: 'Навыки' },
  { key: 'stocks', title: 'Биржа' },
  { key: 'real-estate-bank', title: 'Недвижимость' },
  { key: 'news', title: 'Новости' },
  { key: 'deals', title: 'Сделки' },
  { key: 'ui-tips', title: 'Интерфейс' },
]