import type { profit_grade } from '../../_model/types';
import { getProfitGradeTooltip, PROFIT_GRADE_STYLES } from './_offer_styles';

export function ProfitGradeBadge({
  grade,
  embedded = false,
}: {
  grade: profit_grade;
  embedded?: boolean;
}) {
  const style = PROFIT_GRADE_STYLES[grade];
  const tooltip = getProfitGradeTooltip(grade);

  return (
    <div
      tabIndex={0}
      className={[
        'group/grade cursor-help outline-none',
        embedded
          ? 'asset-market-card__grade relative shrink-0'
          : 'absolute right-2.5 top-2.5 z-20',
      ].join(' ')}
      aria-label={[tooltip.title, ...tooltip.lines].join('. ')}
    >
      <span
        className={[
          'flex items-center justify-center border-2 font-black shadow-lg',
          embedded
            ? 'h-7 min-w-[1.75rem] rounded-lg px-1.5 text-xs'
            : 'h-11 w-11 rounded-xl text-xl',
          style.badge,
          'bg-gradient-to-b from-white/10 to-black/20',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_4px_rgba(0,0,0,0.35)]',
        ].join(' ')}
      >
        {style.label}
      </span>

      <div
        role="tooltip"
        className={[
          'pointer-events-none absolute w-max max-w-[min(14rem,calc(100vw-2rem))] rounded-lg border border-slate-600/55 bg-slate-950/95 px-2.5 py-2 text-left text-[10px] leading-snug text-slate-300 opacity-0 shadow-[0_10px_24px_rgba(0,0,0,0.45)] transition-opacity duration-150 group-hover/grade:opacity-100 group-focus-visible/grade:opacity-100',
          embedded
            ? 'asset-market-card__grade-tooltip'
            : 'top-[calc(100%+6px)] right-0 z-[100]',
        ].join(' ')}
      >
        <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-400/90">
          {tooltip.title}
        </p>
        {tooltip.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}
