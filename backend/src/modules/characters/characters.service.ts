import { NPCS } from '@/assets/npcs.js';
import { REAL_ESTATE } from '@/assets/realEstate.js';
import type { CharacterRosterItem } from '../../schemas/character-roster.schema.js';

export class CharactersService {
  listRoster(): CharacterRosterItem[] {
    return NPCS.map((npc) => ({
      profession: npc.profession,
      name: npc.name,
      salary: npc.salary,
      balance: npc.balance,
      items: npc.items.map((item) => {
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
    }));
  }
}
