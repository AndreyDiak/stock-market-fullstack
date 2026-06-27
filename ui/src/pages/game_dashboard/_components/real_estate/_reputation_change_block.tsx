import { useEffect, useState } from 'react';
import { StarIcon } from '../../../../shared/icons';
import { SkillSegmentBar } from '../character/_skill_segment_bar';

const REPUTATION_ANIM_MS = 1400;

function useAnimatedReputation(from: number, to: number, active: boolean) {
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (!active) {
      setValue(from);
      return;
    }

    const start = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / REPUTATION_ANIM_MS);
      const eased = 1 - (1 - progress) ** 3;
      setValue(from + (to - from) * eased);
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [from, to, active]);

  return value;
}

export function ReputationChangeBlock({
  previousReputation,
  reputation,
  animate = false,
  positive = true,
  preview = false,
}: {
  previousReputation: number;
  reputation: number;
  animate?: boolean;
  positive?: boolean;
  preview?: boolean;
}) {
  const animated = useAnimatedReputation(previousReputation, reputation, animate);
  const displayValue = animate ? animated : reputation;
  const filled = Math.max(1, Math.min(10, Math.round(displayValue)));
  const delta = reputation - previousReputation;
  const deltaLabel = delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);

  return (
    <div className="w-full rounded-xl border border-white/5 bg-slate-900/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <StarIcon className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {preview ? 'Репутация после сделки' : 'Репутация'}
          </span>
        </div>
        <span
          className={`text-sm font-bold tabular-nums ${
            positive ? 'text-emerald-400' : 'text-rose-500'
          }`}
        >
          {deltaLabel}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-lg font-bold tabular-nums text-amber-300">{displayValue.toFixed(1)}</span>
        <SkillSegmentBar filled={filled} total={10} size="sm" className="flex-1 justify-between" />
      </div>
    </div>
  );
}
