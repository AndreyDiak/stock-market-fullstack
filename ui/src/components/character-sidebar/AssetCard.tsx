import MoneyValue from './MoneyValue'

interface AssetCardProps {
  name: string
  image?: string
  price?: number
  badge?: string
  empty?: boolean
  variant?: 'default' | 'dream'
}

const textShadow = '[text-shadow:0_1px_4px_rgba(0,0,0,0.95),0_0_12px_rgba(0,0,0,0.6)]'

export default function AssetCard({
  name,
  image,
  price,
  badge,
  empty = false,
  variant = 'default',
}: AssetCardProps) {
  const isDream = variant === 'dream'

  if (empty) {
    return (
      <div className="aspect-square rounded-2xl border-2 border-dashed border-emerald-400/20 bg-slate-800/40" />
    )
  }

  return (
    <article className="relative aspect-square overflow-hidden rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.35)] ring-1 ring-emerald-400/10">
      {image ? (
        <img src={image} alt={name} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-3">
        {badge && (
          <span
            className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${
              isDream ? `text-white ${textShadow}` : 'text-slate-400'
            }`}
          >
            {badge}
          </span>
        )}
        <p
          className={`truncate text-sm font-bold ${
            isDream ? `text-white ${textShadow}` : 'text-white'
          }`}
        >
          {name}
        </p>
        {price !== undefined && (
          <MoneyValue
            amount={price}
            size="sm"
            tone={isDream ? 'overlay' : 'default'}
          />
        )}
      </div>
    </article>
  )
}
