export const slotsPageVariants = {
  hidden: {},
  show: {
    transition: {
      delayChildren: 0.06,
      staggerChildren: 0.12,
    },
  },
}

export const slotsHeaderVariants = {
  hidden: { y: 18, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

export const slotsGridVariants = {
  hidden: {},
  show: {
    transition: {
      delayChildren: 0.08,
      staggerChildren: 0.11,
    },
  },
}

export const slotsFooterVariants = {
  hidden: { y: 12, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
}
