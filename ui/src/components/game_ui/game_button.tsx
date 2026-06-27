import type { ButtonHTMLAttributes } from 'react'

type GameButtonVariant = 'action' | 'muted' | 'danger' | 'ghost' | 'emerald' | 'teal'
type GameButtonSize = 'sm' | 'md' | 'lg'

interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GameButtonVariant
  size?: GameButtonSize
  fullWidth?: boolean
}

const sizeClasses: Record<GameButtonSize, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-lg',
}

const variantClasses: Record<GameButtonVariant, string> = {
  action:
    'rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-orange-500 font-black uppercase tracking-wide text-amber-950 shadow-[0_4px_0_#b45309,0_0_24px_rgba(251,191,36,0.45)] hover:from-amber-200 hover:via-amber-300 hover:to-orange-400 hover:shadow-[0_4px_0_#b45309,0_0_32px_rgba(251,191,36,0.65)] active:translate-y-0.5 active:shadow-[0_2px_0_#b45309,0_0_20px_rgba(251,191,36,0.4)] disabled:active:translate-y-0',
  muted:
    'rounded-2xl bg-gradient-to-b from-slate-500 via-slate-600 to-slate-700 font-black uppercase tracking-wide text-slate-100 shadow-[0_4px_0_#1e293b,0_0_16px_rgba(15,23,42,0.45)] hover:from-slate-400 hover:via-slate-500 hover:to-slate-600 hover:shadow-[0_4px_0_#1e293b,0_0_22px_rgba(15,23,42,0.55)] active:translate-y-0.5 active:shadow-[0_2px_0_#1e293b,0_0_14px_rgba(15,23,42,0.4)] disabled:active:translate-y-0',
  danger:
    'rounded-2xl bg-gradient-to-b from-red-400 via-red-500 to-red-600 font-black uppercase tracking-wide text-red-950 shadow-[0_4px_0_#991b1b,0_0_20px_rgba(239,68,68,0.35)] hover:from-red-300 hover:via-red-400 hover:to-red-500 hover:shadow-[0_4px_0_#991b1b,0_0_28px_rgba(239,68,68,0.45)] active:translate-y-0.5 active:shadow-[0_2px_0_#991b1b,0_0_16px_rgba(239,68,68,0.3)] disabled:active:translate-y-0',
  ghost:
    'rounded-xl bg-transparent font-semibold normal-case tracking-normal text-slate-400 underline-offset-4 shadow-none hover:text-amber-300 hover:underline active:translate-y-0',
  emerald:
    'rounded-xl bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 font-black uppercase tracking-wide text-white shadow-[0_4px_0_#047857,0_0_15px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.25)] hover:from-emerald-300 hover:via-emerald-400 hover:to-emerald-500 hover:shadow-[0_4px_0_#047857,0_0_22px_rgba(16,185,129,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] active:translate-y-0.5 active:shadow-[0_2px_0_#047857,0_0_12px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] disabled:from-slate-700 disabled:via-slate-800 disabled:to-slate-900 disabled:text-slate-400 disabled:opacity-90 disabled:shadow-[0_4px_0_#0f172a,0_0_0_transparent] disabled:hover:from-slate-700 disabled:hover:via-slate-800 disabled:hover:to-slate-900 disabled:active:translate-y-0',
  teal:
    'rounded-xl bg-gradient-to-b from-teal-400 via-cyan-500 to-teal-600 font-black uppercase tracking-wide text-white shadow-[0_4px_0_#0f766e,0_0_14px_rgba(45,212,191,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] hover:from-teal-300 hover:via-cyan-400 hover:to-teal-500 hover:shadow-[0_4px_0_#0f766e,0_0_20px_rgba(45,212,191,0.45),inset_0_1px_0_rgba(255,255,255,0.3)] active:translate-y-0.5 active:shadow-[0_2px_0_#0f766e,0_0_10px_rgba(45,212,191,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] disabled:from-slate-700 disabled:via-slate-800 disabled:to-slate-900 disabled:text-slate-400 disabled:opacity-90 disabled:shadow-[0_4px_0_#0f172a,0_0_0_transparent] disabled:hover:from-slate-700 disabled:hover:via-slate-800 disabled:hover:to-slate-900 disabled:active:translate-y-0',
}

export function GameButton({
  variant = 'action',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: GameButtonProps) {
  return (
    <button
      type="button"
      className={`shrink-0 transition disabled:cursor-not-allowed disabled:opacity-60 ${sizeClasses[size]} ${
        fullWidth ? 'w-full' : ''
      } ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
