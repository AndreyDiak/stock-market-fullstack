export const titleVariants = {
  hidden: { y: 40, opacity: 0, scale: 0.92 },
  show: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 22 },
  },
}

export const menuContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      delayChildren: 0.35,
      staggerChildren: 0.1,
    },
  },
}

export const menuItemVariants = {
  hidden: { y: 40, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 320, damping: 26 },
  },
}
