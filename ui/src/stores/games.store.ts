import { create } from 'zustand'
import { http } from '../lib/http'
import type { CreateGameBody, GetGamesResponse } from '../api/types'

interface SlotInfo {
  slot: number
  filled: boolean
  id?: string
  name?: string
  characterName?: string
  profession?: string
  balance?: number
  day?: number
}

interface GamesState {
  slots: SlotInfo[]
  loading: boolean
  error: string | null
  loadSlots: () => Promise<void>
  createGame: (slot: number, name: string, profession: CreateGameBody['profession']) => Promise<void>
}

export const useGamesStore = create<GamesState>((set, get) => ({
  slots: [],
  loading: false,
  error: null,

  loadSlots: async () => {
    set({ loading: true, error: null })
    try {
      const games: GetGamesResponse = await http.get('games').json()

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
          }
        }
        return { slot, filled: false }
      })

      set({ slots, loading: false })
    } catch {
      set({ loading: false, error: 'Failed to load games' })
    }
  },

  createGame: async (slot, name, profession) => {
    set({ loading: true, error: null })
    try {
      const body: CreateGameBody = { slot, name, profession }
      await http.post('games', { json: body }).json()
      await get().loadSlots()
    } catch {
      set({ loading: false, error: 'Failed to create game' })
    }
  },
}))
