import { GameModal } from '../../../components/game_ui/floating'
import { GameButton } from '../../../components/game_ui/game_button'
import { MoneyValue } from '../../../components/money/money_value'
import { UpgradeIcon } from '../../../shared/icons'
import type { SkillUpgradePreview } from './character_skills'
import { getSkillSegmentDisplay } from './character_skills'
import { SkillSegmentBar } from './skill_segment_bar'
import { SkillUpgradeBenefitLine } from './skill_upgrade_benefit_line'

interface SkillUpgradeModalProps {
  open: boolean
  preview: SkillUpgradePreview | null
  skillId: string | null
  balance: number
  onCancel: () => void
  onConfirm: () => void
}

export function SkillUpgradeModal({
  open,
  preview,
  skillId,
  balance,
  onCancel,
  onConfirm,
}: SkillUpgradeModalProps) {
  if (!preview || !skillId) return null

  const canAfford = balance >= preview.price
  const segments = getSkillSegmentDisplay(skillId, preview.currentLevel, preview.maxLevel)

  return (
    <GameModal
      open={open}
      onClose={onCancel}
      labelledBy="skill-upgrade-title"
      describedBy="skill-upgrade-desc"
      overlayClassName="bg-black/65 backdrop-blur-sm"
      panelClassName="pointer-events-auto relative w-full max-w-md rounded-[28px] border border-slate-600/50 bg-[#0f1a2e] p-6 text-white shadow-2xl shadow-black/60 outline-none"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900/80 ring-1 ring-slate-700/50">
          <UpgradeIcon upgradeId={skillId} className="h-5 w-5 text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/80">
            {preview.tag}
          </p>
          <h2 id="skill-upgrade-title" className="mt-0.5 text-xl font-bold text-white">
            {preview.skillName}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Уровень{' '}
            <span className="tabular-nums text-slate-300">{preview.currentLevel}</span>
            <span className="text-slate-500"> → </span>
            <span className="font-semibold tabular-nums text-emerald-400">{preview.nextLevel}</span>
            <span className="text-slate-500"> из </span>
            <span className="tabular-nums text-amber-400/90">{preview.maxLevel}</span>
          </p>
        </div>
      </div>

      <div className="mt-4">
        <SkillSegmentBar
          filled={segments.filled}
          total={segments.total}
          className="justify-center"
        />
      </div>

      <div id="skill-upgrade-desc" className="mt-5 rounded-2xl border border-white/5 bg-slate-800/40 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Что даст улучшение
        </p>
        <ul className="mt-3 space-y-2">
          {preview.benefits.map((benefit) => (
            <li key={benefit.id} className="flex gap-2 text-sm leading-relaxed">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
              <SkillUpgradeBenefitLine benefit={benefit} />
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <span className="text-sm text-slate-400">Стоимость</span>
        <MoneyValue amount={preview.price} size="md" color="amber" />
      </div>

      {!canAfford && (
        <p className="mt-2 text-center text-xs text-red-400">Недостаточно средств на балансе</p>
      )}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <GameButton variant="ghost" onClick={onCancel}>
          Отмена
        </GameButton>
        <GameButton disabled={!canAfford} onClick={onConfirm}>
          Улучшить
        </GameButton>
      </div>
    </GameModal>
  )
}
