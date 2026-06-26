import { MoneyValue } from '../../../../components/money/money_value'
import { GameButton } from '../../../../components/game_ui/game_button'
import { UpgradeIcon } from '../../../../shared/icons'
import type { CharacterSkill } from './_character_skills'
import { SkillBonusInfographic } from './_skill_bonus_infographic'
import { SkillLevelIndicator } from './_skill_level_indicator'

interface SkillCardProps {
  skill: CharacterSkill
  balance: number
  onRequestUpgrade: (skillId: string) => void
}

export function SkillCard({ skill, balance, onRequestUpgrade }: SkillCardProps) {
  const price = skill.upgradePrice
  const maxed = skill.level >= skill.maxLevel
  const canAfford = price != null && balance >= price

  return (
    <article className="min-w-0 overflow-visible rounded-2xl border border-white/5 bg-slate-800/50 p-4">
      <div className="relative z-10 flex min-w-0 items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900/80 ring-1 ring-slate-700/50">
          <UpgradeIcon upgradeId={skill.id} className="h-4 w-4 text-emerald-400" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-white">{skill.name}</h4>
            <span className="rounded-md bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-300">
              {skill.tag}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{skill.description}</p>
        </div>

        <SkillLevelIndicator skill={skill} className="shrink-0" />
      </div>

      <div className="relative z-0 mt-4 flex min-w-0 items-center justify-between gap-3 border-t border-slate-700/40 pt-3">
        <SkillBonusInfographic skill={skill} className="min-w-0 flex-1" />

        <div className="flex shrink-0 items-center gap-3">
          {maxed || price == null ? (
            <span className="text-xs font-semibold text-emerald-400">Макс.</span>
          ) : (
            <MoneyValue amount={price} size="sm" color="amber" />
          )}

          <GameButton
            size="sm"
            disabled={maxed || !skill.canUpgrade || !canAfford}
            onClick={() => onRequestUpgrade(skill.id)}
          >
            {maxed ? 'Куплено' : 'Улучшить'}
          </GameButton>
        </div>
      </div>
    </article>
  )
}
