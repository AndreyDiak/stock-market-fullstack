import type { MarketSector } from '@prisma/client';
import { NEWS_TEMPLATES, type StaticNewsKind, type StaticNewsTemplate } from '../../assets/news.js';

function hashSeed(gameId: string, step: number, salt: string): number {
  const input = `${gameId}:${step}:${salt}`;
  let hash = 2166136261;

  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRng(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function fillNewsTemplate(
  template: string,
  company: { name: string; ticker: string },
): string {
  return template.replaceAll('{company}', company.name).replaceAll('{ticker}', company.ticker);
}

export function pickStaticNews(
  kind: StaticNewsKind,
  sector: MarketSector,
  gameId: string,
  gameStep: number,
  salt: string,
): StaticNewsTemplate {
  const pool = NEWS_TEMPLATES.filter((item) => item.kind === kind && item.sector === sector);
  if (pool.length === 0) {
    throw new Error(`No static news for kind=${kind} sector=${sector}`);
  }

  const rng = createRng(hashSeed(gameId, gameStep, salt));
  return pool[Math.floor(rng() * pool.length)]!;
}

export function pickInsiderTurnsUntilImpact(gameId: string, gameStep: number, salt: string) {
  const rng = createRng(hashSeed(gameId, gameStep, salt));
  return 2 + Math.floor(rng() * 4);
}
