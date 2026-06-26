import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { MoneyValue } from '../../../../components/money/money_value'
import { LockIcon } from '../../../../shared/icons'
import { getRealEstateImage } from '../../../../constants/realEstateImages'
import { useGameStore } from '../../../../stores/game.store'
import { useDashboardTheme } from '../../_model/use_dashboard_theme'
import type { GameDashboardThemeTokens } from '../shared'

function AccordionChevron({ open, theme }: { open: boolean; theme: GameDashboardThemeTokens }) {
  return (
    <span
      aria-hidden
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-transform duration-200 ${
        theme.isLight
          ? 'border-slate-200 bg-slate-50 text-slate-500'
          : 'border-slate-600/40 bg-slate-800/60 text-slate-400'
      } ${open ? 'rotate-180' : ''}`}
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export interface PropertyItem {
  itemRef: string
  name: string
  income: number
  paybackPct: number
  monthlyPayment?: number
}

export interface PropertySlot {
  id: number
  isLocked: boolean
  item?: PropertyItem
}

export const PROPERTY_SLOT_UPGRADE_ID = 'property_slots'

export function createEmptyPropertySlots(): PropertySlot[] {
  return [
    { id: 1, isLocked: false },
    { id: 2, isLocked: true },
    { id: 3, isLocked: true },
    { id: 4, isLocked: true },
  ]
}

export function unlockNextPropertySlot(slots: PropertySlot[]) {
  const nextLocked = slots
    .filter((slot) => slot.isLocked)
    .sort((a, b) => a.id - b.id)[0]
  if (!nextLocked) return slots

  return slots.map((slot) =>
    slot.id === nextLocked.id ? { ...slot, isLocked: false } : slot,
  )
}

export function hasLockedPropertySlots(slots: PropertySlot[]) {
  return slots.some((slot) => slot.isLocked)
}

export function calcPropertyPassiveIncome(slots: PropertySlot[]) {
  return slots.reduce((sum, slot) => sum + (slot.item?.income ?? 0), 0)
}

function countOccupiedSlots(slots: PropertySlot[]) {
  return slots.filter((slot) => !slot.isLocked && slot.item).length
}

function LockedPropertySlot({ theme }: { theme: GameDashboardThemeTokens }) {
  return (
    <article
      className={`relative aspect-square overflow-hidden rounded-xl border ${
        theme.isLight
          ? 'border-slate-300/70 bg-slate-100/80'
          : 'border-slate-700/50 bg-slate-800/60'
      }`}
    >
      <div
        className={`absolute inset-0 backdrop-blur-[1px] ${
          theme.isLight ? 'bg-slate-200/40' : 'bg-slate-900/55'
        }`}
      />

      <div className="relative flex h-full flex-col items-center justify-center gap-2 p-3 text-center">
        <LockIcon
          className={`h-10 w-10 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] ${
            theme.isLight ? 'text-slate-400' : 'text-slate-500/80'
          }`}
        />
        <p className={`text-[10px] font-bold uppercase tracking-wider ${theme.secondaryText}`}>
          Заблокировано
        </p>
      </div>
    </article>
  )
}

function OccupiedPropertySlot({
  item,
  theme,
}: {
  item: PropertyItem
  theme: GameDashboardThemeTokens
}) {
  const image = getRealEstateImage(item.itemRef)

  return (
    <article
      className={`group relative aspect-square overflow-hidden rounded-xl border transition hover:border-emerald-400/25 ${
        theme.isLight
          ? 'border-slate-300/70 bg-slate-100'
          : 'border-slate-700/40 bg-slate-800/60'
      }`}
    >
      {image ? (
        <img src={image} alt={item.name} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
      )}

      <span className="absolute right-2 top-2 rounded-md border border-white/15 bg-black/55 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white backdrop-blur-md">
        {item.paybackPct}%
      </span>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2.5 pb-2.5 pt-10">
        <p className="truncate text-sm font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          {item.name}
        </p>
        <div className="mt-0.5">
          {item.income > 0 ? (
            <MoneyValue amount={item.income} size="xs" prefix="+" suffix="/мес" tone="overlay" />
          ) : item.monthlyPayment ? (
            <MoneyValue amount={item.monthlyPayment} size="xs" suffix="/мес" tone="overlay" />
          ) : null}
        </div>
      </div>
    </article>
  )
}

function EmptyPropertySlot({ theme }: { theme: GameDashboardThemeTokens }) {
  return (
    <article
      className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-dashed ${
        theme.isLight
          ? 'border-emerald-500/30 bg-emerald-50/50'
          : 'border-emerald-400/25 bg-slate-800/40'
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/60">Пустой слот</p>
    </article>
  )
}

export function PropertyInventoryBlock() {
  const theme = useDashboardTheme()
  const slots = useGameStore((state) => state.propertySlots)
  const [open, setOpen] = useState(true)
  const occupied = countOccupiedSlots(slots)
  const total = slots.length

  return (
    <section className={theme.sidebarSection}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 text-left ${open ? 'mb-2.5' : ''}`}
      >
        <h3 className={theme.sidebarSectionTitle}>
          Имущество ({occupied}/{total})
        </h3>
        <AccordionChevron open={open} theme={theme} />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="property-grid"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2">
              {slots.map((slot) => {
                if (slot.isLocked) {
                  return <LockedPropertySlot key={slot.id} theme={theme} />
                }
                if (slot.item) {
                  return <OccupiedPropertySlot key={slot.id} item={slot.item} theme={theme} />
                }
                return <EmptyPropertySlot key={slot.id} theme={theme} />
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  )
}
