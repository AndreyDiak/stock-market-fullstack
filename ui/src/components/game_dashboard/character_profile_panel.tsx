import { AssetCard } from '../character_sidebar/asset_card'
import { MoneyValue } from '../money_value'
import { GameButton } from '../game_ui/game_button'
import { SegmentBar } from './segment_bar'
import type { CreateGameBody } from '../../api/types'
import { getProfessionAvatar } from '../../constants/professionImages'
import { PROFESSION_LABELS } from '../../constants/professions'
import { getRealEstateImage } from '../../constants/realEstateImages'

export interface DreamProgress {
  itemRef: string
  name: string
  basePrice: number
  savedAmount: number
}

export interface CharacterProfile {
  name: string
  profession: CreateGameBody['profession']
  professionLevel: number
  salary: number
  reputation: number
  tradingLevel: number
  dreams: DreamProgress[]
}

export interface CharacterUpgrade {
  id: string
  name: string
  description: string
  effectLabel: string
  basePrice: number
  level: number
  maxLevel: number
}

export const MOCK_CHARACTER_PROFILE: CharacterProfile = {
  name: 'Алекс',
  profession: 'DEVELOPER',
  professionLevel: 2,
  salary: 9000,
  reputation: 72,
  tradingLevel: 3,
  dreams: [
    { itemRef: 'penthouse', name: 'Пентхаус', basePrice: 2_500_000, savedAmount: 420_000 },
    { itemRef: 'sport_car', name: 'Спорткар', basePrice: 890_000, savedAmount: 125_000 },
  ],
}

export const MOCK_CHARACTER_UPGRADES: CharacterUpgrade[] = [
  {
    id: 'qualification',
    name: 'Повышение квалификации',
    description:
      'Курсы и аттестация по специальности. Чем выше уровень — тем больше шанс получить инсайдерскую новость.',
    effectLabel: 'Инсайд',
    basePrice: 3500,
    level: 0,
    maxLevel: 3,
  },
  {
    id: 'trading',
    name: 'Курс трейдинга',
    description: 'Открывает доступ к более дорогим акциям и улучшает навыки торговли на бирже.',
    effectLabel: 'Трейдинг',
    basePrice: 5000,
    level: 0,
    maxLevel: 8,
  },
  {
    id: 'negotiation',
    name: 'Курс переговоров',
    description: 'Боты охотнее идут на OTC-сделки — бонус к проверкам при торге с NPC.',
    effectLabel: 'Репутация',
    basePrice: 2800,
    level: 0,
    maxLevel: 5,
  },
  {
    id: 'analytics',
    name: 'Аналитическая подписка',
    description: 'Краткий обзор секторов и трендов в начале каждого хода.',
    effectLabel: 'Обзор',
    basePrice: 1200,
    level: 0,
    maxLevel: 1,
  },
  {
    id: 'property_slots',
    name: 'Слот имущества',
    description:
      'Открывает дополнительный слот в инвентаре имущества. Покупайте в профиле — слот разблокируется автоматически.',
    effectLabel: 'Инвентарь',
    basePrice: 15_000,
    level: 0,
    maxLevel: 2,
  },
]

const SECONDARY_TEXT = 'text-slate-400'

export function calcUpgradePrice(upgrade: CharacterUpgrade) {
  return Math.round(upgrade.basePrice * (1 + upgrade.level * 0.35))
}

export function calcInsiderNewsChance(professionLevel: number) {
  return Math.min(20, professionLevel * 2)
}

function UpgradeIcon({ id }: { id: string }) {
  const className = 'h-5 w-5 shrink-0 text-emerald-400'

  if (id === 'qualification') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path strokeLinecap="round" d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" d="M12 14l6.16-3.422a12.083 12.083 0 0 1 .665 6.479A11.952 11.952 0 0 0 12 20.055a11.952 11.952 0 0 0-6.824-2.998 12.078 12.078 0 0 1 .665-6.479L12 14z" />
      </svg>
    )
  }
  if (id === 'trading') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path strokeLinecap="round" d="M4 18h16M6 14l3-8 4 6 3-4 2 6" />
      </svg>
    )
  }
  if (id === 'negotiation') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4-.8L3 20l1.2-3.6A7.86 7.86 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )
  }
  if (id === 'property_slots') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5 12 4l9 5.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z" />
        <path strokeLinecap="round" d="M12 4v6.5" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" d="M4 19h16M6 16l3-8 4 5 3-4 2 3" />
    </svg>
  )
}

function DreamStatusCard({ dream }: { dream: DreamProgress }) {
  const progress = Math.min(100, Math.round((dream.savedAmount / dream.basePrice) * 100))
  const completed = progress >= 100
  const image = getRealEstateImage(dream.itemRef)

  return (
    <article className="rounded-2xl border border-white/10 bg-slate-800/40 p-3">
      <div className="flex gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10">
          {image ? (
            <img src={image} alt={dream.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-900 text-[10px] text-slate-500">
              {dream.name}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-white">{dream.name}</p>
            <span
              className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                completed
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/15 text-amber-300'
              }`}
            >
              {completed ? 'Достигнуто' : 'В процессе'}
            </span>
          </div>
          <p className={`mt-1 flex flex-wrap items-center gap-1 text-xs ${SECONDARY_TEXT}`}>
            <MoneyValue amount={dream.savedAmount} size="xs" />
            <span>/</span>
            <MoneyValue amount={dream.basePrice} size="xs" color="muted" />
          </p>
          <SegmentBar
            percent={progress}
            variant={completed ? 'emerald' : 'amber'}
            heightClass="h-1.5"
            className="mt-2"
          />
          <p className="mt-1 text-right text-[10px] font-bold text-slate-400">{progress}%</p>
        </div>
      </div>
    </article>
  )
}

function UpgradeCard({
  upgrade,
  balance,
  onPurchase,
}: {
  upgrade: CharacterUpgrade
  balance: number
  onPurchase: (id: string) => void
}) {
  const price = calcUpgradePrice(upgrade)
  const maxed = upgrade.level >= upgrade.maxLevel
  const canAfford = balance >= price

  return (
    <article className="rounded-2xl border border-white/10 bg-slate-800/40 p-4">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900/80 ring-1 ring-slate-700/40">
          <UpgradeIcon id={upgrade.id} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-white">{upgrade.name}</h4>
            <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
              {upgrade.effectLabel}
            </span>
            <span className={`text-xs ${SECONDARY_TEXT}`}>
              Ур. {upgrade.level}/{upgrade.maxLevel}
            </span>
          </div>
          <p className={`mt-1.5 text-xs leading-relaxed ${SECONDARY_TEXT}`}>{upgrade.description}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-700/40 pt-3">
        {maxed ? (
          <span className="text-sm font-semibold text-emerald-400">Максимальный уровень</span>
        ) : (
          <MoneyValue amount={price} size="sm" color="amber" />
        )}
        <GameButton
          size="sm"
          disabled={maxed || !canAfford}
          onClick={() => onPurchase(upgrade.id)}
        >
          {maxed ? 'Куплено' : 'Улучшить'}
        </GameButton>
      </div>
    </article>
  )
}

interface CharacterProfilePanelProps {
  profile: CharacterProfile
  upgrades: CharacterUpgrade[]
  balance: number
  onPurchaseUpgrade: (upgradeId: string) => void
}

export function CharacterProfilePanel({
  profile,
  upgrades,
  balance,
  onPurchaseUpgrade,
}: CharacterProfilePanelProps) {
  const professionLabel = PROFESSION_LABELS[profile.profession]
  const insiderChance = calcInsiderNewsChance(profile.professionLevel)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-white">Профиль</h2>
          <p className={`mt-1 text-sm ${SECONDARY_TEXT}`}>Персонаж, мечты и улучшения</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-auto pr-1">
        <section className="rounded-2xl border border-white/10 bg-slate-800/30 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-emerald-400/25 ring-offset-2 ring-offset-slate-900">
              <img
                src={getProfessionAvatar(profile.profession)}
                alt={professionLabel}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-2xl font-bold text-white">{profile.name}</h3>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {professionLabel}
              </p>
            </div>
            <span className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-sm font-bold text-emerald-400">
              Lv.{profile.professionLevel}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: 'Зарплата',
                value: <MoneyValue amount={profile.salary} size="sm" color="white" suffix="/мес" />,
              },
              { label: 'Репутация', value: <span className="text-sm font-bold text-white">{profile.reputation}</span> },
              { label: 'Трейдинг', value: <span className="text-sm font-bold text-white">Lv.{profile.tradingLevel}</span> },
              { label: 'Шанс инсайда', value: <span className="text-sm font-bold text-white">{insiderChance}%</span> },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-slate-700/40 bg-slate-900/50 px-3 py-2"
              >
                <p className={`text-[10px] font-bold uppercase tracking-wider ${SECONDARY_TEXT}`}>
                  {stat.label}
                </p>
                <div className="mt-0.5">{stat.value}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Мечты</h3>
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {profile.dreams.map((dream) => (
              <AssetCard
                key={dream.itemRef}
                name={dream.name}
                image={getRealEstateImage(dream.itemRef)}
                price={dream.basePrice}
                badge="Цель"
                variant="dream"
              />
            ))}
          </div>
          <div className="space-y-3">
            {profile.dreams.map((dream) => (
              <DreamStatusCard key={`status-${dream.itemRef}`} dream={dream} />
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-white">Улучшения</h3>
          <p className={`mb-3 text-xs ${SECONDARY_TEXT}`}>
            Покупайте развитие персонажа за баланс. Доступно:{' '}
            <MoneyValue amount={balance} size="xs" color="amber" className="inline-flex" />
          </p>
          <div className="space-y-3">
            {upgrades.map((upgrade) => (
              <UpgradeCard
                key={upgrade.id}
                upgrade={upgrade}
                balance={balance}
                onPurchase={onPurchaseUpgrade}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
