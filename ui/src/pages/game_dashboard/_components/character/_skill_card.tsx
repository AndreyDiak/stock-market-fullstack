import { MoneyValue } from '../../../../components/money/money_value'
import { GameButton } from '../../../../components/game_ui/game_button'
import { gameAudio } from '../../../../lib/audio/game_audio'
import { UpgradeIcon } from '../../../../shared/icons'
import type { CharacterSkill } from './_character_skills'
import { getSkillEffectChips } from './_character_skills'
import {
  CategoryChip,
  DashboardCard,
  EffectChip,
  SkillProgressControl,
} from '../shared'
import type { SkillInfographicChip } from './_character_skills'

interface SkillCardProps {
  skill: CharacterSkill
  balance: number
  onRequestUpgrade: (skillId: string) => void
}

function mapEffectChip(chip: SkillInfographicChip) {
  return (
    <EffectChip
      key={chip.id}
      label={chip.label}
      value={chip.value}
      moneyAmount={chip.moneyAmount}
      tone={chip.tone}
    />
  )
}

export function SkillCard({ skill, balance, onRequestUpgrade }: SkillCardProps) {
  const price = skill.upgradePrice
  const maxed = skill.level >= skill.maxLevel
  const canAfford = price != null && balance >= price
  const disabledReason =
    maxed || price == null
      ? undefined
      : !skill.canUpgrade
        ? 'Улучшение недоступно'
        : !canAfford
          ? 'Недостаточно средств'
          : undefined

  return (
    <DashboardCard as="article" className="overflow-visible p-4">
      <div className="skill-card__top flex min-w-0 items-start justify-between gap-3">
        <div className="skill-card__identity min-w-0 flex flex-1 items-start gap-3">
          <div className="skill-card__icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-inset)] ring-1 ring-[var(--border-subtle)]">
            <UpgradeIcon upgradeId={skill.id} className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="skill-card__heading min-w-0">
            <div className="skill-card__title-row flex flex-wrap items-center gap-2">
              <h4 className="skill-card__title text-sm font-bold text-white">{skill.name}</h4>
              <CategoryChip>{skill.tag}</CategoryChip>
            </div>
            <p className="skill-card__description mt-1 text-xs leading-relaxed text-[var(--text-secondary,#94a3b8)]">
              {skill.description}
            </p>
          </div>
        </div>
        <div className="skill-card__progress shrink-0">
          <SkillProgressControl skill={skill} />
        </div>
      </div>

      <div className="skill-card__bottom mt-4 flex min-w-0 flex-col gap-3 border-t border-[var(--border-subtle)] pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="skill-card__effects flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {getSkillEffectChips(skill).map((chip) => mapEffectChip(chip))}
        </div>

        <div className="skill-card__action flex shrink-0 items-center justify-end gap-2.5">
          {maxed || price == null ? (
            <span className="text-xs font-semibold text-emerald-400">Макс.</span>
          ) : (
            <MoneyValue amount={price} size="sm" color="amber" />
          )}

          <GameButton
            variant="emerald"
            size="sm"
            disabled={maxed || !skill.canUpgrade || !canAfford}
            title={disabledReason}
            onClick={() => {
              gameAudio.playSfx('buttonClick')
              onRequestUpgrade(skill.id)
            }}
            className="shadow-[0_3px_0_#047857,inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_3px_0_#047857,0_0_14px_rgba(16,185,129,0.3),inset_0_1px_0_rgba(255,255,255,0.25)] disabled:shadow-[0_3px_0_#0f172a] disabled:hover:shadow-[0_3px_0_#0f172a]"
          >
            {maxed ? 'Куплено' : 'Улучшить'}
          </GameButton>
        </div>
      </div>
    </DashboardCard>
  )
}
