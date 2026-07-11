import { COMPANY_TICKERS } from '../../constants/companies'

const TICKER_ROWS = [
  { tickerIndex: 0, change: '+2.4%', y: '12%', delay: '0s', duration: '28s' },
  { tickerIndex: 4, change: '-0.8%', y: '22%', delay: '-4s', duration: '32s' },
  { tickerIndex: 8, change: '+5.1%', y: '34%', delay: '-8s', duration: '24s' },
  { tickerIndex: 12, change: '+1.2%', y: '46%', delay: '-2s', duration: '30s' },
  { tickerIndex: 16, change: '-1.5%', y: '58%', delay: '-12s', duration: '26s' },
  { tickerIndex: 20, change: '+3.0%', y: '70%', delay: '-6s', duration: '34s' },
  { tickerIndex: 24, change: '+0.9%', y: '82%', delay: '-10s', duration: '29s' },
] as const

export function NewGameAtmosphere() {
  const tickers = TICKER_ROWS.map((row) => ({
    label: `${COMPANY_TICKERS[row.tickerIndex]} ${row.change}`,
    y: row.y,
    delay: row.delay,
    duration: row.duration,
  }))

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(46,174,113,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_100%,rgba(15,40,80,0.45),transparent_50%)]" />

      {tickers.map((ticker) => (
        <div
          key={ticker.label}
          className="new-game-ticker absolute left-0 w-[200%] whitespace-nowrap font-mono text-[11px] tracking-widest text-emerald-400/12"
          style={{
            top: ticker.y,
            animationDuration: ticker.duration,
            animationDelay: ticker.delay,
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="mx-8 inline-block">
              {ticker.label}
              <span className="mx-3 text-emerald-300/10">|</span>
              <span className="text-cyan-400/9">▁▂▃▅▇▅▃▂</span>
            </span>
          ))}
        </div>
      ))}

      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#061018] to-transparent" />
    </div>
  )
}
