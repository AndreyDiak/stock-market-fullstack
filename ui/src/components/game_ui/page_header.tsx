interface PageHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  aside?: string
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  aside,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
      <div>
        {eyebrow && (
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-emerald-500/70">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-emerald-50 md:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
        )}
      </div>
      {aside && (
        <div className="hidden font-mono text-xs text-emerald-400/40 sm:block">
          {aside}
        </div>
      )}
    </div>
  )
}
