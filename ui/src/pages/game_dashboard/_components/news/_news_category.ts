import type { ComponentType } from 'react';
import type { GeneratedNewsItem } from '../../../../api/gameTurn';
import type { IconProps } from '../../../../shared/icons';
import {
  OtcDealsIcon,
  RealEstateIcon,
  TradingChartIcon,
} from '../../../../shared/icons';
import type { news_item } from '../../_model/types';

export type NewsCategory = 'stock' | 'deal' | 'realty';

const NEWS_CYCLE_ORDER: NewsCategory[] = ['stock', 'deal', 'realty'];

export const NEWS_CATEGORY_CONFIG: Record<
  NewsCategory,
  {
    label: string;
    chipClass: string;
    accentClass: string;
    railClass: string;
    glowClass: string;
    latestBorderClass: string;
    Icon: ComponentType<IconProps>;
  }
> = {
  stock: {
    label: 'Акции',
    chipClass:
      'border-sky-500/35 bg-sky-500/12 text-sky-200 shadow-[0_0_10px_rgba(56,189,248,0.12)]',
    accentClass: 'bg-sky-400',
    railClass: 'from-sky-400/70 via-sky-400/25 to-transparent',
    glowClass: 'shadow-[0_0_18px_rgba(56,189,248,0.14)]',
    latestBorderClass: 'border-sky-400/35',
    Icon: TradingChartIcon,
  },
  deal: {
    label: 'Сделки',
    chipClass:
      'border-violet-500/35 bg-violet-500/12 text-violet-200 shadow-[0_0_10px_rgba(139,92,246,0.12)]',
    accentClass: 'bg-violet-400',
    railClass: 'from-violet-400/70 via-violet-400/25 to-transparent',
    glowClass: 'shadow-[0_0_18px_rgba(139,92,246,0.14)]',
    latestBorderClass: 'border-violet-400/35',
    Icon: OtcDealsIcon,
  },
  realty: {
    label: 'Недвижимость',
    chipClass:
      'border-emerald-500/35 bg-emerald-500/12 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.12)]',
    accentClass: 'bg-emerald-400',
    railClass: 'from-emerald-400/70 via-emerald-400/25 to-transparent',
    glowClass: 'shadow-[0_0_18px_rgba(16,185,129,0.14)]',
    latestBorderClass: 'border-emerald-400/35',
    Icon: RealEstateIcon,
  },
};

export function getNewsCategory(kind?: GeneratedNewsItem['kind']): NewsCategory {
  switch (kind) {
    case 'OTC_DEAL':
      return 'deal';
    case 'PROPERTY_OFFER':
    case 'PROPERTY_DEAL':
    case 'PROPERTY_INSTALLMENT':
      return 'realty';
    case 'STOCK_TRADE':
    case 'STOCK_DIVIDEND':
      return 'stock';
    case 'WELCOME':
    case 'MARKET':
    case 'INSIDER':
    case 'RUMOR':
    default:
      return 'stock';
  }
}

export function getNewsCategoryForItem(item: news_item): NewsCategory {
  return getNewsCategory(item.kind);
}

export function getNextNewsCategory(category: NewsCategory): NewsCategory {
  const index = NEWS_CYCLE_ORDER.indexOf(category);
  return NEWS_CYCLE_ORDER[(index + 1) % NEWS_CYCLE_ORDER.length]!;
}

export function resolveNewsCycleState(news: news_item[]) {
  const sorted = [...news].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
  const latest = sorted.find((item) => item.kind !== 'WELCOME') ?? sorted[0] ?? null;
  const lastType = latest ? getNewsCategoryForItem(latest) : null;
  const nextType = lastType ? getNextNewsCategory(lastType) : NEWS_CYCLE_ORDER[0]!;

  return { lastType, nextType, cycleOrder: NEWS_CYCLE_ORDER };
}
