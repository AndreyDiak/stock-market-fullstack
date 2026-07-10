import { useMemo, useState } from 'react'
import type { StockListing } from '../../../../api/stocks'
import type { news_item, portfolio_row } from '../../_model/types'
import { formatSectorLabel } from './_stock_grade_config'
import { getSectorIcon } from './_sector_icons'
import { find_latest_market_news, format_change } from '../../_model/utils'
import { MoneyValue } from '../../../../components/money/money_value'
import { motion, AnimatePresence } from 'framer-motion'

const SECTOR_COLORS: Record<string, string> = {
  TECHNOLOGY: '#38bdf8',
  HEALTHCARE: '#fb7185',
  FINANCE: '#fbbf24',
  AGRICULTURE: '#34d399',
  ENERGY: '#a78bfa',
}

const SECTOR_COLORS_DIM: Record<string, string> = {
  TECHNOLOGY: '#0e7490',
  HEALTHCARE: '#be185d',
  FINANCE: '#a16207',
  AGRICULTURE: '#047857',
  ENERGY: '#6d28d9',
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0

  return [
    'M', cx, cy,
    'L', start.x, start.y,
    'A', r, r, 0, largeArc, 0, end.x, end.y,
    'Z',
  ].join(' ')
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  }
}

interface SectorCount {
  sector: string
  count: number
  tickers: string[]
}

interface AnalyticsTabProps {
  stockListings: StockListing[]
  portfolio: portfolio_row[]
  news: news_item[]
  turn: number
  openNewsTab: () => void
  setHighlightNewsId: (id: string) => void
  openExchangeTab: (listingId?: string) => void
}

function SectorAccordion({
  sector,
  portfolioRows,
  stockListings,
  color,
}: {
  sector: string
  portfolioRows: portfolio_row[]
  stockListings: StockListing[]
  color: string
}) {
  const [open, setOpen] = useState(false)
  const Icon = getSectorIcon(sector)

  const totalValue = useMemo(() => {
    return portfolioRows.reduce((sum, row) => {
      const listing = stockListings.find((s) => s.ticker === row.ticker)
      const currentPrice = listing?.currentPrice ?? row.price
      return sum + row.qty * currentPrice
    }, 0)
  }, [portfolioRows, stockListings])

  const avgChange = useMemo(() => {
    if (portfolioRows.length === 0) return 0
    const sum = portfolioRows.reduce((a, r) => a + r.changePct, 0)
    return sum / portfolioRows.length
  }, [portfolioRows])

  const hasNewsPressure = useMemo(() => {
    return portfolioRows.some((row) => {
      const listing = stockListings.find((s) => s.ticker === row.ticker)
      return listing?.hasNewsPressure ?? false
    })
  }, [portfolioRows, stockListings])

  const hasInsiderPressure = useMemo(() => {
    return portfolioRows.some((row) => {
      const listing = stockListings.find((s) => s.ticker === row.ticker)
      return listing?.hasInsiderPressure ?? false
    })
  }, [portfolioRows, stockListings])

  const count = portfolioRows.length

  return (
    <div className="analytics-tab__accordion">
      <button
        type="button"
        className="analytics-tab__accordion-header"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="analytics-tab__sector-dot" style={{ backgroundColor: color }} />
        <Icon className="analytics-tab__sector-icon" aria-hidden />
        <span className="analytics-tab__sector-label">{formatSectorLabel(sector)}</span>
        <span className="analytics-tab__sector-meta">
          {count} {(count === 1 ? 'акция' : count >= 2 && count <= 4 ? 'акции' : 'акций')} · <MoneyValue amount={totalValue} size="xs" color="muted" className="inline-flex" /> · {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(1)}%
        </span>
        {hasNewsPressure ? (
          <span className="analytics-tab__sector-chip analytics-tab__sector-chip--news">Новости</span>
        ) : null}
        {hasInsiderPressure ? (
          <span className="analytics-tab__sector-chip analytics-tab__sector-chip--insider">Инсайд</span>
        ) : null}
        <span className={`analytics-tab__accordion-arrow ${open ? 'analytics-tab__accordion-arrow--open' : ''}`}>
          ▸
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            className="analytics-tab__accordion-body"
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
          >
            <table className="analytics-tab__sector-table">
              <thead>
                <tr>
                  <th>Тикер</th>
                  <th>Название</th>
                  <th>Кол-во</th>
                  <th>Ср. цена</th>
                  <th>Тек. цена</th>
                  <th>Стоимость</th>
                  <th>Доходность</th>
                </tr>
              </thead>
              <tbody>
                {portfolioRows.map((row) => {
                  const listing = stockListings.find((s) => s.ticker === row.ticker)
                  const currentPrice = listing?.currentPrice ?? row.price
                  const cost = row.qty * currentPrice
                  const changePct = row.changePct
                  return (
                    <tr key={row.ticker}>
                      <td>
                        <span className="analytics-tab__sector-table-ticker">
                          {row.ticker}
                          {row.paysDividends ? <span className="analytics-tab__chip-d">D</span> : null}
                          {listing?.hasInsiderPressure ? <span className="analytics-tab__chip-i">I</span> : null}
                        </span>
                      </td>
                      <td className="analytics-tab__sector-table-name">{row.name}</td>
                      <td className="analytics-tab__sector-table-num">{row.qty}</td>
                      <td className="analytics-tab__sector-table-num">
                        <MoneyValue amount={row.price} size="xs" color="muted" className="inline-flex" />
                      </td>
                      <td className="analytics-tab__sector-table-num">
                        <MoneyValue amount={currentPrice} size="xs" color="muted" className="inline-flex" />
                      </td>
                      <td className="analytics-tab__sector-table-num">
                        <MoneyValue amount={cost} size="xs" color="white" className="inline-flex" />
                      </td>
                      <td className={`analytics-tab__sector-table-pct ${changePct >= 0 ? 'analytics-tab__sector-table-pct--up' : 'analytics-tab__sector-table-pct--down'}`}>
                        {format_change(changePct)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function PieChart({ sectorData, total }: { sectorData: SectorCount[]; total: number }) {
  const cx = 140
  const cy = 140
  const r = 120
  const holeR = 70

  const isSingle = sectorData.length === 1

  let currentAngle = -Math.PI / 2
  const segments: { path: string; color: string; dim: string; sector: string; pct: number }[] = []

  for (const { sector, count } of sectorData) {
    const pct = count / total
    const endAngle = currentAngle + pct * Math.PI * 2
    segments.push({
      path: describeArc(cx, cy, r, currentAngle, endAngle),
      color: SECTOR_COLORS[sector] ?? '#94a3b8',
      dim: SECTOR_COLORS_DIM[sector] ?? '#475569',
      sector,
      pct,
    })
    currentAngle = endAngle
  }

  const holePath = describeArc(cx, cy, holeR, 0, Math.PI * 2)

  return (
    <>
      <h4 className="analytics-tab__chart-title">Структура портфеля</h4>
      <svg viewBox="0 0 280 280" className="analytics-tab__pie-svg">
        {isSingle ? (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill={segments[0].color}
            opacity={0.85}
            stroke={segments[0].dim}
            strokeWidth={1}
            className="analytics-tab__pie-segment"
          >
            <title>{formatSectorLabel(segments[0].sector)} — 100%</title>
          </circle>
        ) : (
          segments.map((seg) => (
            <path
              key={seg.sector}
              d={seg.path}
              fill={seg.color}
              opacity={0.85}
              stroke={seg.dim}
              strokeWidth={1}
              className="analytics-tab__pie-segment"
            >
              <title>{formatSectorLabel(seg.sector)} — {Math.round(seg.pct * 100)}%</title>
            </path>
          ))
        )}
        <path d={holePath} fill="rgba(15, 23, 42, 0.85)" stroke="rgba(255, 255, 255, 0.04)" strokeWidth={1} />
      </svg>
    </>
  )
}

export function AnalyticsTab({ stockListings, portfolio, news, turn, openNewsTab, setHighlightNewsId, openExchangeTab }: AnalyticsTabProps) {
  const tickerToSector = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of stockListings) map.set(s.ticker, s.sector)
    return map
  }, [stockListings])

  const sectorData = useMemo(() => {
    const map = new Map<string, SectorCount>()
    for (const row of portfolio) {
      const sector = tickerToSector.get(row.ticker)
      if (!sector) continue
      const existing = map.get(sector)
      if (existing) {
        existing.count += 1
        existing.tickers.push(row.ticker)
      } else {
        map.set(sector, {
          sector,
          count: 1,
          tickers: [row.ticker],
        })
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count)
  }, [portfolio, tickerToSector])

  const total = useMemo(() => portfolio.length, [portfolio])

  const latestMarketNews = useMemo(
    () => find_latest_market_news(news, turn),
    [news, turn],
  )

  const sectorsAffectedNews = useMemo(() => {
    return [...news]
      .filter((item) => item.visibleSectors && item.visibleSectors.length > 0)
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      )
      .slice(0, 3)
  }, [news])

  const displayNews =
    latestMarketNews && (!latestMarketNews.visibleSectors || latestMarketNews.visibleSectors.length === 0)
      ? latestMarketNews
      : sectorsAffectedNews[0] ?? latestMarketNews

  const portfolioBySector = useMemo(() => {
    const map = new Map<string, portfolio_row[]>()
    for (const row of portfolio) {
      const sector = tickerToSector.get(row.ticker)
      if (!sector) continue
      const existing = map.get(sector)
      if (existing) {
        existing.push(row)
      } else {
        map.set(sector, [row])
      }
    }
    return map
  }, [portfolio, tickerToSector])

  const handleOpenNews = () => {
    if (displayNews) {
      setHighlightNewsId(displayNews.id)
    }
    openNewsTab()
  }

  const handleOpenExchange = (ticker?: string) => {
    openExchangeTab(ticker ?? undefined)
  }

  return (
    <motion.div
      className="analytics-tab"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.1 } },
      }}
    >
      <motion.div
        className="analytics-tab__top"
        variants={{
          hidden: { opacity: 0, y: 16 },
          show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } },
        }}
      >
        <motion.div
          className="analytics-tab__mapping"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.06 } },
          }}
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
            }}
          >
            <h4 className="analytics-tab__section-title">Сектора</h4>
          </motion.div>
          <div className="analytics-tab__sector-list">
            {sectorData.map(({ sector }) => {
              const rows = portfolioBySector.get(sector) ?? []
              return (
                <motion.div
                  key={sector}
                  variants={{
                    hidden: { opacity: 0, x: -12 },
                    show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 280, damping: 26 } },
                  }}
                >
                  <SectorAccordion
                    sector={sector}
                    portfolioRows={rows}
                    stockListings={stockListings}
                    color={SECTOR_COLORS[sector] ?? '#94a3b8'}
                  />
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        <motion.div
          className="analytics-tab__chart"
          variants={{
            hidden: { opacity: 0, scale: 0.92 },
            show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 24 } },
          }}
        >
          {total > 0 ? (
            <PieChart sectorData={sectorData} total={total} />
          ) : (
            <div className="analytics-tab__chart-empty">Нет данных</div>
          )}
          <div className="analytics-tab__chart-legend">
            {sectorData.map(({ sector, count }) => {
              const color = SECTOR_COLORS[sector] ?? '#94a3b8'
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <span key={sector} className="analytics-tab__legend-item">
                  <span className="analytics-tab__legend-dot" style={{ backgroundColor: color }} />
                  <span className="analytics-tab__legend-label">{formatSectorLabel(sector)}</span>
                  <span className="analytics-tab__legend-sep">·</span>
                  <span className="analytics-tab__legend-count">{count}</span>
                  <span className="analytics-tab__legend-sep">·</span>
                  <span className="analytics-tab__legend-pct">{pct}%</span>
                </span>
              )
            })}
          </div>
          <p className="analytics-tab__chart-total">
            Всего {total} акций в {sectorData.length} секторах
          </p>
        </motion.div>
      </motion.div>

      {displayNews ? (
        <motion.div
          className="analytics-tab__spotlight"
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
          }}
        >
          <span className="analytics-tab__spotlight-label">Ключевой сигнал рынка</span>
          {displayNews.visibleSectors && displayNews.visibleSectors.length > 0 ? (
            <div className="analytics-tab__spotlight-sectors">
              {displayNews.visibleSectors.map((sector) => {
                const Icon = getSectorIcon(sector)
                const color = SECTOR_COLORS[sector] ?? '#94a3b8'
                return (
                  <span
                    key={sector}
                    className="analytics-tab__spotlight-sector-chip"
                    style={{
                      borderColor: color,
                      backgroundColor: `${color}18`,
                      color,
                      boxShadow: `0 0 12px ${color}30`,
                    }}
                  >
                    <Icon className="analytics-tab__spotlight-sector-icon" aria-hidden />
                    {formatSectorLabel(sector)}
                  </span>
                )
              })}
            </div>
          ) : (
            <span className="analytics-tab__spotlight-sector-all">Общий рынок</span>
          )}
          <h5 className="analytics-tab__spotlight-title">{displayNews.title}</h5>
          <p className="analytics-tab__spotlight-body">{displayNews.body}</p>
          <div className="analytics-tab__spotlight-footer">
            {displayNews.ticker ? (
              <button
                type="button"
                className="analytics-tab__spotlight-ticker-link"
                onClick={() => handleOpenExchange(displayNews.ticker)}
              >
                {displayNews.ticker}
              </button>
            ) : null}
            <button
              type="button"
              className="analytics-tab__spotlight-cta"
              onClick={handleOpenNews}
            >
              Открыть в новостях
            </button>
          </div>
        </motion.div>
      ) : null}
    </motion.div>
  )
}
