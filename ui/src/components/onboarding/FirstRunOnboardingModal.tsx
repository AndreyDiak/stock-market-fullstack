import { motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { GameButton } from "../../components/game_ui/game_button";
import { NextTurnForecastBlock } from "../../pages/game_dashboard/_components/sidebar";

import type {
  NextTurnForecast,
  TurnCashflowLine,
} from "../../pages/game_dashboard/_components/sidebar/_next_turn_forecast";
import {
  BookOpenIcon,
  CheckIcon,
  ChevronRightIcon,
  XIcon,
} from "../../shared/icons";
import { useGameStore } from "../../stores/game.store";
import { useTutorialStore } from "../../stores/tutorial.store";
import { ONBOARDING_ICONS } from "./onboardingIcons";
import type { OnboardingSlide, ToneType } from "./onboardingSlides";
import { ONBOARDING_SLIDES } from "./onboardingSlides";

/* ---------- tone helpers ---------- */

const toneText: Record<ToneType, string> = {
  positive: "text-emerald-400",
  warning: "text-amber-400",
  danger: "text-red-400",
  info: "text-sky-400",
  money: "text-amber-400",
  skill: "text-violet-400",
  safe: "text-emerald-400",
};

const toneBg: Record<ToneType, string> = {
  positive: "bg-emerald-500/10",
  warning: "bg-amber-500/10",
  danger: "bg-red-500/10",
  info: "bg-sky-500/10",
  money: "bg-amber-500/10",
  skill: "bg-violet-500/10",
  safe: "bg-emerald-500/10",
};

const toneBorder: Record<ToneType, string> = {
  positive: "border-emerald-400/20",
  warning: "border-amber-400/20",
  danger: "border-red-400/20",
  info: "border-sky-400/20",
  money: "border-amber-400/20",
  skill: "border-violet-400/20",
  safe: "border-emerald-400/20",
};

/* ---------- icon ---------- */

function SlideIcon({ icon, className }: { icon: string; className?: string }) {
  const IconComp = ONBOARDING_ICONS[icon];
  if (!IconComp) return null;
  return <IconComp className={className} />;
}

/* ---------- common blocks ---------- */

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5" role="list">
      {items.map((point, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400">
            <CheckIcon className="h-2.5 w-2.5" />
          </span>
          <span>{point}</span>
        </li>
      ))}
    </ul>
  );
}

function TipBlock({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border-l-4 border-emerald-400/30 bg-emerald-500/8 px-3.5 py-2.5 ${className}`}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400 text-[9px] font-bold">
          i
        </span>
        <p className="text-xs leading-relaxed text-emerald-300">{text}</p>
      </div>
    </div>
  );
}

function WarningBlock({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border-l-4 border-amber-400/30 bg-amber-500/8 px-3.5 py-2.5 ${className}`}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-amber-400 text-[9px] font-bold">
          !
        </span>
        <p className="text-xs leading-relaxed text-amber-300">{text}</p>
      </div>
    </div>
  );
}

/* ---------- requirement label helper ---------- */

function formatReqItem(item: string): string {
  const names: Record<string, string> = {
    warehouse: "Склад",
    apartment: "Квартира",
    car: "Автомобиль",
    penthouse: "Пентхаус",
    sport_car: "Спорткар",
    country_house: "Дом в деревне",
    garage: "Гараж",
    tractor: "Трактор",
    yacht: "Яхта",
    boat: "Лодка",
    trip: "Кругосветка",
    hiking_ticket: "Билет в поход",
    collectible_card: "Коллекционная карточка",
    expensive_painting: "Картина",
    combine_harvester: "Комбайн",
    trade_pavilion: "Торговый павильон",
    car_wash: "Автомойка",
  };
  return names[item] ?? item;
}

/* ---------- Slide 1: Flow ---------- */

function FlowSlideContent({
  slide,
}: {
  slide: Extract<OnboardingSlide, { layout: "flow" }>;
}) {
  return (
    <div className="space-y-5">
      {/* Horizontal pipeline with arrows between cards */}
      <div className="flex items-center justify-center">
        {slide.flow.map((item, i) => (
          <div key={item.label} className="flex items-center">
            <div className="flex flex-col items-center gap-1 min-h-[90px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-400/15 bg-[rgb(15,23,42)]/80 shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
                <SlideIcon
                  icon={item.icon}
                  className="h-5 w-5 text-emerald-400"
                />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {item.label}
              </span>
              <span className="text-[10px] text-slate-400 text-center leading-tight max-w-[72px]">
                {item.value}
              </span>
            </div>

            {/* Arrow between cards */}
            {i < slide.flow.length - 1 && (
              <div className="mx-1 flex items-center">
                <ChevronRightIcon className="h-4 w-4 text-emerald-400/30" />
              </div>
            )}
          </div>
        ))}
      </div>

      <BulletList items={slide.bullets} />
      <TipBlock text={slide.note.text} />
    </div>
  );
}

/* ---------- Slide 2: Forecast (using real game NextTurnForecastBlock) ---------- */

function ForecastSlideContent({
  slide,
}: {
  slide: Extract<OnboardingSlide, { layout: "forecast" }>;
}) {
  const demoForecast = useMemo<NextTurnForecast>(() => {
    const lines: TurnCashflowLine[] = slide.forecast.rows
      .slice(0, -1)
      .map((row) => ({
        id: row.label.toLowerCase().replace(/\s+/g, "-"),
        label: row.label,
        amount: Number(row.value.replace(/[^0-9-]/g, "")),
      }));
    const incomeTotal = lines
      .filter((l) => l.amount > 0)
      .reduce((s, l) => s + l.amount, 0);
    const expenseTotal = lines
      .filter((l) => l.amount < 0)
      .reduce((s, l) => s + Math.abs(l.amount), 0);
    const netChange = lines.reduce((s, l) => s + l.amount, 0);
    return { lines, incomeTotal, expenseTotal, netChange };
  }, [slide]);

  return (
    <div className="space-y-4">
      {/* Real game component with demo data */}
      <NextTurnForecastBlock forecast={demoForecast} forceDark />
      {/* Row descriptions (onboarding-only hint) */}
      {/* <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl border border-slate-700/30 bg-slate-800/20 px-3.5 py-2.5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {bodyRows.map((row) => (
          <div key={row.label} className="flex items-center gap-2 text-[10px]">
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${toneBg[row.tone]}`}
            />
            <span className="font-semibold text-slate-300">{row.label}</span>
            <span className="text-slate-500">— {row.description}</span>
          </div>
        ))}
      </motion.div> */}

      {/* Compact spending scale */}
      {/* <motion.div
        className="rounded-xl border border-slate-700/30 bg-slate-800/20 px-3.5 py-2.5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
          {slide.spendingScale.title}
        </span>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
          {slide.spendingScale.items.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${toneBar[item.tone]}`} />
              <span className="text-[10px]">
                <span className={`font-bold ${toneText[item.tone]}`}>
                  {item.label}
                </span>
                <span className="text-slate-400"> — {item.text}</span>
              </span>
            </div>
          ))}
        </div>
      </motion.div> */}
      <WarningBlock text={slide.warning} />
    </div>
  );
}

/* ---------- Slide 3: Sections grid (compact, 2 lines per card) ---------- */

function SectionGridSlideContent({
  slide,
}: {
  slide: Extract<OnboardingSlide, { layout: "section-grid" }>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {slide.sections.map((section) => (
          <div className="rounded-xl border border-slate-600/30 bg-slate-800/80 px-3 py-2.5 transition hover:border-emerald-400/25">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/10">
                <SlideIcon
                  icon={section.icon}
                  className="h-3.5 w-3.5 text-emerald-400"
                />
              </div>
              <h4 className="text-sm font-bold text-white">{section.title}</h4>
            </div>
            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
              {section.purpose}
            </p>
          </div>
        ))}
      </div>
      <TipBlock text={slide.note.text} />
    </div>
  );
}

/* ---------- Slide 4: Dream (real data if available) ---------- */

function DreamCardSlideContent({
  slide,
}: {
  slide: Extract<OnboardingSlide, { layout: "dream-card" }>;
}) {
  const dream = useGameStore((state) => state.dream);
  const characterProfile = useGameStore((state) => state.characterProfile);
  const balance = useGameStore((state) => state.balance);
  const portfolio = useGameStore((state) => state.portfolio);
  const inventoryItems = useGameStore((state) => state.inventoryItems);

  const { liveMetas, liveTitle, liveProgressLabel, allMet } = useMemo(() => {
    if (!dream || !characterProfile)
      return {
        liveMetas: null,
        liveTitle: "",
        liveProgressLabel: "",
        allMet: false,
      };

    const activeStage = dream.stages.find(
      (s) => s.status === "ACTIVE" || s.status === "READY_TO_COMPLETE",
    );
    if (!activeStage)
      return {
        liveMetas: null,
        liveTitle: "",
        liveProgressLabel: "",
        allMet: false,
      };

    const req = activeStage.requirement;
    const metas: {
      label: string;
      current: string;
      target: string;
      pct: number;
      tone: ToneType;
    }[] = [];

    if (req.minBalance !== undefined) {
      const pct = Math.min(100, Math.round((balance / req.minBalance) * 100));
      metas.push({
        label: "Накопить баланс",
        current: balance.toLocaleString("ru-RU"),
        target: req.minBalance.toLocaleString("ru-RU"),
        pct,
        tone: pct >= 100 ? "safe" : "money",
      });
    }

    const portfolioValue = portfolio.reduce(
      (sum, row) => sum + row.qty * row.price,
      0,
    );
    if (req.minPortfolioValue !== undefined) {
      const pct = Math.min(
        100,
        Math.round((portfolioValue / req.minPortfolioValue) * 100),
      );
      metas.push({
        label: "Портфель акций",
        current: portfolioValue.toLocaleString("ru-RU"),
        target: req.minPortfolioValue.toLocaleString("ru-RU"),
        pct,
        tone: pct >= 100 ? "safe" : "money",
      });
    }

    if (req.minProfessionLevel !== undefined) {
      const current = characterProfile.professionLevel;
      const pct = Math.min(
        100,
        Math.round((current / req.minProfessionLevel) * 100),
      );
      metas.push({
        label: "Уровень профессии",
        current: String(current),
        target: String(req.minProfessionLevel),
        pct,
        tone: pct >= 100 ? "safe" : "skill",
      });
    }

    if (req.minReputation !== undefined) {
      const current = characterProfile.reputation;
      const pct = Math.min(
        100,
        Math.round((current / req.minReputation) * 100),
      );
      metas.push({
        label: "Репутация",
        current: current.toFixed(1),
        target: req.minReputation.toFixed(1),
        pct,
        tone: pct >= 100 ? "safe" : "info",
      });
    }

    for (const itemRef of req.requiredItems ?? []) {
      const owned = inventoryItems.some(
        (i) =>
          i.itemRef === itemRef &&
          (!i.isInstallment || i.isPaidOff),
      );
      const pct = owned ? 100 : 0;
      metas.push({
        label: formatReqItem(itemRef),
        current: owned ? "1" : "0",
        target: "1",
        pct,
        tone: owned ? "safe" : "warning",
      });
    }

    const stageNum = dream.currentStage + 1;
    const allDone = metas.length > 0 && metas.every((m) => m.pct >= 100);

    return {
      liveMetas: metas,
      liveTitle: dream.title,
      liveProgressLabel: `Этап ${stageNum} из ${dream.stages.length}`,
      allMet: allDone,
    };
  }, [dream, characterProfile, balance, portfolio, inventoryItems]);

  const hasRealData = liveMetas !== null && liveMetas.length > 0;
  const requirements = hasRealData
    ? liveMetas!
    : slide.dreamPreview.requirements.map((r) => {
        const currentNum = Number(r.current.replace(/\s/g, ""));
        const targetNum = Number(r.target.replace(/\s/g, ""));
        const pct =
          targetNum > 0
            ? Math.min(100, Math.round((currentNum / targetNum) * 100))
            : 50;
        return {
          label: r.label,
          current: r.current,
          target: r.target,
          pct,
          tone: r.tone,
        };
      });

  return (
    <div className="space-y-4">
      {/* Dream stage card in game style */}
      <div className="overflow-hidden rounded-xl border border-sky-500/20 bg-gradient-to-b from-sky-500/8 via-black/[0.12] to-black/[0.2]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-sky-500/10 px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[8px] font-black text-white">
              {hasRealData ? liveMetas!.length : 1}
            </div>
            <h4 className="text-sm font-bold text-white">
              {hasRealData ? liveTitle : slide.dreamPreview.title}
            </h4>
          </div>
          <span className="rounded bg-sky-500/12 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-sky-400">
            {hasRealData ? liveProgressLabel : slide.dreamPreview.progressLabel}
          </span>
        </div>

        {/* Requirements */}
        <div className="px-3.5 pb-3.5 pt-3 space-y-2">
          {requirements.map((req) => (
            <div
              key={req.label}
              className="rounded-lg border border-slate-600/30 bg-slate-700/20 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`h-3 w-3 shrink-0 rounded-full border-2 ${req.pct >= 100 ? "border-emerald-400 bg-emerald-400/20" : "border-slate-500/40"}`}
                  />
                  <span className="text-xs font-semibold text-slate-300">
                    {req.label}
                  </span>
                </div>
                <span
                  className={`shrink-0 text-[11px] font-bold tabular-nums ${toneText[req.tone]}`}
                >
                  {req.current} / {req.target}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-700/50">
                <div
                  className={`h-full rounded-full transition-all ${req.pct >= 100 ? "bg-emerald-400" : "bg-sky-500"}`}
                  style={{ width: `${Math.min(100, req.pct)}%` }}
                />
              </div>
            </div>
          ))}

          {/* Fake action button */}
          <div className="pt-0.5">
            <div
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-semibold ring-1 cursor-default ${
                allMet
                  ? "bg-amber-500/12 text-amber-300 ring-amber-500/20"
                  : "bg-slate-600/30 text-slate-400 ring-slate-600/30"
              }`}
            >
              <GraduationCapIcon className="h-3 w-3" />
              {allMet
                ? "Готово к завершению"
                : slide.dreamPreview.fakeActionLabel}
            </div>
          </div>
        </div>
      </div>

      <BulletList items={slide.bullets} />
      <TipBlock text={slide.note.text} />
    </div>
  );
}

function GraduationCapIcon({ className }: { className?: string }) {
  const Comp = ONBOARDING_ICONS["graduation-cap"];
  return <Comp className={className} />;
}

/* ---------- Slide 5: Advice cards + path ---------- */

function AdviceCardsSlideContent({
  slide,
}: {
  slide: Extract<OnboardingSlide, { layout: "advice-cards" }>;
}) {
  const pathSteps = slide.path;
  return (
    <div className="space-y-4">
      {/* Compact advice cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {slide.cards.map((card) => (
          <div
            key={card.title}
            className={`rounded-xl border ${toneBorder[card.tone]} ${toneBg[card.tone]} px-3 py-2.5`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <SlideIcon
                icon={card.icon}
                className={`h-4 w-4 ${toneText[card.tone]}`}
              />
              <h4 className="text-xs font-bold text-white">{card.title}</h4>
              <span
                className={`ml-auto rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${toneBg[card.tone]} ${toneText[card.tone]}`}
              >
                {card.badge}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {card.text}
            </p>
          </div>
        ))}
      </div>

      {/* Typical newbie path */}
      {!!pathSteps && pathSteps.length > 0 && (
        <div className="rounded-xl border border-slate-700/30 bg-slate-800/15 px-3.5 py-2.5">
          <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
            Типичный путь новичка
          </span>
          <div className="mt-1.5 flex items-center justify-center gap-0 flex-wrap">
            {pathSteps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-0">
                <div className="flex items-center gap-1 rounded-lg bg-slate-700/25 px-2 py-1">
                  <SlideIcon
                    icon={step.icon}
                    className="h-3 w-3 text-emerald-400"
                  />
                  <span className="text-[10px] font-semibold text-slate-300">
                    {step.label}
                  </span>
                </div>
                {i < pathSteps.length - 1 && (
                  <span className="mx-1 text-emerald-400/25 text-[10px]">
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <WarningBlock text={slide.warning} />
    </div>
  );
}

/* ---------- Slide 6: Guide final (denser) ---------- */

function GuideFinalSlideContent({
  slide,
}: {
  slide: Extract<OnboardingSlide, { layout: "guide-final" }>;
}) {
  return (
    <div className="flex flex-col justify-center flex-1 min-h-[180px] space-y-4">
      {/* Guide cards grid */}
      <div className="grid grid-cols-3 gap-2">
        {slide.guideCards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-slate-700/30 bg-slate-800/15 px-2.5 py-2.5 text-center transition hover:border-emerald-400/15"
          >
            <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-400/15 bg-emerald-400/8">
              <SlideIcon
                icon={card.icon}
                className="h-3.5 w-3.5 text-emerald-400"
              />
            </div>
            <h4 className="text-xs font-bold text-white leading-tight">
              {card.title}
            </h4>
            <p className="mt-0.5 text-[10px] text-slate-400 leading-tight">
              {card.text}
            </p>
          </div>
        ))}
      </div>

      <BulletList items={slide.bullets} />
    </div>
  );
}

/* ---------- Main component ---------- */

export function FirstRunOnboardingModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { completeOnboarding, skipOnboarding } = useTutorialStore();
  const [step, setStep] = useState(0);

  const current = ONBOARDING_SLIDES[step] as OnboardingSlide;
  const isLast = step === ONBOARDING_SLIDES.length - 1;

  const handleNext = useCallback(() => {
    if (isLast) {
      completeOnboarding();
      onClose();
    } else {
      setStep((s) => s + 1);
    }
  }, [isLast, completeOnboarding, onClose]);

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const handleSkip = useCallback(() => {
    skipOnboarding();
    onClose();
  }, [skipOnboarding, onClose]);

  const handleOpenGuide = useCallback(() => {
    completeOnboarding();
    onClose();
    useTutorialStore.getState().openGuideSection("quick-start");
  }, [completeOnboarding, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-hidden
      />

      <motion.div
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-emerald-400/15 bg-[rgb(15,23,42)]/95 shadow-[0_12px_48px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Close button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            type="button"
            onClick={handleSkip}
            aria-label="Пропустить знакомство"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-6 pt-7 pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-emerald-400/20">
          {/* Title */}
          <div className="mb-5 text-center">
            <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/15 bg-emerald-400/8 shadow-[0_0_20px_rgba(52,211,153,0.1)]">
              <SlideIcon
                icon={current.icon}
                className="h-5 w-5 text-emerald-400"
              />
            </div>
            <h2
              id="onboarding-title"
              className="text-lg font-bold tracking-tight text-white"
            >
              {current.title}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400 max-w-lg mx-auto">
              {current.subtitle}
            </p>
          </div>

          {/* Slide content — key drives React remount, no JS animations */}
          <div key={current.key}>
            {current.layout === "flow" && (
              <FlowSlideContent slide={current as any} />
            )}
            {current.layout === "forecast" && (
              <ForecastSlideContent slide={current as any} />
            )}
            {current.layout === "section-grid" && (
              <SectionGridSlideContent slide={current as any} />
            )}
            {current.layout === "dream-card" && (
              <DreamCardSlideContent slide={current as any} />
            )}
            {current.layout === "advice-cards" && (
              <AdviceCardsSlideContent slide={current as any} />
            )}
            {current.layout === "guide-final" && (
              <GuideFinalSlideContent slide={current as any} />
            )}
          </div>
        </div>

        {/* Fixed footer: dots + navigation */}
        <div className="shrink-0 border-t border-emerald-400/10 px-6 pt-3.5 pb-5">
          {/* Dots */}
          <div
            className="mb-3.5 flex items-center justify-center gap-2"
            role="group"
            aria-label="Прогресс шагов"
          >
            {ONBOARDING_SLIDES.map((_, i) => (
              <div
                key={i}
                aria-label={`Шаг ${i + 1} из ${ONBOARDING_SLIDES.length}`}
                className={`h-2 rounded-full transition-all duration-200 ${
                  i === step ? "w-6 bg-emerald-400" : "w-2 bg-slate-600"
                }`}
              />
            ))}
          </div>

          {/* Nav buttons */}
          <div className="flex items-center justify-between gap-4">
            {!isLast && (
              <GameButton variant="muted" size="md" onClick={handleBack}>
                Назад
              </GameButton>
            )}
            {isLast && (
              <div
                className="px-5 py-2.5 text-sm font-semibold text-transparent pointer-events-none"
                aria-hidden
              >
                Назад
              </div>
            )}

            <div className="flex items-center gap-3">
              {/* Guide button (only on last slide) */}
              {isLast && (
                <GameButton
                  variant="muted"
                  size="md"
                  onClick={handleOpenGuide}
                  className="flex gap-2 items-center"
                >
                  <BookOpenIcon className="h-4 w-4" />
                  {(current as any).actions?.secondary ?? "Открыть руководство"}
                </GameButton>
              )}

              {/* Next / Start */}
              <GameButton variant="action" size="md" onClick={handleNext}>
                {isLast ? "Начать игру" : "Далее"}
              </GameButton>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
