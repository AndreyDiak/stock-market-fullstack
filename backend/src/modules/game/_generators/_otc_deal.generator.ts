import { COMPANIES } from '../../../assets/companies.js';
import { NPCS } from '../../../assets/npcs.js';
import type { GeneratedOtcDeal } from '../../news/types.js';

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export class OtcDealGenerator {
  async maybeGenerate(input: {
    gameStep: number;
    playerPortfolioTickers: string[];
    chance?: number;
  }): Promise<GeneratedOtcDeal | undefined> {
    if (Math.random() >= (input.chance ?? 0.3)) {
      return undefined;
    }

    const npc = pickRandom(NPCS.filter((n) => n.name !== 'Алекс'));
    const company = pickRandom(COMPANIES);
    const side: 'buy' | 'sell' = Math.random() > 0.5 ? 'sell' : 'buy';

    return {
      botName: npc.name,
      ticker: company.ticker,
      companyName: company.name,
      side,
      qty: 3 + Math.floor(Math.random() * 12),
      price: 80 + Math.floor(Math.random() * 900),
      turnsLeft: 1 + Math.floor(Math.random() * 3),
      flavorText: `${npc.name} предлагает OTC-сделку по ${company.ticker}.`,
    };
  }
}
