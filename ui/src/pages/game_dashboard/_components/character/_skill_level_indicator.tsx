import { LockIcon } from '../../../../shared/icons'
import type { CharacterSkill } from './_character_skills'
import { TRADING_GRADES } from './_character_skills'
import { getTooltipAlignForIndex, SkillLevelTooltipWrap } from './_skill_level_tooltip'

const cellBase =
  'flex h-8 w-8 items-center justify-center rounded-md border text-xs font-bold transition-colors'

const qualificationSegmentBase = 'h-1.5 w-4 shrink-0 rounded-sm'

function GradeLevelCells({ skill }: { skill: CharacterSkill }) {
  const activeIndex = Math.min(Math.max(0, skill.level - 1), TRADING_GRADES.length - 1)

  return (
    <div className="flex gap-1" role="list" aria-label={`Уровень навыка: ${skill.level}`}>
      {TRADING_GRADES.map((letter, index) => {
        const isActive = index === activeIndex
        const tooltip = skill.levelTooltips[index] ?? { title: '', lines: [] }

        return (
          <SkillLevelTooltipWrap
            key={letter}
            tooltip={tooltip}
            placement="top"
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
  const unlockedSlots = skill.level

  return (
    <div className="flex gap-1" role="list" aria-label={`Открыто слотов: ${unlockedSlots}`}>
      {[1, 2, 3, 4].map((slotNumber, index) => {
        const isUnlocked = slotNumber <= unlockedSlots
        const tooltip = skill.levelTooltips[index] ?? { title: '', lines: [] }

        return (
          <SkillLevelTooltipWrap
            key={slotNumber}
            tooltip={tooltip}
            placement="top"
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

function QualificationProgress({ skill }: { skill: CharacterSkill }) {
  return (
    <div
      className="flex flex-col items-end gap-1.5"
      aria-label={`Квалификация: уровень ${skill.level} из ${skill.maxLevel}`}
    >
      <span className="text-xs font-bold tabular-nums text-slate-300">
        уровень {skill.level} / {skill.maxLevel}
      </span>
      <div className="flex gap-0.5" role="list">
        {Array.from({ length: skill.maxLevel }, (_, index) => {
          const level = index + 1
          const isFilled = level <= skill.level
          const tooltip = skill.levelTooltips[index] ?? { title: '', lines: [] }

          return (
            <SkillLevelTooltipWrap
              key={level}
              tooltip={tooltip}
              placement="top"
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
  className?: string
}

export function SkillLevelIndicator({ skill, className = '' }: SkillLevelIndicatorProps) {
  let content

  switch (skill.id) {
    case 'banking':
    case 'trading':
      content = <GradeLevelCells skill={skill} />
      break
    case 'property_slots':
      content = <PropertySlotCells skill={skill} />
      break
    case 'qualification':
      content = <QualificationProgress skill={skill} />
      break
    default:
      content = null
  }

  return <div className={`shrink-0 self-center ${className}`}>{content}</div>
}
