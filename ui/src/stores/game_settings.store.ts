import { create } from 'zustand'

export type GameColorTheme = 'dark' | 'light'

interface GameSettingsState {
  dynamicBackground: boolean
  colorTheme: GameColorTheme
  sidebarCollapsed: boolean
  musicEnabled: boolean
  sfxEnabled: boolean
  musicVolume: number
  sfxVolume: number
  setDynamicBackground: (value: boolean) => void
  setColorTheme: (value: GameColorTheme) => void
  setSidebarCollapsed: (value: boolean) => void
  setMusicEnabled: (value: boolean) => void
  setSfxEnabled: (value: boolean) => void
  setMusicVolume: (value: number) => void
  setSfxVolume: (value: number) => void
  toggleSidebarCollapsed: () => void
}

const STORAGE_KEY = 'game-settings'

type PersistedSettings = Pick<
  GameSettingsState,
  | 'dynamicBackground'
  | 'colorTheme'
  | 'sidebarCollapsed'
  | 'musicEnabled'
  | 'sfxEnabled'
  | 'musicVolume'
  | 'sfxVolume'
>

function clampVolume(value: unknown, fallback: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.min(1, Math.max(0, value))
}

function readStoredSettings(): PersistedSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        dynamicBackground: true,
        colorTheme: 'dark',
        sidebarCollapsed: false,
        musicEnabled: true,
        sfxEnabled: true,
        musicVolume: 0.45,
        sfxVolume: 0.7,
      }
    }
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>
    return {
      dynamicBackground: parsed.dynamicBackground ?? true,
      colorTheme: parsed.colorTheme === 'light' ? 'light' : 'dark',
      sidebarCollapsed: parsed.sidebarCollapsed ?? false,
      musicEnabled: parsed.musicEnabled ?? true,
      sfxEnabled: parsed.sfxEnabled ?? true,
      musicVolume: clampVolume(parsed.musicVolume, 0.45),
      sfxVolume: clampVolume(parsed.sfxVolume, 0.7),
    }
  } catch {
    return {
      dynamicBackground: true,
      colorTheme: 'dark',
      sidebarCollapsed: false,
      musicEnabled: true,
      sfxEnabled: true,
      musicVolume: 0.45,
      sfxVolume: 0.7,
    }
  }
}

function persistSettings(state: PersistedSettings) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      dynamicBackground: state.dynamicBackground,
      colorTheme: state.colorTheme,
      sidebarCollapsed: state.sidebarCollapsed,
      musicEnabled: state.musicEnabled,
      sfxEnabled: state.sfxEnabled,
      musicVolume: state.musicVolume,
      sfxVolume: state.sfxVolume,
    }),
  )
}

const initial = readStoredSettings()

export const useGameSettingsStore = create<GameSettingsState>((set) => ({
  ...initial,
  setDynamicBackground: (value) => {
    set((state) => {
      const next = { ...state, dynamicBackground: value }
      persistSettings(next)
      return next
    })
  },
  setColorTheme: (value) => {
    set((state) => {
      const next = { ...state, colorTheme: value }
      persistSettings(next)
      return next
    })
  },
  setSidebarCollapsed: (value) => {
    set((state) => {
      const next = { ...state, sidebarCollapsed: value }
      persistSettings(next)
      return next
    })
  },
  setMusicEnabled: (value) => {
    set((state) => {
      const next = { ...state, musicEnabled: value }
      persistSettings(next)
      return next
    })
  },
  setSfxEnabled: (value) => {
    set((state) => {
      const next = { ...state, sfxEnabled: value }
      persistSettings(next)
      return next
    })
  },
  setMusicVolume: (value) => {
    set((state) => {
      const next = { ...state, musicVolume: clampVolume(value, state.musicVolume) }
      persistSettings(next)
      return next
    })
  },
  setSfxVolume: (value) => {
    set((state) => {
      const next = { ...state, sfxVolume: clampVolume(value, state.sfxVolume) }
      persistSettings(next)
      return next
    })
  },
  toggleSidebarCollapsed: () => {
    set((state) => {
      const next = { ...state, sidebarCollapsed: !state.sidebarCollapsed }
      persistSettings(next)
      return next
    })
  },
}))
