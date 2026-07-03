import type { CharacterSkill } from '../character/_character_skills'
import { SkillLevelIndicator } from '../character/_skill_level_indicator'

export function SkillProgressControl({ skill }: { skill: CharacterSkill }) {
  return <SkillLevelIndicator skill={skill} />
}
