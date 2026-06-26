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
  upgradeCharacterSkill,
} from '../api/gameTurn';
import type { Game } from '../api/types';
import type { ActiveLoan, BankSummary } from '../pages/game_dashboard/_components/bank';
import type {
  CharacterProfile,
  CharacterSkill,
  CharacterSkillsState,
  CharacterStats,
} from '../pages/game_dashboard/_components/character';
import {
  EMPTY_CHARACTER_SKILLS_STATE,
  EMPTY_CHARACTER_STATS,
} from '../pages/game_dashboard/_components/character/_character_skills';
import {
  appendLoanToForecast,
  buildNextTurnForecast,
  type NextTurnForecast,
} from '../pages/game_dashboard/_components/sidebar/_next_turn_forecast';
import { createEmptyPropertySlots, type PropertySlot } from '../pages/game_dashboard/_components/property';
import { EMPTY_CHARACTER_PROFILE } from '../pages/game_dashboard/_model/defaults';
import { mapCharacterSnapshot } from '../pages/game_dashboard/_model/game_mappers';
import { merge_news_items, remap_news_for_step } from '../pages/game_dashboard/_model/utils';
import type { bot_deal, news_item, portfolio_row } from '../pages/game_dashboard/_model/types';

const EMPTY_FORECAST: NextTurnForecast = {
  lines: [],
  incomeTotal: 0,
  expenseTotal: 0,
  netChange: 0,
};

const EMPTY_BANK_SUMMARY: BankSummary = {
  totalDebt: 0,
  paymentPerTurn: 0,
  turnsUntilNextCharge: 3,
};

let endingTurnInFlight = false;

interface GameState {
  gameId: string | null;
  loading: boolean;
  endingTurn: boolean;
  upgradingSkill: boolean;
  turn: number;
  balance: number;
  balanceFx: { delta: number; id: number } | null;
  news: news_item[];
  enteringNewsIds: string[];
  otcDeals: bot_deal[];
  portfolio: portfolio_row[];
  characterProfile: CharacterProfile;
  characterSkills: CharacterSkill[];
  characterStats: CharacterStats;
  bankLoans: ActiveLoan[];
  bankSummary: BankSummary;
  propertySlots: PropertySlot[];
  nextTurnForecast: NextTurnForecast;
  creditRating: string;

  reset: () => void;
  init: (gameId: string, initialGame?: Game) => Promise<void>;
  setBalance: (balance: number | ((current: number) => number)) => void;
  removeOtcDeal: (id: string) => void;
  purchaseSkill: (skillId: string) => Promise<void>;
  payOffLoan: (loanId: string) => void;
  endTurn: () => Promise<void>;
  loadNews: () => Promise<void>;
  clearEnteringNews: () => void;
  clearBalanceFx: () => void;
}

function getInitialState(): Omit<
  GameState,
  | 'reset'
  | 'init'
  | 'setBalance'
  | 'removeOtcDeal'
  | 'purchaseSkill'
  | 'payOffLoan'
  | 'endTurn'
  | 'loadNews'
  | 'clearEnteringNews'
  | 'clearBalanceFx'
> {
  return {
    gameId: null,
    loading: false,
    endingTurn: false,
    upgradingSkill: false,
    turn: 1,
    balance: 0,
    balanceFx: null,
    news: [],
    enteringNewsIds: [],
    otcDeals: [],
    portfolio: [],
    characterProfile: EMPTY_CHARACTER_PROFILE,
    characterSkills: [],
    characterStats: EMPTY_CHARACTER_STATS,
    bankLoans: [],
    bankSummary: EMPTY_BANK_SUMMARY,
    propertySlots: createEmptyPropertySlots(),
    nextTurnForecast: EMPTY_FORECAST,
    creditRating: 'A+',
  };
}

function applyCharacterSkillsState(
  character: NonNullable<Game['character']>,
  characterSkills: CharacterSkillsState,
) {
  const snapshot = mapCharacterSnapshot(
    character,
    characterSkills.stats.propertySlotsUnlocked,
  );

  return {
    balance: snapshot.balance,
    characterProfile: snapshot.profile,
    propertySlots: snapshot.propertySlots,
    characterSkills: characterSkills.skills,
    characterStats: characterSkills.stats,
  };
}

export const useGameStore = create<GameState>((set, get) => {
  const applyGameSnapshot = (
    character: NonNullable<Game['character']>,
    step: number,
    characterSkills: CharacterSkillsState = get().characterSkills.length > 0
      ? { skills: get().characterSkills, stats: get().characterStats }
      : EMPTY_CHARACTER_SKILLS_STATE,
  ) => {
    const applied = applyCharacterSkillsState(character, characterSkills);
    set({
      turn: step,
      balance: applied.balance,
      characterProfile: applied.characterProfile,
      propertySlots: applied.propertySlots,
      characterSkills: applied.characterSkills,
      characterStats: applied.characterStats,
      portfolio: [],
      otcDeals: [],
      bankLoans: [],
      bankSummary: EMPTY_BANK_SUMMARY,
    });
    return applied;
  };

  const refreshForecast = async (
    id: string,
    loanPaymentPerTurn: number,
    forecastOverride?: NextTurnForecast,
  ) => {
    const { propertySlots } = get();

    try {
      const forecast = forecastOverride ?? (await fetchNextTurnForecast(id));
      set({
        nextTurnForecast: appendLoanToForecast(forecast, loanPaymentPerTurn),
      });
    } catch {
      set({
        nextTurnForecast: buildNextTurnForecast({
          step: get().turn,
          salary: get().characterStats.effectiveSalary,
          propertySlots,
          loanPaymentPerTurn,
        }),
      });
    }
  };

  const applyDashboardData = (
    character: NonNullable<Game['character']>,
    step: number,
    newsItems: Parameters<typeof mapApiNewsToFeedItem>[0][],
    forecast: NextTurnForecast,
    characterSkills: CharacterSkillsState,
    loanPaymentPerTurn = 0,
  ) => {
    applyGameSnapshot(character, step, characterSkills);
    set({
      news: mapApiNewsList(newsItems, step),
      nextTurnForecast: appendLoanToForecast(forecast, loanPaymentPerTurn),
    });
  };

  const loadDashboardState = async (id: string) => {
    try {
      const dashboard = await fetchGameDashboard(id);
      if (!dashboard.game.character) return;

      applyDashboardData(
        dashboard.game.character,
        dashboard.game.step,
        dashboard.news,
        dashboard.nextTurnForecast,
        dashboard.characterSkills,
      );
      return;
    } catch {
      const [gameResult, newsResult, forecastResult] = await Promise.allSettled([
        fetchGame(id),
        fetchGameNews(id),
        fetchNextTurnForecast(id),
      ]);

      if (gameResult.status === 'fulfilled' && gameResult.value.character) {
        applyGameSnapshot(gameResult.value.character, gameResult.value.step);

        if (forecastResult.status === 'fulfilled') {
          set({
            nextTurnForecast: appendLoanToForecast(forecastResult.value, 0),
          });
        } else {
          set({
            nextTurnForecast: buildNextTurnForecast({
              step: gameResult.value.step,
              salary: get().characterStats.effectiveSalary,
              propertySlots: get().propertySlots,
              loanPaymentPerTurn: 0,
            }),
          });
        }
      }

      if (newsResult.status === 'fulfilled') {
        const step = gameResult.status === 'fulfilled' ? gameResult.value.step : get().turn;
        set({
          news: mapApiNewsList(newsResult.value.news, step),
        });
      }
    }
  };

  return {
    ...getInitialState(),

    reset: () => {
      endingTurnInFlight = false;
      set(getInitialState());
    },

    init: async (gameId, initialGame) => {
      set({ gameId, loading: true });

      if (initialGame?.id === gameId && initialGame.character) {
        applyGameSnapshot(initialGame.character, initialGame.step);
      }

      try {
        await loadDashboardState(gameId);
      } finally {
        set({ loading: false });
      }
    },

    setBalance: (balance) => {
      set((state) => ({
        balance: typeof balance === 'function' ? balance(state.balance) : balance,
      }));
    },

    removeOtcDeal: (id) => {
      set((state) => ({
        otcDeals: state.otcDeals.filter((deal) => deal.id !== id),
      }));
    },

    purchaseSkill: async (skillId) => {
      const { gameId, bankSummary } = get();
      if (!gameId) return;

      set({ upgradingSkill: true });
      try {
        const result = await upgradeCharacterSkill(gameId, skillId);
        if (!result.game.character) return;

        const applied = applyCharacterSkillsState(result.game.character, result.characterSkills);
        set({
          balance: applied.balance,
          characterProfile: applied.characterProfile,
          propertySlots: applied.propertySlots,
          characterSkills: applied.characterSkills,
          characterStats: applied.characterStats,
          nextTurnForecast: appendLoanToForecast(
            result.nextTurnForecast,
            bankSummary.paymentPerTurn,
          ),
        });
      } catch {
        // оставляем текущее состояние
      } finally {
        set({ upgradingSkill: false });
      }
    },

    payOffLoan: (loanId) => {
      const { bankLoans, balance, gameId } = get();
      const loan = bankLoans.find((item) => item.id === loanId);
      if (!loan || balance < loan.remainingDebt) return;

      const nextSummary = {
        ...get().bankSummary,
        totalDebt: get().bankSummary.totalDebt - loan.remainingDebt,
        paymentPerTurn: get().bankSummary.paymentPerTurn - loan.paymentPerTurn,
      };

      set({
        balance: balance - loan.remainingDebt,
        bankLoans: bankLoans.filter((item) => item.id !== loanId),
        bankSummary: nextSummary,
      });

      if (gameId) {
        void refreshForecast(gameId, nextSummary.paymentPerTurn);
      }
    },

    endTurn: async () => {
      if (endingTurnInFlight) return;

      const { gameId, turn, bankSummary } = get();
      if (!gameId) return;

      endingTurnInFlight = true;
      set({ endingTurn: true });
      const stepAtClick = turn;

      try {
        const result = await endGameTurn(gameId, stepAtClick);
        const applied = applyCharacterSkillsState(result.character, result.characterSkills);
        const netDelta = result.passiveIncome.netChange;

        set((state) => ({
          turn: result.step,
          balance: applied.balance,
          balanceFx: netDelta !== 0 ? { delta: netDelta, id: Date.now() } : null,
          characterProfile: applied.characterProfile,
          propertySlots: applied.propertySlots,
          characterSkills: applied.characterSkills,
          characterStats: applied.characterStats,
          nextTurnForecast: appendLoanToForecast(
            result.nextTurnForecast,
            bankSummary.paymentPerTurn,
          ),
          news: remap_news_for_step(state.news, result.step),
        }));

        if (result.news.length > 0) {
          const freshNews = mapApiNewsList(result.news, result.step);
          set((state) => ({
            news: merge_news_items(freshNews, state.news, result.step),
            enteringNewsIds: freshNews.map((item) => item.id),
          }));
        }

        if (result.otcDeal) {
          set((state) => ({
            otcDeals: [
              mapOtcDealToCard(result.otcDeal!, `otc-${Date.now()}`),
              ...state.otcDeals,
            ],
          }));
        }
      } catch {
        if (gameId) {
          try {
            const dashboard = await fetchGameDashboard(gameId);
            if (dashboard.game.character) {
              applyDashboardData(
                dashboard.game.character,
                dashboard.game.step,
                dashboard.news,
                dashboard.nextTurnForecast,
                dashboard.characterSkills,
                bankSummary.paymentPerTurn,
              );
            }
          } catch {
            // Оставляем текущее состояние, если синхронизация не удалась
          }
        }
      } finally {
        endingTurnInFlight = false;
        set({ endingTurn: false });
      }
    },

    loadNews: async () => {
      const { gameId, turn } = get();
      if (!gameId) return;

      try {
        const { news } = await fetchGameNews(gameId);
        set({ news: mapApiNewsList(news, turn) });
      } catch {
        // оставляем текущую ленту
      }
    },

    clearEnteringNews: () => set({ enteringNewsIds: [] }),

    clearBalanceFx: () => set({ balanceFx: null }),
  };
});
