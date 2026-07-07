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
import {
  acceptNegotiatedPropertyOffer,
  acceptPropertyOffer,
  declineNegotiatedPropertyOffer,
  negotiatePropertyOffer,
  type AcceptPropertyOfferResponse,
  type NegotiatePropertyOfferResponse,
  type PropertyOfferPaymentMode,
} from '../api/propertyOffers';
import { acceptOtcDeal as acceptOtcDealApi } from '../api/otcDeals';
import { payOffInstallment } from '../api/propertyLoans';
import {
  buyStock as buyStockApi,
  fetchStockHistory,
  mapApiPortfolioRow,
  sellStock as sellStockApi,
  subscribeToIpo as subscribeToIpoApi,
  type IpoListing,
  type MarketSentiment,
  type StockListing,
} from '../api/stocks';
import type { GeneratedNewsItem } from '../api/gameTurn';
import type { Game } from '../api/types';
import type { ActiveLoan, BankSummary, PaidProperty } from '../pages/game_dashboard/_components/bank';
import { mapInventoryToBankState } from '../pages/game_dashboard/_components/bank/_bank_mappers';
import { calcInstallmentEarlyPayAmount } from '../pages/game_dashboard/_components/bank/_bank_payoff_utils';
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
  buildNextTurnForecast,
  EMPTY_NEXT_TURN_FORECAST,
  resolveNextTurnForecast,
  type NextTurnForecast,
} from '../pages/game_dashboard/_components/sidebar/_next_turn_forecast';
import { createEmptyPropertySlots, type PropertySlot } from '../pages/game_dashboard/_components/property';
import { EMPTY_CHARACTER_PROFILE } from '../pages/game_dashboard/_model/defaults';
import { mapCharacterSnapshot, type InventoryItemDto } from '../pages/game_dashboard/_model/game_mappers';
import { merge_news_items, remap_news_for_step } from '../pages/game_dashboard/_model/utils';
import type { bot_deal, news_item, portfolio_row, PropertyOffer } from '../pages/game_dashboard/_model/types';
import {
  applyBankingLevelToPropertyOffers,
  getPlayerBankingLevel,
} from '../pages/game_dashboard/_components/real_estate/_property_offer_access';
import { gameAudio } from '../lib/audio/game_audio';
import { playTurnResultSounds } from '../lib/audio/turn_result_sounds';

const EMPTY_FORECAST = EMPTY_NEXT_TURN_FORECAST;

const EMPTY_BANK_SUMMARY: BankSummary = {
  totalDebt: 0,
  paymentPerTurn: 0,
  turnsUntilNextCharge: 3,
};

let endingTurnInFlight = false;

function appendNewsItem(state: { news: news_item[]; turn: number }, item: GeneratedNewsItem) {
  const freshNews = mapApiNewsList([item], state.turn);
  return {
    news: merge_news_items(freshNews, state.news, state.turn),
    enteringNewsIds: freshNews.map((entry) => entry.id),
  };
}

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
  propertyOffers: PropertyOffer[];
  propertyOfferBusy: boolean;
  portfolio: portfolio_row[];
  stockListings: StockListing[];
  marketSentiment: MarketSentiment | null;
  ipos: IpoListing[];
  stockBusy: boolean;
  characterProfile: CharacterProfile;
  characterSkills: CharacterSkill[];
  characterStats: CharacterStats;
  bankLoans: ActiveLoan[];
  bankPaidProperties: PaidProperty[];
  bankSummary: BankSummary;
  payingOffLoanId: string | null;
  propertySlots: PropertySlot[];
  inventoryItems: InventoryItemDto[];
  nextTurnForecast: NextTurnForecast;
  creditRating: string;

  reset: () => void;
  init: (gameId: string, initialGame?: Game) => Promise<void>;
  setBalance: (balance: number | ((current: number) => number)) => void;
  removeOtcDeal: (id: string) => void;
  acceptOtcDeal: (deal: bot_deal) => Promise<void>;
  acceptPropertyOffer: (
    offerId: string,
    paymentMode?: PropertyOfferPaymentMode,
  ) => Promise<AcceptPropertyOfferResponse>;
  negotiatePropertyOffer: (
    offerId: string,
    adjustmentPercent: number,
  ) => Promise<NegotiatePropertyOfferResponse>;
  acceptNegotiatedPropertyOffer: (
    offerId: string,
    paymentMode?: PropertyOfferPaymentMode,
  ) => Promise<AcceptPropertyOfferResponse>;
  declineNegotiatedPropertyOffer: (offerId: string) => Promise<void>;
  purchaseSkill: (skillId: string) => Promise<void>;
  payOffLoan: (loanId: string, payPercent: number) => Promise<void>;
  endTurn: () => Promise<void>;
  loadNews: () => Promise<void>;
  loadExchangeData: () => Promise<void>;
  fetchStockHistory: (listingId: string) => Promise<{ turn: number; price: number }[]>;
  buyStock: (listingId: string, quantity: number) => Promise<void>;
  sellStock: (listingId: string, quantity: number) => Promise<void>;
  subscribeToIpo: (ipoId: string, amount: number) => Promise<void>;
  clearEnteringNews: () => void;
  clearBalanceFx: () => void;
}

function getInitialState(): Omit<
  GameState,
  | 'reset'
  | 'init'
  | 'setBalance'
  | 'removeOtcDeal'
  | 'acceptOtcDeal'
  | 'acceptPropertyOffer'
  | 'negotiatePropertyOffer'
  | 'acceptNegotiatedPropertyOffer'
  | 'declineNegotiatedPropertyOffer'
  | 'purchaseSkill'
  | 'payOffLoan'
  | 'endTurn'
  | 'loadNews'
  | 'loadExchangeData'
  | 'fetchStockHistory'
  | 'buyStock'
  | 'sellStock'
  | 'subscribeToIpo'
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
    propertyOffers: [],
    propertyOfferBusy: false,
    portfolio: [],
    stockListings: [],
    marketSentiment: null,
    ipos: [],
    stockBusy: false,
    characterProfile: EMPTY_CHARACTER_PROFILE,
    characterSkills: [],
    characterStats: EMPTY_CHARACTER_STATS,
    bankLoans: [],
    bankPaidProperties: [],
    bankSummary: EMPTY_BANK_SUMMARY,
    payingOffLoanId: null,
    propertySlots: createEmptyPropertySlots(),
    inventoryItems: [],
    nextTurnForecast: EMPTY_FORECAST,
    creditRating: 'A+',
  };
}

function applyCharacterSkillsState(
  character: NonNullable<Game['character']>,
  characterSkills: CharacterSkillsState,
  news: news_item[] = [],
) {
  const snapshot = mapCharacterSnapshot(
    character,
    characterSkills.stats.propertySlotsUnlocked,
  );
  const bank = mapInventoryToBankState(
    snapshot.inventoryItems,
    news,
    characterSkills.stats.bankBaseRatePercent,
  );

  return {
    balance: snapshot.balance,
    characterProfile: snapshot.profile,
    propertySlots: snapshot.propertySlots,
    inventoryItems: snapshot.inventoryItems,
    characterSkills: characterSkills.skills,
    characterStats: characterSkills.stats,
    bankLoans: bank.activeLoans,
    bankPaidProperties: bank.paidProperties,
    bankSummary: bank.summary,
  };
}

function spreadCharacterBankState(
  applied: ReturnType<typeof applyCharacterSkillsState>,
) {
  return {
    balance: applied.balance,
    characterProfile: applied.characterProfile,
    propertySlots: applied.propertySlots,
    inventoryItems: applied.inventoryItems,
    characterSkills: applied.characterSkills,
    characterStats: applied.characterStats,
    bankLoans: applied.bankLoans,
    bankPaidProperties: applied.bankPaidProperties,
    bankSummary: applied.bankSummary,
  };
}

export const useGameStore = create<GameState>((set, get) => {
  const applyGameSnapshot = (
    character: NonNullable<Game['character']>,
    step: number,
    characterSkills: CharacterSkillsState = get().characterSkills.length > 0
      ? { skills: get().characterSkills, stats: get().characterStats }
      : EMPTY_CHARACTER_SKILLS_STATE,
    preserveMarket = false,
  ) => {
    const applied = applyCharacterSkillsState(character, characterSkills, get().news);
    set({
      turn: step,
      ...spreadCharacterBankState(applied),
      ...(preserveMarket
        ? {}
        : {
            portfolio: [],
            stockListings: [],
            marketSentiment: null,
            ipos: [],
          }),
      otcDeals: [],
    });
    return applied;
  };

  const applyDashboardData = (
    character: NonNullable<Game['character']>,
    step: number,
    newsItems: Parameters<typeof mapApiNewsToFeedItem>[0][],
    forecast: NextTurnForecast,
    characterSkills: CharacterSkillsState,
    propertyOffers: PropertyOffer[] = [],
    stocks: StockListing[] = [],
    portfolio: portfolio_row[] = [],
    marketSentiment: MarketSentiment | null = null,
    ipos: IpoListing[] = [],
  ) => {
    const applied = applyGameSnapshot(character, step, characterSkills, true);
    set({
      news: mapApiNewsList(newsItems, step),
      nextTurnForecast: resolveNextTurnForecast(
        {
          step,
          salary: applied.characterProfile.salary,
          propertySlots: applied.propertySlots,
          loanPaymentPerTurn: applied.bankSummary.paymentPerTurn,
        },
        forecast,
      ),
      propertyOffers: applyBankingLevelToPropertyOffers(
        propertyOffers,
        getPlayerBankingLevel(characterSkills.skills),
      ),
      stockListings: stocks,
      portfolio,
      marketSentiment,
      ipos,
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
        dashboard.propertyOffers,
        dashboard.stocks ?? [],
        (dashboard.portfolio ?? []).map(mapApiPortfolioRow),
        dashboard.marketSentiment ?? null,
        dashboard.ipos ?? [],
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
          const state = get()
          set({
            nextTurnForecast: resolveNextTurnForecast(
              {
                step: state.turn,
                salary: state.characterProfile.salary,
                propertySlots: state.propertySlots,
                loanPaymentPerTurn: state.bankSummary.paymentPerTurn,
              },
              forecastResult.value,
            ),
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

    acceptOtcDeal: async (deal) => {
      const { gameId } = get();
      if (!gameId) {
        throw new Error('Game is not loaded');
      }

      const payload = {
        botName: deal.botName,
        ticker: deal.ticker,
        companyName: deal.companyName,
        side: deal.side,
        qty: deal.qty,
        price: deal.price,
        turnsLeft: deal.turnsLeft,
        flavorText: `${deal.botName} предлагает OTC-сделку по ${deal.ticker}.`,
      };

      const result = await acceptOtcDealApi(gameId, payload);
      const applied = applyCharacterSkillsState(
        result.character,
        get().characterSkills.length > 0
          ? { skills: get().characterSkills, stats: get().characterStats }
          : EMPTY_CHARACTER_SKILLS_STATE,
        get().news,
      );
      const balanceDelta = result.balance - get().balance;

      set((state) => ({
        otcDeals: state.otcDeals.filter((entry) => entry.id !== deal.id),
        balance: result.balance,
        characterProfile: applied.characterProfile,
        propertySlots: applied.propertySlots,
        inventoryItems: applied.inventoryItems,
        bankLoans: applied.bankLoans,
        bankPaidProperties: applied.bankPaidProperties,
        bankSummary: applied.bankSummary,
        balanceFx:
          balanceDelta !== 0
            ? { delta: balanceDelta, id: Date.now() }
            : state.balanceFx,
        ...appendNewsItem(state, result.news),
      }));
    },

    acceptPropertyOffer: async (offerId, paymentMode = 'installment') => {
      const { gameId } = get();
      if (!gameId) {
        throw new Error('Game is not loaded');
      }

      set({ propertyOfferBusy: true });
      try {
        const result = await acceptPropertyOffer(gameId, offerId, paymentMode);
        const state = get();
        const newsForBank = result.news
          ? appendNewsItem(state, result.news).news
          : state.news;
        const applied = applyCharacterSkillsState(
          result.character,
          get().characterSkills.length > 0
            ? { skills: get().characterSkills, stats: get().characterStats }
            : EMPTY_CHARACTER_SKILLS_STATE,
          newsForBank,
        );
        const balanceDelta = result.balance - result.previousBalance;

        set((state) => ({
          balance: result.balance,
          characterProfile: applied.characterProfile,
          propertySlots: applied.propertySlots,
          inventoryItems: applied.inventoryItems,
          bankLoans: applied.bankLoans,
          bankPaidProperties: applied.bankPaidProperties,
          bankSummary: applied.bankSummary,
          propertyOffers: result.propertyOffers,
          nextTurnForecast: resolveNextTurnForecast(
            {
              step: state.turn,
              salary: applied.characterProfile.salary,
              propertySlots: applied.propertySlots,
              loanPaymentPerTurn: applied.bankSummary.paymentPerTurn,
            },
            result.nextTurnForecast,
          ),
          balanceFx:
            balanceDelta !== 0
              ? { delta: balanceDelta, id: Date.now() }
              : get().balanceFx,
          ...appendNewsItem(state, result.news),
        }));
        gameAudio.playSfx('operationCompleted');
        return result;
      } finally {
        set({ propertyOfferBusy: false });
      }
    },

    negotiatePropertyOffer: async (offerId, adjustmentPercent) => {
      const { gameId } = get();
      if (!gameId) {
        throw new Error('Game is not loaded');
      }

      set({ propertyOfferBusy: true });
      try {
        const result = await negotiatePropertyOffer(gameId, offerId, adjustmentPercent);
        const state = get();
        const newsForBank = result.news
          ? appendNewsItem(state, result.news).news
          : state.news;
        const applied = applyCharacterSkillsState(
          result.character,
          get().characterSkills.length > 0
            ? { skills: get().characterSkills, stats: get().characterStats }
            : EMPTY_CHARACTER_SKILLS_STATE,
          newsForBank,
        );
        const balanceDelta = result.balance - result.previousBalance;
        const reputationChanged = result.reputation !== result.previousReputation;

        set((state) => {
          const next: Partial<GameState> = {
            propertyOffers: result.propertyOffers,
          };

          if (balanceDelta !== 0) {
            next.balance = applied.balance;
            next.balanceFx = { delta: balanceDelta, id: Date.now() };
          }

          if (reputationChanged) {
            next.characterProfile = applied.characterProfile;
            next.propertySlots = applied.propertySlots;
            next.inventoryItems = applied.inventoryItems;
          }

          if (result.news) {
            Object.assign(next, appendNewsItem(state, result.news));
          }

          return next;
        });
        return result;
      } finally {
        set({ propertyOfferBusy: false });
      }
    },

    acceptNegotiatedPropertyOffer: async (offerId, paymentMode = 'installment') => {
      const { gameId } = get();
      if (!gameId) {
        throw new Error('Game is not loaded');
      }

      set({ propertyOfferBusy: true });
      try {
        const result = await acceptNegotiatedPropertyOffer(gameId, offerId, paymentMode);
        const state = get();
        const newsForBank = result.news
          ? appendNewsItem(state, result.news).news
          : state.news;
        const applied = applyCharacterSkillsState(
          result.character,
          get().characterSkills.length > 0
            ? { skills: get().characterSkills, stats: get().characterStats }
            : EMPTY_CHARACTER_SKILLS_STATE,
          newsForBank,
        );
        const balanceDelta = result.balance - result.previousBalance;

        set((state) => ({
          balance: result.balance,
          characterProfile: applied.characterProfile,
          propertySlots: applied.propertySlots,
          inventoryItems: applied.inventoryItems,
          bankLoans: applied.bankLoans,
          bankPaidProperties: applied.bankPaidProperties,
          bankSummary: applied.bankSummary,
          propertyOffers: result.propertyOffers,
          nextTurnForecast: resolveNextTurnForecast(
            {
              step: state.turn,
              salary: applied.characterProfile.salary,
              propertySlots: applied.propertySlots,
              loanPaymentPerTurn: applied.bankSummary.paymentPerTurn,
            },
            result.nextTurnForecast,
          ),
          balanceFx:
            balanceDelta !== 0
              ? { delta: balanceDelta, id: Date.now() }
              : state.balanceFx,
          ...appendNewsItem(state, result.news),
        }));
        gameAudio.playSfx('operationCompleted');
        return result;
      } finally {
        set({ propertyOfferBusy: false });
      }
    },

    declineNegotiatedPropertyOffer: async (offerId) => {
      const { gameId } = get();
      if (!gameId) {
        throw new Error('Game is not loaded');
      }

      const result = await declineNegotiatedPropertyOffer(gameId, offerId);
      set({ propertyOffers: result.propertyOffers });
    },

    purchaseSkill: async (skillId) => {
      const { gameId } = get();
      if (!gameId) return;

      set({ upgradingSkill: true });
      try {
        const result = await upgradeCharacterSkill(gameId, skillId);
        if (!result.game.character) return;

        const applied = applyCharacterSkillsState(result.game.character, result.characterSkills, get().news);
        set({
          ...spreadCharacterBankState(applied),
          propertyOffers: applyBankingLevelToPropertyOffers(
            get().propertyOffers,
            getPlayerBankingLevel(result.characterSkills.skills),
          ),
          nextTurnForecast: resolveNextTurnForecast(
            {
              step: get().turn,
              salary: applied.characterProfile.salary,
              propertySlots: applied.propertySlots,
              loanPaymentPerTurn: applied.bankSummary.paymentPerTurn,
            },
            result.nextTurnForecast,
          ),
        });
        gameAudio.playSfx('operationCompleted');
      } catch {
        // оставляем текущее состояние
      } finally {
        set({ upgradingSkill: false });
      }
    },

    payOffLoan: async (loanId, payPercent) => {
      const { bankLoans, balance, gameId } = get();
      const loan = bankLoans.find((item) => item.id === loanId);
      if (!loan || !gameId) return;

      const paymentAmount = calcInstallmentEarlyPayAmount(
        loan.remainingAmount,
        payPercent,
        balance,
      );
      if (paymentAmount <= 0) return;

      set({ payingOffLoanId: loanId });
      try {
        const result = await payOffInstallment(gameId, loanId, payPercent);
        const state = get();
        const newsForBank = result.news
          ? appendNewsItem(state, result.news).news
          : state.news;
        const applied = applyCharacterSkillsState(
          result.character,
          get().characterSkills.length > 0
            ? { skills: get().characterSkills, stats: get().characterStats }
            : EMPTY_CHARACTER_SKILLS_STATE,
          newsForBank,
        );
        const balanceDelta = result.balance - result.previousBalance;

        set((state) => ({
          ...spreadCharacterBankState(applied),
          balance: result.balance,
          balanceFx:
            balanceDelta !== 0
              ? { delta: balanceDelta, id: Date.now() }
              : state.balanceFx,
          nextTurnForecast: resolveNextTurnForecast(
            {
              step: get().turn,
              salary: applied.characterProfile.salary,
              propertySlots: applied.propertySlots,
              loanPaymentPerTurn: applied.bankSummary.paymentPerTurn,
            },
            result.nextTurnForecast,
          ),
          ...appendNewsItem(state, result.news),
        }));

        gameAudio.playSfx('goodNews');
      } catch {
        // оставляем текущее состояние
      } finally {
        set({ payingOffLoanId: null });
      }
    },

    endTurn: async () => {
      if (endingTurnInFlight) return;

      const { gameId, turn } = get();
      if (!gameId) return;

      endingTurnInFlight = true;
      set({ endingTurn: true });
      const stepAtClick = turn;

      try {
        const result = await endGameTurn(gameId, stepAtClick);
        const applied = applyCharacterSkillsState(result.character, result.characterSkills, get().news);
        const dividendTotal =
          result.dividendPayouts?.reduce((sum, payout) => sum + payout.totalPaid, 0) ?? 0;
        const netDelta = result.passiveIncome.netChange + dividendTotal;

        set((state) => ({
          turn: result.step,
          ...spreadCharacterBankState(applied),
          balanceFx: netDelta !== 0 ? { delta: netDelta, id: Date.now() } : null,
          nextTurnForecast: resolveNextTurnForecast(
            {
              step: get().turn,
              salary: applied.characterProfile.salary,
              propertySlots: applied.propertySlots,
              loanPaymentPerTurn: applied.bankSummary.paymentPerTurn,
            },
            result.nextTurnForecast,
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

        playTurnResultSounds(result.news, result.passiveIncome.itemsPaidOff);

        if (result.otcDeal) {
          set((state) => ({
            otcDeals: [
              mapOtcDealToCard(result.otcDeal!, `otc-${Date.now()}`),
              ...state.otcDeals,
            ],
          }));
        }

        set({ propertyOffers: result.propertyOffers });
        await get().loadExchangeData();
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
                dashboard.propertyOffers,
                dashboard.stocks ?? [],
                (dashboard.portfolio ?? []).map(mapApiPortfolioRow),
                dashboard.marketSentiment ?? null,
                dashboard.ipos ?? [],
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

    loadExchangeData: async () => {
      const { gameId } = get();
      if (!gameId) return;

      try {
        const dashboard = await fetchGameDashboard(gameId);
        set({
          stockListings: dashboard.stocks ?? [],
          portfolio: (dashboard.portfolio ?? []).map(mapApiPortfolioRow),
          marketSentiment: dashboard.marketSentiment ?? null,
          ipos: dashboard.ipos ?? [],
        });
      } catch {
        // оставляем текущие биржевые данные
      }
    },

    fetchStockHistory: async (listingId) => {
      const { gameId } = get();
      if (!gameId) return [];
      const { history } = await fetchStockHistory(gameId, listingId);
      return history;
    },

    buyStock: async (listingId, quantity) => {
      const { gameId, turn } = get();
      if (!gameId) return;

      set({ stockBusy: true });
      try {
        const result = await buyStockApi(gameId, listingId, quantity);
        const newsUpdate = appendNewsItem({ news: get().news, turn }, result.news);
        set({
          balance: result.balance,
          portfolio: result.portfolio.map(mapApiPortfolioRow),
          ...newsUpdate,
        });
        await get().loadExchangeData();
      } finally {
        set({ stockBusy: false });
      }
    },

    sellStock: async (listingId, quantity) => {
      const { gameId, turn } = get();
      if (!gameId) return;

      set({ stockBusy: true });
      try {
        const result = await sellStockApi(gameId, listingId, quantity);
        const newsUpdate = appendNewsItem({ news: get().news, turn }, result.news);
        set({
          balance: result.balance,
          portfolio: result.portfolio.map(mapApiPortfolioRow),
          ...newsUpdate,
        });
        await get().loadExchangeData();
      } finally {
        set({ stockBusy: false });
      }
    },

    subscribeToIpo: async (ipoId, amount) => {
      const { gameId } = get();
      if (!gameId) return;

      set({ stockBusy: true });
      try {
        const result = await subscribeToIpoApi(gameId, ipoId, amount);
        set({ ipos: result.ipos });
        await get().loadExchangeData();
      } finally {
        set({ stockBusy: false });
      }
    },

    clearEnteringNews: () => set({ enteringNewsIds: [] }),

    clearBalanceFx: () => set({ balanceFx: null }),
  };
});
