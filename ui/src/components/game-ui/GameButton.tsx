import type { ButtonHTMLAttributes } from 'react'

type GameButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GameButtonVariant
  fullWidth?: boolean
}

const variantClasses: Record<GameButtonVariant, string> = {
  primary:
    'rounded-2xl bg-gradient-to-b from-emerald-500 to-teal-600 font-bold text-white shadow-[0_0_28px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.25)] hover:from-emerald-400 hover:to-teal-500',
  secondary:
    'rounded-2xl bg-slate-800/90 font-semibold text-slate-300 hover:bg-slate-700/90',
  danger:
    'rounded-2xl border border-red-400/20 bg-slate-800/90 font-semibold text-red-400 hover:bg-slate-700/90',
  ghost:
    'rounded-xl bg-transparent font-medium text-slate-400 underline-offset-4 hover:text-emerald-300 hover:underline',
}

export default function GameButton({
  variant = 'primary',
  fullWidth = true,
  className = '',
  children,
  ...props
}: GameButtonProps) {
  return (
    <button
      type="button"
      className={`px-5 py-3.5 text-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
        fullWidth ? 'w-full' : ''
      } ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
