import { AssetCard } from './asset_card'
import { getRealEstateImage } from '../../constants/realEstateImages'

interface DreamCardProps {
  name: string
  itemRef: string
  basePrice: number
  theme?: 'light' | 'night'
}

export function DreamCard({
  name,
  itemRef,
  basePrice,
  theme = 'light',
}: DreamCardProps) {
  if (theme !== 'night') {
    return (
      <div className="overflow-hidden rounded-xl border border-pastel-300/70 bg-white/60 shadow-sm">
        <AssetCard
          name={name}
          image={getRealEstateImage(itemRef)}
          price={basePrice}
          badge="Цель"
        />
      </div>
    )
  }

  return (
    <AssetCard
      name={name}
      image={getRealEstateImage(itemRef)}
      price={basePrice}
      badge="Цель"
    />
  )
}
