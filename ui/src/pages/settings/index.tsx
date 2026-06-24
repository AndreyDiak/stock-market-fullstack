import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameSettingsPanel } from '../../components/game_dashboard/game_settings_panel'
import { getGameDashboardTheme } from '../../components/game_dashboard/game_dashboard_theme'
import { GameButton } from '../../components/game_ui/game_button'
import { GamePanel } from '../../components/game_ui/game_panel'
import { GameShell } from '../../components/game_ui/game_shell'
import { useGameSettingsStore } from '../../stores/gameSettings.store'

export function SettingsPage() {
  const navigate = useNavigate()
  const {
    dynamicBackground,
    colorTheme,
    setDynamicBackground,
    setColorTheme,
  } = useGameSettingsStore()
  const theme = useMemo(() => getGameDashboardTheme(colorTheme), [colorTheme])

  return (
    <GameShell showAtmosphere={dynamicBackground} colorTheme={colorTheme} className={theme.shellClass}>
      <div className="flex min-h-dvh flex-col items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-lg">
          <GamePanel className="!p-5 md:!p-6">
            <GameSettingsPanel
              theme={theme}
              dynamicBackground={dynamicBackground}
              colorTheme={colorTheme}
              onDynamicBackgroundChange={setDynamicBackground}
              onColorThemeChange={setColorTheme}
            />

            <div className={`mt-8 border-t pt-5 ${theme.isLight ? 'border-slate-200' : 'border-slate-700/40'}`}>
              <GameButton fullWidth variant="muted" onClick={() => navigate('/menu')}>
                Назад в меню
              </GameButton>
            </div>
          </GamePanel>
        </div>
      </div>
    </GameShell>
  )
}
