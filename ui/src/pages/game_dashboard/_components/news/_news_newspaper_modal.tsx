import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { GameModal } from '../../../../components/game_ui/floating'
import { GameButton } from '../../../../components/game_ui/game_button'
import { AssetImageFrame } from '../../../../shared/components'
import { useDashboardUi } from '../../_model/dashboard_ui_context'
import type { news_item } from '../../_model/types'
import {
  format_turns_left_label,
  is_insider_news,
} from '../../_model/utils'

const KIND_LABELS: Record<NonNullable<news_item['kind']>, string> = {
  WELCOME: 'Аккредитация',
  MARKET: 'Рынок',
  INSIDER: 'Инсайд',
  RUMOR: 'Слухи',
  OTC_DEAL: 'Внебиржа',
  PROPERTY_OFFER: 'Недвижимость',
  PROPERTY_DEAL: 'Сделка',
  PROPERTY_INSTALLMENT: 'Ипотека',
  STOCK_TRADE: 'Биржа',
}

function formatIssueDate(publishedAt: string) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(publishedAt))
  } catch {
    return 'Сегодня'
  }
}

function splitBodyParagraphs(body: string) {
  return body
    .split(/(?<=[.!?])\s+/)
    .reduce<string[]>((chunks, sentence) => {
      const last = chunks[chunks.length - 1]
      if (!last || last.length > 220) {
        chunks.push(sentence)
      } else {
        chunks[chunks.length - 1] = `${last} ${sentence}`
      }
      return chunks
    }, [])
}

function CornerOrnament({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute h-5 w-5 border-[#3d4a30]/55 ${className}`}
    />
  )
}

interface NewsNewspaperModalProps {
  item: news_item | null
  onClose: () => void
}

function PropertyOfferNewsExtras({
  item,
  onGoToOffer,
}: {
  item: news_item
  onGoToOffer: (offerId: string) => void
}) {
  const payload = item.payload as { offerId?: string; assetId?: string } | undefined
  if (!payload?.offerId) return null

  return (
    <div className="mt-5 flex flex-col items-center gap-4 border-t border-[#3d4a30]/15 pt-5">
      {payload.assetId ? (
        <AssetImageFrame
          assetId={payload.assetId}
          alt=""
          width="4rem"
          height="4rem"
          className="ring-2 ring-[#3d4a30]/25"
        />
      ) : null}
      <GameButton size="sm" onClick={() => onGoToOffer(payload.offerId!)}>
        Перейти к предложению
      </GameButton>
    </div>
  )
}

export function NewsNewspaperModal({ item, onClose }: NewsNewspaperModalProps) {
  const { openRealEstateTab } = useDashboardUi()
  const layout = useMemo(() => {
    if (!item) return null

    const paragraphs = splitBodyParagraphs(item.body)
    return {
      insider: is_insider_news(item),
      issueDate: formatIssueDate(item.publishedAt),
      paragraphs,
      // Две колонки только когда есть несколько абзацев — иначе второй столбец пустой
      useColumns: paragraphs.length >= 2,
    }
  }, [item])

  const open = Boolean(item && layout)

  return (
    <GameModal
      open={open}
      onClose={onClose}
      labelledBy="news-newspaper-title"
      zIndex={60}
      overlayClassName="bg-[#0d2818]/72 backdrop-blur-md"
      overlayExtra={
        <div
          aria-hidden
          className="h-full w-full bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.55)_100%)]"
        />
      }
      panelClassName="pointer-events-auto relative w-full max-w-lg outline-none sm:max-w-xl"
    >
      {item && layout ? (
        <motion.article
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={`relative flex max-h-[70vh] flex-col overflow-hidden rounded-xl shadow-[0_28px_60px_-12px_rgba(45,32,18,0.55)] ${
            layout.insider
              ? 'border border-[#8b7355]/70 ring-1 ring-[#8b7355]/25'
              : 'border border-[#3d4a30]/55 ring-1 ring-[#3d4a30]/20'
          }`}
          style={{
            background: layout.insider
              ? 'linear-gradient(165deg, #f7f0df 0%, #f5f0e0 45%, #efe8d4 100%)'
              : 'linear-gradient(165deg, #f7f2e4 0%, #f5f0e0 50%, #efe9d8 100%)',
          }}
        >
          <CornerOrnament className="left-4 top-4 border-l-2 border-t-2" />
          <CornerOrnament className="bottom-4 left-4 border-b-2 border-l-2" />
          <CornerOrnament className="bottom-4 right-4 border-b-2 border-r-2" />

          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#3d4a30]/20 bg-[#f5f0e0]/80 font-serif text-lg leading-none text-[#3d3a32] transition hover:border-[#3d4a30]/40 hover:bg-[#ebe4d0]"
            aria-label="Закрыть выпуск"
          >
            ×
          </button>

          <header className="relative shrink-0 border-b border-[#3d4a30]/20 px-6 pb-4 pt-6 sm:px-8 sm:pt-7">
            <p className="text-center font-serif text-[10px] font-semibold uppercase tracking-[0.35em] text-[#5c5748]">
              Night Session Press
            </p>
            <div className="my-2 h-px bg-gradient-to-r from-transparent via-[#3d4a30]/35 to-transparent" />
            <h2 className="text-center font-serif text-lg font-bold uppercase tracking-[0.22em] text-[#2f2c26] sm:text-xl">
              Financial Chronicle
            </h2>
            <p className="mt-1.5 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-[#6b6558]">
              {layout.issueDate}
              {item.kind ? ` · ${KIND_LABELS[item.kind]}` : ''}
              {item.ticker ? ` · ${item.ticker}` : ''}
            </p>
          </header>

          <div className="relative min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8">
            <h3
              id="news-newspaper-title"
              className="font-serif text-2xl font-bold leading-tight text-[#2a2822] sm:text-[1.65rem]"
            >
              {item.title}
            </h3>

            {layout.insider && item.turnsLeft != null ? (
              <p className="mt-3 inline-block border border-[#8b7355]/45 bg-[#8b7355]/10 px-2.5 py-1 font-serif text-xs font-semibold uppercase tracking-[0.12em] text-[#5c4a32]">
                Инсайд · {format_turns_left_label(item.turnsLeft)} до события
              </p>
            ) : null}

            <div
              className={`mt-4 gap-x-6 gap-y-3 font-serif text-[15px] leading-[1.65] text-[#3d3a32] ${
                layout.useColumns ? 'columns-1 sm:columns-2' : 'columns-1'
              }`}
            >
              {layout.paragraphs.map((paragraph, index) => (
                <p key={index} className="break-inside-avoid">
                  {index === 0 ? (
                    <span className="float-left mr-1.5 font-serif text-4xl font-bold leading-none text-[#3d4a30]">
                      {paragraph.charAt(0)}
                    </span>
                  ) : null}
                  {index === 0 ? paragraph.slice(1) : paragraph}
                </p>
              ))}
            </div>

            {item.kind === 'PROPERTY_OFFER' ? (
              <PropertyOfferNewsExtras
                item={item}
                onGoToOffer={(offerId) => {
                  onClose()
                  openRealEstateTab(offerId)
                }}
              />
            ) : null}
          </div>

          <footer className="relative shrink-0 border-t border-[#3d4a30]/15 px-6 py-3 sm:px-8">
            <p className="text-center font-serif text-[10px] uppercase tracking-[0.2em] text-[#7a7468]">
              {item.timeLabel} · закрыть — Esc
            </p>
          </footer>
        </motion.article>
      ) : null}
    </GameModal>
  )
}
