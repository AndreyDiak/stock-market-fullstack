import { ShieldInsiderIcon } from '../../../shared/icons'

export function InsiderNewsBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/45 bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.25)]">
      <ShieldInsiderIcon className="h-3 w-3 shrink-0 text-amber-300" />
      Инсайд
    </span>
  )
}
