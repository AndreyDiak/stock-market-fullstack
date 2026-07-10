import { NPCS } from '@/assets/npcs.js';
import { REAL_ESTATE } from '@/assets/real_estate.js';
import { PROFESSION_DREAMS } from '@/assets/dreams.js';
import type { CharacterRosterItem } from '../../schemas/character_roster.schema.js';
import { buildCharacterDreamPreview } from './dream_preview.js';

export class CharactersService {
  listRoster(): CharacterRosterItem[] {
    return NPCS.map((npc) => {
      const dreamStages = PROFESSION_DREAMS[npc.profession];
      if (!dreamStages) {
        throw new Error(`No dream stages found for profession ${npc.profession}`);
      }

      return {
        profession: npc.profession,
        name: npc.name,
        salary: npc.salary,
        balance: npc.balance,
        items: npc.items.slice(0, 1).map((item) => {
          const template = REAL_ESTATE.find((r) => r.id === item.itemRef)!;
          return {
            itemRef: item.itemRef,
            name: template.name,
            basePrice: template.basePrice,
            monthlyPayment: template.monthlyPayment,
            installmentsTotal: template.installmentMonths,
            installmentsPaid: item.installmentsPaid,
          };
        }),
        dreams: npc.dreams.map((itemRef) => {
          const template = REAL_ESTATE.find((r) => r.id === itemRef)!;
          return {
            itemRef,
            name: template.name,
            description: template.description,
            basePrice: template.basePrice,
          };
        }),
        dreamStages,
        dreamPreview: buildCharacterDreamPreview(npc.profession, dreamStages),
      };
    });
  }
}
