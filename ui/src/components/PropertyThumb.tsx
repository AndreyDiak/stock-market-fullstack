interface PropertyThumbProps {
  name?: string
  image?: string
  empty?: boolean
  theme?: 'light' | 'night'
}

export default function PropertyThumb({
  name,
  image,
  empty = false,
  theme = 'light',
}: PropertyThumbProps) {
  const isNight = theme === 'night'

  if (empty) {
    return (
      <div
        className={`aspect-square rounded-xl border-2 border-dashed ${
          isNight ? 'border-emerald-400/20 bg-white/5' : 'border-pastel-200/50 bg-pastel-50/30'
        }`}
      />
    )
  }

  return (
    <div
      className={`aspect-square overflow-hidden rounded-xl border-2 p-2.5 shadow-sm ${
        isNight
          ? 'border-emerald-400/25 bg-[#0d1f2d]/60 shadow-[inset_0_0_20px_rgba(77,196,141,0.08)]'
          : 'border-pastel-200/70 bg-pastel-100/60'
      }`}
    >
      <div className="flex h-full w-full items-center justify-center">
        {image ? (
          <img
            src={image}
            alt={name}
            className="max-h-full max-w-full rounded-sm object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
          />
        ) : (
          <span
            className={`text-center text-xs font-medium ${isNight ? 'text-emerald-300/60' : 'text-pastel-500'}`}
          >
            {name}
          </span>
        )}
      </div>
    </div>
  )
}
