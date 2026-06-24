import { create } from 'zustand'

export type GameColorTheme = 'dark' | 'light'

interface GameSettingsState {
  dynamicBackground: boolean
  colorTheme: GameColorTheme
  setDynamicBackground: (value: boolean) => void
  setColorTheme: (value: GameColorTheme) => void
}

const STORAGE_KEY = 'game-settings'

function readStoredSettings(): Pick<GameSettingsState, 'dynamicBackground' | 'colorTheme'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { dynamicBackground: true, colorTheme: 'dark' }
    }
    const parsed = JSON.parse(raw) as Partial<Pick<GameSettingsState, 'dynamicBackground' | 'colorTheme'>>
    return {
      dynamicBackground: parsed.dynamicBackground ?? true,
      colorTheme: parsed.colorTheme === 'light' ? 'light' : 'dark',
    }
  } catch {
    return { dynamicBackground: true, colorTheme: 'dark' }
  }
}

function persistSettings(state: Pick<GameSettingsState, 'dynamicBackground' | 'colorTheme'>) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      dynamicBackground: state.dynamicBackground,
      colorTheme: state.colorTheme,
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
}))
