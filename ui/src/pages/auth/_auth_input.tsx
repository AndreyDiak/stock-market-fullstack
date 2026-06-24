import type { InputHTMLAttributes } from 'react'

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function AuthInput({ label, className = '', id, ...props }: AuthInputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <label htmlFor={inputId} className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-500/80">
        {label}
      </span>
      <input
        id={inputId}
        className={`auth-input w-full rounded-xl border border-white/10 bg-[#0a1218]/80 px-3.5 py-2.5 text-sm text-slate-100 shadow-[inset_0_2px_6px_rgba(0,0,0,0.35)] outline-none ring-1 ring-inset ring-white/5 transition placeholder:text-slate-500 focus:border-emerald-400/35 focus:ring-emerald-400/20 ${className}`}
        {...props}
      />
    </label>
  )
}
