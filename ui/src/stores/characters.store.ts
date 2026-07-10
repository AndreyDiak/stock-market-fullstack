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
  basePrice: number
  monthlyPayment: number
  installmentsTotal: number
  installmentsPaid: number
}

export interface DreamStageRequirement {
  description: string
  minBalance?: number
  minPortfolioValue?: number
  minPassiveIncome?: number
  minReputation?: number
  minProfessionLevel?: number
  minTradingLevel?: number
  minBankingLevel?: number
  requiredItems?: string[]
  requireItemFullyOwned?: string[]
  noActiveInstallments?: boolean
}

export type DreamRequirementPreviewKind =
  | 'balance'
  | 'profession'
  | 'portfolio'
  | 'banking'
  | 'trading'
  | 'passive'
  | 'reputation'
  | 'property'
  | 'no_installments'

export interface CharacterDreamPreviewRequirement {
  kind: DreamRequirementPreviewKind
  label: string
}

export interface CharacterDreamPreviewStage {
  order: number
  title: string
  description: string
  requirementsPreview: CharacterDreamPreviewRequirement[]
  isFinal?: boolean
}

export interface CharacterDreamPreview {
  title: string
  description: string
  stageCount: number
  pathHint: string
  stages: CharacterDreamPreviewStage[]
}

export interface CharacterDreamStages {
  dreamType: string
  title: string
  description: string
  stages: DreamStageRequirement[]
}

export interface CharacterRosterItem {
  profession: CreateGameBody['profession']
  name: string
  salary: number
  balance: number
  items: CharacterItem[]
  dreams: CharacterDream[]
  dreamStages?: CharacterDreamStages
  dreamPreview?: CharacterDreamPreview
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
      set({
        characters: characters.map((character) => ({
          ...character,
          items: character.items.slice(0, 1),
        })),
        loading: false,
      })
    } catch {
      set({ loading: false, error: 'Не удалось загрузить персонажей' })
    }
  },
}))
