import { useState } from 'react'
import { AssetCard } from '../character_sidebar/asset_card'
import { MoneyValue } from '../money_value'
import { GameButton } from '../game_ui/game_button'
import { SegmentBar } from './segment_bar'
import { REAL_ESTATE_CATALOG, type RealEstateItem } from '../../constants/realEstate'
import { getRealEstateImage } from '../../constants/realEstateImages'

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

function SelectablePercentBar({
  percent,
  onChange,
}: {
  percent: number
  onChange: (percent: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, index) => {
          const step = (index + 1) * 10
          const selected = percent >= step
          return (
            <button
              key={step}
              type="button"
              onClick={() => onChange(step)}
              className={`h-9 flex-1 rounded-sm border text-[10px] font-bold transition ${
                selected
                  ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-300'
                  : 'border-slate-600/60 bg-slate-800/60 text-slate-500 hover:border-emerald-400/30 hover:text-slate-300'
              }`}
              aria-label={`Взнос ${step}%`}
            >
              {step}%
            </button>
          )
        })}
      </div>
      <SegmentBar percent={percent} variant="emerald" />
    </div>
  )
}

function RealEstateMarketList({ onSelect }: { onSelect: (id: string) => void }) {
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

      <div className="min-h-0 flex-1 overflow-auto pr-1">
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
  const [downPaymentPercent, setDownPaymentPercent] = useState(30)
  const image = getRealEstateImage(item.id)
  const remainingAfterCash = balance - item.basePrice
  const canBuyCash = balance >= item.basePrice
  const showLowBalanceWarning =
    canBuyCash && remainingAfterCash >= 0 && remainingAfterCash < LOW_BALANCE_WARNING

  const { downAmount, loanAmount, rate, monthlyPayment } = calcLoanTerms(item, downPaymentPercent)
  const canBuyCredit = balance >= downAmount && downPaymentPercent < 100

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <Breadcrumbs itemName={item.name} onMarketClick={onBack} />

      <div className="min-h-0 flex-1 overflow-auto pr-1">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
          <div className="mx-auto w-full max-w-xs lg:max-w-none">
            <AssetCard
              name={item.name}
              image={image}
              price={item.basePrice}
              variant="dream"
            />
          </div>

          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-white">{item.name}</h2>
              <p className={`mt-2 text-sm leading-relaxed ${SECONDARY_TEXT}`}>{item.description}</p>
              {item.special && (
                <p className="mt-2 text-sm font-medium text-amber-400/90">{item.special}</p>
              )}
            </div>

            <section className="rounded-3xl border border-white/10 bg-slate-800/40 p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Купить сразу</h3>
              <p className={`mt-1 text-xs ${SECONDARY_TEXT}`}>
                Полная оплата — имущество сразу ваше, без процентов
              </p>

              <div className="mt-4">
                <MoneyValue amount={item.basePrice} size="2xl" color="white" />
              </div>

              {showLowBalanceWarning && (
                <div className="mt-4 flex gap-2 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3">
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
                <p className="mt-4 text-sm font-medium text-red-400">
                  Недостаточно средств для полной покупки
                </p>
              )}

              <GameButton
                disabled={!canBuyCash}
                onClick={() => onBuyCash(item)}
                className="mt-4 sm:w-auto"
              >
                Купить за полную стоимость
              </GameButton>
            </section>

            {item.isTradable && item.installmentMonths > 0 && (
              <section className="rounded-3xl border border-white/10 bg-slate-800/40 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Взять в кредит</h3>
                <p className={`mt-1 text-xs ${SECONDARY_TEXT}`}>
                  Выберите, сколько выплатить сразу — остальное в рассрочку
                </p>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className={SECONDARY_TEXT}>Первый взнос</span>
                    <span className="font-bold text-emerald-400">{downPaymentPercent}%</span>
                  </div>
                  <SelectablePercentBar
                    percent={downPaymentPercent}
                    onChange={setDownPaymentPercent}
                  />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Взнос сейчас', amount: downAmount, color: 'white' as const },
                    { label: 'В кредит', amount: loanAmount, color: 'red' as const },
                    { label: 'Платёж / ход', amount: monthlyPayment, color: 'emerald' as const },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="rounded-2xl border border-slate-700/40 bg-slate-900/50 px-3 py-2"
                    >
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${SECONDARY_TEXT}`}>
                        {row.label}
                      </p>
                      <div className="mt-0.5">
                        <MoneyValue amount={row.amount} size="sm" color={row.color} />
                      </div>
                    </div>
                  ))}
                  <div className="rounded-2xl border border-slate-700/40 bg-slate-900/50 px-3 py-2">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${SECONDARY_TEXT}`}>
                      Ставка
                    </p>
                    <p
                      className={`mt-0.5 text-sm font-bold tabular-nums ${
                        rate > 10 ? 'text-amber-300' : 'text-emerald-400'
                      }`}
                    >
                      {rate}%
                    </p>
                  </div>
                </div>

                <p className={`mt-3 text-xs ${SECONDARY_TEXT}`}>
                  Срок: {item.installmentMonths} мес. · чем меньше взнос, тем выше ставка
                </p>

                {!canBuyCredit && downPaymentPercent < 100 && (
                  <p className="mt-3 text-sm font-medium text-red-400">
                    Недостаточно средств для взноса{' '}
                    <MoneyValue amount={downAmount} size="sm" color="red" className="inline-flex" />
                  </p>
                )}

                <GameButton
                  disabled={!canBuyCredit}
                  onClick={() => onBuyCredit(item, downPaymentPercent)}
                  className="mt-4 sm:w-auto"
                >
                  Оформить кредит
                </GameButton>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface RealEstatePanelProps {
  balance: number
  onBalanceChange: (next: number) => void
}

export function RealEstatePanel({ balance, onBalanceChange }: RealEstatePanelProps) {
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
