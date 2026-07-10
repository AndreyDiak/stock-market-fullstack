import type { Character, GameStockListing } from '@prisma/client';
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
  LIQUIDITY: { minBenefitPercent: -15, maxBenefitPercent: 5 },
  DREAM_HELPER: { minBenefitPercent: 0, maxBenefitPercent: 15 },
};

/** Минимальная доля стоимости бота, которую игрок должен отдать. */
export const PURPOSE_MIN_PAY_RATIO: Record<DealPurpose, number> = {
  VALUE_EXCHANGE: 0.9,
  LIQUIDITY: 0.85,
  DREAM_HELPER: 0.85,
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

export function validateDeal(ctx: DealValidationContext): string | null {
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

  const affordError = validatePlayerCanAfford(ctx);
  if (affordError) return affordError;

  return null;
}

function validatePurposeAssets(
  purpose: DealPurpose,
  botGives: DealBundle,
  playerGives: DealBundle,
): string | null {
  if (playerGives.assets.some((a) => a.type === 'PROPERTY')) {
    return 'PLAYER_PROPERTY_NOT_ALLOWED';
  }

  switch (purpose) {
    case 'VALUE_EXCHANGE':
      if (botGives.assets.some((a) => a.type === 'PROPERTY')) {
        return 'PROPERTY_ONLY_IN_DREAM_HELPER';
      }
      if (!botGives.assets.every((a) => a.type === 'CASH' || a.type === 'STOCK')) {
        return 'VALUE_EXCHANGE_INVALID_BOT_ASSETS';
      }
      break;
    case 'LIQUIDITY':
      if (!botGives.assets.every((a) => a.type === 'CASH')) {
        return 'LIQUIDITY_BOT_MUST_GIVE_CASH';
      }
      if (!playerGives.assets.some((a) => a.type === 'STOCK')) {
        return 'LIQUIDITY_PLAYER_MUST_GIVE_STOCK';
      }
      break;
    case 'DREAM_HELPER':
      if (botGives.assets.length !== 1 || botGives.assets[0]?.type !== 'PROPERTY') {
        return 'DREAM_BOT_MUST_GIVE_SINGLE_PROPERTY';
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
      case 'STOCK':
        // Акции могут быть целевыми: игрок докупает их на бирже до принятия сделки.
        break;
    }
  }
  return null;
}

export function estimatePlayerPaymentCapacity(input: {
  playerCharacter: Character;
  playerStocks: PlayerStockRef[];
  playerProperties: PlayerPropertyRef[];
}): number {
  const cash = Math.round(input.playerCharacter.balance * 0.9);
  const stockValue = input.playerStocks.reduce(
    (sum, s) => sum + Math.round(s.shares * s.currentPrice * 0.85),
    0,
  );
  return cash + stockValue;
}
