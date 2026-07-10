import { create } from 'zustand'
import { http } from '../lib/http'
import type { CreateGameBody, CreateGameResponse, GetGamesResponse } from '../api/types'

interface SlotInfo {
  slot: number
  filled: boolean
  id?: string
  name?: string
  characterName?: string
  profession?: string
  balance?: number
  day?: number
  status?: string
}

interface SavesState {
  slots: SlotInfo[]
  loading: boolean
  error: string | null
  loadSlots: () => Promise<void>
  createGame: (slot: number, name: string, profession: CreateGameBody['profession']) => Promise<CreateGameResponse | null>
  deleteGame: (gameId: string) => Promise<boolean>
}

export const useSavesStore = create<SavesState>((set, get) => ({
  slots: [],
  loading: false,
  error: null,

  loadSlots: async () => {
    set({ loading: true, error: null })
    try {
      const games: GetGamesResponse = await http.get('saves').json()

      const slots: SlotInfo[] = [1, 2, 3].map((slot) => {
        const game = games.find((g) => g.slot === slot)
        if (game) {
          return {
            slot,
            filled: true,
            id: game.id,
            name: game.name,
            characterName: game.character?.name,
            profession: game.character?.profession,
            balance: game.character?.balance,
            day: game.step ?? 1,
            status: game.status,
          }
        }
        return { slot, filled: false }
      })

      set({ slots, loading: false })
    } catch {
      set({ loading: false, error: 'Failed to load saves' })
    }
  },

  createGame: async (slot, name, profession) => {
    set({ loading: true, error: null })
    try {
      const body: CreateGameBody = { slot, name, profession }
      const game: CreateGameResponse = await http.post('saves', { json: body }).json()
      await get().loadSlots()
      return game
    } catch {
      set({ loading: false, error: 'Failed to create save' })
      return null
    }
  },

  deleteGame: async (gameId) => {
    set({ loading: true, error: null })
    try {
      await http.delete(`saves/${gameId}`).json()
      await get().loadSlots()
      return true
    } catch {
      set({ loading: false, error: 'Не удалось удалить сохранение' })
      return false
    }
  },
}))
