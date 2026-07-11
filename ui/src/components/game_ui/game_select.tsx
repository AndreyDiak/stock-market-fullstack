import { useCallback, useEffect, useRef, useState } from 'react'

interface Option<T extends string> {
  value: T
  label: string
}

interface GameSelectProps<T extends string> {
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function GameSelect<T extends string>({
  value,
  options,
  onChange,
  placeholder,
  className = '',
  disabled = false,
}: GameSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const selected = options.find((o) => o.value === value)

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        setOpen((v) => !v)
      }
      if (event.key === 'Escape') {
        setOpen(false)
      }
    },
    [],
  )

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm outline-none ring-1 ring-transparent transition ${
          disabled
            ? 'cursor-not-allowed border-slate-700/30 bg-slate-800/40 text-slate-500'
            : 'border-slate-700/40 bg-slate-800/60 text-slate-200 focus:border-emerald-500/50 focus:ring-emerald-500/30'
        }`}
      >
        <span className={selected ? 'text-slate-200' : 'text-slate-500'}>
          {selected?.label ?? placeholder ?? ''}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-500 transition ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && options.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
              className={`w-full px-3.5 py-2.5 text-left text-sm transition hover:bg-slate-700/50 ${
                opt.value === value ? 'text-emerald-400' : 'text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
