import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../../../stores/game.store'
import { useDashboardUi } from '../../_model/dashboard_ui_context'
import { type DreamStageResponse } from '../../../../api/dreams'
import { DashboardCard } from '../shared'
import { GameButton } from '../../../../components/game_ui/game_button'
import {
  CoinIcon,
  GraduationCapIcon,
  LockIcon,
  StarIcon,
} from '../../../../shared/icons'
import { getRequirementMetas, getActionsForRequirement, isAllMet, type PlayerState, type RequirementMeta } from './_helpers'
import { calcPaybackPct } from '../../_model/game_mappers'
import type { dashboard_tab } from '../../_model/types'

/* ---------- icons ---------- */

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M13.78 4.22a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06 0L2.22 9.78a.75.75 0 011.06-1.06L5.5 11.94l6.72-6.72a.75.75 0 011.06 0z" />
    </svg>
  )
}

/* ---------- ActionCta ---------- */

function ActionCta({ label, tab, icon }: { label: string; tab: dashboard_tab; icon: React.ReactNode }) {
  const { setActiveTab } = useDashboardUi()
  return (
    <button
      onClick={() => setActiveTab(tab)}
      className="inline-flex items-center gap-1 rounded-lg bg-sky-500/12 px-2.5 py-1 text-[11px] font-semibold text-sky-400 ring-1 ring-sky-500/20 transition hover:bg-sky-500/20 hover:ring-sky-500/30"
    >
      {icon}
      {label}
    </button>
  )
}

/* ---------- timeline marker ---------- */

function StageMarker({ status, connected }: { status: DreamStageResponse['status']; connected: boolean }) {
  const isCompleted = status === 'COMPLETED'
  const isActive = status === 'ACTIVE' || status === 'READY_TO_COMPLETE'
  return (
    <div className="flex flex-col items-center">
      {connected && <div className="h-4 w-px bg-slate-700/30" />}
      <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
        isCompleted
          ? 'border-emerald-400 bg-emerald-500'
          : isActive
            ? 'border-sky-400 bg-sky-500 ring-4 ring-sky-500/25'
            : 'border-slate-600 bg-slate-700'
      }`}>
        {isCompleted ? (
          <CheckIcon className="h-3 w-3 text-white" />
        ) : isActive ? (
          <GraduationCapIcon className="h-3 w-3 text-white" />
        ) : (
          <LockIcon className="h-3 w-3 text-slate-400" />
        )}
      </div>
      {connected && <div className="h-full w-px bg-slate-700/30" />}
    </div>
  )
}

/* ---------- RequirementProgress ---------- */

function formatGradeValue(level: number): string {
  const grades = ['F', 'E', 'D', 'C', 'B', 'A']
  return grades[Math.max(0, Math.min(level - 1, grades.length - 1))] ?? 'F'
}

function RequirementProgress({ meta }: { meta: RequirementMeta }) {
  const pct = meta.progress
    ? Math.min(100, Math.round((meta.progress.current / meta.progress.target) * 100))
    : meta.met ? 100 : 0

  const isMoneyKey = meta.key === 'balance' || meta.key === 'portfolio'
  const displayValue = meta.progress && meta.displayFormat === 'grade'
    ? `${formatGradeValue(meta.progress.current)} / ${formatGradeValue(meta.progress.target)}`
    : meta.progress && meta.key === 'items'
      ? `${pct}%`
      : meta.progress
        ? `${meta.progress.current.toLocaleString('ru-RU')} / ${meta.progress.target.toLocaleString('ru-RU')}`
        : ''

  return (
    <div className={`rounded-lg border px-3 py-2 ${
      meta.met
        ? 'border-emerald-500/20 bg-emerald-500/6'
        : 'border-slate-600/30 bg-slate-700/25'
    }`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {meta.met ? (
            <CheckIcon className="h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <span className="h-4 w-4 shrink-0 rounded-full border-2 border-slate-500/40" />
          )}
          <div className="flex items-center gap-1.5 min-w-0">
            {meta.icon}
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-200">{meta.label}</p>
              {meta.progress && (
                <p className="text-xs font-semibold text-slate-400 tabular-nums">
                  {isMoneyKey && (
                    <CoinIcon className="mr-0.5 inline-block h-3 w-3 -translate-y-0.5 text-amber-400/70" />
                  )}
                  {displayValue}
                </p>
              )}
            </div>
          </div>
        </div>
        {meta.progress && (
          <span className={`text-sm font-extrabold tabular-nums ${
            meta.met ? 'text-emerald-400' : 'text-slate-300'
          }`}>
            {pct}%
          </span>
        )}
      </div>
      {meta.progress && (
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-700/50">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              meta.met ? 'bg-emerald-400' : 'bg-sky-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

/* ---------- CompletedStageCard ---------- */

function CompletedStageCard({ stage, index }: { stage: DreamStageResponse; index: number }) {
  return (
    <div className="rounded-xl border border-emerald-500/15 bg-gradient-to-r from-emerald-500/5 to-black/[0.15] px-4 py-3 transition hover:border-emerald-500/25">
      <div className="flex items-center gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-400/70">
          Этап {index + 1}
        </p>
        <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400/80">
          Завершён
        </span>
        {stage.completedTurn != null && (
          <span className="ml-auto text-[10px] text-slate-600">
            Ход {stage.completedTurn}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">
        {stage.requirement.description}
      </p>
    </div>
  )
}

/* ---------- ActiveStageCard ---------- */

function ActiveStageCard({
  stage,
  index,
  metas,
  allMet,
  onCheck,
  onFulfill,
  isLast,
  isFulfillReady,
}: {
  stage: DreamStageResponse
  index: number
  metas: RequirementMeta[]
  allMet: boolean
  onCheck: () => void
  onFulfill: () => void
  isLast: boolean
  isFulfillReady: boolean
}) {
  const actions = getActionsForRequirement(stage.requirement)
  const isReady = stage.status === 'READY_TO_COMPLETE'

  return (
    <div className="rounded-xl border border-sky-500/25 bg-gradient-to-b from-sky-500/8 via-black/[0.15] to-black/[0.25] px-4 py-3.5 shadow-lg shadow-sky-500/5">
      {/* header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-[10px] font-black text-white">
            {index + 1}
          </span>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-sky-400/80">
            Этап {index + 1}
          </p>
          {isReady && (
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400 animate-pulse">
              Готово
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium text-slate-500">
          {metas.length} {metas.length === 1 ? 'требование' : metas.length < 5 ? 'требования' : 'требований'}
        </span>
      </div>

      {/* description */}
      <p className="mt-1 text-sm leading-snug text-slate-200">
        {stage.requirement.description}
      </p>

      {/* progress line */}
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-700/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${allMet ? 100 : Math.round((metas.filter(m => m.met).length / Math.max(metas.length, 1)) * 100)}%` }}
        />
      </div>
      <p className="mt-0.5 text-[10px] text-slate-500">
        {allMet
          ? 'Все требования выполнены'
          : `${metas.filter(m => m.met).length} из ${metas.length} выполнено`
        }
      </p>

      {/* requirement blocks */}
      <div className="mt-3 space-y-2">
        {metas.map((m) => (
          <RequirementProgress key={m.key} meta={m} />
        ))}
      </div>

      {/* cta actions */}
      {actions.length > 0 && !allMet && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {actions.map((a) => (
            <ActionCta key={a.tab} label={a.label} tab={a.tab} icon={a.icon} />
          ))}
        </div>
      )}

      {/* check / fulfill button */}
      <div className="mt-3">
        {isReady ? (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
            <GameButton
              variant="action"
              size="md"
              fullWidth
              onClick={isLast && isFulfillReady ? onFulfill : onCheck}
            >
              <span className="flex items-center justify-center gap-1.5">
                {isLast && isFulfillReady ? (
                  <><StarIcon className="h-4 w-4" /> Исполнить мечту</>
                ) : (
                  <><GraduationCapIcon className="h-4 w-4" /> Завершить этап</>
                )}
              </span>
            </GameButton>
          </motion.div>
        ) : (
          <GameButton
            variant="action"
            size="md"
            fullWidth
            disabled
          >
            <span className="flex items-center justify-center gap-1.5">
              <GraduationCapIcon className="h-4 w-4" />
              Проверить требования
            </span>
          </GameButton>
        )}
      </div>
    </div>
  )
}

/* ---------- LockedStageCard ---------- */

function LockedStageCard({ stage, index }: { stage: DreamStageResponse; index: number }) {
  return (
    <div className="rounded-xl border border-slate-700/30 bg-gradient-to-r from-black/[0.08] to-black/[0.15] px-4 py-3 opacity-60 transition hover:opacity-80">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
        Этап {index + 1}
      </p>
      <p className="mt-0.5 text-xs text-slate-600 line-clamp-1">
        {stage.requirement.description}
      </p>
    </div>
  )
}

/* ---------- DreamPanel ---------- */

export function DreamPanel() {
  const gameId = useGameStore((state) => state.gameId)
  const storeDream = useGameStore((state) => state.dream)
  const loadDream = useGameStore((state) => state.loadDream)
  const completeStageStore = useGameStore((state) => state.completeDreamStage)
  const fulfillDreamStore = useGameStore((state) => state.fulfillDream)
  const balance = useGameStore((state) => state.balance)
  const reputation = useGameStore((state) => state.characterProfile.reputation)
  const professionLevel = useGameStore((state) => state.characterProfile.professionLevel)
  const tradingLevel = useGameStore((state) => state.characterProfile.tradingLevel)
  const bankingLevel = useGameStore((state) => state.characterProfile.bankingLevel)
  const portfolio = useGameStore((state) => state.portfolio)
  const inventoryItems = useGameStore((state) => state.inventoryItems)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fulfilled, setFulfilled] = useState(false)

  useEffect(() => {
    if (!gameId) return
    setLoading(true)
    setError(null)
    loadDream()
      .catch((e) => {
        setError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => setLoading(false))
  }, [gameId, loadDream])

  const dream = storeDream

  const portfolioValue = useMemo(
    () => portfolio.reduce((sum, row) => sum + row.qty * row.price, 0),
    [portfolio],
  )

  const playerState: PlayerState = useMemo(() => {
    const inventoryPaymentPct: Record<string, number> = {}
    for (const item of inventoryItems) {
      const pct = calcPaybackPct(item)
      if (pct > (inventoryPaymentPct[item.itemRef] ?? -1)) {
        inventoryPaymentPct[item.itemRef] = pct
      }
    }
    return {
      balance,
      portfolioValue,
      reputation,
      tradingLevel,
      professionLevel,
      bankingLevel,
      inventoryRefs: inventoryItems.map((i) => i.itemRef),
      inventoryPaymentPct,
      hasActiveInstallments: inventoryItems.some((i) => i.isInstallment && !i.isPaidOff),
    }
  }, [balance, portfolioValue, reputation, tradingLevel, professionLevel, bankingLevel, inventoryItems])

  const completeStage = async () => {
    if (!gameId || !dream) return
    try {
      await completeStageStore()
    } catch {
      // ignore
    }
  }

  const fulfill = async () => {
    if (!gameId || !dream) return
    try {
      await fulfillDreamStore()
      setFulfilled(true)
    } catch {
      // ignore
    }
  }

  if (fulfilled) {
    return (
      <div className="flex h-full flex-col gap-4 p-4 pb-6 md:p-5 md:pb-8">
        <DashboardCard>
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 14 }}
            >
              <StarIcon className="h-12 w-12 text-amber-400" />
            </motion.div>
            <h2 className="text-xl font-bold text-white">Мечта исполнена!</h2>
            <p className="text-sm text-slate-400">Вы достигли своей цели. Поздравляем!</p>
          </div>
        </DashboardCard>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-4 p-4 pb-6 md:p-5 md:pb-8">
        <DashboardCard>
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
            <p className="text-sm font-medium text-slate-400">Загрузка мечты...</p>
          </div>
        </DashboardCard>
      </div>
    )
  }

  if (!dream) {
    return (
      <div className="flex h-full flex-col gap-4 p-4 pb-6 md:p-5 md:pb-8">
        <DashboardCard>
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <span className="text-4xl">💭</span>
            <p className="text-sm font-medium text-slate-400">У вас пока нет мечты</p>
            <p className="text-xs text-slate-600">Мечта появится после первой игровой сессии</p>
            {error && <p className="mt-2 text-xs text-red-400">Ошибка: {error}</p>}
          </div>
        </DashboardCard>
      </div>
    )
  }

  const stages = dream.stages
  const completedCount = stages.filter((s) => s.status === 'COMPLETED').length
  const isFulfillReady = stages.every((s) => s.status === 'COMPLETED')
  const activeStage = stages.find((s) => s.status === 'ACTIVE' || s.status === 'READY_TO_COMPLETE')

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 pb-6 md:p-5 md:pb-8">
      {/* ===== Dream Summary ===== */}
      <DashboardCard>
        <div className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-400/70">
                Мечта
              </p>
              <h2 className="mt-0.5 text-xl font-bold text-white">{dream.title}</h2>
              <p className="mt-0.5 text-sm text-slate-400">{dream.description}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Этап</p>
              <p className="text-lg font-black text-white">
                {dream.currentStage + 1}
                <span className="text-sm font-medium text-slate-500">/{stages.length}</span>
              </p>
            </div>
          </div>

          {/* progress bar */}
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-700/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${(completedCount / stages.length) * 100}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-600">
            <span>{completedCount} из {stages.length} завершено</span>
            {activeStage && (
              <span className="text-sky-400">
                Следующий этап: {activeStage.requirement.description.slice(0, 30)}...
              </span>
            )}
          </div>

          {/* mini stat — only balance */}
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-700/20 px-3 py-2">
            <CoinIcon className="h-4 w-4 text-amber-400" />
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Баланс</span>
            <span className="ml-auto text-sm font-bold text-white tabular-nums">
              {balance.toLocaleString('ru-RU')}
            </span>
          </div>
        </div>
      </DashboardCard>

      {/* ===== Timeline + Stages ===== */}
      <div className="flex flex-col gap-1">
        {stages.map((stage, i) => {
          const metas = stage.status === 'ACTIVE' || stage.status === 'READY_TO_COMPLETE'
            ? getRequirementMetas(stage.requirement, playerState)
            : []
          const allMet = isAllMet(metas)
          const isLast = i === stages.length - 1

          return (
            <div key={stage.stageIndex} className="flex gap-3">
              {/* timeline marker */}
              <div className="flex shrink-0 flex-col items-center pt-1">
                <StageMarker status={stage.status} connected={i > 0} />
                {!isLast && <div className="flex-1 w-px bg-slate-700/30 min-h-[8px]" />}
              </div>

              {/* stage card */}
              <div className="min-w-0 flex-1 pb-1">
                {stage.status === 'COMPLETED' ? (
                  <CompletedStageCard stage={stage} index={i} />
                ) : stage.status === 'ACTIVE' || stage.status === 'READY_TO_COMPLETE' ? (
                  <ActiveStageCard
                    stage={stage}
                    index={i}
                    metas={metas}
                    allMet={allMet}
                    onCheck={completeStage}
                    onFulfill={fulfill}
                    isLast={isLast}
                    isFulfillReady={isFulfillReady}
                  />
                ) : (
                  <LockedStageCard stage={stage} index={i} />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
