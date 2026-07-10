import { motion } from 'framer-motion'
import type {
  CharacterDreamPreview,
  CharacterDreamPreviewRequirement,
  CharacterDreamStages,
} from '../../../stores/characters.store'
import { DreamRequirementChip } from './_dream_requirement_chip'
import {
  buildDreamRequirementsPreview,
  limitDreamRequirementsPreview,
} from './_dream_requirements'

interface DreamPathPreviewProps {
  preview?: CharacterDreamPreview
  dreamStages?: CharacterDreamStages
}

function PreviewStageMarker({
  variant,
  showLineAbove,
  showLineBelow,
}: {
  variant: 'start' | 'default' | 'final'
  showLineAbove: boolean
  showLineBelow: boolean
}) {
  const ring =
    variant === 'start'
      ? 'border-sky-400 bg-sky-500/90 ring-2 ring-sky-500/30'
      : variant === 'final'
        ? 'border-amber-400/80 bg-amber-500/20 ring-2 ring-amber-500/15'
        : 'border-slate-600 bg-slate-700/90'

  const dot =
    variant === 'start'
      ? 'bg-white'
      : variant === 'final'
        ? 'bg-amber-300'
        : 'bg-slate-400'

  return (
    <div className="relative flex w-4 shrink-0 items-center justify-center self-stretch">
      {showLineAbove && (
        <div className="absolute left-1/2 top-0 h-1/2 w-px -translate-x-1/2 bg-slate-700/45" />
      )}
      <div className={`relative z-10 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${ring}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      </div>
      {showLineBelow && (
        <div className="absolute bottom-0 left-1/2 top-1/2 w-px -translate-x-1/2 bg-slate-700/45" />
      )}
    </div>
  )
}

function StagePreviewCard({
  stage,
  variant,
  requirements,
}: {
  stage: CharacterDreamPreview['stages'][number]
  variant: 'start' | 'default' | 'final'
  requirements: CharacterDreamPreviewRequirement[]
}) {
  const cardClass =
    variant === 'start'
      ? 'border-sky-500/30 bg-gradient-to-r from-sky-500/10 via-slate-800/50 to-slate-800/30 shadow-[0_0_20px_rgba(56,189,248,0.08)]'
      : variant === 'final'
        ? 'border-amber-500/25 bg-gradient-to-r from-amber-500/8 via-slate-800/45 to-slate-800/25'
        : 'border-slate-700/45 bg-slate-800/35'

  const labelClass =
    variant === 'start'
      ? 'text-sky-400/90'
      : variant === 'final'
        ? 'text-amber-400/85'
        : 'text-slate-500'

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 transition-colors hover:border-slate-500/50 ${cardClass}`}
    >
      <div className="flex items-center gap-2">
        <p className={`text-[9px] font-bold uppercase tracking-[0.14em] ${labelClass}`}>
          Этап {stage.order}
        </p>
        {variant === 'start' && (
          <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-sky-300/90">
            Старт
          </span>
        )}
        {variant === 'final' && (
          <span className="rounded bg-amber-500/12 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-amber-300/90">
            Финал
          </span>
        )}
      </div>
      <p className="mt-0.5 text-sm font-semibold leading-snug text-slate-100">{stage.title}</p>
      <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-400">{stage.description}</p>
      {requirements.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {requirements.map((requirement, index) => (
            <DreamRequirementChip
              key={`${stage.order}-${requirement.kind}-${requirement.label}-${index}`}
              requirement={requirement}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function DreamPathPreview({ preview, dreamStages }: DreamPathPreviewProps) {
  if (!preview) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/50 bg-slate-800/30 px-4 py-8 text-center">
        <p className="text-sm font-medium text-slate-400">Мечта скоро будет добавлена</p>
      </div>
    )
  }

  return (
    <motion.section
      className="flex min-h-0 flex-1 flex-col gap-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-400/85">
        Путь к мечте
      </h3>

      <div className="rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-slate-800/90 via-slate-800/70 to-slate-900/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-400/75">Мечта</p>
            <h4 className="mt-0.5 text-lg font-bold leading-tight text-white">{preview.title}</h4>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{preview.description}</p>
            <p className="mt-2 text-[10px] font-medium text-slate-500">{preview.pathHint}</p>
          </div>
          <div className="shrink-0 rounded-xl border border-slate-600/40 bg-slate-900/50 px-2.5 py-1.5 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Этапов</p>
            <p className="text-base font-black text-white">{preview.stageCount}</p>
          </div>
        </div>
      </div>

      <div className="game-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {preview.stages.map((stage, index) => {
          const variant = index === 0 ? 'start' : stage.isFinal ? 'final' : 'default'
          const requirements = limitDreamRequirementsPreview(
            dreamStages?.stages[index]
              ? buildDreamRequirementsPreview(dreamStages.stages[index])
              : stage.requirementsPreview ?? [],
          )

          return (
            <div key={stage.order} className="flex gap-2.5">
              <PreviewStageMarker
                variant={variant}
                showLineAbove={index > 0}
                showLineBelow={index < preview.stages.length - 1}
              />
              <div className="min-w-0 flex-1 pb-1.5">
                <StagePreviewCard stage={stage} variant={variant} requirements={requirements} />
              </div>
            </div>
          )
        })}
      </div>
    </motion.section>
  )
}
