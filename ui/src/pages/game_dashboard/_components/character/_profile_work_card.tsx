import { MoneyValue } from "../../../../components/money/money_value";
import { BriefcaseIcon } from "../../../../shared/icons";
import { DashboardCard, DashboardCardHeader, StatusBadge } from "../shared";
import type { CharacterStats } from "./_character_skills";

interface ProfileWorkCardProps {
  baseSalary: number;
  stats: CharacterStats;
  className?: string;
}

export function ProfileWorkCard({
  baseSalary,
  stats,
  className = "",
}: ProfileWorkCardProps) {
  const hasBonus = stats.qualificationBonusPercent > 0;

  return (
    <DashboardCard className={className}>
      <DashboardCardHeader
        title="Работа"
        icon={<BriefcaseIcon className="h-4 w-4 shrink-0 text-emerald-400" />}
        action={<StatusBadge>Уровень {stats.workLevel}</StatusBadge>}
      />

      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted,#64748b)]">
            Зарплата
          </p>
          <MoneyValue
            amount={stats.effectiveSalary}
            size="xl"
            suffix="/мес"
            className="mt-1"
          />
        </div>

        {hasBonus ? (
          <p className="text-xs text-[var(--text-secondary,#94a3b8)]">
            Базовая{" "}
            <MoneyValue
              amount={baseSalary}
              size="xs"
              color="muted"
              className="inline-flex"
            />
            <span className="text-emerald-400">
              {" "}
              +{stats.qualificationBonusPercent}% от квалификации
            </span>
          </p>
        ) : null}

        <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary,#94a3b8)]">
          Начисляется каждые 5 ходов. Прокачивайте квалификацию, чтобы увеличить
          доход. Шанс инсайда: {stats.insiderChancePercent}% за ход.
        </p>
      </div>
    </DashboardCard>
  );
}
