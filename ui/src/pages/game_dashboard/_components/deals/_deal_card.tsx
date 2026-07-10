import { useState } from 'react'
import { GameButton } from '../../../../components/game_ui/game_button'
import { MoneyValue } from '../../../../components/money/money_value'
import { AssetImageFrame, GradeBadge } from '../../../../shared/components'
import { getBotAvatar } from '../../../../constants/botAvatars'
import { UserIcon, BarChartIcon, DealArrowIcon, ChatBubbleIcon, CoinIcon, LockOutlineIcon, StarIcon } from '../../../../shared/icons'
import { format_turns_left_label } from '../../_model/utils'
import { PROFESSION_LABELS } from '../../../../constants/professions'
import { TRADING_GRADES } from '../character/_character_skills'
import type { DealOfferPayload } from '../../../../api/gameTurn'
import { useGameStore } from '../../../../stores/game.store'
import { formatDealPurposeLabel } from './_deal_purpose'

function BotAvatar({ src, name }: { src?: string; name: string }) {
  const [failed, setFailed] = useState(false)
  const showImage = src && !failed

  return (
    <div className="relative h-12 w-12 shrink-0">
      {showImage ? (
        <img
          src={src}
          alt={name}
          onError={() => setFailed(true)}
          className="h-12 w-12 rounded-full object-cover ring-2 ring-white/10"
        />
      ) : (
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 ring-2 ring-white/10"
          aria-hidden
        >
          <UserIcon className="h-5 w-5 text-slate-500" />
        </div>
      )}
    </div>
  )
}

function CashCard({ amount }: { amount: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-3.5 py-2 ring-1 ring-amber-500/25">
      <MoneyValue amount={amount} size="sm" color="amber" />
    </span>
  )
}

function StockCard({ ticker, shares }: { ticker?: string; shares?: number; companyName?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/12 px-3.5 py-2 ring-1 ring-cyan-500/25">
      <BarChartIcon className="h-3.5 w-3.5 text-cyan-400" />
      <span className="font-mono text-sm font-bold text-cyan-200">{ticker ?? ''}</span>
      <span className="text-sm font-bold text-cyan-300/80">x{shares ?? 0}</span>
    </span>
  )
}

function PropertyCard({ propertyId, propertyName, estimatedValue }: {
  propertyId?: string; propertyName?: string; estimatedValue: number
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/12 px-3.5 py-2 ring-1 ring-emerald-500/25">
      <div className="h-5 w-5 shrink-0 overflow-hidden rounded">
        <AssetImageFrame
          assetId={propertyId}
          alt={propertyName ?? ''}
          size="paid"
          width={20}
          height={20}
          decorations={false}
        />
      </div>
      <span className="truncate text-sm font-semibold text-emerald-200">{propertyName ?? ''}</span>
      <MoneyValue amount={estimatedValue} size="xs" color="emerald" />
    </span>
  )
}

function AssetCard({ asset }: { asset: DealOfferPayload['botGives']['assets'][number] }) {
  if (asset.type === 'CASH') return <CashCard amount={asset.cashAmount ?? 0} />
  if (asset.type === 'STOCK') return <StockCard ticker={asset.ticker} shares={asset.shares} companyName={asset.companyName} />
  return <PropertyCard propertyId={asset.propertyId} propertyName={asset.propertyName} estimatedValue={asset.estimatedValue} />
}

interface DealCardProps {
  deal: DealOfferPayload
  onAccept: (dealId: string) => void
  disabled?: boolean
}

export function DealCard({ deal, onAccept, disabled }: DealCardProps) {
  const lastTurn = deal.expiresInTurns <= 1
  const unfavorable = deal.botGives.totalEstimatedValue < deal.playerGives.totalEstimatedValue
  const professionLabel = PROFESSION_LABELS[deal.botProfession as keyof typeof PROFESSION_LABELS] ?? deal.botProfession
  const tradingLevel = useGameStore((state) => state.characterProfile.tradingLevel)
  const insufficientTrading = deal.requiredTradingLevel > tradingLevel
  const purposeLabel = formatDealPurposeLabel(deal.purpose)

  return (
    <article
      className={`group relative flex w-full flex-col transition-all duration-200 hover:-translate-y-1 ${
        lastTurn
          ? ''
          : 'hover:z-30'
      }`}
    >
      <div className={`relative flex w-full flex-col overflow-hidden rounded-2xl border transition-all duration-200 ${
        lastTurn
          ? 'border-yellow-500/40 shadow-[0_0_24px_rgba(234,179,8,0.10)]'
          : 'border-slate-600/55 shadow-[0_10px_28px_rgba(0,0,0,0.38),0_2px_0_rgba(15,23,42,0.85)] hover:border-slate-500/65 hover:shadow-[0_16px_36px_rgba(0,0,0,0.45),0_3px_0_rgba(15,23,42,0.9)] hover:ring-1 hover:ring-slate-400/20'
      }`}>
        {/* Glass highlight overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.04] transition duration-200 group-hover:ring-white/[0.08]" />

        {/* Top accent line */}
        <div className="absolute left-0 right-0 top-0 z-10 h-0.5 bg-gradient-to-r from-teal-400/30 via-teal-400/40 to-teal-400/30 transition-opacity duration-200 group-hover:from-teal-400/50 group-hover:via-teal-400/60 group-hover:to-teal-400/50" />

        {/* Top rail */}
        <div className="relative z-20 flex items-center justify-between gap-2 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.05] to-black/[0.12] px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="hidden h-1.5 w-1.5 rounded-full bg-red-400/55 sm:inline" aria-hidden />
          <span className="hidden h-1.5 w-1.5 rounded-full bg-amber-400/55 sm:inline" aria-hidden />
          <span className="hidden h-1.5 w-1.5 rounded-full bg-emerald-600/45 sm:inline" aria-hidden />
          <DealArrowIcon direction="buy" className="ml-1.5 h-3.5 w-3.5 text-teal-400/90" />
          <span className="font-mono text-[9px] font-extrabold uppercase tracking-[0.14em] text-teal-300">
            Сделка
          </span>
          {purposeLabel && (
            <>
              <span className="text-[10px] text-slate-500/60" aria-hidden>&middot;</span>
              <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400/90">
                {purposeLabel}
              </span>
            </>
          )}
          <span className="text-[10px] text-slate-500/60" aria-hidden>&middot;</span>
          <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-500/75">
            {professionLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] font-bold tracking-wide ${
              lastTurn
                ? 'animate-pulse border-yellow-500/40 bg-yellow-500/15 text-yellow-200'
                : 'border-slate-600/50 bg-slate-700/50 text-slate-300'
            }`}
          >
            {lastTurn ? 'Последний шанс' : format_turns_left_label(deal.expiresInTurns)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold ring-1 ring-amber-500/25 text-amber-300">
            <StarIcon className="h-3 w-3 text-amber-400" />
            {deal.requiredReputation.toFixed(1)}
          </span>
          <GradeBadge grade={TRADING_GRADES[deal.requiredTradingLevel - 1] ?? 'F'} />
        </div>
      </div>

      {/* Bot info + stats */}
      <div className="relative z-10 flex items-center gap-3 px-3 pt-3">
        <BotAvatar src={getBotAvatar(deal.botName, deal.botProfession as never)} name={deal.botName} />
        <div className="min-w-0">
          <p className="truncate font-bold text-white">{deal.botName}</p>
          <p className="truncate text-xs text-slate-400">{professionLabel}</p>
        </div>
      </div>

      {/* Exchange block */}
      <div className="relative z-10 mt-3 grid grid-cols-1 gap-3 px-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-0">
        {/* You give */}
        <div className="rounded-xl border border-white/[0.06] bg-gradient-to-b from-black/[0.22] to-black/[0.35] p-2.5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.28)] sm:mr-2">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-400/90">
            Вы отдаёте
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {deal.playerGives.assets.map((asset, i) => (
              <AssetCard key={i} asset={asset} />
            ))}
          </div>
          <div className="mt-2 flex items-center justify-end gap-1.5">
            <CoinIcon className="h-4 w-4 text-amber-400/80" />
            <span className="text-base font-bold text-amber-300">{deal.playerGives.totalEstimatedValue.toLocaleString('ru-RU')}</span>
          </div>
        </div>

        {/* Exchange arrow (between columns) */}
        <div className="hidden items-center justify-center sm:flex">
          <div className="flex h-6 w-14 items-center justify-center rounded-full bg-slate-800/80 ring-1 ring-white/[0.06]">
            <svg viewBox="0 0 24 12" className="h-3.5 w-7 text-teal-400/70" fill="none" aria-hidden>
              <path d="M1 6h20M17 2l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* You receive */}
        <div className="rounded-xl border border-white/[0.06] bg-gradient-to-b from-black/[0.22] to-black/[0.35] p-2.5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.28)] sm:ml-2">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-400/90">
            Вы получаете
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {deal.botGives.assets.map((asset, i) => (
              <AssetCard key={i} asset={asset} />
            ))}
          </div>
          <div className="mt-2 flex items-center justify-end gap-1.5">
            <CoinIcon className={`h-4 w-4 ${unfavorable ? 'text-red-400/80' : 'text-emerald-400/80'}`} />
            <span className={`text-base font-bold ${unfavorable ? 'text-red-300' : 'text-emerald-300'}`}>{deal.botGives.totalEstimatedValue.toLocaleString('ru-RU')}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-2 border-t border-white/[0.06] px-3 pb-3 pt-2.5">

        {/* Actions panel */}
        <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-b from-slate-900/55 to-slate-950/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          {insufficientTrading ? (
            <div className="p-1.5">
              <GameButton
                variant="muted"
                size="md"
                fullWidth
                disabled
                className="flex h-11 min-h-[2.75rem] w-full cursor-not-allowed items-center justify-center gap-1.5 border border-slate-400/22 text-[10px] font-bold uppercase leading-none tracking-[0.06em] text-slate-300 opacity-80"
              >
                <LockOutlineIcon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                <span>Нужен ранг {TRADING_GRADES[deal.requiredTradingLevel - 1] ?? 'F'}</span>
              </GameButton>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 p-1.5">
              <GameButton variant="muted" size="md" fullWidth disabled className="flex h-11 min-h-[2.75rem] items-center justify-center gap-1.5 border border-slate-400/22 text-slate-200">
                <ChatBubbleIcon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                <span>Торговаться</span>
              </GameButton>
              <GameButton variant="emerald" size="md" fullWidth onClick={() => onAccept(deal.id)} disabled={disabled} className="flex h-11 min-h-[2.75rem] items-center justify-center gap-1.5">
                <CoinIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>Принять</span>
              </GameButton>
            </div>
          )}
        </div>
      </div>
      </div>
    </article>
  )
}
