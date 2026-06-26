import type { CreateGameBody } from '../../../../api/types'
import { getProfessionAvatar } from '../../../../constants/professionImages'
import { PROFESSION_LABELS } from '../../../../constants/professions'
import type { CharacterProfile } from '.'
import type { CharacterStats } from './_character_skills'

interface ProfileInfoCardProps {
  profile: CharacterProfile
  stats: CharacterStats
  className?: string
}

interface ProfileStat {
  label: string
  value: string
  tooltip: string
}

function ProfileStatTile({ label, value, tooltip }: ProfileStat) {
  return (
    <div
      tabIndex={0}
      className="group/stat relative min-w-0 cursor-help rounded-xl border border-slate-700/50 bg-slate-900/60 px-2 py-2.5 text-center outline-none transition-colors hover:border-slate-600/70 focus-visible:border-emerald-400/35 focus-visible:ring-1 focus-visible:ring-emerald-400/25 sm:px-2.5"
      aria-label={`${label}: ${value}. ${tooltip}`}
    >
      <p className="whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 sm:text-[10px] sm:tracking-wider">
        {label}
      </p>
      <p className="mt-1 text-base font-bold tabular-nums text-white sm:text-lg">{value}</p>

      <div
        role="tooltip"
        className="pointer-events-none absolute top-[calc(100%+8px)] left-1/2 z-30 w-[min(13.5rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-slate-600/55 bg-slate-950/95 px-3 py-2 text-left text-[11px] leading-snug text-slate-300 opacity-0 shadow-[0_12px_28px_rgba(0,0,0,0.45)] transition-opacity duration-150 group-hover/stat:opacity-100 group-focus-visible/stat:opacity-100"
      >
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-400/90">
          {label}
        </p>
        {tooltip}
      </div>
    </div>
  )
}

export function ProfileInfoCard({ profile, stats, className = '' }: ProfileInfoCardProps) {
  const professionLabel = PROFESSION_LABELS[profile.profession]

  const statTiles: ProfileStat[] = [
    {
      label: 'Репутация',
      value: String(profile.reputation),
      tooltip:
        'Доверие рынка к вам. Чем выше репутация, тем лучше условия сделок и отношение контрагентов.',
    },
    {
      label: 'Трейдинг',
      value: stats.tradingGrade,
      tooltip:
        'Грейд торгового навыка от F до A. Повышается курсом трейдинга и открывает доступ к более дорогим акциям.',
    },
    {
      label: 'Шанс инсайда',
      value: `${stats.insiderChancePercent}%`,
      tooltip:
        'Вероятность получить инсайдерскую новость. +2% за каждый уровень карьеры, максимум 30%.',
    },
  ]

  return (
    <section
      className={`flex h-full flex-col rounded-2xl border border-white/10 bg-slate-800/40 p-5 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative shrink-0">
          <div
            className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-amber-400/70 via-emerald-400/50 to-cyan-500/60 blur-[2px]"
            aria-hidden
          />
          <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-amber-300 via-emerald-400 to-sky-500 opacity-90" />
          <div className="relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-slate-900/80 ring-offset-2 ring-offset-[#0b1525]">
            <img
              src={getProfessionAvatar(profile.profession as CreateGameBody['profession'])}
              alt={professionLabel}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-2xl font-bold text-white">{profile.name}</h3>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {professionLabel}
          </p>
          <span className="mt-2 inline-flex rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
            Карьера Lv.{stats.workLevel}
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-2.5">
        {statTiles.map((stat) => (
          <ProfileStatTile key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  )
}
