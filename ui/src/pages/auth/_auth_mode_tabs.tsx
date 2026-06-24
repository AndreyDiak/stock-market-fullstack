import { motion } from 'framer-motion'
import type { AuthMode } from './model/types'

interface AuthModeTabsProps {
  mode: AuthMode
  onChange: (mode: AuthMode) => void
}

export function AuthModeTabs({ mode, onChange }: AuthModeTabsProps) {
  return (
    <div className="relative mb-5 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/25 p-1">
      <motion.div
        className="pointer-events-none absolute inset-y-1 rounded-lg bg-emerald-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        layout
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        style={{
          width: 'calc(50% - 6px)',
          left: mode === 'login' ? 4 : 'calc(50% + 2px)',
        }}
      />

      <button
        type="button"
        onClick={() => onChange('login')}
        className={`relative z-10 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
          mode === 'login' ? 'text-emerald-300' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        Вход
      </button>
      <button
        type="button"
        onClick={() => onChange('register')}
        className={`relative z-10 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
          mode === 'register' ? 'text-emerald-300' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        Регистрация
      </button>
    </div>
  )
}
