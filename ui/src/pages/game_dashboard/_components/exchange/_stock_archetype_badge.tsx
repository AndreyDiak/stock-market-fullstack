import type { StockListing } from '../../../../api/stocks';

const COLORS: Record<NonNullable<StockListing['archetype']>, string> = {
  growth: 'border-violet-500/30 bg-violet-500/10 text-violet-200',
  dividend: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  speculative: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  defensive: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
};

export function StockArchetypeBadge({ listing }: { listing: StockListing }) {
  if (!listing.archetype || !listing.archetypeLabel) return null;

  return (
    <span
      className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${COLORS[listing.archetype]}`}
      title={`Архетип: ${listing.archetypeLabel}`}
    >
      {listing.archetypeLabel}
    </span>
  );
}
