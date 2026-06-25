import { create } from 'zustand';
import {
  endGameTurn,
  fetchGame,
  fetchGameDashboard,
  fetchGameNews,
  fetchNextTurnForecast,
  mapApiNewsList,
  mapApiNewsToFeedItem,
  mapOtcDealToCard,
} from '../api/gameTurn';
import type { Game } from '../api/types';
import type { ActiveLoan, BankSummary } from '../pages/game_dashboard/_components/bank_view';
import {
  calcEffectiveSalary,
  calcSkillPrice,
  CHARACTER_SKILLS,
  getSkillLevel,
  type CharacterProfile,
  type CharacterSkill,
} from '../pages/game_dashboard/_components/character_profile_panel';
import {
  appendLoanToForecast,
  buildNextTurnForecast,
  patchForecastSalary,
  type NextTurnForecast,
} from '../pages/game_dashboard/_components/next_turn_forecast';
import {
  createEmptyPropertySlots,
  hasLockedPropertySlots,
  PROPERTY_SLOT_UPGRADE_ID,
  unlockNextPropertySlot,
  type PropertySlot,
} from '../pages/game_dashboard/_components/property_inventory_block';
import { EMPTY_CHARACTER_PROFILE } from '../pages/game_dashboard/_model/defaults';
import {
  countUnlockedPropertySlots,
  mapCharacterSnapshot,
} from '../pages/game_dashboard/_model/game_mappers';
import { merge_news_items, remap_news_for_step } from '../pages/game_dashboard/_model/utils';
import type { bot_deal, news_item, portfolio_row } from '../pages/game_dashboard/_model/types';

const EMPTY_FORECAST: NextTurnForecast = {
  lines: [],
  incomeTotal: 0,
  expenseTotal: 0,
  netChange: 0,
}

const EMPTY_BANK_SUMMARY: BankSummary = {
  totalDebt: 0,
  paymentPerTurn: 0,
  turnsUntilNextCharge: 3,
}

const INITIAL_SKILLS = () => CHARACTER_SKILLS.map((skill) => ({ ...skill }))

let endingTurnInFlight = false

function resolveEffectiveSalary(state: {
  characterProfile: CharacterProfile
  characterSkills: CharacterSkill[]
}) {
  return calcEffectiveSalary(
    state.characterProfile.salary,
    getSkillLevel(state.characterSkills, 'qualification'),
  )
}

function withEffectiveSalaryForecast(
  forecast: NextTurnForecast,
  state: { characterProfile: CharacterProfile; characterSkills: CharacterSkill[] },
) {
  return patchForecastSalary(forecast, resolveEffectiveSalary(state))
}

interface GameState {
  gameId: string | null
  loading: boolean
  endingTurn: boolean
  turn: number
  balance: number
  balanceFx: { delta: number; id: number } | null
  news: news_item[]
  enteringNewsIds: string[]
  otcDeals: bot_deal[]
  portfolio: portfolio_row[]
  characterProfile: CharacterProfile
  characterSkills: CharacterSkill[]
  bankLoans: ActiveLoan[]
  bankSummary: BankSummary
  propertySlots: PropertySlot[]
  nextTurnForecast: NextTurnForecast
  creditRating: string

  reset: () => void
  init: (gameId: string, initialGame?: Game) => Promise<void>
  setBalance: (balance: number | ((current: number) => number)) => void
  removeOtcDeal: (id: string) => void
  purchaseSkill: (skillId: string) => void
  payOffLoan: (loanId: string) => void
  endTurn: () => Promise<void>
  loadNews: () => Promise<void>
  clearEnteringNews: () => void
  clearBalanceFx: () => void
}

function getInitialState(): Omit<
  GameState,
  'reset' | 'init' | 'setBalance' | 'removeOtcDeal' | 'purchaseSkill' | 'payOffLoan' | 'endTurn' | 'loadNews' | 'clearEnteringNews' | 'clearBalanceFx'
> {
  return {
    gameId: null,
    loading: false,
    endingTurn: false,
    turn: 1,
    balance: 0,
    balanceFx: null,
    news: [],
    enteringNewsIds: [],
    otcDeals: [],
    portfolio: [],
    characterProfile: EMPTY_CHARACTER_PROFILE,
    characterSkills: INITIAL_SKILLS(),
    bankLoans: [],
    bankSummary: EMPTY_BANK_SUMMARY,
    propertySlots: createEmptyPropertySlots(),
    nextTurnForecast: EMPTY_FORECAST,
    creditRating: 'A+',
  }
}

export const useGameStore = create<GameState>((set, get) => {
  const applyGameSnapshot = (
    character: NonNullable<Game['character']>,
    step: number,
  ) => {
    const slotUpgradeLevel =
      get().characterSkills.find((skill) => skill.id === PROPERTY_SLOT_UPGRADE_ID)?.level ?? 0
    const snapshot = mapCharacterSnapshot(
      character,
      countUnlockedPropertySlots(slotUpgradeLevel),
    )
    set({
      turn: step,
      balance: snapshot.balance,
      characterProfile: snapshot.profile,
      propertySlots: snapshot.propertySlots,
      portfolio: [],
      otcDeals: [],
      bankLoans: [],
      bankSummary: EMPTY_BANK_SUMMARY,
    })
    return snapshot
  }

  const refreshForecast = async (
    id: string,
    step: number,
    loanPaymentPerTurn: number,
    slotsOverride?: PropertySlot[],
  ) => {
    const { propertySlots } = get()
    const slots = slotsOverride ?? propertySlots

    try {
      const forecast = await fetchNextTurnForecast(id)
      set({
        nextTurnForecast: withEffectiveSalaryForecast(
          appendLoanToForecast(forecast, loanPaymentPerTurn),
          get(),
        ),
      })
    } catch {
      set({
        nextTurnForecast: buildNextTurnForecast({
          step,
          salary: resolveEffectiveSalary(get()),
          propertySlots: slots,
          loanPaymentPerTurn,
        }),
      })
    }
  }

  const applyDashboardData = (
    character: NonNullable<Game['character']>,
    step: number,
    newsItems: Parameters<typeof mapApiNewsToFeedItem>[0][],
    forecast: NextTurnForecast,
    loanPaymentPerTurn = 0,
  ) => {
    applyGameSnapshot(character, step)
    set({
      news: mapApiNewsList(newsItems, step),
      nextTurnForecast: withEffectiveSalaryForecast(
        appendLoanToForecast(forecast, loanPaymentPerTurn),
        get(),
      ),
    })
  }

  const loadDashboardState = async (id: string) => {
    try {
      const dashboard = await fetchGameDashboard(id)
      if (!dashboard.game.character) return

      applyDashboardData(
        dashboard.game.character,
        dashboard.game.step,
        dashboard.news,
        dashboard.nextTurnForecast,
      )
      return
    } catch {
      const [gameResult, newsResult, forecastResult] = await Promise.allSettled([
        fetchGame(id),
        fetchGameNews(id),
        fetchNextTurnForecast(id),
      ])

      if (gameResult.status === 'fulfilled' && gameResult.value.character) {
        const snapshot = applyGameSnapshot(
          gameResult.value.character,
          gameResult.value.step,
        )

        if (forecastResult.status === 'fulfilled') {
          set({
            nextTurnForecast: withEffectiveSalaryForecast(
              appendLoanToForecast(forecastResult.value, 0),
              get(),
            ),
          })
        } else {
          set({
            nextTurnForecast: buildNextTurnForecast({
              step: gameResult.value.step,
              salary: resolveEffectiveSalary(get()),
              propertySlots: snapshot.propertySlots,
              loanPaymentPerTurn: 0,
            }),
          })
        }
      }

      if (newsResult.status === 'fulfilled') {
        const step = gameResult.status === 'fulfilled' ? gameResult.value.step : get().turn
        set({
          news: mapApiNewsList(newsResult.value.news, step),
        })
      }
    }
  }

  return {
    ...getInitialState(),

    reset: () => {
      endingTurnInFlight = false
      set(getInitialState())
    },

    init: async (gameId, initialGame) => {
      set({ gameId, loading: true })

      if (initialGame?.id === gameId && initialGame.character) {
        applyGameSnapshot(initialGame.character, initialGame.step)
      }

      try {
        await loadDashboardState(gameId)
      } finally {
        set({ loading: false })
      }
    },

    setBalance: (balance) => {
      set((state) => ({
        balance: typeof balance === 'function' ? balance(state.balance) : balance,
      }))
    },

    removeOtcDeal: (id) => {
      set((state) => ({
        otcDeals: state.otcDeals.filter((deal) => deal.id !== id),
      }))
    },

    purchaseSkill: (skillId) => {
      const { balance, characterSkills, propertySlots } = get()
      const skill = characterSkills.find((item) => item.id === skillId)
      if (!skill || skill.level >= skill.maxLevel) return

      const price = calcSkillPrice(skill)
      if (balance < price) return
      if (skillId === PROPERTY_SLOT_UPGRADE_ID && !hasLockedPropertySlots(propertySlots)) {
        return
      }

      set((state) => ({
        balance: state.balance - price,
        characterSkills: state.characterSkills.map((item) =>
          item.id === skillId ? { ...item, level: item.level + 1 } : item,
        ),
        propertySlots:
          skillId === PROPERTY_SLOT_UPGRADE_ID
            ? unlockNextPropertySlot(state.propertySlots)
            : state.propertySlots,
        characterProfile:
          skillId === 'qualification'
            ? {
                ...state.characterProfile,
                professionLevel: state.characterProfile.professionLevel + 1,
              }
            : skillId === 'trading'
              ? {
                  ...state.characterProfile,
                  tradingLevel: state.characterProfile.tradingLevel + 1,
                }
              : state.characterProfile,
      }))
    },

    payOffLoan: (loanId) => {
      const { bankLoans, balance, gameId, turn } = get()
      const loan = bankLoans.find((item) => item.id === loanId)
      if (!loan || balance < loan.remainingDebt) return

      const nextSummary = {
        ...get().bankSummary,
        totalDebt: get().bankSummary.totalDebt - loan.remainingDebt,
        paymentPerTurn: get().bankSummary.paymentPerTurn - loan.paymentPerTurn,
      }

      set({
        balance: balance - loan.remainingDebt,
        bankLoans: bankLoans.filter((item) => item.id !== loanId),
        bankSummary: nextSummary,
      })

      if (gameId) {
        void refreshForecast(gameId, turn, nextSummary.paymentPerTurn)
      }
    },

    endTurn: async () => {
      if (endingTurnInFlight) return

      const { gameId, turn, bankSummary } = get()
      if (!gameId) return

      endingTurnInFlight = true
      set({ endingTurn: true })
      const stepAtClick = turn

      try {
        const result = await endGameTurn(gameId, stepAtClick)
        const slotUpgradeLevel =
          get().characterSkills.find((skill) => skill.id === PROPERTY_SLOT_UPGRADE_ID)?.level ?? 0
        const snapshot = mapCharacterSnapshot(
          result.character,
          countUnlockedPropertySlots(slotUpgradeLevel),
        )

        const netDelta = result.passiveIncome.netChange

        set((state) => ({
          turn: result.step,
          balance: snapshot.balance,
          balanceFx: netDelta !== 0 ? { delta: netDelta, id: Date.now() } : null,
          characterProfile: snapshot.profile,
          propertySlots: snapshot.propertySlots,
          nextTurnForecast: withEffectiveSalaryForecast(
            appendLoanToForecast(result.nextTurnForecast, bankSummary.paymentPerTurn),
            get(),
          ),
          news: remap_news_for_step(state.news, result.step),
        }))

        if (result.news.length > 0) {
          const freshNews = mapApiNewsList(result.news, result.step)
          set((state) => ({
            news: merge_news_items(freshNews, state.news, result.step),
            enteringNewsIds: freshNews.map((item) => item.id),
          }))
        }

        if (result.otcDeal) {
          set((state) => ({
            otcDeals: [
              mapOtcDealToCard(result.otcDeal!, `otc-${Date.now()}`),
              ...state.otcDeals,
            ],
          }))
        }
      } catch {
        if (gameId) {
          try {
            const dashboard = await fetchGameDashboard(gameId)
            if (dashboard.game.character) {
              applyDashboardData(
                dashboard.game.character,
                dashboard.game.step,
                dashboard.news,
                dashboard.nextTurnForecast,
                bankSummary.paymentPerTurn,
              )
            }
          } catch {
            // Оставляем текущее состояние, если синхронизация не удалась
          }
        }
      } finally {
        endingTurnInFlight = false
        set({ endingTurn: false })
      }
    },

    loadNews: async () => {
      const { gameId, turn } = get()
      if (!gameId) return

      try {
        const { news } = await fetchGameNews(gameId)
        set({ news: mapApiNewsList(news, turn) })
      } catch {
        // оставляем текущую ленту
      }
    },

    clearEnteringNews: () => set({ enteringNewsIds: [] }),

    clearBalanceFx: () => set({ balanceFx: null }),
  }
})
