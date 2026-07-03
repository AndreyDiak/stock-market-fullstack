import { getRealEstateImage } from '../../../../constants/realEstateImages'
import type { news_item } from '../../_model/types'
import { getNewsCategoryForItem } from './_news_category'

type PropertyNewsPayload = {
  assetId?: string
  offerId?: string
  itemName?: string
}

type PropertyOfferLookup = {
  id: string
  assetId: string
  itemName?: string
}

function readPropertyPayload(item: news_item): PropertyNewsPayload | undefined {
  return item.payload as PropertyNewsPayload | undefined
}

export function getNewsPropertyImage(
  item: news_item,
  propertyOffers: PropertyOfferLookup[] = [],
): string | undefined {
  if (getNewsCategoryForItem(item) !== 'realty') return undefined

  const payload = readPropertyPayload(item)
  const assetIds = [
    payload?.assetId,
    payload?.offerId
      ? propertyOffers.find((offer) => offer.id === payload.offerId)?.assetId
      : undefined,
  ].filter(Boolean) as string[]

  for (const assetId of assetIds) {
    const image = getRealEstateImage(assetId)
    if (image) return image
  }

  return undefined
}

export function getNewsPropertyAlt(
  item: news_item,
  propertyOffers: PropertyOfferLookup[] = [],
): string | undefined {
  const payload = readPropertyPayload(item)
  if (payload?.itemName) return payload.itemName

  if (payload?.offerId) {
    const offer = propertyOffers.find((entry) => entry.id === payload.offerId)
    if (offer?.itemName) return offer.itemName
  }

  return undefined
}
