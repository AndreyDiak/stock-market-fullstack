import type { GameColorTheme } from '../../stores/gameSettings.store'
import type { GameDashboardThemeTokens } from './game_dashboard_theme'

interface GameSettingsPanelProps {
  theme: GameDashboardThemeTokens
  dynamicBackground: boolean
  colorTheme: GameColorTheme
  onDynamicBackgroundChange: (value: boolean) => void
  onColorThemeChange: (value: GameColorTheme) => void
}

function SettingsToggle({
  label,
  description,
  checked,
  onChange,
  theme,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
  theme: GameDashboardThemeTokens
}) {
  return (
    <label
      className={`flex cursor-pointer items-start justify-between gap-4 rounded-2xl border px-4 py-3 transition ${
        checked
          ? 'border-emerald-400/35 bg-emerald-500/10'
          : theme.isLight
            ? 'border-slate-200 bg-slate-50/80'
            : 'border-slate-700/40 bg-slate-800/40'
      }`}
    >
      <div className="min-w-0">
        <p className={`text-sm font-bold ${theme.primaryText}`}>{label}</p>
        <p className={`mt-1 text-xs leading-relaxed ${theme.secondaryText}`}>{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition ${
          checked ? 'bg-emerald-500' : 'bg-slate-500/50'
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
            checked ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  )
}

function ThemeOption({
  label,
  active,
  onSelect,
  theme,
  previewClass,
}: {
  label: string
  active: boolean
  onSelect: () => void
  theme: GameDashboardThemeTokens
  previewClass: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-1 flex-col gap-2 rounded-2xl border p-3 text-left transition ${
        active
          ? 'border-emerald-400/45 bg-emerald-500/10 ring-1 ring-emerald-400/25'
          : theme.isLight
            ? 'border-slate-200 bg-white hover:border-emerald-300/40'
            : 'border-slate-700/40 bg-slate-800/40 hover:border-emerald-400/25'
      }`}
    >
      <div className={`h-14 rounded-xl border border-black/10 ${previewClass}`} />
      <span className={`text-sm font-bold ${active ? 'text-emerald-500' : theme.primaryText}`}>
        {label}
      </span>
    </button>
  )
}

export function GameSettingsPanel({
  theme,
  dynamicBackground,
  colorTheme,
  onDynamicBackgroundChange,
  onColorThemeChange,
}: GameSettingsPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-5">
        <h2 className={`text-xl font-bold tracking-wider ${theme.primaryText}`}>Настройки</h2>
        <p className={`mt-1 text-sm ${theme.secondaryText}`}>
          Параметры отображения игрового интерфейса
        </p>
      </div>

      <div className="flex max-w-xl flex-col gap-4">
        <SettingsToggle
          theme={theme}
          label="Динамический фон"
          description="Анимированные тикеры и световые эффекты на заднем плане."
          checked={dynamicBackground}
          onChange={onDynamicBackgroundChange}
        />

        <section>
          <p className={`mb-2 text-sm font-bold ${theme.primaryText}`}>Цветовая тема</p>
          <div className="flex gap-3">
            <ThemeOption
              theme={theme}
              label="Тёмная"
              active={colorTheme === 'dark'}
              onSelect={() => onColorThemeChange('dark')}
              previewClass="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950"
            />
            <ThemeOption
              theme={theme}
              label="Светлая"
              active={colorTheme === 'light'}
              onSelect={() => onColorThemeChange('light')}
              previewClass="bg-gradient-to-br from-slate-100 via-white to-emerald-50"
            />
          </div>
        </section>
      </div>
    </div>
  )
}
