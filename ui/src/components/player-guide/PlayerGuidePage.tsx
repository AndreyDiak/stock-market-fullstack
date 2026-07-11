import { BookOpenIcon, StarIcon, ExchangeIcon, GraduationCapIcon, TradingChartIcon, RealEstateIcon, NewsIcon, BriefcaseIcon, SettingsIcon } from '../../shared/icons'
import { useDashboardTheme } from '../../pages/game_dashboard/_model/use_dashboard_theme'
import { useTutorialStore } from '../../stores/tutorial.store'
import { GUIDE_SECTIONS, getGuideSection, type GuideSectionKey } from './guideData'
import { GuideContent } from './GuideContent'
import { gameAudio } from '../../lib/audio/game_audio'
import type { GameDashboardThemeTokens } from '../../pages/game_dashboard/_components/shared'

const SECTION_ICONS: Record<GuideSectionKey, React.ReactNode> = {
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

const SIDEBAR_ORDER: GuideSectionKey[] = [
  'overview',
  'quick-start',
  'dream',
  'turn-economy',
  'skills',
  'stocks',
  'real-estate-bank',
  'news',
  'deals',
  'ui-tips',
]

function GuideSidebar({
  theme,
  activeSection,
  onSelectSection,
}: {
  theme: GameDashboardThemeTokens
  activeSection: GuideSectionKey
  onSelectSection: (key: GuideSectionKey) => void
}) {
  return (
    <aside
      className={`flex h-full min-h-0 w-60 shrink-0 flex-col overflow-y-auto ${theme.scrollArea}`}
      aria-label="Разделы справочника"
    >
      <div className="p-4 border-b pb-4" style={{ borderColor: theme.headerDivider }}>
        <h2 className="text-lg font-bold text-white">Справочник</h2>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto px-2 pb-4" aria-label="Содержание">
        <ul className="space-y-0.5" role="list">
          {SIDEBAR_ORDER.map((key) => {
            const section = GUIDE_SECTIONS.find((s) => s.key === key)
            if (!section) return null
            const isActive = activeSection === key

            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => {
                    gameAudio.playSfx('buttonClick')
                    onSelectSection(key)
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group w-full min-h-10 px-3 py-2 rounded-xl text-left transition-colors duration-150 flex items-center gap-3 ${
                    isActive ? theme.navActive : theme.navIdle
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center" aria-hidden>
                    {SECTION_ICONS[key]}
                  </span>
                  <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-sm font-medium leading-tight group-hover:text-white">
                    {section.title}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

export function PlayerGuidePage() {
  const theme = useDashboardTheme()
  const { activeGuideSection, openGuideSection, markGuideSectionSeen } = useTutorialStore()

  const section = getGuideSection(activeGuideSection) ?? GUIDE_SECTIONS[0]

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <GuideSidebar
          theme={theme}
          activeSection={activeGuideSection}
          onSelectSection={(key) => {
            openGuideSection(key)
            markGuideSectionSeen(key)
          }}
        />
        <GuideContent theme={theme} section={section} />
      </div>
    </div>
  )
}