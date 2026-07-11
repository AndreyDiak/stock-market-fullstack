import type { MarketSentiment } from '../../../../api/stocks';

const LABELS: Record<MarketSentiment['indicator'], string> = {
  bearish: 'Медвежий рынок',
  neutral: 'Нейтральный рынок',
  bullish: 'Бычий рынок',
};

const COLORS: Record<MarketSentiment['indicator'], string> = {
  bearish: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  neutral: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
  bullish: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
};

export function MarketSentimentBar({ sentiment }: { sentiment: MarketSentiment | null }) {
  if (!sentiment) return null;

  return (
    <div className={`mb-4 rounded-2xl border px-4 py-3 ${COLORS[sentiment.indicator]}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em]">{LABELS[sentiment.indicator]}</p>
        <span className="font-mono text-sm font-bold">{sentiment.value.toFixed(2)}</span>
      </div>
    </div>
  );
}
