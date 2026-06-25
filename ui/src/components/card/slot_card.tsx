import { motion } from 'framer-motion'
import { GameButton } from '../game_ui/game_button'
import { MoneyValue } from '../money/money_value'
import { PlusIcon } from '../../shared/icons'
import { PROFESSION_LABELS } from '../../constants/professions'
import { getProfessionImage } from '../../constants/professionImages'
import type { CreateGameBody } from '../../api/types'

export const slotCardVariants = {
  hidden: { y: 40, opacity: 0, scale: 0.94 },
  show: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 24 },
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
        variants={slotCardVariants}
        className="flex h-full min-h-[22rem] flex-col opacity-80"
        style={emptyFrameStyle}
      >
        <div className="flex flex-1 flex-col p-2.5">
          <SlotChrome slot={slot} active={false} />

          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/5 bg-gradient-to-b from-[#0a1218] to-[#060a0e]">
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-emerald-400/30 bg-emerald-400/5">
                <PlusIcon className="h-7 w-7 text-emerald-400/70" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Пустой слот
              </span>
            </div>
            <div className="h-1 bg-black/40">
              <div className="h-full w-0 bg-slate-700/50" />
            </div>
          </div>

          <div className="mt-2 shrink-0 px-1 text-center">
            <div className="text-sm font-bold text-slate-500">Слот {slot}</div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Свободен
            </div>
          </div>
        </div>

        <div className="px-2.5 pb-2.5">
          <GameButton fullWidth variant="muted" onClick={onNewGame}>
            Новая игра
          </GameButton>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={slotCardVariants}
      className="flex h-full min-h-[22rem] flex-col shadow-[0_8px_28px_rgba(0,0,0,0.35)]"
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

          <div className="relative z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-2 pt-6">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-400">Баланс</span>
              {balance != null ? (
                <MoneyValue amount={balance} size="xs" />
              ) : (
                <span className="font-bold text-emerald-400">—</span>
              )}
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-400">Ход</span>
              <span className="font-bold text-emerald-400">{day ?? 1}</span>
            </div>
          </div>

          <div className="relative z-10 h-1 bg-black/40">
            <div className="h-full w-2/3 bg-gradient-to-r from-emerald-500 to-teal-400" />
          </div>
        </div>

        <div className="mt-2 shrink-0 px-1 text-center">
          <div className="text-sm font-bold text-slate-100">{characterName}</div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-500/80">
            {professionLabel ?? profession}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 px-2.5 pb-2.5">
        <GameButton fullWidth onClick={onLoad}>
          Загрузить
        </GameButton>
        <GameButton fullWidth variant="ghost" className="!text-red-400 hover:!text-red-300" onClick={onDelete}>
          Удалить
        </GameButton>
      </div>
    </motion.div>
  )
}
