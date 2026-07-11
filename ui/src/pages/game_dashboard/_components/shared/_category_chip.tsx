export function CategoryChip({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-[var(--border-subtle,rgba(255,255,255,0.06))] bg-[var(--surface-inset,rgba(2,6,23,0.55))] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary,#94a3b8)]">
      {children}
    </span>
  )
}
