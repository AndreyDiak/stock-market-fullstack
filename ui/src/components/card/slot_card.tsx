import { motion } from 'framer-motion'
import type { KeyboardEvent } from 'react'
import { GameButton } from '../game_ui/game_button'
import { MoneyValue } from '../money/money_value'
import { PlusIcon } from '../../shared/icons'
import { PROFESSION_LABELS } from '../../constants/professions'
import { getProfessionImage } from '../../constants/professionImages'
import type { CreateGameBody } from '../../api/types'

export const slotCardVariants = {
  hidden: { y: 28, opacity: 0, scale: 0.97 },
  show: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 210, damping: 28, mass: 0.85 },
  },
}

export const emptySlotCardVariants = {
  hidden: { y: 28, opacity: 0, scale: 0.97 },
  show: {
    y: 0,
    opacity: 0.8,
    scale: 1,
    transition: { type: 'spring', stiffness: 210, damping: 28, mass: 0.85 },
  },
}

const frameStyle = {
  borderRadius: '1.35rem',
  background: 'linear-gradient(165deg, #3d4f63 0%, #1a2433 45%, #121a26 100%)',
}

const emptyFrameStyle = {
  borderRadius: '1.35rem',
  background: 'linear-gradient(165deg, #2a3340 0%, #151c26 45%, #0f141c 100%)',
}

interface SlotCardProps {
  slot: number
  filled?: boolean
  characterName?: string
  profession?: string
  balance?: number
  day?: number
  isPlayable?: boolean
  onLoad?: () => void
  onNewGame?: () => void
  onDelete?: () => void
}

function SlotChrome({ slot, active = true }: { slot: number; active?: boolean }) {
  return (
    <div className="mb-2 flex items-center gap-1.5 px-1.5 pt-0.5">
      <span
        className={`h-2 w-2 rounded-full ${
          active ? 'bg-red-400/70 shadow-[0_0_6px_rgba(248,113,113,0.5)]' : 'bg-slate-600/80'
        }`}
      />
      <span
        className={`h-2 w-2 rounded-full ${
          active ? 'bg-amber-400/70 shadow-[0_0_6px_rgba(251,191,36,0.4)]' : 'bg-slate-600/80'
        }`}
      />
      <span
        className={`h-2 w-2 rounded-full ${
          active
            ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]'
            : 'bg-slate-600/80'
        }`}
      />
      <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
        SLOT {slot}
      </span>
    </div>
  )
}

export function SlotCard({
  slot,
  filled = false,
  characterName,
  profession,
  balance,
  day,
  isPlayable = true,
  onLoad,
  onNewGame,
  onDelete,
}: SlotCardProps) {
  const professionKey = profession as CreateGameBody['profession'] | undefined
  const professionLabel = professionKey ? PROFESSION_LABELS[professionKey] : undefined
  const portrait = getProfessionImage(profession)

  if (!filled) {
    return (
      <motion.div
        variants={emptySlotCardVariants}
        role="button"
        tabIndex={0}
        onClick={onNewGame}
        onKeyDown={(event: KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onNewGame?.()
          }
        }}
        className="group flex h-full min-h-[24rem] cursor-pointer flex-col transition-shadow duration-200 hover:shadow-[0_0_28px_rgba(16,185,129,0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400/50"
        style={emptyFrameStyle}
      >
        <div className="flex flex-1 flex-col p-2.5">
          <SlotChrome slot={slot} active={false} />

          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/5 bg-gradient-to-b from-[#0a1218] to-[#060a0e] transition-colors duration-200 group-hover:border-emerald-400/25">
            <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-3 p-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-emerald-400/25 bg-emerald-400/5 transition-colors duration-200 group-hover:border-emerald-400/45 group-hover:bg-emerald-400/10">
                <PlusIcon className="h-9 w-9 text-emerald-400/60 transition-colors duration-200 group-hover:text-emerald-300" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 transition-colors duration-200 group-hover:text-slate-400">
                Пустой слот
              </span>
            </div>

            <div className="relative z-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-3 py-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-600">Баланс</span>
                <span className="text-base font-bold text-slate-600">—</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-600">Ход</span>
                <span className="text-lg font-bold tabular-nums text-slate-600">1</span>
              </div>
            </div>

            <div className="relative z-10 h-1 bg-black/40">
              <div className="h-full w-0 bg-slate-700/50" />
            </div>
          </div>

          <div className="mt-2.5 shrink-0 px-0.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 text-left">
                <div className="truncate text-sm font-bold text-slate-500 transition-colors duration-200 group-hover:text-slate-400">
                  Слот {slot}
                </div>
                <div className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 transition-colors duration-200 group-hover:text-emerald-500/70">
                  Свободен
                </div>
              </div>
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                —
              </span>
            </div>
          </div>
        </div>

        <div className="px-2.5 pb-2.5">
          <GameButton fullWidth variant="muted">
            Новая игра
          </GameButton>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={slotCardVariants}
      className="flex h-full min-h-[24rem] flex-col shadow-[0_8px_28px_rgba(0,0,0,0.35)]"
      style={frameStyle}
    >
      <div className="flex flex-1 flex-col p-2.5">
        <SlotChrome slot={slot} />

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/5 bg-gradient-to-b from-[#0c1824] via-[#0a1f1a] to-[#071510]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_95%,rgba(77,196,141,0.22),transparent_65%)]" />
          <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10 flex min-h-0 flex-1 items-end justify-center px-2 pb-1 pt-2">
            {portrait ? (
              <img
                src={portrait}
                alt={professionLabel ?? characterName}
                className="h-full max-h-full w-full object-contain object-bottom drop-shadow-[0_12px_28px_rgba(0,0,0,0.65)]"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-800/80 text-2xl font-bold text-emerald-300">
                {characterName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="relative z-10 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-3 pb-2.5 pt-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-300">Баланс</span>
              {balance != null ? (
                <MoneyValue amount={balance} size="md" />
              ) : (
                <span className="text-base font-bold text-emerald-400">—</span>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-300">Ход</span>
              <span className="text-lg font-bold tabular-nums text-emerald-300">{day ?? 1}</span>
            </div>
          </div>

          <div className="relative z-10 h-1 bg-black/40">
            <div className="h-full w-2/3 bg-gradient-to-r from-emerald-500 to-teal-400" />
          </div>
        </div>

        <div className="mt-2.5 flex items-start justify-between gap-3 px-0.5">
          <div className="min-w-0 text-left">
            <div className="truncate text-sm font-bold text-slate-100">{characterName}</div>
            <div className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-500/80">
              {professionLabel ?? profession}
            </div>
          </div>
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="shrink-0 pt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-red-400/85 transition hover:text-red-300"
            >
              Удалить
            </button>
          ) : null}
        </div>
      </div>

      <div className="px-2.5 pb-2.5">
        {isPlayable ? (
          <GameButton fullWidth onClick={onLoad}>
            Загрузить
          </GameButton>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-400/80">
              Игра завершена
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
