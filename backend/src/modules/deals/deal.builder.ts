import type { Character, GameStockListing } from '@prisma/client';
import { COMPANIES } from '../../assets/companies.js';
import { PROFESSION_DREAMS } from '../../assets/dreams.js';
import { REAL_ESTATE } from '../../assets/real_estate.js';
import type {
  DealAsset,
  DealBundle,
  DealFairnessTarget,
  DealPurpose,
  PlayerPropertyRef,
  PlayerStockRef,
} from './deal.types.js';
import {
  PURPOSE_FAIRNESS,
  PURPOSE_MIN_PAY_RATIO,
  calcTargetPlayerValue,
  estimatePlayerPaymentCapacity,
} from './deal.validator.js';

export interface DealBuildContext {
  gameId: string;
  gameStep: number;
  playerCharacter: Character;
  npcCharacter: Character;
  availableStocks: GameStockListingWithCompany[];
  playerStocks: PlayerStockRef[];
  playerProperties: PlayerPropertyRef[];
}

interface GameStockListingWithCompany extends GameStockListing {
  company: { ticker: string };
}

interface BuiltDeal {
  purpose: DealPurpose;
  botGives: DealBundle;
  playerGives: DealBundle;
  fairness: DealFairnessTarget;
}

const PURPOSE_WEIGHTS: Record<DealPurpose, number> = {
  VALUE_EXCHANGE: 2,
  LIQUIDITY: 2,
  DREAM_HELPER: 1,
};

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)]!;
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randomFloat(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function findCompanyByTicker(ticker: string) {
  return COMPANIES.find((c) => c.ticker === ticker) ?? null;
}

function cashAsset(amount: number): DealAsset {
  return { type: 'CASH', cashAmount: amount, estimatedValue: amount };
}

function propertyAsset(propertyId: string, propertyName: string, estimatedValue: number): DealAsset {
  return { type: 'PROPERTY', propertyId, propertyName, estimatedValue };
}

function stockAsset(
  ticker: string,
  companyName: string,
  shares: number,
  price: number,
  listingId: string,
): DealAsset {
  return {
    type: 'STOCK',
    ticker,
    companyName,
    shares,
    stockListingId: listingId,
    estimatedValue: Math.round(shares * price),
  };
}

function buildBundle(assets: DealAsset[]): DealBundle {
  const totalEstimatedValue = assets.reduce((sum, a) => sum + a.estimatedValue, 0);
  return { assets, totalEstimatedValue };
}

function pickPurpose(): DealPurpose {
  const entries = Object.entries(PURPOSE_WEIGHTS) as Array<[DealPurpose, number]>;
  const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * totalWeight;
  for (const [purpose, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return purpose;
  }
  return 'VALUE_EXCHANGE';
}

function pickFairness(purpose: DealPurpose): DealFairnessTarget {
  const range = PURPOSE_FAIRNESS[purpose];
  const benefitPercent = Math.round(randomFloat(range.minBenefitPercent, range.maxBenefitPercent));
  return { benefitPercent };
}

function getExchangeStocks(ctx: DealBuildContext): GameStockListingWithCompany[] {
  return ctx.availableStocks.filter((s) => s.availableOnExchange);
}

function getDreamHelperProperties(ctx: DealBuildContext): typeof REAL_ESTATE {
  const dream = PROFESSION_DREAMS[ctx.playerCharacter.profession];
  const ownedIds = new Set(ctx.playerProperties.map((p) => p.propertyId));
  const dreamItemIds = new Set([
    ...ctx.playerCharacter.dreamItemRefs,
    ...(dream?.stages.flatMap((s) => s.requiredItems ?? []) ?? []),
    ...(dream?.stages.flatMap((s) => s.requireItemFullyOwned ?? []) ?? []),
  ]);

  const capacity = estimatePlayerPaymentCapacity(ctx);
  const maxPrice = Math.round(capacity * 1.15);

  return REAL_ESTATE.filter(
    (p) => p.isTradable
      && dreamItemIds.has(p.id)
      && !ownedIds.has(p.id)
      && p.basePrice <= maxPrice
      && p.basePrice >= 1500,
  );
}

function buildCashStockBundle(
  ctx: DealBuildContext,
  targetValue: number,
  preferCashRatio: number,
): DealBundle | null {
  const stocks = getExchangeStocks(ctx);
  if (stocks.length === 0) return null;

  const stock = pickRandom(stocks);
  if (!stock) return null;
  const company = findCompanyByTicker(stock.company.ticker);
  if (!company) return null;

  const maxCash = Math.max(0, ctx.playerCharacter.balance - 500);
  let cashAmount = Math.min(Math.round(targetValue * preferCashRatio), maxCash);
  if (cashAmount < 500) cashAmount = 0;

  let remaining = targetValue - cashAmount;
  if (remaining <= 0) {
    cashAmount = Math.min(targetValue, maxCash);
    remaining = targetValue - cashAmount;
  }

  let shares = Math.max(1, Math.ceil(remaining / stock.currentPrice));
  shares = clamp(shares, 1, 200);
  let stockValue = shares * stock.currentPrice;
  let total = cashAmount + stockValue;

  if (total < targetValue * 0.92) {
    const missing = targetValue - total;
    const extraShares = Math.max(1, Math.ceil(missing / stock.currentPrice));
    shares = clamp(shares + extraShares, 1, 200);
    stockValue = shares * stock.currentPrice;
    total = cashAmount + stockValue;
  }

  if (total < targetValue * 0.85) return null;

  const assets: DealAsset[] = [];
  if (cashAmount > 0) assets.push(cashAsset(cashAmount));
  assets.push(stockAsset(company.ticker, company.name, shares, stock.currentPrice, stock.id));

  return buildBundle(assets);
}

function buildStockOnlyBundle(ctx: DealBuildContext, targetValue: number): DealBundle | null {
  const stocks = getExchangeStocks(ctx);
  const stock = pickRandom(stocks);
  if (!stock) return null;
  const company = findCompanyByTicker(stock.company.ticker);
  if (!company) return null;

  const shares = clamp(Math.max(1, Math.ceil(targetValue / stock.currentPrice)), 1, 200);
  const bundle = buildBundle([
    stockAsset(company.ticker, company.name, shares, stock.currentPrice, stock.id),
  ]);
  if (bundle.totalEstimatedValue < targetValue * 0.85) return null;
  return bundle;
}

function buildTwoStockBundle(ctx: DealBuildContext, targetValue: number): DealBundle | null {
  const stocks = getExchangeStocks(ctx);
  if (stocks.length < 2) return buildStockOnlyBundle(ctx, targetValue);

  const stock1 = pickRandom(stocks);
  const stock2 = pickRandom(stocks.filter((s) => s.id !== stock1?.id));
  if (!stock1 || !stock2) return null;

  const company1 = findCompanyByTicker(stock1.company.ticker);
  const company2 = findCompanyByTicker(stock2.company.ticker);
  if (!company1 || !company2) return null;

  const split = randomFloat(0.35, 0.65);
  const value1 = Math.round(targetValue * split);
  const value2 = targetValue - value1;

  const shares1 = clamp(Math.max(1, Math.ceil(value1 / stock1.currentPrice)), 1, 50);
  const shares2 = clamp(Math.max(1, Math.ceil(value2 / stock2.currentPrice)), 1, 50);

  return buildBundle([
    stockAsset(company1.ticker, company1.name, shares1, stock1.currentPrice, stock1.id),
    stockAsset(company2.ticker, company2.name, shares2, stock2.currentPrice, stock2.id),
  ]);
}

function buildPlayerStockBundle(ctx: DealBuildContext, targetValue: number): DealBundle | null {
  return buildTwoStockBundle(ctx, targetValue)
    ?? buildCashStockBundle(ctx, targetValue, randomFloat(0.25, 0.55))
    ?? buildStockOnlyBundle(ctx, targetValue);
}

function buildBotCashBundle(amount: number): DealBundle {
  return buildBundle([cashAsset(amount)]);
}

function buildBotStockBundle(ctx: DealBuildContext, targetValue: number): DealBundle | null {
  const stocks = getExchangeStocks(ctx);
  const stock = pickRandom(stocks);
  if (!stock) return null;
  const company = findCompanyByTicker(stock.company.ticker);
  if (!company) return null;

  const shares = clamp(Math.max(1, Math.ceil(targetValue / stock.currentPrice)), 1, 80);
  return buildBundle([
    stockAsset(company.ticker, company.name, shares, stock.currentPrice, stock.id),
  ]);
}

function buildBotPropertyBundle(propertyId: string): DealBundle | null {
  const property = REAL_ESTATE.find((p) => p.id === propertyId);
  if (!property) return null;
  return buildBundle([propertyAsset(property.id, property.name, property.basePrice)]);
}

function meetsEconomicTargets(
  purpose: DealPurpose,
  botGives: DealBundle,
  playerGives: DealBundle,
  fairness: DealFairnessTarget,
): boolean {
  const minPlayerValue = botGives.totalEstimatedValue * PURPOSE_MIN_PAY_RATIO[purpose];
  if (playerGives.totalEstimatedValue < minPlayerValue * 0.97) return false;

  const targetPlayerValue = calcTargetPlayerValue(botGives.totalEstimatedValue, fairness.benefitPercent);
  const tolerance = Math.max(800, botGives.totalEstimatedValue * 0.12);
  if (Math.abs(playerGives.totalEstimatedValue - targetPlayerValue) > tolerance) return false;

  return true;
}

function finalizeBuiltDeal(
  purpose: DealPurpose,
  botGives: DealBundle,
  playerGives: DealBundle,
  fairness: DealFairnessTarget,
): BuiltDeal | null {
  if (!meetsEconomicTargets(purpose, botGives, playerGives, fairness)) return null;
  return { purpose, botGives, playerGives, fairness };
}

function tryBuildValueExchange(ctx: DealBuildContext, fairness: DealFairnessTarget): BuiltDeal | null {
  const botGives = Math.random() > 0.4
    ? buildBotStockBundle(ctx, randomInt(4000, 22000))
    : buildBotCashBundle(clamp(randomInt(3000, 15000), 2000, Math.round(estimatePlayerPaymentCapacity(ctx) * 0.55)));

  if (!botGives) return null;

  const playerTarget = calcTargetPlayerValue(botGives.totalEstimatedValue, fairness.benefitPercent);
  const playerGives = buildPlayerStockBundle(ctx, playerTarget);
  if (!playerGives) return null;

  return finalizeBuiltDeal('VALUE_EXCHANGE', botGives, playerGives, fairness);
}

function tryBuildLiquidity(ctx: DealBuildContext, fairness: DealFairnessTarget): BuiltDeal | null {
  const capacity = estimatePlayerPaymentCapacity(ctx);
  const cashAmount = clamp(randomInt(3000, 15000), 2000, Math.max(2000, Math.round(capacity * 0.6)));
  const botGives = buildBotCashBundle(cashAmount);

  const playerTarget = calcTargetPlayerValue(botGives.totalEstimatedValue, fairness.benefitPercent);
  const playerGives = buildTwoStockBundle(ctx, playerTarget)
    ?? buildStockOnlyBundle(ctx, playerTarget);
  if (!playerGives) return null;

  return finalizeBuiltDeal('LIQUIDITY', botGives, playerGives, fairness);
}

function tryBuildDreamHelper(ctx: DealBuildContext, fairness: DealFairnessTarget): BuiltDeal | null {
  const candidates = getDreamHelperProperties(ctx);
  const property = pickRandom(candidates);
  if (!property) return null;

  const botGives = buildBotPropertyBundle(property.id);
  if (!botGives) return null;

  const playerTarget = calcTargetPlayerValue(botGives.totalEstimatedValue, fairness.benefitPercent);
  const playerGives = buildCashStockBundle(ctx, playerTarget, randomFloat(0.25, 0.55))
    ?? buildPlayerStockBundle(ctx, playerTarget);
  if (!playerGives) return null;

  return finalizeBuiltDeal('DREAM_HELPER', botGives, playerGives, fairness);
}

const BUILDERS: Record<DealPurpose, (ctx: DealBuildContext, fairness: DealFairnessTarget) => BuiltDeal | null> = {
  VALUE_EXCHANGE: tryBuildValueExchange,
  LIQUIDITY: tryBuildLiquidity,
  DREAM_HELPER: tryBuildDreamHelper,
};

export function buildDeal(ctx: DealBuildContext, purpose?: DealPurpose): BuiltDeal | null {
  const selectedPurpose = purpose ?? pickPurpose();
  const fairness = pickFairness(selectedPurpose);
  return BUILDERS[selectedPurpose](ctx, fairness);
}

export function buildDealWithRetries(ctx: DealBuildContext, maxAttempts = 12): BuiltDeal | null {
  const purposes = Object.keys(BUILDERS) as DealPurpose[];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const purpose = attempt < 4 ? pickPurpose() : pickRandom(purposes)!;
    const built = buildDeal(ctx, purpose);
    if (built) return built;
  }

  return null;
}
