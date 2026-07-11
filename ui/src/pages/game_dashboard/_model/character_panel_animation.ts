import type { Variants } from 'framer-motion'

export const characterPanelVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      delayChildren: 0.05,
      staggerChildren: 0.09,
    },
  },
}

export const characterSectionVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 320, damping: 28 },
  },
}

export const characterSkillsContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      delayChildren: 0.12,
      staggerChildren: 0.08,
    },
  },
}

export const characterSkillCardVariants: Variants = {
  hidden: { opacity: 0, x: 18 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 340, damping: 30 },
  },
}
