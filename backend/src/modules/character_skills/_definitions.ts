export interface SkillDefinition {
  id: string;
  name: string;
  tag: string;
  description: string;
  effectLabel: string;
  basePrice: number;
  maxLevel: number;
  defaultLevel: number;
}

export const SKILL_DEFINITIONS: SkillDefinition[] = [
  {
    id: 'qualification',
    name: 'Повышение квалификации',
    tag: 'Работа',
    description:
      'Курсы и аттестация по специальности. Растёт доход и внимание рынка к вашим контактам.',
    effectLabel: '+10% к зарплате и +2% к шансу инсайда за уровень',
    basePrice: 3500,
    maxLevel: 10,
    defaultLevel: 1,
  },
  {
    id: 'banking',
    name: 'Курсы банковского дела',
    tag: 'Банк',
    description: 'Разбираетесь в кредитных продуктах, переговорах с банком и сделках на рынке недвижимости.',
    effectLabel: '−2% к ставке по кредитам и доступ к сделкам F→A на рынке имущества',
    basePrice: 4200,
    maxLevel: 6,
    defaultLevel: 1,
  },
  {
    id: 'trading',
    name: 'Курс трейдинга',
    tag: 'Трейдинг',
    description: 'Практика на симуляторе и разбор сделок с наставником.',
    effectLabel: 'Грейды F → A: доступ к акциям и до 50% скидки при торге по имуществу',
    basePrice: 5000,
    maxLevel: 6,
    defaultLevel: 1,
  },
  {
    id: 'property_slots',
    name: 'Слоты имущества',
    tag: 'Слоты',
    description: 'Оформление и учёт дополнительных объектов в инвентаре.',
    effectLabel: 'Разблокирует следующий слот имущества (макс. 4 активных)',
    basePrice: 15_000,
    maxLevel: 4,
    defaultLevel: 1,
  },
];

export const TRADING_GRADES = ['F', 'E', 'D', 'C', 'B', 'A'] as const;

export type SkillId = (typeof SKILL_DEFINITIONS)[number]['id'];

export function getSkillDefinition(skillId: string) {
  return SKILL_DEFINITIONS.find((skill) => skill.id === skillId);
}
