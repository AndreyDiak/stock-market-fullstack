import { motion } from 'framer-motion'
import { useState } from 'react'
import type { CreateGameBody } from '../../../../api/types'
import { useGameStore } from '../../../../stores/game.store'
import { useDashboardTheme } from '../../_model/use_dashboard_theme'
import { PanelSectionHeading } from '../shared'
import {
  characterPanelVariants,
  characterSectionVariants,
  characterSkillCardVariants,
  characterSkillsContainerVariants,
} from '../../_model/character_panel_animation'
import type { DreamProgress } from './_character_profile_types'
import { ProfileInfoCard } from './_profile_info_card'
import { ProfileWorkCard } from './_profile_work_card'
import { SkillCard } from './_skill_card'
import { SkillUpgradeModal } from './_skill_upgrade_modal'

export type { DreamProgress } from './_character_profile_types'
export type {
  CharacterSkill,
  CharacterSkillsState,
  CharacterStats,
  SkillInfographicChip,
  SkillLevelTooltip,
  SkillUpgradePreview,
} from './_character_skills'
export { getSkillLevel, TRADING_GRADES } from './_character_skills'

export interface CharacterProfile {
  name: string
  profession: CreateGameBody['profession']
  professionLevel: number
  salary: number
  reputation: number
  tradingLevel: number
  dreams: DreamProgress[]
}

export function CharacterProfilePanel() {
  const theme = useDashboardTheme()
  const profile = useGameStore((state) => state.characterProfile)
  const skills = useGameStore((state) => state.characterSkills)
  const stats = useGameStore((state) => state.characterStats)
  const balance = useGameStore((state) => state.balance)
  const purchaseSkill = useGameStore((state) => state.purchaseSkill)
  const [pendingSkillId, setPendingSkillId] = useState<string | null>(null)

  const pendingSkill = pendingSkillId
    ? skills.find((skill) => skill.id === pendingSkillId) ?? null
    : null
  const upgradePreview = pendingSkill?.upgradePreview ?? null

  return (
    <motion.div
      className="flex h-full min-h-0 flex-col"
      variants={characterPanelVariants}
      initial="hidden"
      animate="show"
    >
      <motion.header
        className="mb-4 px-1"
        variants={characterSectionVariants}
        initial="hidden"
        animate="show"
      >
        <PanelSectionHeading
          title="Персонаж"
          subtitle="Развивайте навыки и следите за карьерой"
        />
      </motion.header>

      <div
        className={`min-h-0 flex-1 space-y-5 overflow-x-hidden overflow-y-auto px-1 pb-2 pr-0.5 ${theme.scrollArea}`}
      >
        <motion.div
          className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]"
          variants={characterPanelVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={characterSectionVariants}>
            <ProfileInfoCard profile={profile} stats={stats} />
          </motion.div>
          <motion.div variants={characterSectionVariants}>
            <ProfileWorkCard baseSalary={profile.salary} stats={stats} />
          </motion.div>
        </motion.div>

        <motion.section variants={characterSectionVariants} initial="hidden" animate="show">
          <div className="mb-3">
            <PanelSectionHeading
              title="Навыки"
              subtitle="Прокачивайте персонажа и становитесь сильнее"
              size="sm"
            />
          </div>

          <motion.div
            className="space-y-3"
            variants={characterSkillsContainerVariants}
            initial="hidden"
            animate="show"
          >
            {skills.map((skill) => (
              <motion.div key={skill.id} variants={characterSkillCardVariants}>
                <SkillCard
                  skill={skill}
                  balance={balance}
                  onRequestUpgrade={setPendingSkillId}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      </div>

      <SkillUpgradeModal
        open={pendingSkillId != null}
        preview={upgradePreview}
        skillId={pendingSkillId}
        segmentDisplay={pendingSkill?.segmentDisplay ?? null}
        balance={balance}
        onCancel={() => setPendingSkillId(null)}
        onConfirm={() => {
          if (pendingSkillId) {
            void purchaseSkill(pendingSkillId)
            setPendingSkillId(null)
          }
        }}
      />
    </motion.div>
  )
}
