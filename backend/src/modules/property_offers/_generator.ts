import { REAL_ESTATE } from '../../assets/real_estate.js';
import type { InventoryItem } from '@prisma/client';
import {
  calcOfferPrice,
  gradeFromPercent,
  pickRandomGrade,
  randomPercentInGrade,
  requiredBankingLevel,
} from './_profit.js';
import type { GeneratedOfferParams, PropertyOfferType, ProfitGrade } from './_types.js';

const TRADABLE_ASSETS = REAL_ESTATE.filter((r) => r.isTradable);

function pickRandom<T>(items: T[], random: () => number): T {
  return items[Math.floor(random() * items.length)]!;
}

function isTradableInventoryItem(item: InventoryItem): boolean {
  const asset = REAL_ESTATE.find((r) => r.id === item.itemRef);
  return asset?.isTradable ?? false;
}

export function buildOfferParams(input: {
  gameId: string;
  gameStep: number;
  inventoryItems: InventoryItem[];
  random?: () => number;
  forceHot?: boolean;
  forcedGrade?: ProfitGrade;
  excludeAssetIds?: string[];
  excludeInventoryItemIds?: string[];
}): GeneratedOfferParams | null {
  const random = input.random ?? Math.random;
  const excludeAssets = new Set(input.excludeAssetIds ?? []);
  const excludeInventoryItems = new Set(input.excludeInventoryItemIds ?? []);

  let type: PropertyOfferType = random() > 0.45 ? 'SELL' : 'BUY';
  let assetId: string;
  let inventoryItemId: string | null = null;

  const tradableOwned = input.inventoryItems.filter(isTradableInventoryItem);
  const sellableOwned = tradableOwned.filter(
    (item) => !excludeAssets.has(item.itemRef) && !excludeInventoryItems.has(item.id),
  );

  if (type === 'BUY') {
    if (sellableOwned.length === 0) {
      type = 'SELL';
    } else {
      const item = pickRandom(sellableOwned, random);
      inventoryItemId = item.id;
      assetId = item.itemRef;
    }
  }

  if (type === 'SELL') {
    const pool = TRADABLE_ASSETS.filter((asset) => !excludeAssets.has(asset.id));
    if (pool.length === 0) return null;
    assetId = pickRandom(pool, random).id;
  } else {
    assetId = assetId!;
  }

  const asset = REAL_ESTATE.find((r) => r.id === assetId);
  if (!asset) return null;

  const marketPrice = asset.basePrice;
  const isHot = input.forcedGrade ? false : (input.forceHot ?? random() < 0.05);

  let profitable: boolean;
  let profitPercent: number;
  let profitGrade: ProfitGrade;

  if (input.forcedGrade) {
    profitable = true;
    profitGrade = input.forcedGrade;
    profitPercent = randomPercentInGrade(profitGrade, random);
  } else if (isHot) {
    profitable = true;
    profitGrade = pickRandomGrade('C', random);
    profitPercent = randomPercentInGrade(profitGrade, random);
  } else if (random() < 0.3) {
    profitable = false;
    profitPercent = random() * 10;
    profitGrade = 'F';
  } else {
    profitable = true;
    profitGrade = pickRandomGrade('F', random);
    profitPercent = randomPercentInGrade(profitGrade, random);
  }

  const offerPrice = calcOfferPrice(type, marketPrice, profitPercent, profitable);
  const signedProfit = profitable ? profitPercent : -profitPercent;
  profitGrade = input.forcedGrade ?? gradeFromPercent(signedProfit, profitable);

  const expiresInTurns = isHot ? 1 : 1 + Math.floor(random() * 15);

  return {
    gameId: input.gameId,
    gameStep: input.gameStep,
    assetId,
    inventoryItemId,
    type,
    offerPrice,
    marketPrice,
    profitPercent: signedProfit,
    profitGrade,
    requiredBankingLevel: profitable ? requiredBankingLevel(profitGrade) : 1,
    isHot,
    expiresInTurns,
    expiresAtTurn: input.gameStep + expiresInTurns,
  };
}

export function getAssetName(assetId: string): string {
  return REAL_ESTATE.find((r) => r.id === assetId)?.name ?? assetId;
}

export function formatOfferNewsBody(params: GeneratedOfferParams): string {
  const name = getAssetName(params.assetId);
  const typeLabel =
    params.type === 'BUY'
      ? `Покупатель хочет купить ${name}`
      : `Продавец предлагает ${name}`;
  const profitLabel =
    params.profitPercent >= 0
      ? `Выгода +${params.profitPercent.toFixed(1)}%`
      : `Убыток ${params.profitPercent.toFixed(1)}%`;

  return `${typeLabel} за $${params.offerPrice.toLocaleString('en-US')}. Категория ${params.profitGrade}. ${profitLabel}. Ходов: ${params.expiresInTurns}. Требуемый bankingLevel: ${params.requiredBankingLevel}.`;
}
