import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { MoneyValue } from "../../../../components/money/money_value";
import { gameAudio } from "../../../../lib/audio/game_audio";
import { AssetImageFrame } from "../../../../shared/components";
import { EyeIcon, LockIcon, PropertySlotIcon, CoinIcon } from "../../../../shared/icons";
import { useGameStore } from "../../../../stores/game.store";
import { useDashboardUi } from "../../_model/dashboard_ui_context";
import { useDashboardTheme } from "../../_model/use_dashboard_theme";
import type { GameDashboardThemeTokens } from "../shared";
import { StatusBadge } from "../shared";

function AccordionChevron({
  open,
  theme,
}: {
  open: boolean;
  theme: GameDashboardThemeTokens;
}) {
  return (
    <span
      aria-hidden
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-transform duration-200 ${
        theme.isLight
          ? "border-slate-200 bg-slate-50 text-slate-500"
          : "border-slate-600/40 bg-slate-800/60 text-slate-400"
      } ${open ? "rotate-180" : ""}`}
    >
      <svg
        viewBox="0 0 16 16"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export interface PropertyItem {
  itemRef: string;
  name: string;
  income: number;
  paybackPct: number;
  isOwned: boolean;
  monthlyPayment?: number;
}

export interface PropertySlot {
  id: number;
  isLocked: boolean;
  item?: PropertyItem;
}

export const PROPERTY_SLOT_UPGRADE_ID = "property_slots";

export function createEmptyPropertySlots(): PropertySlot[] {
  return [
    { id: 1, isLocked: false },
    { id: 2, isLocked: true },
    { id: 3, isLocked: true },
    { id: 4, isLocked: true },
  ];
}

export function unlockNextPropertySlot(slots: PropertySlot[]) {
  const nextLocked = slots
    .filter((slot) => slot.isLocked)
    .sort((a, b) => a.id - b.id)[0];
  if (!nextLocked) return slots;

  return slots.map((slot) =>
    slot.id === nextLocked.id ? { ...slot, isLocked: false } : slot,
  );
}

export function hasLockedPropertySlots(slots: PropertySlot[]) {
  return slots.some((slot) => slot.isLocked);
}

export function calcPropertyPassiveIncome(slots: PropertySlot[]) {
  return slots.reduce((sum, slot) => sum + (slot.item?.income ?? 0), 0);
}

function countOccupiedSlots(slots: PropertySlot[]) {
  return slots.filter((slot) => !slot.isLocked && slot.item).length;
}

function LockedPropertySlot({ theme }: { theme: GameDashboardThemeTokens }) {
  return (
    <article
      className={`relative aspect-square overflow-hidden rounded-xl border opacity-70 ${
        theme.isLight
          ? "border-slate-300/50 bg-slate-100/50"
          : "border-slate-800/60 bg-slate-900/35"
      }`}
    >
      <div
        className={`absolute inset-0 backdrop-blur-[1px] ${
          theme.isLight ? "bg-slate-200/40" : "bg-slate-900/55"
        }`}
      />

      <div className="relative flex h-full flex-col items-center justify-center gap-2 p-3 text-center">
        <LockIcon
          className={`h-10 w-10 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] ${
            theme.isLight ? "text-slate-400" : "text-slate-500/80"
          }`}
        />
        <p className={`text-[10px] font-medium ${theme.secondaryText}`}>
          Заблокировано
        </p>
      </div>
    </article>
  );
}

function PropertySlotTopLeft({
  item,
}: {
  item: PropertyItem;
}) {
  const showPayback = !item.isOwned;
  const showOwned = item.isOwned;
  const showIncome = item.income > 0;

  if (!showPayback && !showOwned && !showIncome) return null;

  return (
    <div className="pointer-events-none absolute left-1.5 top-1.5 z-10 flex max-w-[calc(100%-0.75rem)] flex-wrap items-start gap-1">
      {showPayback ? (
        <span className="rounded-md border border-white/15 bg-black/55 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white backdrop-blur-md">
          {item.paybackPct}%
        </span>
      ) : null}
      {showOwned ? (
        <StatusBadge
          tone="emerald"
          solid
          className="rounded-md px-1.5 py-0.5 text-[10px] leading-none uppercase tracking-wide"
        >
          Куплено
        </StatusBadge>
      ) : null}
      {showIncome ? (
        <span className="inline-flex items-center gap-0.5 rounded-md border border-emerald-400/35 bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-emerald-100 backdrop-blur-md">
          <CoinIcon className="h-3 w-3" />
          +{item.income.toLocaleString("ru-RU")}
        </span>
      ) : null}
    </div>
  );
}

function PropertySlotTopRight() {
  return (
    <div className="pointer-events-none absolute right-1.5 top-1.5 z-10">
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-white/20 bg-black/60 text-sky-300 opacity-0 shadow-sm backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
        aria-hidden
      >
        <EyeIcon className="h-3.5 w-3.5" />
      </span>
    </div>
  );
}

function OccupiedPropertySlot({
  item,
  theme,
  onOpenBank,
}: {
  item: PropertyItem;
  theme: GameDashboardThemeTokens;
  onOpenBank: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        gameAudio.playSfx("buttonClick");
        onOpenBank();
      }}
      aria-label={`Открыть в банке: ${item.name}`}
      className={`group relative aspect-square cursor-pointer overflow-hidden rounded-xl border text-left transition hover:border-emerald-400/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/60 ${
        theme.isLight
          ? "border-slate-300/70 bg-slate-100"
          : "border-slate-700/40 bg-slate-800/60"
      }`}
    >
      <AssetImageFrame
        assetId={item.itemRef}
        alt={item.name}
        size="fill"
        decorations={false}
        className="absolute inset-0 rounded-xl"
      />

      <PropertySlotTopLeft item={item} />
      <PropertySlotTopRight />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2.5 pb-2.5 pt-10">
        <p className="truncate text-sm font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          {item.name}
        </p>
        <div className="mt-0.5">
          {!item.isOwned && item.monthlyPayment && item.income <= 0 ? (
            <MoneyValue
              amount={item.monthlyPayment}
              size="xs"
              suffix="/ход"
              tone="overlay"
            />
          ) : null}
        </div>
      </div>
    </button>
  );
}

function EmptyPropertySlot({ theme }: { theme: GameDashboardThemeTokens }) {
  return (
    <article
      className={`relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed p-3 text-center ${
        theme.isLight
          ? "border-emerald-500/30 bg-emerald-50/50"
          : "border-emerald-400/25 bg-slate-800/40"
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg border border-dashed ${
          theme.isLight
            ? "border-emerald-500/25 bg-emerald-500/5"
            : "border-emerald-400/20 bg-emerald-400/5"
        }`}
      >
        <PropertySlotIcon
          className={`h-5 w-5 ${
            theme.isLight ? "text-emerald-500/70" : "text-emerald-400/65"
          }`}
        />
      </div>
      <div>
        <p
          className={`text-[10px] font-bold uppercase tracking-wider ${
            theme.isLight ? "text-emerald-600/80" : "text-emerald-400/75"
          }`}
        >
          Свободный слот
        </p>
        <p className={`mt-0.5 text-[9px] leading-snug ${theme.secondaryText}`}>
          Купите на рынке
        </p>
      </div>
    </article>
  );
}

export function PropertyInventoryBlock() {
  const theme = useDashboardTheme();
  const { setActiveTab } = useDashboardUi();
  const slots = useGameStore((state) => state.propertySlots);
  const [open, setOpen] = useState(true);
  const occupied = countOccupiedSlots(slots);
  const total = slots.length;

  const openBank = () => setActiveTab("bank");

  return (
    <section className={theme.sidebarSection}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 text-left ${open ? "mb-2.5" : ""}`}
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
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2">
              {slots.map((slot) => {
                if (slot.isLocked) {
                  return <LockedPropertySlot key={slot.id} theme={theme} />;
                }
                if (slot.item) {
                  return (
                    <OccupiedPropertySlot
                      key={slot.id}
                      item={slot.item}
                      theme={theme}
                      onOpenBank={openBank}
                    />
                  );
                }
                return <EmptyPropertySlot key={slot.id} theme={theme} />;
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
