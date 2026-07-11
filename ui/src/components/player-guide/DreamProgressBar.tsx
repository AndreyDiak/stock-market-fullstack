import { motion } from 'framer-motion'
import type { GameDashboardThemeTokens } from '../../pages/game_dashboard/_components/shared'

interface DreamProgressBarProps {
  totalStages: number
  currentStage: number
  completedStages: number
  theme: GameDashboardThemeTokens
}

export function DreamProgressBar({
  totalStages,
  currentStage,
  completedStages,
  theme,
}: DreamProgressBarProps) {
  const isLight = theme.isLight
  const completedColor = isLight ? 'bg-emerald-600' : 'bg-emerald-500'
  const currentColor = isLight ? 'bg-emerald-400' : 'bg-emerald-400'
  const inactiveColor = isLight ? 'bg-slate-200/50' : 'bg-slate-700/50'

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.3,
      },
    },
  }

  const stageVariants = {
    hidden: { scaleX: 0, opacity: 0 },
    visible: {
      scaleX: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  }

  const textVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  }

  return (
    <motion.div
      className="w-full"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div
        className="flex items-center justify-between gap-2"
        variants={containerVariants}
      >
        {Array.from({ length: totalStages }, (_, i) => {
          const stageNum = i + 1
          let colorClass = inactiveColor
          let isCurrent = false
          let isComplete = false

          if (stageNum <= completedStages) {
            colorClass = completedColor
            isComplete = true
          } else if (stageNum === currentStage) {
            colorClass = currentColor
            isCurrent = true
          }

          return (
            <motion.div
              key={stageNum}
              className={`flex-1 h-3 rounded ${colorClass}`}
              variants={stageVariants}
              style={{ originX: 0 }}
              whileHover={{
                scaleY: 1.8,
                transition: { duration: 0.2 },
              }}
            >
              <span className="sr-only">
                {isComplete ? 'Завершён' : isCurrent ? 'Текущий' : 'Заблокирован'} этап {stageNum}
              </span>
            </motion.div>
          )
        })}
      </motion.div>
      <motion.div
        className="mt-4 flex items-center justify-between text-xs text-slate-400"
        variants={textVariants}
      >
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Этап 1
        </motion.span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          Текущий: {currentStage} из {totalStages}
        </motion.span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          Завершено: {completedStages}
        </motion.span>
      </motion.div>
    </motion.div>
  )
}