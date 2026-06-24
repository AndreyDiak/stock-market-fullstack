import MoneyAmount from './MoneyAmount'
import { getRealEstateImage } from '../constants/realEstateImages'

interface DreamCardProps {
  name: string
  itemRef: string
  basePrice: number
}

export default function DreamCard({ name, itemRef, basePrice }: DreamCardProps) {
  const image = getRealEstateImage(itemRef)

  return (
    <div className="overflow-hidden rounded-xl border-2 border-pastel-300/70 bg-white/60 shadow-sm">
      <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-b from-pastel-50/80 to-pastel-100/60 p-3">
        {image ? (
          <img
            src={image}
            alt={name}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span className="text-center text-xs font-medium text-pastel-500">{name}</span>
        )}
      </div>
      <div className="border-t border-pastel-200/60 px-3 py-2">
        <p className="truncate text-sm font-semibold text-pastel-900">{name}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-pastel-500">
            Цель
          </span>
          <MoneyAmount amount={basePrice} size="sm" />
        </div>
      </div>
    </div>
  )
}
