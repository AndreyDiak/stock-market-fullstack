import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { ExitIcon, SettingsIcon } from '../../../../shared/icons'
import { useGameSettingsStore } from '../../../../stores/game_settings.store'
import { useGameStore } from '../../../../stores/game.store'
import { useDashboardUi } from '../../_model/dashboard_ui_context'
import { NAV_ITEMS, SIDEBAR_PRIMARY_ITEMS } from '../../_model/nav_items'
import type { dashboard_tab, sidebar_nav_item } from '../../_model/types'
import { has_active_insider_alert } from '../../_model/utils'
import { useDashboardTheme } from '../../_model/use_dashboard_theme'
import type { GameDashboardThemeTokens } from '../shared'

function navShellClass(collapsed: boolean) {
  return collapsed
    ? 'w-full min-w-0 max-w-full gap-3 px-4 lg:justify-center lg:gap-0 lg:px-2.5'
    : 'w-full min-w-0 gap-3 px-4'
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
      onClick={onToggle}
      title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
      aria-expanded={!collapsed}
      aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
      className={`flex min-w-0 max-w-full items-center overflow-hidden rounded-[28px] border py-2 transition-colors ${navShellClass(collapsed)} ${
        collapsed ? 'lg:rounded-2xl' : ''
      } ${
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
}: {
  item: sidebar_nav_item
  active: boolean
  collapsed: boolean
  onSelect: () => void
  theme: GameDashboardThemeTokens
  notify?: boolean
}) {
  return (
    <button
      type="button"
      title={item.label}
      onClick={onSelect}
      className={`group relative isolate flex min-w-0 max-w-full items-center overflow-hidden rounded-[28px] border py-3 text-left backdrop-blur-md transition-[gap,padding,border-radius] duration-300 ease-in-out ${navShellClass(collapsed)} ${
        collapsed ? 'lg:rounded-2xl' : ''
      } ${active ? theme.navActive : theme.navIdle}`}
    >
      {active ? (
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-0 ${
            collapsed ? 'rounded-2xl lg:rounded-2xl' : 'rounded-[28px]'
          } ${theme.isLight ? 'bg-white/35' : 'bg-emerald-400/8'}`}
        />
      ) : null}
      <div
        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
          active ? theme.navIconActive : theme.navIconIdle
        }`}
      >
        {item.icon}
        {notify ? (
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] ring-2 ring-slate-900"
          />
        ) : null}
      </div>
      <span
        className={`relative shrink-0 text-sm font-bold leading-tight tracking-wide ${
          collapsed ? 'lg:hidden' : ''
        }`}
      >
        {item.label}
      </span>
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
      onClick={onClick}
      className={`group relative isolate flex min-w-0 max-w-full items-center overflow-hidden rounded-[28px] border py-2.5 text-left backdrop-blur-md transition-[gap,padding,border-radius] duration-300 ease-in-out ${navShellClass(collapsed)} ${
        collapsed ? 'lg:rounded-2xl' : ''
      } ${
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
            collapsed ? 'rounded-2xl lg:rounded-2xl' : 'rounded-[28px]'
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
      <span
        className={`relative shrink-0 text-sm font-bold leading-tight tracking-wide ${
          collapsed ? 'lg:hidden' : ''
        }`}
      >
        {label}
      </span>
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

  const showNewsInsiderAlert = useMemo(
    () => has_active_insider_alert(news, turn),
    [news, turn],
  )

  const go = (tab: dashboard_tab) => () => setActiveTab(tab)

  return (
    <nav
      className={`flex h-full min-h-0 w-full min-w-0 shrink-0 flex-col overflow-x-hidden transition-[width] duration-300 ease-in-out lg:self-stretch lg:overflow-y-auto ${
        collapsed ? 'lg:w-[4.5rem]' : 'lg:w-48'
      } ${theme.scrollArea}`}
    >
      <div className={`flex min-h-full min-w-0 flex-col gap-3 py-0.5 ${collapsed ? 'px-0' : 'px-1'}`}>
        <div className="flex min-w-0 flex-col gap-3">
          {SIDEBAR_PRIMARY_ITEMS.map((item) => (
            <SidebarNavButton
              key={item.id}
              item={item}
              theme={theme}
              collapsed={collapsed}
              active={activeTab === item.id}
              onSelect={go(item.id)}
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
              notify={item.id === 'news' && showNewsInsiderAlert && activeTab !== 'news'}
            />
          ))}
        </div>

        <div className="mt-auto flex min-w-0 flex-col gap-2 pt-2">
          <div className="hidden lg:flex lg:flex-col lg:gap-2">
            <SidebarCollapseToggle
              collapsed={collapsed}
              onToggle={toggleSidebarCollapsed}
              theme={theme}
            />
            <div className={`h-px ${theme.headerDivider}`} aria-hidden />
          </div>
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
