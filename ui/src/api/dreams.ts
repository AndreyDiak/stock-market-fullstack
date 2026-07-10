import { http } from '../lib/http'

export type DreamStageStatus = 'LOCKED' | 'ACTIVE' | 'READY_TO_COMPLETE' | 'COMPLETED'

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

export interface DreamStageResponse {
  stageIndex: number
  status: DreamStageStatus
  requirement: DreamStageRequirement
  completedAt: string | null
  completedTurn: number | null
}

export interface DreamResponse {
  id: string
  dreamType: string
  title: string
  description: string
  currentStage: number
  stages: DreamStageResponse[]
}

export async function fetchDream(saveId: string) {
  return http.get(`saves/${saveId}/dream`).json<DreamResponse>()
}

export async function completeDreamStage(saveId: string, dreamId: string) {
  return http.post(`saves/${saveId}/dream/complete-stage`, { json: { dreamId } }).json<DreamResponse>()
}

export async function fulfillDream(saveId: string, dreamId: string) {
  return http.post(`saves/${saveId}/dream/fulfill`, { json: { dreamId } }).json<{ success: boolean }>()
}
