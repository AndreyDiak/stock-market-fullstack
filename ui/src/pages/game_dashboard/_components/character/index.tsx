import { motion } from 'framer-motion'
import { useState } from 'react'
import type { CreateGameBody } from '../../../../api/types'
import { useGameStore } from '../../../../stores/game.store'
import { useDashboardTheme } from '../../_model/use_dashboard_theme'
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

const SECONDARY_TEXT = 'text-slate-400'

function PanelSectionHeading({
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
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      variants={characterPanelVariants}
      initial="hidden"
      animate="show"
    >
      <motion.header
        className="mb-5 px-3 pt-2"
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
        className={`min-h-0 flex-1 space-y-6 overflow-x-hidden overflow-y-auto px-1 pb-1 pr-0.5 ${theme.scrollArea}`}
      >
        <motion.div
          className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:items-stretch"
          variants={characterPanelVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div className="h-full" variants={characterSectionVariants}>
            <ProfileInfoCard profile={profile} stats={stats} className="h-full" />
          </motion.div>
          <motion.div className="h-full" variants={characterSectionVariants}>
            <ProfileWorkCard baseSalary={profile.salary} stats={stats} className="h-full" />
          </motion.div>
        </motion.div>

        <motion.section
          className="mt-6"
          variants={characterSectionVariants}
          initial="hidden"
          animate="show"
        >
          <div className="mb-4">
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
