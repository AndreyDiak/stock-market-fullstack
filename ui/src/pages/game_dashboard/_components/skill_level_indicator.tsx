import { LockIcon } from '../../../shared/icons'
import type { CharacterSkill } from './character_skills'
import { getSkillLevelTooltip, TRADING_GRADES } from './character_skills'
import { getTooltipAlignForIndex, SkillLevelTooltipWrap } from './skill_level_tooltip'

const cellBase =
  'flex h-8 w-8 items-center justify-center rounded-md border text-xs font-bold transition-colors'

const qualificationSegmentBase = 'h-1.5 w-4 shrink-0 rounded-sm'

function GradeLevelCells({
  skill,
  baseSalary,
}: {
  skill: CharacterSkill
  baseSalary: number
}) {
  const activeIndex = Math.min(skill.level, TRADING_GRADES.length - 1)

  return (
    <div className="flex gap-1" role="list" aria-label={`Уровень навыка: ${skill.level}`}>
      {TRADING_GRADES.map((letter, index) => {
        const isActive = index === activeIndex
        const tooltip = getSkillLevelTooltip(skill.id, index, { baseSalary })

        return (
          <SkillLevelTooltipWrap
            key={letter}
            tooltip={tooltip}
            align={getTooltipAlignForIndex(index, TRADING_GRADES.length)}
          >
            <div
              role="listitem"
              className={`${cellBase} ${
                isActive
                  ? 'border-emerald-400/40 bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                  : 'border-slate-600/30 bg-slate-700/50 text-slate-400'
              }`}
            >
              {letter}
            </div>
          </SkillLevelTooltipWrap>
        )
      })}
    </div>
  )
}

function PropertySlotCells({ skill }: { skill: CharacterSkill }) {
  const unlockedSlots = 1 + skill.level

  return (
    <div className="flex gap-1" role="list" aria-label={`Открыто слотов: ${unlockedSlots}`}>
      {[1, 2, 3, 4].map((slotNumber, index) => {
        const isUnlocked = slotNumber <= unlockedSlots
        const tooltip = getSkillLevelTooltip('property_slots', slotNumber, { baseSalary: 0 })

        return (
          <SkillLevelTooltipWrap
            key={slotNumber}
            tooltip={tooltip}
            align={getTooltipAlignForIndex(index, 4)}
          >
            <div
              role="listitem"
              className={`${cellBase} ${
                isUnlocked
                  ? 'border-emerald-400/40 bg-emerald-500 text-white'
                  : 'border-slate-600/30 bg-slate-700/50 text-slate-500'
              }`}
            >
              {isUnlocked ? slotNumber : <LockIcon className="h-3.5 w-3.5" />}
            </div>
          </SkillLevelTooltipWrap>
        )
      })}
    </div>
  )
}

function QualificationProgress({
  skill,
  baseSalary,
}: {
  skill: CharacterSkill
  baseSalary: number
}) {
  return (
    <div
      className="flex flex-col items-end gap-1.5"
      aria-label={`Квалификация: уровень ${skill.level} из ${skill.maxLevel}`}
    >
      <span className="text-xs font-bold tabular-nums text-slate-300">
        Lv. {skill.level} / {skill.maxLevel}
      </span>
      <div className="flex gap-0.5" role="list">
        {Array.from({ length: skill.maxLevel }, (_, index) => {
          const level = index + 1
          const isFilled = level <= skill.level
          const tooltip = getSkillLevelTooltip('qualification', level, { baseSalary })

          return (
            <SkillLevelTooltipWrap
              key={level}
              tooltip={tooltip}
              placement="bottom"
              align={getTooltipAlignForIndex(index, skill.maxLevel, 5)}
            >
              <div
                role="listitem"
                className={`${qualificationSegmentBase} ${
                  isFilled ? 'bg-emerald-500' : 'bg-slate-700/50'
                }`}
              />
            </SkillLevelTooltipWrap>
          )
        })}
      </div>
    </div>
  )
}

interface SkillLevelIndicatorProps {
  skill: CharacterSkill
  baseSalary?: number
  className?: string
}

export function SkillLevelIndicator({
  skill,
  baseSalary = 0,
  className = '',
}: SkillLevelIndicatorProps) {
  let content

  switch (skill.id) {
    case 'banking':
    case 'trading':
      content = <GradeLevelCells skill={skill} baseSalary={baseSalary} />
      break
    case 'property_slots':
      content = <PropertySlotCells skill={skill} />
      break
    case 'qualification':
      content = <QualificationProgress skill={skill} baseSalary={baseSalary} />
      break
    default:
      content = null
  }

  return <div className={`shrink-0 self-center ${className}`}>{content}</div>
}
