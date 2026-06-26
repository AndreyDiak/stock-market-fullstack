import { useMemo } from 'react'
import { useGameSettingsStore } from '../../../stores/game_settings.store'
import { getGameDashboardTheme } from '../_components/shared'

export function useDashboardTheme() {
  const colorTheme = useGameSettingsStore((state) => state.colorTheme)
  return useMemo(() => getGameDashboardTheme(colorTheme), [colorTheme])
}
