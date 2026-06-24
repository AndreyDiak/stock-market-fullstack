import { motion } from 'framer-motion'

export const characterCardVariants = {
  hidden: { y: 48, opacity: 0, scale: 0.92 },
  show: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 24 },
  },
}

interface CharacterCardProps {
  name: string
  professionLabel: string
  image?: string
  selected?: boolean
  locked?: boolean
  onClick?: () => void
}

export function CharacterCard({
  name,
  professionLabel,
  image,
  selected = false,
  locked = false,
  onClick,
}: CharacterCardProps) {
  if (locked) {
    return (
      <motion.div
        variants={characterCardVariants}
        className="relative flex h-full min-h-0 flex-col p-2.5 opacity-55"
        style={{
          borderRadius: '1.35rem',
          background: 'linear-gradient(165deg, #2a3340 0%, #151c26 45%, #0f141c 100%)',
        }}
        aria-disabled
      >
        <div className="mb-2 flex items-center gap-1.5 px-1.5 pt-0.5">
          <span className="h-2 w-2 rounded-full bg-slate-600/80" />
          <span className="h-2 w-2 rounded-full bg-slate-600/80" />
          <span className="h-2 w-2 rounded-full bg-slate-600/80" />
          <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.2em] text-slate-600">
            LOCK
          </span>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/5 bg-gradient-to-b from-[#0a1218] to-[#060a0e]">
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-600/50 bg-slate-800/50">
              <svg
                className="h-5 w-5 text-slate-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Скоро
            </span>
          </div>
          <div className="h-1 bg-black/40">
            <div className="h-full w-0 bg-slate-700/50" />
          </div>
        </div>

        <div className="mt-2 shrink-0 px-1 text-center">
          <div className="text-sm font-bold tracking-wide text-slate-500">???</div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            {professionLabel}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.button
      type="button"
      variants={characterCardVariants}
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      className={`group relative flex h-full min-h-0 flex-col p-2.5 text-left transition-shadow duration-300 ${
        selected
          ? 'shadow-[0_0_32px_rgba(77,196,141,0.35),0_12px_40px_rgba(0,0,0,0.45)]'
          : 'shadow-[0_8px_28px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.4)]'
      }`}
      style={{
        borderRadius: '1.35rem',
        background: 'linear-gradient(165deg, #3d4f63 0%, #1a2433 45%, #121a26 100%)',
      }}
    >
      <div
        className={`absolute inset-0 rounded-[1.35rem] transition-opacity duration-300 ${
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
        }`}
        style={{
          padding: '2px',
          background: 'linear-gradient(135deg, rgba(77,196,141,0.9), rgba(45,212,191,0.4), rgba(77,196,141,0.2))',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      <div className="mb-2 flex items-center gap-1.5 px-1.5 pt-0.5">
        <span className="h-2 w-2 rounded-full bg-red-400/70 shadow-[0_0_6px_rgba(248,113,113,0.5)]" />
        <span className="h-2 w-2 rounded-full bg-amber-400/70 shadow-[0_0_6px_rgba(251,191,36,0.4)]" />
        <span
          className={`h-2 w-2 rounded-full transition-all duration-300 ${
            selected
              ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]'
              : 'bg-emerald-600/50'
          }`}
        />
        <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
          SLOT
        </span>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/5 bg-gradient-to-b from-[#0c1824] via-[#0a1f1a] to-[#071510]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_95%,rgba(77,196,141,0.22),transparent_65%)]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 flex min-h-0 flex-1 items-end justify-center px-1 pb-1 pt-2">
          <img
            src={image}
            alt={professionLabel}
            className="h-full max-h-full w-full object-contain object-bottom drop-shadow-[0_12px_28px_rgba(0,0,0,0.65)] transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>

        <div className="relative z-10 h-1 bg-black/40">
          <div
            className={`h-full transition-all duration-500 ${
              selected ? 'w-full bg-gradient-to-r from-emerald-500 to-teal-400' : 'w-1/3 bg-emerald-700/50'
            }`}
          />
        </div>
      </div>

      <div className="mt-2 shrink-0 px-1 text-center">
        <div
          className={`text-sm font-bold tracking-wide transition-colors ${
            selected ? 'text-emerald-300' : 'text-slate-100'
          }`}
        >
          {name}
        </div>
        <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-500/80">
          {professionLabel}
        </div>
      </div>
    </motion.button>
  )
}
