import type { bot_deal, news_item, portfolio_row } from './types'

export const MOCK_PORTFOLIO: portfolio_row[] = [
  { ticker: 'ORCH', name: 'Orchard Systems', qty: 12, price: 842, changePct: 4.2 },
  { ticker: 'MAGE', name: 'Magellan Search', qty: 5, price: 1240, changePct: -1.3 },
  { ticker: 'NOVA', name: 'Nova Semiconductor', qty: 8, price: 318, changePct: 2.8 },
  { ticker: 'COIN', name: 'CoinReach Exchange', qty: 20, price: 96, changePct: 6.1 },
  { ticker: 'APEX', name: 'ApexPetro Energy', qty: 3, price: 2105, changePct: -0.4 },
]

export const MOCK_NEWS: news_item[] = [
  {
    id: 'insider-1',
    title: 'Инсайд: ORCH через 3 ход(ов)',
    excerpt:
      'Инсайд: через 3 ход(ов) акции Orchard Systems (ORCH) вырастут примерно на 9%. Источник близок к совету директоров.',
    timeLabel: 'только что',
    kind: 'INSIDER',
    hot: true,
    sentiment: 'positive',
  },
  {
    id: '2',
    title: 'Регулятор ужесточает OTC-сделки',
    excerpt: 'Новые лимиты для частных сделок.',
    timeLabel: '2 хода назад',
    sentiment: 'negative',
  },
  {
    id: '3',
    title: 'Ставки по ипотеке стабилизировались',
    excerpt: 'Спрос на жильё остаётся высоким.',
    timeLabel: '5 ходов назад',
    sentiment: 'positive',
  },
]

export const MOCK_OTC_DEALS: bot_deal[] = [
  {
    id: 'otc-1',
    botName: 'Алекс',
    profession: 'DEVELOPER',
    ticker: 'NOVA',
    companyName: 'Nova Semiconductor',
    side: 'sell',
    qty: 4,
    price: 305,
    turnsLeft: 2,
  },
  {
    id: 'otc-2',
    botName: 'Петрович',
    profession: 'FARMER',
    ticker: 'ORCH',
    companyName: 'Orchard Systems',
    side: 'buy',
    qty: 10,
    price: 850,
    turnsLeft: 1,
  },
  {
    id: 'otc-3',
    botName: 'Марк',
    profession: 'FINANCIER',
    ticker: 'COIN',
    companyName: 'CoinReach Exchange',
    side: 'sell',
    qty: 15,
    price: 92,
    turnsLeft: 3,
  },
]

export const MOCK_AVAILABLE_CASH = 12_400
