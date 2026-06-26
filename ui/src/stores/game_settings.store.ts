import { create } from 'zustand'

export type GameColorTheme = 'dark' | 'light'

interface GameSettingsState {
  dynamicBackground: boolean
  colorTheme: GameColorTheme
  sidebarCollapsed: boolean
  setDynamicBackground: (value: boolean) => void
  setColorTheme: (value: GameColorTheme) => void
  setSidebarCollapsed: (value: boolean) => void
  toggleSidebarCollapsed: () => void
}

const STORAGE_KEY = 'game-settings'

function readStoredSettings(): Pick<
  GameSettingsState,
  'dynamicBackground' | 'colorTheme' | 'sidebarCollapsed'
> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { dynamicBackground: true, colorTheme: 'dark', sidebarCollapsed: false }
    }
    const parsed = JSON.parse(raw) as Partial<
      Pick<GameSettingsState, 'dynamicBackground' | 'colorTheme' | 'sidebarCollapsed'>
    >
    return {
      dynamicBackground: parsed.dynamicBackground ?? true,
      colorTheme: parsed.colorTheme === 'light' ? 'light' : 'dark',
      sidebarCollapsed: parsed.sidebarCollapsed ?? false,
    }
  } catch {
    return { dynamicBackground: true, colorTheme: 'dark', sidebarCollapsed: false }
  }
}

function persistSettings(
  state: Pick<GameSettingsState, 'dynamicBackground' | 'colorTheme' | 'sidebarCollapsed'>,
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      dynamicBackground: state.dynamicBackground,
      colorTheme: state.colorTheme,
      sidebarCollapsed: state.sidebarCollapsed,
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
  toggleSidebarCollapsed: () => {
    set((state) => {
      const next = { ...state, sidebarCollapsed: !state.sidebarCollapsed }
      persistSettings(next)
      return next
    })
  },
}))
