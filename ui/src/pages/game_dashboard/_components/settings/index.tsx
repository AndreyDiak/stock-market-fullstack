import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { GameColorTheme } from '../../../../stores/game_settings.store'
import { useGameSettingsStore } from '../../../../stores/game_settings.store'
import {
  sessionStaggerContainerVariants,
  sessionStaggerItemVariants,
} from '../../../../components/game_ui/session_animations'
import { useDashboardTheme } from '../../_model/use_dashboard_theme'
import type { GameDashboardThemeTokens } from '../shared'

interface GameSettingsPanelProps {
  theme?: GameDashboardThemeTokens
  dynamicBackground?: boolean
  colorTheme?: GameColorTheme
  onDynamicBackgroundChange?: (value: boolean) => void
  onColorThemeChange?: (value: GameColorTheme) => void
  animated?: boolean
  footer?: ReactNode
}

function SettingsSection({
  animated,
  className = "",
  children,
}: {
  animated?: boolean;
  className?: string;
  children: ReactNode;
}) {
  if (animated) {
    return (
      <motion.div variants={sessionStaggerItemVariants} className={className}>
        {children}
      </motion.div>
    );
  }

  return <div className={className}>{children}</div>;
}

function SettingsToggle({
  label,
  description,
  checked,
  onChange,
  theme,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  theme: GameDashboardThemeTokens;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start justify-between gap-4 rounded-2xl border px-4 py-3 transition ${
        checked
          ? "border-emerald-400/35 bg-emerald-500/10"
          : theme.isLight
            ? "border-slate-200 bg-slate-50/80"
            : "border-slate-700/40 bg-slate-800/40"
      }`}
    >
      <div className="min-w-0">
        <p className={`text-sm font-bold ${theme.primaryText}`}>{label}</p>
        <p className={`mt-1 text-xs leading-relaxed ${theme.secondaryText}`}>
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-emerald-500" : "bg-slate-500/50"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
            checked ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}

function SettingsVolumeSlider({
  label,
  description,
  value,
  disabled,
  onChange,
  theme,
}: {
  label: string;
  description: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  theme: GameDashboardThemeTokens;
}) {
  const percent = Math.round(value * 100);

  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        theme.isLight
          ? "border-slate-200 bg-slate-50/80"
          : "border-slate-700/40 bg-slate-800/40"
      } ${disabled ? "opacity-55" : ""}`}
    >
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-sm font-bold ${theme.primaryText}`}>{label}</p>
          <p className={`mt-1 text-xs leading-relaxed ${theme.secondaryText}`}>
            {description}
          </p>
        </div>
        <span className={`shrink-0 text-sm font-bold tabular-nums ${theme.primaryText}`}>
          {percent}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={percent}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-500/35 accent-emerald-500 disabled:cursor-not-allowed"
        aria-label={label}
      />
    </div>
  );
}

function ThemeOption({
  label,
  active,
  onSelect,
  theme,
  previewClass,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
  theme: GameDashboardThemeTokens;
  previewClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-1 flex-col gap-2 rounded-2xl border p-3 text-left transition ${
        active
          ? "border-emerald-400/45 bg-emerald-500/10 ring-1 ring-emerald-400/25"
          : theme.isLight
            ? "border-slate-200 bg-white hover:border-emerald-300/40"
            : "border-slate-700/40 bg-slate-800/40 hover:border-emerald-400/25"
      }`}
    >
      <div
        className={`h-14 rounded-xl border border-black/10 ${previewClass}`}
      />
      <span
        className={`text-sm font-bold ${active ? "text-emerald-500" : theme.primaryText}`}
      >
        {label}
      </span>
    </button>
  );
}

export function GameSettingsPanel({
  theme: themeProp,
  dynamicBackground: dynamicBackgroundProp,
  colorTheme: colorThemeProp,
  onDynamicBackgroundChange: onDynamicBackgroundChangeProp,
  onColorThemeChange: onColorThemeChangeProp,
  animated = false,
  footer,
}: GameSettingsPanelProps = {}) {
  const dashboardTheme = useDashboardTheme()
  const {
    dynamicBackground: storeDynamicBackground,
    colorTheme: storeColorTheme,
    musicEnabled,
    sfxEnabled,
    musicVolume,
    sfxVolume,
    setDynamicBackground,
    setColorTheme,
    setMusicEnabled,
    setSfxEnabled,
    setMusicVolume,
    setSfxVolume,
  } = useGameSettingsStore()

  const theme = themeProp ?? dashboardTheme
  const dynamicBackground = dynamicBackgroundProp ?? storeDynamicBackground
  const colorTheme = colorThemeProp ?? storeColorTheme
  const onDynamicBackgroundChange = onDynamicBackgroundChangeProp ?? setDynamicBackground
  const onColorThemeChange = onColorThemeChangeProp ?? setColorTheme
  const rootClassName = "flex min-h-0 flex-1 flex-col";
  const content = (
    <>
      <SettingsSection animated={animated} className="mb-5">
        <h2 className={`text-xl font-bold tracking-wider ${theme.primaryText}`}>
          Настройки
        </h2>
        <p className={`mt-1 text-sm ${theme.secondaryText}`}>
          Параметры отображения игрового интерфейса
        </p>
      </SettingsSection>

      <div className="flex max-w-xl flex-col gap-4">
        <SettingsSection animated={animated}>
          <SettingsToggle
            theme={theme}
            label="Динамический фон"
            description="Анимированные тикеры и световые эффекты на заднем плане."
            checked={dynamicBackground}
            onChange={onDynamicBackgroundChange}
          />
        </SettingsSection>

        <SettingsSection animated={animated}>
          <section className="flex flex-col gap-3">
            <p className={`text-sm font-bold ${theme.primaryText}`}>Звук</p>
            <SettingsToggle
              theme={theme}
              label="Фоновая музыка"
              description="Зацикленное воспроизведение фоновых треков во время игры."
              checked={musicEnabled}
              onChange={setMusicEnabled}
            />
            <SettingsVolumeSlider
              theme={theme}
              label="Громкость музыки"
              description="Регулирует громкость фоновых треков."
              value={musicVolume}
              disabled={!musicEnabled}
              onChange={setMusicVolume}
            />
            <SettingsToggle
              theme={theme}
              label="Звуковые эффекты"
              description="Короткие звуки на действия: ход, сделки, новости и покупки."
              checked={sfxEnabled}
              onChange={setSfxEnabled}
            />
            <SettingsVolumeSlider
              theme={theme}
              label="Громкость эффектов"
              description="Регулирует громкость игровых звуковых эффектов."
              value={sfxVolume}
              disabled={!sfxEnabled}
              onChange={setSfxVolume}
            />
          </section>
        </SettingsSection>

        <SettingsSection animated={animated}>
          <section>
            <p className={`mb-2 text-sm font-bold ${theme.primaryText}`}>
              Цветовая тема
            </p>
            <div className="flex gap-3">
              <ThemeOption
                theme={theme}
                label="Тёмная"
                active={colorTheme === "dark"}
                onSelect={() => onColorThemeChange("dark")}
                previewClass="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950"
              />
              <ThemeOption
                theme={theme}
                label="Светлая"
                active={colorTheme === "light"}
                onSelect={() => onColorThemeChange("light")}
                previewClass="bg-gradient-to-br from-slate-100 via-white to-emerald-50"
              />
            </div>
          </section>
        </SettingsSection>
      </div>

      {footer ? (
        <SettingsSection
          animated={animated}
          className="mt-8 border-t border-white/10 pt-5"
        >
          {footer}
        </SettingsSection>
      ) : null}
    </>
  );

  if (animated) {
    return (
      <motion.div
        className={rootClassName}
        variants={sessionStaggerContainerVariants}
        initial="hidden"
        animate="show"
      >
        {content}
      </motion.div>
    );
  }

  return <div className={rootClassName}>{content}</div>;
}
