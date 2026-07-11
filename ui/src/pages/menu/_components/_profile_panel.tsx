interface ProfilePanelProps {
  loading: boolean
  displayName?: string
  email?: string
  avatarUrl?: string
}

export function ProfilePanel({ loading, displayName, email, avatarUrl }: ProfilePanelProps) {
  return (
    <section className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#0a1218]/90 via-[#081510]/95 to-[#060d0a] p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,rgba(77,196,141,0.14),transparent_50%)]" />
      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-emerald-500/75">
            Профиль
          </span>
          {!loading && displayName && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              Online
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-slate-700/60" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-slate-700/60" />
              <div className="h-3 w-44 animate-pulse rounded bg-slate-800/80" />
            </div>
          </div>
        ) : displayName ? (
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-emerald-400/40 shadow-[0_0_20px_rgba(52,211,153,0.25)]"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-gradient-to-br from-slate-600 to-slate-800 text-lg font-black text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.2)]">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold tracking-wide text-emerald-50">{displayName}</p>
              {email && (
                <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">{email}</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-slate-400">Не удалось загрузить профиль</p>
        )}
      </div>
    </section>
  )
}
