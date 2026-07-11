import type { dashboard_tab } from './types'

export const DASHBOARD_TAB_SEARCH_PARAM = 'tab'

const DASHBOARD_TABS: dashboard_tab[] = [
  'character',
  'bank',
  'exchange',
  'deals',
  'real-estate',
  'dream',
  'news',
  'settings',
  'guide',
]

const DASHBOARD_TAB_SET = new Set<string>(DASHBOARD_TABS)

export const DEFAULT_DASHBOARD_TAB: dashboard_tab = 'character'

export function isDashboardTab(value: string | null): value is dashboard_tab {
  return value != null && DASHBOARD_TAB_SET.has(value)
}

export function parseDashboardTab(searchParams: URLSearchParams): dashboard_tab {
  const value = searchParams.get(DASHBOARD_TAB_SEARCH_PARAM)
  return isDashboardTab(value) ? value : DEFAULT_DASHBOARD_TAB
}

export function applyDashboardTabSearchParam(
  searchParams: URLSearchParams,
  tab: dashboard_tab,
): URLSearchParams {
  const next = new URLSearchParams(searchParams)

  if (tab === DEFAULT_DASHBOARD_TAB) {
    next.delete(DASHBOARD_TAB_SEARCH_PARAM)
  } else {
    next.set(DASHBOARD_TAB_SEARCH_PARAM, tab)
  }

  return next
}
