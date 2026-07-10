export type DealAssetType = 'CASH' | 'STOCK' | 'PROPERTY';

export interface DealAsset {
  type: DealAssetType;

  cashAmount?: number;

  stockListingId?: string;
  ticker?: string;
  companyName?: string;
  shares?: number;

  propertyId?: string;
  propertyName?: string;

  estimatedValue: number;
}

export interface DealBundle {
  assets: DealAsset[];
  totalEstimatedValue: number;
}

export type DealOfferStatus = 'ACTIVE' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'NEGOTIATED';

/** MVP: три понятных сценария без отдельных тяжёлых систем. */
export type DealPurpose =
  | 'VALUE_EXCHANGE'
  | 'LIQUIDITY'
  | 'DREAM_HELPER';

export interface DealFairnessRange {
  minBenefitPercent: number;
  maxBenefitPercent: number;
}

export interface DealFairnessTarget {
  benefitPercent: number;
}

export interface GeneratedDealOffer {
  id: string;
  botCharacterId: string;
  botName: string;
  botProfession: string;

  purpose?: DealPurpose;
  botGives: DealBundle;
  playerGives: DealBundle;

  requiredReputation: number;
  requiredTradingLevel: number;
  reputationPenalty: number;

  playerBenefitValue: number;
  playerBenefitPercent: number;

  status: DealOfferStatus;
  turnCreated: number;
  expiresTurn: number;
  expiresInTurns: number;
}

export interface PlayerPropertyRef {
  propertyId: string;
  propertyName: string;
  estimatedValue: number;
}

export interface PlayerStockRef {
  ticker: string;
  shares: number;
  listingId: string;
  currentPrice: number;
}
