import { create } from 'zustand';
import {
  endGameTurn,
  fetchGame,
  fetchGameDashboard,
  fetchGameNews,
  fetchNextTurnForecast,
  mapApiNewsToFeedItem,
  mapOtcDealToCard,
} from '../api/gameTurn';
import type { Game } from '../api/types';
import type { ActiveLoan, BankSummary } from '../pages/game_dashboard/_components/bank_view';
import {
  calcUpgradePrice,
  CHARACTER_UPGRADES,
  type CharacterProfile,
  type CharacterUpgrade,
} from '../pages/game_dashboard/_components/character_profile_panel';
import {
  appendLoanToForecast,
  buildNextTurnForecast,
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
import { mapCharacterSnapshot } from '../pages/game_dashboard/_model/game_mappers';
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

const INITIAL_UPGRADES = () => CHARACTER_UPGRADES.map((upgrade) => ({ ...upgrade }))

let endingTurnInFlight = false

interface GameState {
  gameId: string | null
  loading: boolean
  endingTurn: boolean
  turn: number
  balance: number
  news: news_item[]
  otcDeals: bot_deal[]
  portfolio: portfolio_row[]
  characterProfile: CharacterProfile
  characterUpgrades: CharacterUpgrade[]
  bankLoans: ActiveLoan[]
  bankSummary: BankSummary
  propertySlots: PropertySlot[]
  nextTurnForecast: NextTurnForecast
  creditRating: string

  reset: () => void
  init: (gameId: string, initialGame?: Game) => Promise<void>
  setBalance: (balance: number | ((current: number) => number)) => void
  removeOtcDeal: (id: string) => void
  purchaseUpgrade: (upgradeId: string) => void
  payOffLoan: (loanId: string) => void
  endTurn: () => Promise<void>
}

function getInitialState(): Omit<
  GameState,
  'reset' | 'init' | 'setBalance' | 'removeOtcDeal' | 'purchaseUpgrade' | 'payOffLoan' | 'endTurn'
> {
  return {
    gameId: null,
    loading: false,
    endingTurn: false,
    turn: 1,
    balance: 0,
    news: [],
    otcDeals: [],
    portfolio: [],
    characterProfile: EMPTY_CHARACTER_PROFILE,
    characterUpgrades: INITIAL_UPGRADES(),
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
    const snapshot = mapCharacterSnapshot(character)
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
    const { characterProfile, propertySlots } = get()
    const slots = slotsOverride ?? propertySlots

    try {
      const forecast = await fetchNextTurnForecast(id)
      set({ nextTurnForecast: appendLoanToForecast(forecast, loanPaymentPerTurn) })
    } catch {
      set({
        nextTurnForecast: buildNextTurnForecast({
          step,
          salary: characterProfile.salary,
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
      news: newsItems.map((item, index) => mapApiNewsToFeedItem(item, index)),
      nextTurnForecast: appendLoanToForecast(forecast, loanPaymentPerTurn),
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
          set({ nextTurnForecast: appendLoanToForecast(forecastResult.value, 0) })
        } else {
          set({
            nextTurnForecast: buildNextTurnForecast({
              step: gameResult.value.step,
              salary: snapshot.profile.salary,
              propertySlots: snapshot.propertySlots,
              loanPaymentPerTurn: 0,
            }),
          })
        }
      }

      if (newsResult.status === 'fulfilled') {
        set({
          news: newsResult.value.news.map((item, index) =>
            mapApiNewsToFeedItem(item, index),
          ),
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

    purchaseUpgrade: (upgradeId) => {
      const { balance, characterUpgrades, propertySlots } = get()
      const upgrade = characterUpgrades.find((item) => item.id === upgradeId)
      if (!upgrade || upgrade.level >= upgrade.maxLevel) return

      const price = calcUpgradePrice(upgrade)
      if (balance < price) return
      if (upgradeId === PROPERTY_SLOT_UPGRADE_ID && !hasLockedPropertySlots(propertySlots)) {
        return
      }

      set((state) => ({
        balance: state.balance - price,
        characterUpgrades: state.characterUpgrades.map((item) =>
          item.id === upgradeId ? { ...item, level: item.level + 1 } : item,
        ),
        propertySlots:
          upgradeId === PROPERTY_SLOT_UPGRADE_ID
            ? unlockNextPropertySlot(state.propertySlots)
            : state.propertySlots,
        characterProfile:
          upgradeId === 'qualification'
            ? {
                ...state.characterProfile,
                professionLevel: state.characterProfile.professionLevel + 1,
              }
            : upgradeId === 'trading'
              ? {
                  ...state.characterProfile,
                  tradingLevel: state.characterProfile.tradingLevel + 1,
                }
              : upgradeId === 'negotiation'
                ? {
                    ...state.characterProfile,
                    reputation: state.characterProfile.reputation + 4,
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
        const snapshot = mapCharacterSnapshot(result.character)

        set({
          turn: result.step,
          balance: snapshot.balance,
          characterProfile: snapshot.profile,
          propertySlots: snapshot.propertySlots,
          nextTurnForecast: appendLoanToForecast(
            result.nextTurnForecast,
            bankSummary.paymentPerTurn,
          ),
        })

        if (result.news.length > 0) {
          const freshNews = result.news.map((item, index) =>
            mapApiNewsToFeedItem(item, index),
          )
          set((state) => ({
            news: [...freshNews, ...state.news].slice(0, 15),
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
  }
})
