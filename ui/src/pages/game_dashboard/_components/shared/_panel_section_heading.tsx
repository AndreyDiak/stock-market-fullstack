const SECONDARY_TEXT = 'text-slate-400'

export function PanelSectionHeading({
  title,
  subtitle,
  size = 'lg',
}: {
  title: string
  subtitle?: string
  size?: 'lg' | 'sm'
}) {
  const titleClass =
    size === 'lg'
      ? 'text-xl font-bold tracking-wide text-white'
      : 'text-sm font-bold uppercase tracking-wider text-white'

  const TitleTag = size === 'lg' ? 'h2' : 'h3'

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <div
        className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-600/70 to-slate-600/30"
        aria-hidden
      />
      <div className="max-w-md shrink-0 px-1 text-center">
        <TitleTag className={titleClass}>{title}</TitleTag>
        {subtitle ? (
          <p className={`mt-1 text-xs sm:text-sm ${SECONDARY_TEXT}`}>{subtitle}</p>
        ) : null}
      </div>
      <div
        className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-600/70 to-slate-600/30"
        aria-hidden
      />
    </div>
  )
}
