import { motion } from 'framer-motion'

export const characterCardVariants = {
  hidden: { y: 56, opacity: 0, scale: 0.94 },
  show: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 26 },
  },
}

interface CharacterCardProps {
  name: string
  professionLabel: string
  image: string
  selected: boolean
  onClick: () => void
}

export default function CharacterCard({
  name,
  professionLabel,
  image,
  selected,
  onClick,
}: CharacterCardProps) {
  return (
    <motion.button
      type="button"
      variants={characterCardVariants}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`flex h-full flex-col overflow-hidden rounded-2xl border-2 bg-pastel-100/85 text-left shadow-sm backdrop-blur-sm transition-[box-shadow,background-color,border-color] hover:bg-pastel-100/95 hover:shadow-md ${
        selected
          ? 'border-pastel-500/80 ring-2 ring-pastel-300/60'
          : 'border-pastel-200/60 hover:border-pastel-300/70'
      }`}
    >
      <div className="flex min-h-0 flex-1 items-end justify-center bg-gradient-to-b from-pastel-100/30 to-pastel-200/40 p-3 pt-4">
        <img
          src={image}
          alt={professionLabel}
          className="h-full w-full object-contain object-bottom"
        />
      </div>
      <div className="border-t border-pastel-200/60 bg-white/40 px-3 py-2 text-center">
        <div className="font-semibold text-pastel-900">{name}</div>
        <div className="text-xs font-medium text-pastel-700">{professionLabel}</div>
      </div>
    </motion.button>
  )
}
