import type { Character, GameStockListing, InventoryItem, Profession } from '@prisma/client';
import { COMPANIES } from '../../assets/companies.js';
import { PROFESSION_DREAMS } from '../../assets/dreams.js';
import { REAL_ESTATE, type RealEstateData, isLuxuryAsset } from '../../assets/real_estate.js';
import type { StockGrade } from '../../assets/stock_grade.js';
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
  VALUE_EXCHANGE_MAX_STOCK_SHARE,
  DREAM_HELPER_MIN_CASH,
  DREAM_HELPER_STOCK_SHARE,
  calcTargetPlayerValue,
  estimateCashCapacity,
  estimateStockCapacity,
  gradeToTradingLevel,
  hasMeaningfulPortfolio,
  isLowCash,
} from './deal.validator.js';
import { pickCheaperPropertyForLuxuryDeal } from './luxury_trade_up.js';

export interface DealBuildContext {
  gameId: string;
  gameStep: number;
  playerCharacter: Character & { inventoryItems?: InventoryItem[] };
  npcCharacter: Character;
  availableStocks: GameStockListingWithCompany[];
  playerStocks: PlayerStockRef[];
  playerProperties: PlayerPropertyRef[];
}

interface GameStockListingWithCompany extends GameStockListing {
  company: { ticker: string };
}

export interface BuiltDeal {
  purpose: DealPurpose;
  botGives: DealBundle;
  playerGives: DealBundle;
  fairness: DealFairnessTarget;
}

interface WeightedPurpose {
  purpose: DealPurpose;
  weight: number;
}

const VALUE_EXCHANGE_WEIGHT = 1;

const PROFESSION_LUXURY_FALLBACK: Partial<Record<Profession, string>> = {
  FARMER: 'tractor',
  ENGINEER: 'sport_car',
  DEVELOPER: 'penthouse',
  FINANCIER: 'yacht',
  DOCTOR: 'penthouse',
  STREET_CLEANER: 'car_wash',
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
  return COMPANIES.find((company) => company.ticker === ticker) ?? null;
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
  const totalEstimatedValue = assets.reduce((sum, asset) => sum + asset.estimatedValue, 0);
  return { assets, totalEstimatedValue };
}

function getInventoryItems(ctx: DealBuildContext): InventoryItem[] {
  return ctx.playerCharacter.inventoryItems ?? [];
}

function getCashCapacity(ctx: DealBuildContext): number {
  return estimateCashCapacity(ctx.playerCharacter.balance);
}

function getStockCapacity(ctx: DealBuildContext): number {
  return estimateStockCapacity(ctx.playerStocks);
}

function getExchangeStocks(ctx: DealBuildContext): GameStockListingWithCompany[] {
  return ctx.availableStocks.filter((listing) => listing.availableOnExchange);
}

/** Акции, которые бот может предложить в сделке (любые на бирже, не только по уровню игрока). */
function getBotOfferStocks(ctx: DealBuildContext): GameStockListingWithCompany[] {
  return getExchangeStocks(ctx);
}

function getTradableExchangeStocks(ctx: DealBuildContext): GameStockListingWithCompany[] {
  return getExchangeStocks(ctx).filter(
    (listing) => gradeToTradingLevel(listing.grade as StockGrade) <= ctx.playerCharacter.tradingLevel,
  );
}

function pickAvailablePurposes(ctx: DealBuildContext): WeightedPurpose[] {
  const purposes: WeightedPurpose[] = [];

  const emptyPortfolio = !ctx.playerStocks.some((stock) => stock.shares > 0);
  const emptyRealEstate = ctx.playerProperties.length === 0;

  // Сделка-мечта: бот отдаёт недвижимость, игроку не нужно ничего иметь заранее.
  purposes.push({ purpose: 'DREAM_HELPER', weight: emptyRealEstate ? 4 : 3 });

  const exchangeStocks = getBotOfferStocks(ctx);

  if (exchangeStocks.length > 0) {
    purposes.push({
      purpose: 'STOCK_PACKAGE',
      weight: emptyPortfolio ? 2 : 1,
    });
  }

  const lowCash = isLowCash({
    balance: ctx.playerCharacter.balance,
    gameId: ctx.gameId,
    gameStep: ctx.gameStep,
    inventoryItems: getInventoryItems(ctx),
  });

  if (
    lowCash
    && hasMeaningfulPortfolio(ctx.playerStocks)
    && ctx.playerStocks.some((stock) => stock.shares > 0)
  ) {
    purposes.push({ purpose: 'LIQUIDITY', weight: 1 });
  }

  if (VALUE_EXCHANGE_WEIGHT > 0) {
    purposes.push({ purpose: 'VALUE_EXCHANGE', weight: 1 });
  }

  return purposes;
}

function getDreamItemIds(ctx: DealBuildContext): Set<string> {
  const dream = PROFESSION_DREAMS[ctx.playerCharacter.profession];
  return new Set([
    ...ctx.playerCharacter.dreamItemRefs,
    ...(dream?.stages.flatMap((stage) => stage.requiredItems ?? []) ?? []),
    ...(dream?.stages.flatMap((stage) => stage.requireItemFullyOwned ?? []) ?? []),
  ]);
}

function getDreamLuxuryTargets(ctx: DealBuildContext): RealEstateData[] {
  const ownedIds = new Set(ctx.playerProperties.map((property) => property.propertyId));

  return REAL_ESTATE.filter(
    (property) => isLuxuryAsset(property)
      && !ownedIds.has(property.id),
  );
}

/** Объекты, которые бот может предложить в DREAM_HELPER (без лимита по балансу игрока). */
function getBotOfferProperties(ctx: DealBuildContext): RealEstateData[] {
  const luxuryTargets = getDreamLuxuryTargets(ctx);
  if (luxuryTargets.length > 0) return luxuryTargets;

  const fallbackId = PROFESSION_LUXURY_FALLBACK[ctx.playerCharacter.profession] ?? 'penthouse';
  const fallback = REAL_ESTATE.find((property) => property.id === fallbackId && isLuxuryAsset(property));
  if (fallback) return [fallback];

  return REAL_ESTATE.filter(isLuxuryAsset);
}

function pickGuaranteedDreamProperty(ctx: DealBuildContext): RealEstateData {
  const offerTargets = getBotOfferProperties(ctx);
  return [...offerTargets].sort((a, b) => a.basePrice - b.basePrice)[0]!;
}

function pickWeightedPurpose(purposes: WeightedPurpose[]): DealPurpose {
  const totalWeight = purposes.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const entry of purposes) {
    roll -= entry.weight;
    if (roll <= 0) return entry.purpose;
  }

  return purposes[0]!.purpose;
}

function pickFairness(purpose: DealPurpose): DealFairnessTarget {
  const range = PURPOSE_FAIRNESS[purpose];
  const benefitPercent = Math.round(randomFloat(range.minBenefitPercent, range.maxBenefitPercent));
  return { benefitPercent };
}

function buildAspirationalStockAssets(
  ctx: DealBuildContext,
  targetValue: number,
  stocks = getBotOfferStocks(ctx),
): DealAsset[] | null {
  if (stocks.length === 0 || targetValue <= 0) return null;

  const ownedStocks = ctx.playerStocks.filter((stock) => stock.shares > 0 && stock.currentPrice > 0);
  if (ownedStocks.length > 0 && Math.random() > 0.35) {
    const ownedAssets = pickPlayerOwnedStockAssets(ctx, targetValue);
    if (ownedAssets) return ownedAssets;
  }

  const stock = pickRandom(stocks);
  if (!stock) return null;

  const company = findCompanyByTicker(stock.company.ticker);
  if (!company) return null;

  const shares = clamp(Math.max(1, Math.ceil(targetValue / stock.currentPrice)), 1, 120);
  return [stockAsset(company.ticker, company.name, shares, stock.currentPrice, stock.id)];
}

function buildLuxuryPlayerBundle(
  ctx: DealBuildContext,
  luxury: RealEstateData,
  targetValue: number,
): DealBundle | null {
  const exchangeStocks = getBotOfferStocks(ctx);

  const assets: DealAsset[] = [];
  let budget = targetValue;

  const cheaperProperty = pickCheaperPropertyForLuxuryDeal({
    luxury,
    dreamItemIds: getDreamItemIds(ctx),
    ownedProperties: ctx.playerProperties,
  });

  if (cheaperProperty) {
    const maxPropertyValue = Math.round(targetValue * 0.6);
    if (
      cheaperProperty.basePrice <= maxPropertyValue
      && cheaperProperty.basePrice <= budget - DREAM_HELPER_MIN_CASH
    ) {
      assets.push(propertyAsset(cheaperProperty.id, cheaperProperty.name, cheaperProperty.basePrice));
      budget -= cheaperProperty.basePrice;
    }
  }

  if (exchangeStocks.length > 0) {
    const minStockValue = Math.max(500, Math.round(targetValue * DREAM_HELPER_STOCK_SHARE.min));
    const maxStockValue = Math.max(minStockValue, budget - DREAM_HELPER_MIN_CASH);
    const stockTarget = clamp(
      Math.round(targetValue * randomFloat(DREAM_HELPER_STOCK_SHARE.min, DREAM_HELPER_STOCK_SHARE.max)),
      minStockValue,
      maxStockValue,
    );

    const stockAssets = buildAspirationalStockAssets(ctx, stockTarget, exchangeStocks);
    if (stockAssets && stockAssets.length > 0) {
      assets.push(...stockAssets);
      budget -= stockAssets.reduce((sum, asset) => sum + asset.estimatedValue, 0);
    }
  }

  if (budget < DREAM_HELPER_MIN_CASH) return null;

  assets.push(cashAsset(Math.max(DREAM_HELPER_MIN_CASH, budget)));

  const bundle = buildBundle(assets);
  const diff = targetValue - bundle.totalEstimatedValue;
  if (diff !== 0) {
    const cashIndex = assets.findIndex((asset) => asset.type === 'CASH');
    if (cashIndex >= 0) {
      assets[cashIndex] = cashAsset(Math.max(DREAM_HELPER_MIN_CASH, (assets[cashIndex].cashAmount ?? 0) + diff));
      return buildBundle(assets);
    }
  }

  return bundle;
}

function buildAspirationalCashBundle(targetValue: number): DealBundle {
  return buildBundle([cashAsset(Math.max(500, targetValue))]);
}

function buildPlayerCashBundle(ctx: DealBuildContext, targetValue: number): DealBundle | null {
  const cashCapacity = getCashCapacity(ctx);
  if (targetValue > cashCapacity || targetValue > ctx.playerCharacter.balance) {
    return null;
  }

  return buildBundle([cashAsset(targetValue)]);
}

function buildBotCashBundle(amount: number): DealBundle {
  return buildBundle([cashAsset(amount)]);
}

function buildBotStockBundle(
  ctx: DealBuildContext,
  targetValue: number,
  stocks = getBotOfferStocks(ctx),
): DealBundle | null {
  const stock = pickRandom(stocks);
  if (!stock) return null;

  const company = findCompanyByTicker(stock.company.ticker);
  if (!company) return null;

  const shares = clamp(Math.max(1, Math.ceil(targetValue / stock.currentPrice)), 1, 80);
  return buildBundle([
    stockAsset(company.ticker, company.name, shares, stock.currentPrice, stock.id),
  ]);
}

function buildTwoStockBundle(
  ctx: DealBuildContext,
  targetValue: number,
  stocks = getBotOfferStocks(ctx),
): DealBundle | null {
  if (stocks.length < 2) {
    return buildBotStockBundle(ctx, targetValue, stocks);
  }

  const stock1 = pickRandom(stocks);
  const stock2 = pickRandom(stocks.filter((listing) => listing.id !== stock1?.id));
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

function buildBotPropertyBundle(propertyId: string): DealBundle | null {
  const property = REAL_ESTATE.find((item) => item.id === propertyId);
  if (!property) return null;
  return buildBundle([propertyAsset(property.id, property.name, property.basePrice)]);
}

function pickPlayerOwnedStockAssets(ctx: DealBuildContext, targetValue: number): DealAsset[] | null {
  const ownedStocks = ctx.playerStocks.filter((stock) => stock.shares > 0 && stock.currentPrice > 0);
  if (ownedStocks.length === 0) return null;

  const stockCapacity = getStockCapacity(ctx);
  if (targetValue > stockCapacity) return null;

  if (ownedStocks.length >= 2 && Math.random() > 0.45) {
    const stock1 = pickRandom(ownedStocks)!;
    const stock2 = pickRandom(ownedStocks.filter((stock) => stock.ticker !== stock1.ticker));
    if (stock2) {
      const split = randomFloat(0.4, 0.6);
      const value1 = Math.round(targetValue * split);
      const value2 = targetValue - value1;
      const shares1 = clamp(Math.max(1, Math.ceil(value1 / stock1.currentPrice)), 1, stock1.shares);
      const shares2 = clamp(Math.max(1, Math.ceil(value2 / stock2.currentPrice)), 1, stock2.shares);
      const company1 = findCompanyByTicker(stock1.ticker);
      const company2 = findCompanyByTicker(stock2.ticker);
      if (!company1 || !company2) return null;

      return [
        stockAsset(company1.ticker, company1.name, shares1, stock1.currentPrice, stock1.listingId),
        stockAsset(company2.ticker, company2.name, shares2, stock2.currentPrice, stock2.listingId),
      ];
    }
  }

  const stock = pickRandom(ownedStocks)!;
  const company = findCompanyByTicker(stock.ticker);
  if (!company) return null;

  const shares = clamp(
    Math.max(1, Math.ceil(targetValue / stock.currentPrice)),
    1,
    stock.shares,
  );

  return [stockAsset(company.ticker, company.name, shares, stock.currentPrice, stock.listingId)];
}

function buildValueExchangePlayerBundle(ctx: DealBuildContext, targetValue: number): DealBundle | null {
  const cashCapacity = getCashCapacity(ctx);
  const maxCash = Math.min(cashCapacity, ctx.playerCharacter.balance);

  if (maxCash >= targetValue) {
    return buildBundle([cashAsset(targetValue)]);
  }

  const maxStockValue = Math.round(targetValue * VALUE_EXCHANGE_MAX_STOCK_SHARE);
  const minCashValue = Math.max(0, targetValue - maxStockValue);

  let cashAmount = clamp(Math.round(targetValue * randomFloat(0.55, 0.85)), minCashValue, maxCash);
  let remaining = targetValue - cashAmount;

  const assets: DealAsset[] = [];
  if (cashAmount > 0) {
    assets.push(cashAsset(cashAmount));
  }

  if (remaining > 0) {
    const ownedStocks = ctx.playerStocks.filter((stock) => stock.shares > 0 && stock.currentPrice > 0);
    const stock = pickRandom(ownedStocks);
    if (!stock) {
      if (maxCash >= targetValue * 0.88) {
        return buildBundle([cashAsset(Math.min(targetValue, maxCash))]);
      }
      return null;
    }

    const company = findCompanyByTicker(stock.ticker);
    if (!company) return null;

    const shares = clamp(
      Math.max(1, Math.ceil(remaining / stock.currentPrice)),
      1,
      stock.shares,
    );
    assets.push(stockAsset(company.ticker, company.name, shares, stock.currentPrice, stock.listingId));
    remaining = targetValue - assets.reduce((sum, asset) => sum + asset.estimatedValue, 0);

    if (remaining > 500 && cashAmount + remaining <= maxCash) {
      cashAmount += remaining;
      const cashAssetIndex = assets.findIndex((asset) => asset.type === 'CASH');
      if (cashAssetIndex >= 0) {
        assets[cashAssetIndex] = cashAsset(cashAmount);
      } else {
        assets.unshift(cashAsset(remaining));
      }
    }
  }

  if (assets.length === 0) return null;
  return buildBundle(assets);
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

function tryBuildDreamHelper(ctx: DealBuildContext, fairness: DealFairnessTarget): BuiltDeal | null {
  const property = pickRandom(getBotOfferProperties(ctx));
  if (!property) return null;

  const botGives = buildBotPropertyBundle(property.id);
  if (!botGives) return null;

  const playerTarget = calcTargetPlayerValue(botGives.totalEstimatedValue, fairness.benefitPercent);
  const playerGives = buildLuxuryPlayerBundle(ctx, property, playerTarget);
  if (!playerGives) return null;

  return finalizeBuiltDeal('DREAM_HELPER', botGives, playerGives, fairness);
}

function tryBuildStockPackage(ctx: DealBuildContext, fairness: DealFairnessTarget): BuiltDeal | null {
  const exchangeStocks = getBotOfferStocks(ctx);
  if (exchangeStocks.length === 0) return null;

  const cashCapacity = getCashCapacity(ctx);
  const botTarget = cashCapacity >= 2_000
    ? randomInt(4_000, clamp(Math.round(cashCapacity * 1.1), 5_000, 22_000))
    : randomInt(2_000, 6_000);

  const botGives = buildTwoStockBundle(ctx, botTarget, exchangeStocks)
    ?? buildBotStockBundle(ctx, botTarget, exchangeStocks);
  if (!botGives) return null;

  const playerTarget = calcTargetPlayerValue(botGives.totalEstimatedValue, fairness.benefitPercent);
  const playerGives = buildPlayerCashBundle(ctx, playerTarget)
    ?? buildAspirationalCashBundle(playerTarget);

  return finalizeBuiltDeal('STOCK_PACKAGE', botGives, playerGives, fairness);
}

function tryBuildLiquidity(ctx: DealBuildContext, fairness: DealFairnessTarget): BuiltDeal | null {
  const lowCash = isLowCash({
    balance: ctx.playerCharacter.balance,
    gameId: ctx.gameId,
    gameStep: ctx.gameStep,
    inventoryItems: getInventoryItems(ctx),
  });

  if (!lowCash || !hasMeaningfulPortfolio(ctx.playerStocks)) return null;

  const stockCapacity = getStockCapacity(ctx);
  if (stockCapacity < 3_000) return null;

  const playerTarget = randomInt(3_000, clamp(Math.round(stockCapacity * 0.65), 4_000, 18_000));
  const stockAssets = pickPlayerOwnedStockAssets(ctx, playerTarget);
  if (!stockAssets) return null;

  const playerGives = buildBundle(stockAssets);
  const botCash = Math.round(playerGives.totalEstimatedValue * (1 + fairness.benefitPercent / 100));
  if (botCash <= 0) return null;
  const botGives = buildBotCashBundle(botCash);

  return finalizeBuiltDeal('LIQUIDITY', botGives, playerGives, fairness);
}

function tryBuildValueExchange(ctx: DealBuildContext, fairness: DealFairnessTarget): BuiltDeal | null {
  const cashCapacity = getCashCapacity(ctx);
  const exchangeStocks = getBotOfferStocks(ctx);
  const playerHasStocks = ctx.playerStocks.some((stock) => stock.shares > 0);
  const useBotStock = exchangeStocks.length > 0
    && (!playerHasStocks || Math.random() > 0.45);

  const botStock = useBotStock
    ? buildBotStockBundle(
      ctx,
      randomInt(3_000, clamp(Math.round(Math.max(cashCapacity, 2_000) * 0.9), 4_000, 15_000)),
      exchangeStocks,
    )
    : null;

  const botGives = botStock
    ?? buildBotCashBundle(clamp(randomInt(2_000, 9_000), 1_500, Math.max(1_500, Math.round(Math.max(cashCapacity, 2_000) * 0.55))));

  const playerTarget = calcTargetPlayerValue(botGives.totalEstimatedValue, fairness.benefitPercent);
  const playerGives = buildPlayerCashBundle(ctx, playerTarget)
    ?? (playerHasStocks ? buildValueExchangePlayerBundle(ctx, playerTarget) : null)
    ?? buildAspirationalCashBundle(playerTarget);

  return finalizeBuiltDeal('VALUE_EXCHANGE', botGives, playerGives, fairness);
}

const BUILDERS: Record<DealPurpose, (ctx: DealBuildContext, fairness: DealFairnessTarget) => BuiltDeal | null> = {
  VALUE_EXCHANGE: tryBuildValueExchange,
  LIQUIDITY: tryBuildLiquidity,
  STOCK_PACKAGE: tryBuildStockPackage,
  DREAM_HELPER: tryBuildDreamHelper,
};

export function buildDeal(ctx: DealBuildContext, purpose: DealPurpose): BuiltDeal | null {
  const fairness = pickFairness(purpose);
  return BUILDERS[purpose](ctx, fairness);
}

function buildGuaranteedStockPackage(ctx: DealBuildContext): BuiltDeal | null {
  const exchangeStocks = getBotOfferStocks(ctx);
  if (exchangeStocks.length === 0) return null;

  const botGives = buildBotStockBundle(ctx, 4_000, exchangeStocks);
  if (!botGives) return null;

  const playerValue = botGives.totalEstimatedValue;
  const playerGives = buildBundle([cashAsset(playerValue)]);

  return {
    purpose: 'STOCK_PACKAGE',
    botGives,
    playerGives,
    fairness: { benefitPercent: 0 },
  };
}

function buildGuaranteedDreamHelper(ctx: DealBuildContext): BuiltDeal | null {
  const property = pickGuaranteedDreamProperty(ctx);
  const botGives = buildBotPropertyBundle(property.id);
  if (!botGives) return null;

  const playerGives = buildLuxuryPlayerBundle(ctx, property, botGives.totalEstimatedValue);
  if (!playerGives) return null;

  return {
    purpose: 'DREAM_HELPER',
    botGives,
    playerGives,
    fairness: { benefitPercent: 0 },
  };
}

export function buildGuaranteedDeal(ctx: DealBuildContext): BuiltDeal {
  const dreamDeal = buildGuaranteedDreamHelper(ctx);
  if (dreamDeal) return dreamDeal;

  const stockDeal = buildGuaranteedStockPackage(ctx);
  if (stockDeal) return stockDeal;

  throw new Error('Unable to build guaranteed deal: no exchange stocks available');
}

export function buildDealWithRetries(ctx: DealBuildContext, maxAttempts = 12): BuiltDeal | null {
  const availablePurposes = pickAvailablePurposes(ctx);
  if (availablePurposes.length === 0) return null;

  for (const entry of availablePurposes) {
    const built = buildDeal(ctx, entry.purpose);
    if (built) return built;
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const purpose = pickWeightedPurpose(availablePurposes);
    const built = buildDeal(ctx, purpose);
    if (built) return built;
  }

  return null;
}

export function listAvailablePurposes(ctx: DealBuildContext): WeightedPurpose[] {
  return pickAvailablePurposes(ctx);
}
