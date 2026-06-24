import { AnimatePresence, motion } from 'framer-motion'
import { useLayoutEffect, useRef, useState } from 'react'
import { LoginForm } from './_login_form'
import { RegisterForm } from './_register_form'
import type { AuthMode } from './model/types'

interface AuthFormsPanelProps {
  mode: AuthMode
  direction: number
  loading?: boolean
  onLogin: (login: string, password: string) => void
  onRegister: (username: string, email: string, password: string) => void
}

const formVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    y: direction > 0 ? 14 : -14,
  }),
  center: {
    opacity: 1,
    y: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    y: direction > 0 ? -14 : 14,
  }),
}

export function AuthFormsPanel({ mode, direction, loading, onLogin, onRegister }: AuthFormsPanelProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | 'auto'>('auto')

  useLayoutEffect(() => {
    const node = contentRef.current
    if (!node) return

    const updateHeight = () => setHeight(node.scrollHeight)

    updateHeight()

    const observer = new ResizeObserver(updateHeight)
    observer.observe(node)
    return () => observer.disconnect()
  }, [mode])

  return (
    <motion.div
      className="-mx-3 overflow-hidden px-3 pb-1"
      animate={{ height }}
      initial={false}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
    >
      <div ref={contentRef}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            custom={direction}
            variants={formVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {mode === 'login' ? (
              <LoginForm loading={loading} onSubmit={onLogin} />
            ) : (
              <RegisterForm loading={loading} onSubmit={onRegister} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
