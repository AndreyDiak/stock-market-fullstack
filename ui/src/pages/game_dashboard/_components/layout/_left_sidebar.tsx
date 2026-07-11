import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { gameAudio } from '../../../../lib/audio/game_audio'
import { ExitIcon, HelpIcon, SettingsIcon } from '../../../../shared/icons'
import { useGameSettingsStore } from '../../../../stores/game_settings.store'
import { useGameStore } from '../../../../stores/game.store'
import { useDashboardUi } from '../../_model/dashboard_ui_context'
import { NAV_ITEMS, SIDEBAR_BOTTOM_ITEMS, SIDEBAR_PRIMARY_ITEMS } from '../../_model/nav_items'
import type { dashboard_tab, sidebar_nav_item } from '../../_model/types'
import { has_active_insider_alert } from '../../_model/utils'
import { useDashboardTheme } from '../../_model/use_dashboard_theme'
import type { GameDashboardThemeTokens } from '../shared'

function navButtonClass(collapsed: boolean) {
  const base = 'w-full px-4 py-3'
  if (collapsed) {
    return `${base} gap-0 lg:rounded-2xl`
  }
  return `${base} gap-3 max-lg:gap-0 max-lg:rounded-2xl`
}

function navLabelClass(collapsed: boolean) {
  return `min-w-0 overflow-hidden whitespace-nowrap text-sm font-bold leading-tight tracking-wide transition-[max-width,opacity] duration-300 ease-in-out ${
    collapsed
      ? 'max-w-0 opacity-0'
      : 'max-w-[12rem] opacity-100 max-lg:max-w-0 max-lg:opacity-0'
  }`
}

function SidebarCollapseToggle({
  collapsed,
  onToggle,
  theme,
}: {
  collapsed: boolean
  onToggle: () => void
  theme: GameDashboardThemeTokens
}) {
  return (
    <button
      type="button"
      onClick={() => {
        gameAudio.playSfx('buttonClick')
        onToggle()
      }}
      title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
      aria-expanded={!collapsed}
      aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
      className={`flex w-full min-w-0 items-center justify-start overflow-hidden rounded-[28px] border transition-[gap,padding,border-radius,colors] duration-300 ease-in-out ${navButtonClass(collapsed)} ${
        theme.isLight
          ? 'border-slate-200/80 bg-white/60 text-slate-500 hover:bg-white hover:text-emerald-700'
          : 'border-slate-700/45 bg-slate-800/45 text-slate-400 hover:border-emerald-400/25 hover:text-emerald-300'
      }`}
    >
      <svg
        viewBox="0 0 20 20"
        className={`h-4 w-4 shrink-0 transition-transform duration-300 ease-in-out ${collapsed ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M12 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

function SidebarNavButton({
  item,
  active,
  collapsed,
  onSelect,
  theme,
  notify,
  badgeCount,
  badgeCountLabel = 'предложений',
}: {
  item: sidebar_nav_item
  active: boolean
  collapsed: boolean
  onSelect: () => void
  theme: GameDashboardThemeTokens
  notify?: boolean
  badgeCount?: number
  badgeCountLabel?: string
}) {
  const showBadge = badgeCount != null && badgeCount > 0

  return (
    <button
      type="button"
      title={item.label}
      onClick={() => {
        gameAudio.playSfx('buttonClick')
        onSelect()
      }}
      aria-label={
        showBadge ? `${item.label}, ${badgeCount} ${badgeCountLabel}` : item.label
      }
      className={`group relative isolate flex min-h-11 w-full min-w-0 items-center justify-start overflow-hidden rounded-[28px] border text-left backdrop-blur-md transition-[gap,padding,border-radius,transform] duration-300 ease-in-out hover:-translate-y-px ${navButtonClass(collapsed)} ${
        active ? theme.navActive : theme.navIdle
      }`}
    >
      {active ? (
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-0 ${
            collapsed ? 'rounded-2xl' : 'rounded-[28px]'
          } ${theme.isLight ? 'bg-white/35' : 'bg-emerald-400/8'}`}
        />
      ) : null}
      <div
        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl [&_svg]:h-5 [&_svg]:w-5 ${
          active ? theme.navIconActive : theme.navIconIdle
        }`}
      >
        {item.icon}
        {showBadge ? (
          <span
            aria-hidden
            className="absolute -right-1.5 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-400 px-1 text-[10px] font-black leading-none text-emerald-950 shadow-[0_0_8px_rgba(52,211,153,0.65)] ring-2 ring-slate-900"
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        ) : notify ? (
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] ring-2 ring-slate-900"
          />
        ) : null}
      </div>
      <span className={navLabelClass(collapsed)}>{item.label}</span>
    </button>
  )
}

function SidebarFooterButton({
  label,
  icon,
  active,
  collapsed,
  onClick,
  theme,
  danger,
}: {
  label: string
  icon: ReactNode
  active?: boolean
  collapsed: boolean
  onClick: () => void
  theme: GameDashboardThemeTokens
  danger?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={() => {
        gameAudio.playSfx('buttonClick')
        onClick()
      }}
      className={`group relative isolate flex w-full min-w-0 items-center justify-start overflow-hidden rounded-[28px] border text-left backdrop-blur-md transition-[gap,padding,border-radius] duration-300 ease-in-out ${navButtonClass(collapsed)} ${
        danger
          ? theme.isLight
            ? 'border-red-200/80 bg-red-50/80 text-red-700 hover:border-red-300 hover:bg-red-50'
            : 'border-red-900/40 bg-red-950/30 text-red-300 hover:border-red-500/35 hover:bg-red-950/50'
          : active
            ? theme.navActive
            : theme.navIdle
      }`}
    >
      {active && !danger ? (
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-0 ${
            collapsed ? 'rounded-2xl' : 'rounded-[28px]'
          } ${theme.isLight ? 'bg-white/35' : 'bg-emerald-400/8'}`}
        />
      ) : null}
      <div
        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
          danger
            ? theme.isLight
              ? 'bg-red-100 text-red-600'
              : 'bg-red-500/15 text-red-400'
            : active
              ? theme.navIconActive
              : theme.navIconIdle
        }`}
      >
        {icon}
      </div>
      <span className={navLabelClass(collapsed)}>{label}</span>
    </button>
  )
}

export function LeftSidebar() {
  const theme = useDashboardTheme()
  const collapsed = useGameSettingsStore((state) => state.sidebarCollapsed)
  const toggleSidebarCollapsed = useGameSettingsStore((state) => state.toggleSidebarCollapsed)
  const { activeTab, setActiveTab, openExitModal } = useDashboardUi()
  const news = useGameStore((state) => state.news)
  const turn = useGameStore((state) => state.turn)
  const portfolio = useGameStore((state) => state.portfolio)
  const dealCount = useGameStore((state) => state.deals.length)
  const propertyOfferCount = useGameStore((state) => state.propertyOffers.length)
  const activeLoanCount = useGameStore((state) => state.bankLoans.length)
  const stockCount = useMemo(() => (portfolio ?? []).filter((r) => r.qty > 0).length, [portfolio])

  const showNewsInsiderAlert = useMemo(
    () => has_active_insider_alert(news, turn),
    [news, turn],
  )

  const dream = useGameStore((state) => state.dream)
  const dreamStageReady = useMemo(
    () => dream?.stages.some((s) => s.status === 'READY_TO_COMPLETE') ?? false,
    [dream],
  )

  const go = (tab: dashboard_tab) => () => setActiveTab(tab)

  return (
    <nav
      className={`flex h-full min-h-0 w-full min-w-0 shrink-0 flex-col overflow-x-hidden lg:overflow-y-auto ${theme.scrollArea}`}
    >
      <div className="flex min-h-full w-full min-w-0 flex-col gap-3 py-0.5">
        <div className="sidebar__main flex w-full min-w-0 flex-col gap-3">
          {SIDEBAR_PRIMARY_ITEMS.map((item) => (
            <SidebarNavButton
              key={item.id}
              item={item}
              theme={theme}
              collapsed={collapsed}
              active={activeTab === item.id}
              onSelect={go(item.id)}
              notify={item.id === 'news' && showNewsInsiderAlert && activeTab !== 'news'}
            />
          ))}

          <div className={`my-1 h-px ${theme.headerDivider}`} />

          {NAV_ITEMS.map((item) => (
            <SidebarNavButton
              key={item.id}
              item={item}
              theme={theme}
              collapsed={collapsed}
              active={activeTab === item.id}
              onSelect={go(item.id)}
              badgeCount={item.id === 'bank' ? activeLoanCount : item.id === 'exchange' ? stockCount : item.id === 'deals' ? dealCount : item.id === 'real-estate' ? propertyOfferCount : undefined}
              badgeCountLabel={item.id === 'bank' ? 'активных кредитов' : undefined}
            />
          ))}

          <div className={`my-1 h-px ${theme.headerDivider}`} />

          {SIDEBAR_BOTTOM_ITEMS.map((item) => (
            <SidebarNavButton
              key={item.id}
              item={item}
              theme={theme}
              collapsed={collapsed}
              active={activeTab === item.id}
              onSelect={go(item.id)}
              notify={item.id === 'dream' && dreamStageReady && activeTab !== 'dream'}
            />
          ))}
        </div>

        <div className="sidebar__system mt-auto flex w-full min-w-0 flex-col gap-2 pt-2">
          <div className="sidebar__collapse hidden lg:flex lg:flex-col lg:gap-2">
            <SidebarCollapseToggle
              collapsed={collapsed}
              onToggle={toggleSidebarCollapsed}
              theme={theme}
            />
            <div className={`h-px ${theme.headerDivider}`} aria-hidden />
          </div>
          <SidebarFooterButton
            label="Руководство"
            icon={<HelpIcon className="h-6 w-6" />}
            theme={theme}
            collapsed={collapsed}
            active={activeTab === 'guide'}
            onClick={go('guide')}
          />
          <SidebarFooterButton
            label="Настройки"
            icon={<SettingsIcon className="h-6 w-6" />}
            theme={theme}
            collapsed={collapsed}
            active={activeTab === 'settings'}
            onClick={go('settings')}
          />
          <SidebarFooterButton
            label="Выход"
            icon={<ExitIcon className="h-6 w-6" />}
            theme={theme}
            collapsed={collapsed}
            danger
            onClick={openExitModal}
          />
        </div>
      </div>
    </nav>
  )
}
