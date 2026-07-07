import type { CharacterProfile } from ".";
import type { CreateGameBody } from "../../../../api/types";
import { getProfessionAvatar } from "../../../../constants/professionImages";
import { PROFESSION_INSIDER_SECTOR, PROFESSION_LABELS } from "../../../../constants/professions";
import { formatSectorLabel } from "../exchange/_stock_grade_config";
import { formatReputation } from "../../_model/utils";
import { DashboardCard } from "../shared";
import type { CharacterStats } from "./_character_skills";

interface ProfileInfoCardProps {
  profile: CharacterProfile;
  stats: CharacterStats;
  className?: string;
}

function CharacterStatColumn({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: string;
  tooltip: string;
}) {
  return (
    <div
      tabIndex={0}
      className="character-stat group/stat relative min-w-0 flex-1 cursor-help px-2 py-1 text-center outline-none first:pl-0 last:pr-0"
      aria-label={`${label}: ${value}. ${tooltip}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted,#64748b)]">
        {label}
      </p>
      <p className="mt-1 text-base font-bold tabular-nums text-white">
        {value}
      </p>
      <div
        role="tooltip"
        className="pointer-events-none absolute top-[calc(100%+6px)] left-1/2 z-30 w-[min(13rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-slate-600/55 bg-slate-950/95 px-2.5 py-2 text-left text-xs leading-snug text-slate-300 opacity-0 shadow-lg transition-opacity group-hover/stat:opacity-100 group-focus-visible/stat:opacity-100"
      >
        {tooltip}
      </div>
    </div>
  );
}

export function ProfileInfoCard({
  profile,
  stats,
  className = "",
}: ProfileInfoCardProps) {
  const professionLabel = PROFESSION_LABELS[profile.profession];
  const insiderSector = PROFESSION_INSIDER_SECTOR[profile.profession];
  const insiderSectorLabel = insiderSector ? formatSectorLabel(insiderSector) : null;

  const statColumns = [
    {
      label: "Репутация",
      value: formatReputation(profile.reputation),
      tooltip:
        "Доверие рынка к вам. Чем выше репутация, тем лучше условия сделок.",
    },
    {
      label: "Трейдинг",
      value: stats.tradingGrade,
      tooltip:
        "Грейд торгового навыка. Открывает доступ к более дорогим акциям.",
    },
    {
      label: "Инсайд",
      value: `${stats.insiderChancePercent}%`,
      tooltip: insiderSectorLabel
        ? `Вероятность получить инсайдерскую новость по сектору «${insiderSectorLabel}».`
        : "Ваша профессия не даёт доступа к инсайдерским новостям.",
    },
  ];

  return (
    <DashboardCard className={className}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-amber-300/70 via-emerald-400/60 to-cyan-500/60 opacity-90" />
          <div className="relative h-full w-full overflow-hidden rounded-full ring-2 ring-slate-900/80">
            <img
              src={getProfessionAvatar(
                profile.profession as CreateGameBody["profession"],
              )}
              alt={professionLabel}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold text-white">{profile.name}</h3>
          <p className="mt-0.5 text-xs font-medium text-[var(--text-secondary,#94a3b8)]">
            {professionLabel}
          </p>
        </div>
      </div>

      <div className="character-summary__stats mt-4 flex divide-x divide-[var(--border-subtle)] rounded-xl bg-[var(--surface-inset)] px-1 py-2">
        {statColumns.map((stat) => (
          <CharacterStatColumn key={stat.label} {...stat} />
        ))}
      </div>
    </DashboardCard>
  );
}
