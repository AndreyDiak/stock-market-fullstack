import type { Character, GameStockListing, InventoryItem } from '@prisma/client';
import type { StockGrade } from '../../assets/stock_grade.js';
import { generateLivingExpenses } from '../game/_generators/_living_expense.generator.js';
import { hasActiveInstallmentDebt } from '../property_offers/_deal.js';
import type {
  DealBundle,
  DealFairnessRange,
  DealPurpose,
  PlayerPropertyRef,
  PlayerStockRef,
} from './deal.types.js';

export const GLOBAL_BENEFIT_LIMITS = {
  minBenefitPercent: -30,
  maxBenefitPercent: 25,
} as const;

export const PURPOSE_FAIRNESS: Record<DealPurpose, DealFairnessRange> = {
  VALUE_EXCHANGE: { minBenefitPercent: -10, maxBenefitPercent: 10 },
  LIQUIDITY: { minBenefitPercent: -20, maxBenefitPercent: -5 },
  DREAM_HELPER: { minBenefitPercent: -5, maxBenefitPercent: 10 },
  STOCK_PACKAGE: { minBenefitPercent: -10, maxBenefitPercent: 12 },
};

/** Минимальная доля стоимости бота, которую игрок должен отдать. */
export const PURPOSE_MIN_PAY_RATIO: Record<DealPurpose, number> = {
  VALUE_EXCHANGE: 0.9,
  LIQUIDITY: 0.85,
  DREAM_HELPER: 0.85,
  STOCK_PACKAGE: 0.85,
};

export const VALUE_EXCHANGE_MAX_STOCK_SHARE = 0.3;

/** Доли пакета игрока в DREAM_HELPER: cash + stock + optional property. */
export const DREAM_HELPER_STOCK_SHARE = { min: 0.25, max: 0.42 } as const;
export const DREAM_HELPER_MIN_CASH = 500;

const GRADE_TO_LEVEL: Record<StockGrade, number> = {
  F: 1,
  E: 2,
  D: 3,
  C: 4,
  B: 5,
  A: 6,
};

interface GameStockListingWithCompany extends GameStockListing {
  company: { ticker: string };
}

export interface DealValidationContext {
  purpose: DealPurpose;
  botGives: DealBundle;
  playerGives: DealBundle;
  playerCharacter: Character;
  playerStocks: PlayerStockRef[];
  playerProperties: PlayerPropertyRef[];
  availableStocks: GameStockListingWithCompany[];
}

export function gradeToTradingLevel(grade: StockGrade): number {
  return GRADE_TO_LEVEL[grade] ?? 1;
}

export function calcPlayerBenefitPercent(botGives: DealBundle, playerGives: DealBundle): number {
  if (playerGives.totalEstimatedValue === 0) return 100;
  return Math.round(
    ((botGives.totalEstimatedValue - playerGives.totalEstimatedValue) / playerGives.totalEstimatedValue) * 100,
  );
}

export function calcPlayerBenefitValue(botGives: DealBundle, playerGives: DealBundle): number {
  return botGives.totalEstimatedValue - playerGives.totalEstimatedValue;
}

export function calcTargetPlayerValue(botValue: number, benefitPercent: number): number {
  return Math.round(botValue / (1 + benefitPercent / 100));
}

export function estimateCashCapacity(balance: number): number {
  return Math.round(balance * 0.85);
}

export function estimateStockCapacity(playerStocks: PlayerStockRef[]): number {
  return playerStocks.reduce(
    (sum, stock) => sum + Math.round(stock.shares * stock.currentPrice * 0.85),
    0,
  );
}

export function estimatePortfolioValue(playerStocks: PlayerStockRef[]): number {
  return playerStocks.reduce(
    (sum, stock) => sum + Math.round(stock.shares * stock.currentPrice),
    0,
  );
}

export function estimatePlayerPaymentCapacity(input: {
  playerCharacter: Character;
  playerStocks: PlayerStockRef[];
}): number {
  return estimateCashCapacity(input.playerCharacter.balance) + estimateStockCapacity(input.playerStocks);
}

export function calcNextTurnExpense(input: {
  gameId: string;
  gameStep: number;
  inventoryItems: InventoryItem[];
}): number {
  const livingExpense = generateLivingExpenses(input.gameId, input.gameStep)
    .reduce((sum, receipt) => sum + receipt.amount, 0);

  const installmentExpense = input.inventoryItems
    .filter((item) => hasActiveInstallmentDebt(item))
    .reduce((sum, item) => sum + (item.monthlyPayment ?? 0), 0);

  return livingExpense + installmentExpense;
}

export function isLowCash(input: {
  balance: number;
  gameId: string;
  gameStep: number;
  inventoryItems: InventoryItem[];
}): boolean {
  const nextExpense = calcNextTurnExpense(input);
  return input.balance < nextExpense * 2 || input.balance < 10_000;
}

export function hasMeaningfulPortfolio(playerStocks: PlayerStockRef[]): boolean {
  return estimatePortfolioValue(playerStocks) >= 10_000;
}

export function maxStockRequiredTradingLevel(
  botGives: DealBundle,
  availableStocks: GameStockListingWithCompany[],
): number {
  let maxLevel = 1;

  for (const asset of botGives.assets) {
    if (asset.type !== 'STOCK' || !asset.ticker) continue;
    const listing = availableStocks.find((row) => row.company.ticker === asset.ticker);
    if (!listing) continue;
    maxLevel = Math.max(maxLevel, gradeToTradingLevel(listing.grade as StockGrade));
  }

  return maxLevel;
}

export function validateDeal(ctx: DealValidationContext): string | null {
  const shapeError = validateDealShape(ctx);
  if (shapeError) return shapeError;

  return validatePlayerCanAfford(ctx);
}

/** Проверка при генерации: без требования наличия cash/stock у игрока. */
export function validateDealForGeneration(ctx: DealValidationContext): string | null {
  return validateDealShape(ctx);
}

function validateDealShape(ctx: DealValidationContext): string | null {
  const { purpose, botGives, playerGives } = ctx;

  if (botGives.assets.length === 0 || playerGives.assets.length === 0) {
    return 'EMPTY_BUNDLE';
  }

  if (botGives.totalEstimatedValue <= 0 || playerGives.totalEstimatedValue <= 0) {
    return 'NON_POSITIVE_VALUE';
  }

  const purposeAssetError = validatePurposeAssets(purpose, botGives, playerGives);
  if (purposeAssetError) return purposeAssetError;

  const benefitPercent = calcPlayerBenefitPercent(botGives, playerGives);
  const fairness = PURPOSE_FAIRNESS[purpose];

  if (benefitPercent < GLOBAL_BENEFIT_LIMITS.minBenefitPercent
    || benefitPercent > GLOBAL_BENEFIT_LIMITS.maxBenefitPercent) {
    return 'GLOBAL_BENEFIT_OUT_OF_RANGE';
  }

  if (benefitPercent < fairness.minBenefitPercent || benefitPercent > fairness.maxBenefitPercent) {
    return 'PURPOSE_BENEFIT_OUT_OF_RANGE';
  }

  const minPayRatio = PURPOSE_MIN_PAY_RATIO[purpose];
  const actualPayRatio = playerGives.totalEstimatedValue / botGives.totalEstimatedValue;
  if (actualPayRatio < minPayRatio) {
    return 'PLAYER_PAYS_TOO_LITTLE';
  }

  for (const asset of [...botGives.assets, ...playerGives.assets]) {
    if (asset.estimatedValue <= 0) return 'INVALID_ASSET_VALUE';
  }

  return null;
}

function validatePurposeAssets(
  purpose: DealPurpose,
  botGives: DealBundle,
  playerGives: DealBundle,
): string | null {
  if (purpose !== 'DREAM_HELPER' && playerGives.assets.some((asset) => asset.type === 'PROPERTY')) {
    return 'PLAYER_PROPERTY_NOT_ALLOWED';
  }

  switch (purpose) {
    case 'DREAM_HELPER':
      if (botGives.assets.length !== 1 || botGives.assets[0]?.type !== 'PROPERTY') {
        return 'DREAM_BOT_MUST_GIVE_SINGLE_PROPERTY';
      }
      if (!playerGives.assets.some((asset) => asset.type === 'CASH')) {
        return 'DREAM_PLAYER_MUST_GIVE_CASH';
      }
      if (!playerGives.assets.some((asset) => asset.type === 'STOCK')) {
        return 'DREAM_PLAYER_MUST_GIVE_STOCK';
      }
      if (playerGives.assets.filter((asset) => asset.type === 'PROPERTY').length > 1) {
        return 'DREAM_PLAYER_TOO_MANY_PROPERTIES';
      }
      break;

    case 'LIQUIDITY':
      if (!botGives.assets.every((asset) => asset.type === 'CASH')) {
        return 'LIQUIDITY_BOT_MUST_GIVE_CASH';
      }
      if (!playerGives.assets.every((asset) => asset.type === 'STOCK')) {
        return 'LIQUIDITY_PLAYER_MUST_GIVE_STOCK_ONLY';
      }
      break;

    case 'STOCK_PACKAGE':
      if (!botGives.assets.every((asset) => asset.type === 'STOCK')) {
        return 'STOCK_PACKAGE_BOT_MUST_GIVE_STOCK_ONLY';
      }
      if (!playerGives.assets.every((asset) => asset.type === 'CASH')) {
        return 'STOCK_PACKAGE_PLAYER_MUST_GIVE_CASH_ONLY';
      }
      break;

    case 'VALUE_EXCHANGE':
      if (botGives.assets.some((asset) => asset.type === 'PROPERTY')) {
        return 'PROPERTY_ONLY_IN_DREAM_HELPER';
      }
      if (!botGives.assets.every((asset) => asset.type === 'CASH' || asset.type === 'STOCK')) {
        return 'VALUE_EXCHANGE_INVALID_BOT_ASSETS';
      }
      if (playerGives.assets.some((asset) => asset.type === 'STOCK')) {
        const stockValue = playerGives.assets
          .filter((asset) => asset.type === 'STOCK')
          .reduce((sum, asset) => sum + asset.estimatedValue, 0);
        if (stockValue / playerGives.totalEstimatedValue > VALUE_EXCHANGE_MAX_STOCK_SHARE + 0.01) {
          return 'VALUE_EXCHANGE_STOCK_SHARE_TOO_HIGH';
        }
      }
      break;
  }

  return null;
}

function validatePlayerCanAfford(ctx: DealValidationContext): string | null {
  for (const asset of ctx.playerGives.assets) {
    switch (asset.type) {
      case 'CASH': {
        const amount = asset.cashAmount ?? 0;
        if (ctx.playerCharacter.balance < amount) {
          return 'INSUFFICIENT_CASH';
        }
        break;
      }
      case 'STOCK': {
        if (!asset.ticker || !asset.shares) {
          return 'INVALID_STOCK_ASSET';
        }
        const owned = ctx.playerStocks.find((stock) => stock.ticker === asset.ticker);
        if (!owned || owned.shares < asset.shares) {
          return 'INSUFFICIENT_STOCK';
        }
        break;
      }
      case 'PROPERTY': {
        if (!asset.propertyId) {
          return 'INVALID_PROPERTY_ASSET';
        }
        const owned = ctx.playerProperties.find((property) => property.propertyId === asset.propertyId);
        if (!owned) {
          return 'INSUFFICIENT_PROPERTY';
        }
        break;
      }
    }
  }

  return null;
}
