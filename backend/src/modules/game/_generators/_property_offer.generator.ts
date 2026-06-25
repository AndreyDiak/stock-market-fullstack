import { NPCS } from '../../../assets/npcs.js';
import { REAL_ESTATE } from '../../../assets/real_estate.js';
import type { GeneratedPropertyOffer } from '../../news/types.js';

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export class PropertyOfferGenerator {
  async maybeGenerate(input: {
    gameStep: number;
    chance?: number;
  }): Promise<GeneratedPropertyOffer | undefined> {
    if (Math.random() >= (input.chance ?? 0.18)) {
      return undefined;
    }

    const npc = pickRandom(NPCS);
    const item = pickRandom(REAL_ESTATE.filter((r) => r.isTradable));
    const side: 'buy' | 'sell' = Math.random() > 0.45 ? 'sell' : 'buy';

    return {
      botName: npc.name,
      itemRef: item.id,
      itemName: item.name,
      side,
      price: Math.round(item.basePrice * (0.9 + Math.random() * 0.2)),
      turnsLeft: 1 + Math.floor(Math.random() * 2),
      flavorText: `${npc.name} ${side === 'sell' ? 'продаёт' : 'ищет покупателя для'} ${item.name}.`,
    };
  }
}
