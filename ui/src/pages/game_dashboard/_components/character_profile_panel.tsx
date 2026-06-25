import { useState } from 'react'
import type { CreateGameBody } from '../../../api/types'
import type { DreamProgress } from './character_profile_types'
import type { CharacterSkill } from './character_skills'
import { buildSkillUpgradePreview, calcWorkLevel, getSkillLevel } from './character_skills'
import { ProfileInfoCard } from './profile_info_card'
import { ProfileWorkCard } from './profile_work_card'
import { SkillCard } from './skill_card'
import { SkillUpgradeModal } from './skill_upgrade_modal'

export type { DreamProgress } from './character_profile_types'
export type { CharacterSkill, CharacterUpgrade } from './character_skills'
export {
  CHARACTER_SKILLS,
  CHARACTER_UPGRADES,
  calcSkillPrice,
  calcUpgradePrice,
  calcEffectiveSalary,
  calcInsiderChance,
  calcBankBaseRate,
  calcWorkLevel,
  getTradingGrade,
  getSkillLevel,
  getSkillSegmentDisplay,
  buildSkillUpgradePreview,
} from './character_skills'

export interface CharacterProfile {
  name: string
  profession: CreateGameBody['profession']
  professionLevel: number
  salary: number
  reputation: number
  tradingLevel: number
  dreams: DreamProgress[]
}

interface CharacterProfilePanelProps {
  profile: CharacterProfile
  skills: CharacterSkill[]
  balance: number
  onPurchaseSkill: (skillId: string) => void
}

const SECONDARY_TEXT = 'text-slate-400'

export function CharacterProfilePanel({
  profile,
  skills,
  balance,
  onPurchaseSkill,
}: CharacterProfilePanelProps) {
  const qualificationLevel = getSkillLevel(skills, 'qualification')
  const tradingSkillLevel = getSkillLevel(skills, 'trading')
  const [pendingSkillId, setPendingSkillId] = useState<string | null>(null)

  const pendingSkill = pendingSkillId
    ? skills.find((skill) => skill.id === pendingSkillId) ?? null
    : null
  const upgradePreview = pendingSkill
    ? buildSkillUpgradePreview(pendingSkill, { baseSalary: profile.salary })
    : null

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#0b1525] p-1">
      <header className="mb-5 px-3 pt-2">
        <h2 className="text-xl font-bold tracking-wide text-white">Прогресс персонажа</h2>
        <p className={`mt-1 text-sm ${SECONDARY_TEXT}`}>
          Развивайте навыки и следите за карьерой
        </p>
      </header>

      <div className="min-h-0 flex-1 space-y-6 overflow-auto px-3 pb-3 pr-1">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
          <ProfileInfoCard
            profile={profile}
            qualificationLevel={qualificationLevel}
            tradingSkillLevel={tradingSkillLevel}
          />
          <ProfileWorkCard
            baseSalary={profile.salary}
            qualificationLevel={qualificationLevel}
          />
        </div>

        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Навыки</h3>
              <p className={`mt-0.5 text-xs ${SECONDARY_TEXT}`}>
                Покупайте развитие за баланс
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {skills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                balance={balance}
                onRequestUpgrade={setPendingSkillId}
              />
            ))}
          </div>
        </section>
      </div>

      <SkillUpgradeModal
        open={pendingSkillId != null}
        preview={upgradePreview}
        skillId={pendingSkillId}
        balance={balance}
        onCancel={() => setPendingSkillId(null)}
        onConfirm={() => {
          if (pendingSkillId) {
            onPurchaseSkill(pendingSkillId)
            setPendingSkillId(null)
          }
        }}
      />
    </div>
  )
}

/** @deprecated use calcInsiderChance from character_skills */
export function calcInsiderNewsChance(qualificationLevel: number) {
  return Math.min(30, calcWorkLevel(qualificationLevel) * 2)
}
