/** Sync with backend/src/assets/realEstate.ts */
export interface RealEstateItem {
  id: string
  name: string
  description: string
  basePrice: number
  monthlyPayment: number
  installmentMonths: number
  isTradable: boolean
  special?: string
}

export const REAL_ESTATE_CATALOG: RealEstateItem[] = [
  {
    id: 'old_garage',
    name: 'Старый гараж',
    description: 'Ржавые ворота, протекающая крыша. Но зато СВОЙ и почти даром.',
    basePrice: 1500,
    monthlyPayment: 80,
    installmentMonths: 20,
    isTradable: true,
  },
  {
    id: 'garage',
    name: 'Гараж',
    description: 'Кирпичный гараж на окраине. Вмещает одну машину и гору хлама.',
    basePrice: 5000,
    monthlyPayment: 250,
    installmentMonths: 24,
    isTradable: true,
  },
  {
    id: 'parking_spot',
    name: 'Парковочное место',
    description: 'Место в подземном паркинге. Больше никаких штрафов за неправильную парковку.',
    basePrice: 8000,
    monthlyPayment: 300,
    installmentMonths: 30,
    isTradable: true,
  },
  {
    id: 'apartment',
    name: 'Квартира',
    description: 'Двухкомнатная квартира в спальном районе. Свои углы лучше, чем аренда.',
    basePrice: 80000,
    monthlyPayment: 1500,
    installmentMonths: 60,
    isTradable: true,
  },
  {
    id: 'country_house',
    name: 'Дача',
    description: 'Домик за городом с участком. Идеально для шашлыков и побега от цивилизации.',
    basePrice: 25000,
    monthlyPayment: 600,
    installmentMonths: 48,
    isTradable: true,
  },
  {
    id: 'penthouse',
    name: 'Пентхаус',
    description: 'Роскошный пентхаус в центре. Панорамные окна, терраса, вид на город.',
    basePrice: 500000,
    monthlyPayment: 8000,
    installmentMonths: 84,
    isTradable: true,
  },
  {
    id: 'warehouse',
    name: 'Склад',
    description: 'Промышленный склад на окраине. Можно сдавать или перестроить.',
    basePrice: 60000,
    monthlyPayment: 1000,
    installmentMonths: 72,
    isTradable: true,
    special: 'Приносит пассивный доход 400/ход',
  },
  {
    id: 'car',
    name: 'Автомобиль',
    description: 'Надёжный седан — свобода передвижения и статус на районе.',
    basePrice: 35000,
    monthlyPayment: 700,
    installmentMonths: 60,
    isTradable: true,
  },
  {
    id: 'sport_car',
    name: 'Спорткар',
    description: 'Мощный двигатель, кожаный салон. Мечта о скорости и престиже.',
    basePrice: 180000,
    monthlyPayment: 3500,
    installmentMonths: 72,
    isTradable: true,
  },
  {
    id: 'yacht',
    name: 'Яхта',
    description: 'Парусная яхта для круизов. Вершина финансового успеха.',
    basePrice: 800000,
    monthlyPayment: 12000,
    installmentMonths: 96,
    isTradable: true,
  },
  {
    id: 'tractor',
    name: 'Трактор',
    description: 'Новый трактор для поля. Расширяет возможности хозяйства.',
    basePrice: 45000,
    monthlyPayment: 900,
    installmentMonths: 60,
    isTradable: true,
  },
  {
    id: 'trip',
    name: 'Путешествие',
    description: 'Кругосветка мечты. Разовая покупка — воспоминания на всю жизнь.',
    basePrice: 25000,
    monthlyPayment: 0,
    installmentMonths: 1,
    isTradable: false,
  },
]
