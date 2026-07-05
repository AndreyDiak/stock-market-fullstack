export const SENTIMENT_MIN = -1;
export const SENTIMENT_MAX = 1;
export const SENTIMENT_DRIFT = 0.05;

export function clampSentiment(value: number): number {
  return Math.max(SENTIMENT_MIN, Math.min(SENTIMENT_MAX, value));
}

export function shiftSentiment(current: number, delta: number): number {
  return clampSentiment(current + delta);
}

export function driftSentiment(current: number): number {
  if (Math.abs(current) <= SENTIMENT_DRIFT) {
    return 0;
  }
  return clampSentiment(current - Math.sign(current) * SENTIMENT_DRIFT);
}

export type SentimentIndicator = 'bearish' | 'neutral' | 'bullish';

export function getSentimentIndicator(value: number): SentimentIndicator {
  if (value <= -0.35) return 'bearish';
  if (value >= 0.35) return 'bullish';
  return 'neutral';
}

export function processSentimentTurn(current: number): number {
  return driftSentiment(current);
}
