import { MoneyValue } from '../money_value'
import { getRealEstateImage } from '../../constants/realEstateImages'

export interface PropertyItem {
  itemRef: string
  name: string
  income: number
  paybackPct: number
}

export interface PropertySlot {
  id: number
  isLocked: boolean
  item?: PropertyItem
}

export const PROPERTY_SLOT_UPGRADE_ID = 'property_slots'

export const MOCK_PROPERTY_SLOTS: PropertySlot[] = [
  {
    id: 1,
    isLocked: false,
    item: { itemRef: 'garage', name: 'Гараж', income: 150, paybackPct: 25 },
  },
  {
    id: 2,
    isLocked: false,
    item: { itemRef: 'apartment', name: 'Квартира', income: 420, paybackPct: 42 },
  },
  {
    id: 3,
    isLocked: true,
  },
  {
    id: 4,
    isLocked: true,
  },
]

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

function LockIcon({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`text-slate-500/80 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V7.5a4.5 4.5 0 1 0-9 0v3M6.75 10.5h10.5a1.5 1.5 0 0 1 1.5 1.5v7.5a1.5 1.5 0 0 1-1.5 1.5H6.75a1.5 1.5 0 0 1-1.5-1.5v-7.5a1.5 1.5 0 0 1 1.5-1.5z"
      />
    </svg>
  )
}

function LockedPropertySlot({
  unlockPrice,
  onGoToProfile,
}: {
  unlockPrice?: number
  onGoToProfile?: () => void
}) {
  return (
    <article className="relative aspect-square overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ring-1 ring-black/20">
      <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-[1px]" />

      <div className="relative flex h-full flex-col items-center justify-center gap-3 p-3 text-center">
        <LockIcon className="h-12 w-12 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]" />

        <button
          type="button"
          onClick={onGoToProfile}
          className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300 transition hover:border-emerald-400/60 hover:bg-emerald-500/20"
        >
          Купить улучшение
        </button>
      </div>

      {unlockPrice != null && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-2.5 pb-2.5 pt-8">
          <MoneyValue amount={unlockPrice} size="xs" color="amber" className="justify-center" />
        </div>
      )}
    </article>
  )
}

function OccupiedPropertySlot({ item }: { item: PropertyItem }) {
  const image = getRealEstateImage(item.itemRef)

  return (
    <article className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/60 shadow-[0_8px_24px_rgba(0,0,0,0.35)] ring-1 ring-emerald-400/10 transition hover:border-emerald-400/25 hover:ring-emerald-400/20">
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
          <MoneyValue amount={item.income} size="xs" prefix="+" suffix="/мес" tone="overlay" />
        </div>
      </div>
    </article>
  )
}

function EmptyPropertySlot() {
  return (
    <article className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-dashed border-emerald-400/25 bg-slate-800/40 ring-1 ring-emerald-400/10">
      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/60">Пустой слот</p>
    </article>
  )
}

interface PropertyInventoryBlockProps {
  slots: PropertySlot[]
  /** Цена следующего улучшения «Слот имущества» в профиле */
  nextUnlockPrice?: number
  onGoToProfile?: () => void
}

export function PropertyInventoryBlock({
  slots,
  nextUnlockPrice,
  onGoToProfile,
}: PropertyInventoryBlockProps) {
  const occupied = countOccupiedSlots(slots)
  const total = slots.length

  return (
    <section className="py-1">
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-white">
        Имущество{' '}
        <span className="font-bold text-emerald-400/90">
          ({occupied}/{total})
        </span>
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {slots.map((slot) => {
          if (slot.isLocked) {
            return (
              <LockedPropertySlot
                key={slot.id}
                unlockPrice={nextUnlockPrice}
                onGoToProfile={onGoToProfile}
              />
            )
          }
          if (slot.item) {
            return <OccupiedPropertySlot key={slot.id} item={slot.item} />
          }
          return <EmptyPropertySlot key={slot.id} />
        })}
      </div>
    </section>
  )
}
