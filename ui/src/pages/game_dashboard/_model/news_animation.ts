import type { Transition, Variants } from 'framer-motion'

export const newsBlockLayoutTransition: Transition = {
  layout: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  opacity: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
  y: { type: 'spring', stiffness: 380, damping: 30, mass: 0.85 },
}

export const newsBlockItemVariants: Variants = {
  enter: {
    opacity: 0,
    y: -14,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.98,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
  },
}
