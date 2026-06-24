import { create } from 'zustand'
import { http } from '../lib/http'
import type { CreateGameBody } from '../api/types'

export interface CharacterDream {
  itemRef: string
  name: string
  description: string
  basePrice: number
}

export interface CharacterItem {
  itemRef: string
  name: string
  monthlyPayment: number
  installmentsTotal: number
  installmentsPaid: number
}

export interface CharacterRosterItem {
  profession: CreateGameBody['profession']
  name: string
  salary: number
  balance: number
  savings: number
  items: CharacterItem[]
  dreams: CharacterDream[]
}

interface CharactersState {
  characters: CharacterRosterItem[]
  loading: boolean
  error: string | null
  loadCharacters: () => Promise<void>
}

export const useCharactersStore = create<CharactersState>((set) => ({
  characters: [],
  loading: false,
  error: null,

  loadCharacters: async () => {
    set({ loading: true, error: null })
    try {
      const characters: CharacterRosterItem[] = await http.get('characters').json()
      set({ characters, loading: false })
    } catch {
      set({ loading: false, error: 'Не удалось загрузить персонажей' })
    }
  },
}))
