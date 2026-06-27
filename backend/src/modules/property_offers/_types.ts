export type PropertyOfferType = 'BUY' | 'SELL';
export type ProfitGrade = 'F' | 'E' | 'D' | 'C' | 'B' | 'A';

export interface PropertyOfferDto {
  id: string;
  assetId: string;
  itemName: string;
  inventoryItemId: string | null;
  type: PropertyOfferType;
  offerPrice: number;
  marketPrice: number;
  profitPercent: number;
  profitGrade: ProfitGrade;
  requiredBankingLevel: number;
  isHot: boolean;
  expiresInTurns: number;
  isLocked: boolean;
  downPaymentPercent: number;
}

export interface GeneratedOfferParams {
  gameId: string;
  gameStep: number;
  assetId: string;
  inventoryItemId: string | null;
  type: PropertyOfferType;
  offerPrice: number;
  marketPrice: number;
  profitPercent: number;
  profitGrade: ProfitGrade;
  requiredBankingLevel: number;
  isHot: boolean;
  expiresInTurns: number;
  expiresAtTurn: number;
}
