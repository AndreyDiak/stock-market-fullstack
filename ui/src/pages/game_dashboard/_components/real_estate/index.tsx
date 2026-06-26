import { useState, type ReactNode } from 'react'
import { AssetCard } from '../../../../components/card/asset_card'
import { formatMoney, MoneyValue } from '../../../../components/money/money_value'
import { GameButton } from '../../../../components/game_ui/game_button'
import { REAL_ESTATE_CATALOG, type RealEstateItem } from '../../../../constants/realEstate'
import { getRealEstateImage } from '../../../../constants/realEstateImages'
import { useDashboardTheme } from '../../_model/use_dashboard_theme'
import { CoinIcon } from '../../../../shared/icons'
import { useGameStore } from '../../../../stores/game.store'

const SECONDARY_TEXT = 'text-slate-400'
const LOW_BALANCE_WARNING = 3_000

function calcCreditRate(downPaymentPercent: number) {
  if (downPaymentPercent >= 100) return 0
  return Math.round(4 + (100 - downPaymentPercent) * 0.12)
}

function calcLoanTerms(item: RealEstateItem, downPaymentPercent: number) {
  const downAmount = Math.round((item.basePrice * downPaymentPercent) / 100)
  const loanAmount = item.basePrice - downAmount
  const rate = calcCreditRate(downPaymentPercent)
  const monthlyPayment =
    loanAmount > 0
      ? Math.ceil((loanAmount / item.installmentMonths) * (1 + rate / 100))
      : 0

  return { downAmount, loanAmount, rate, monthlyPayment }
}

function calcCreditOverpayment(item: RealEstateItem, downPaymentPercent: number) {
  const { downAmount, monthlyPayment } = calcLoanTerms(item, downPaymentPercent)
  if (downPaymentPercent >= 100) return 0
  const totalPaid = downAmount + monthlyPayment * item.installmentMonths
  return Math.max(0, totalPaid - item.basePrice)
}

function Breadcrumbs({
  itemName,
  onMarketClick,
}: {
  itemName: string
  onMarketClick: () => void
}) {
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm" aria-label="Навигация">
      <button
        type="button"
        onClick={onMarketClick}
        className="font-semibold text-emerald-400 transition hover:text-emerald-300"
      >
        Рынок имущества
      </button>
      <span className="text-slate-600">›</span>
      <span className="font-bold text-white">{itemName}</span>
    </nav>
  )
}

function DownPaymentSlider({
  percent,
  onChange,
}: {
  percent: number
  onChange: (percent: number) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className={`text-xs font-semibold uppercase tracking-wider ${SECONDARY_TEXT}`}>
          Первый взнос
        </span>
        <span className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-sm font-black tabular-nums text-amber-300">
          {percent}%
        </span>
      </div>

      <input
        type="range"
        min={10}
        max={100}
        step={10}
        value={percent}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700/80 accent-amber-400 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-amber-200 [&::-webkit-slider-thumb]:bg-gradient-to-b [&::-webkit-slider-thumb]:from-amber-300 [&::-webkit-slider-thumb]:to-orange-500 [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(251,191,36,0.5)]"
        aria-label="Процент первого взноса"
        aria-valuemin={10}
        aria-valuemax={100}
        aria-valuenow={percent}
      />

      <div className="flex justify-between text-[10px] font-bold tabular-nums text-slate-500">
        <span>10%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  )
}

function CreditStatCard({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
      <p className={`text-[10px] font-bold uppercase tracking-wider ${SECONDARY_TEXT}`}>{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

function ProductShowcase({ item, image }: { item: RealEstateItem; image?: string }) {
  return (
    <aside className="flex flex-col">
      <div className="overflow-hidden rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
        {image ? (
          <img src={image} alt={item.name} className="aspect-square w-full object-cover" />
        ) : (
          <div className="aspect-square w-full bg-gradient-to-br from-slate-700 to-slate-900" />
        )}
      </div>

      <div className="mt-4 space-y-2">
        <h2 className="text-xl font-bold leading-tight text-white">{item.name}</h2>
        <div className="flex items-center gap-2">
          <CoinIcon className="h-5 w-5 shrink-0 text-amber-400" />
          <span className="text-2xl font-black tabular-nums text-yellow-400">
            {formatMoney(item.basePrice)}
          </span>
        </div>
      </div>
    </aside>
  )
}

function RealEstateMarketList({ onSelect }: { onSelect: (id: string) => void }) {
  const theme = useDashboardTheme()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-white">Рынок имущества</h2>
          <p className={`mt-1 text-sm ${SECONDARY_TEXT}`}>Покупка в рассрочку или за полную стоимость</p>
        </div>
        <span className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/20">
          {REAL_ESTATE_CATALOG.length} лотов
        </span>
      </div>

      <div className={`min-h-0 flex-1 overflow-auto pr-0.5 ${theme.scrollArea}`}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {REAL_ESTATE_CATALOG.map((item) => {
            const image = getRealEstateImage(item.id)
            const badge = item.special
              ? 'Бонус'
              : !item.isTradable
                ? 'Разовая'
                : item.monthlyPayment > 0
                  ? `×${item.installmentMonths} мес`
                  : undefined

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className="group flex flex-col text-left transition hover:-translate-y-0.5"
              >
                <AssetCard
                  name={item.name}
                  image={image}
                  price={item.basePrice}
                  badge={badge}
                  variant="dream"
                />
                <div className="mt-2 space-y-1 px-0.5">
                  {item.monthlyPayment > 0 ? (
                    <MoneyValue amount={item.monthlyPayment} size="xs" suffix="/мес" />
                  ) : (
                    <p className="text-xs font-medium text-slate-500">Без рассрочки</p>
                  )}
                  <p
                    className={`line-clamp-2 text-xs leading-relaxed ${SECONDARY_TEXT} group-hover:text-slate-300`}
                  >
                    {item.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function RealEstateDetailView({
  item,
  balance,
  onBack,
  onBuyCash,
  onBuyCredit,
}: {
  item: RealEstateItem
  balance: number
  onBack: () => void
  onBuyCash: (item: RealEstateItem) => void
  onBuyCredit: (item: RealEstateItem, downPercent: number) => void
}) {
  const theme = useDashboardTheme()
  const [downPaymentPercent, setDownPaymentPercent] = useState(30)
  const image = getRealEstateImage(item.id)
  const remainingAfterCash = balance - item.basePrice
  const canBuyCash = balance >= item.basePrice
  const showLowBalanceWarning =
    canBuyCash && remainingAfterCash >= 0 && remainingAfterCash < LOW_BALANCE_WARNING

  const { downAmount, loanAmount, rate, monthlyPayment } = calcLoanTerms(item, downPaymentPercent)
  const overpayment = calcCreditOverpayment(item, downPaymentPercent)
  const canBuyCredit = balance >= downAmount && downPaymentPercent < 100

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <Breadcrumbs itemName={item.name} onMarketClick={onBack} />

      <div className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto pr-0.5 ${theme.scrollArea}`}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,30%)_minmax(0,1fr)] lg:items-start">
          <ProductShowcase item={item} image={image} />

          <div className="min-w-0 space-y-6">
            <header>
              <h1 className="text-2xl font-black tracking-tight text-white lg:text-3xl">{item.name}</h1>
              <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${SECONDARY_TEXT}`}>
                {item.description}
              </p>
              {item.special && (
                <p className="mt-2 text-sm font-semibold text-amber-400/90">{item.special}</p>
              )}
            </header>

            <section className="relative overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-500/10 via-slate-800/60 to-slate-900/80 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-400/10 blur-3xl"
                aria-hidden
              />

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300/80">
                Купить сразу
              </p>
              <p className={`mt-1 text-xs ${SECONDARY_TEXT}`}>
                Полная оплата — имущество сразу ваше, без процентов
              </p>

              <div className="mt-5 flex items-center gap-4">
                <CoinIcon className="h-12 w-12 shrink-0 drop-shadow-[0_0_16px_rgba(251,191,36,0.55)]" />
                <span className="text-5xl font-black tabular-nums tracking-tight text-yellow-400 drop-shadow-[0_0_24px_rgba(250,204,21,0.35)] sm:text-6xl">
                  {formatMoney(item.basePrice)}
                </span>
              </div>

              {showLowBalanceWarning && (
                <div className="mt-5 flex gap-2 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3">
                  <span className="text-lg leading-none text-amber-400" aria-hidden>
                    ⚠
                  </span>
                  <p className="text-sm text-amber-200/90">
                    После покупки на счету останется только{' '}
                    <MoneyValue amount={remainingAfterCash} size="sm" color="amber" className="inline-flex" />
                    . Этого может не хватить на расходы и сделки в ближайшие ходы.
                  </p>
                </div>
              )}

              {!canBuyCash && (
                <p className="mt-5 text-sm font-medium text-red-400">
                  Недостаточно средств для полной покупки
                </p>
              )}

              <GameButton
                disabled={!canBuyCash}
                onClick={() => onBuyCash(item)}
                size="lg"
                fullWidth
                className="mt-6 shadow-[0_0_20px_rgba(251,191,36,0.4)]"
              >
                Купить за полную стоимость
              </GameButton>
            </section>

            {item.isTradable && item.installmentMonths > 0 && (
              <section className="rounded-3xl border border-white/10 bg-slate-800/35 p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">
                  Взять в кредит
                </p>
                <p className={`mt-1 text-xs ${SECONDARY_TEXT}`}>
                  Выберите взнос — остальное в рассрочку на {item.installmentMonths} мес.
                </p>

                <div className="mt-6">
                  <DownPaymentSlider
                    percent={downPaymentPercent}
                    onChange={setDownPaymentPercent}
                  />
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <CreditStatCard label="Взнос">
                    <MoneyValue amount={downAmount} size="lg" color="white" />
                  </CreditStatCard>
                  <CreditStatCard label="В кредит">
                    <MoneyValue amount={loanAmount} size="lg" color="red" />
                  </CreditStatCard>
                  <CreditStatCard label="Платёж">
                    <MoneyValue amount={monthlyPayment} size="lg" color="emerald" suffix="/ход" />
                  </CreditStatCard>
                  <CreditStatCard label="Ставка">
                    <span
                      className={`text-2xl font-black tabular-nums ${
                        rate > 10 ? 'text-amber-300' : 'text-emerald-400'
                      }`}
                    >
                      {rate}%
                    </span>
                  </CreditStatCard>
                </div>

                <p className={`mt-4 text-xs ${SECONDARY_TEXT}`}>
                  Переплата за {item.installmentMonths} месяцев:{' '}
                  <span className="font-bold tabular-nums text-amber-300/90">
                    {formatMoney(overpayment)} ₽
                  </span>
                </p>

                {!canBuyCredit && downPaymentPercent < 100 && (
                  <p className="mt-3 text-sm font-medium text-red-400">
                    Недостаточно средств для взноса{' '}
                    <MoneyValue amount={downAmount} size="sm" color="red" className="inline-flex" />
                  </p>
                )}

                <button
                  type="button"
                  disabled={!canBuyCredit}
                  onClick={() => onBuyCredit(item, downPaymentPercent)}
                  className="mt-5 w-full rounded-2xl border border-amber-400/35 bg-white/10 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-amber-100 transition hover:border-amber-400/55 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Оформить кредит
                </button>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface RealEstatePanelProps {
  balance?: number
  onBalanceChange?: (next: number) => void
}

export function RealEstatePanel({
  balance: balanceProp,
  onBalanceChange: onBalanceChangeProp,
}: RealEstatePanelProps = {}) {
  const storeBalance = useGameStore((state) => state.balance)
  const setBalance = useGameStore((state) => state.setBalance)
  const balance = balanceProp ?? storeBalance
  const onBalanceChange = onBalanceChangeProp ?? setBalance
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedItem = selectedId
    ? REAL_ESTATE_CATALOG.find((item) => item.id === selectedId)
    : undefined

  function handleBuyCash(item: RealEstateItem) {
    if (balance < item.basePrice) return
    onBalanceChange(balance - item.basePrice)
    setSelectedId(null)
  }

  function handleBuyCredit(item: RealEstateItem, downPercent: number) {
    const { downAmount } = calcLoanTerms(item, downPercent)
    if (balance < downAmount || downPercent >= 100) return
    onBalanceChange(balance - downAmount)
    setSelectedId(null)
  }

  if (selectedItem) {
    return (
      <RealEstateDetailView
        item={selectedItem}
        balance={balance}
        onBack={() => setSelectedId(null)}
        onBuyCash={handleBuyCash}
        onBuyCredit={handleBuyCredit}
      />
    )
  }

  return <RealEstateMarketList onSelect={setSelectedId} />
}
