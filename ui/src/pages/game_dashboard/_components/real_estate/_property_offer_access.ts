import type { PropertyOffer } from '../../_model/types'
import { getSkillLevel, type CharacterSkill } from '../character/_character_skills'

export function getPlayerBankingLevel(skills: CharacterSkill[]) {
  return getSkillLevel(skills, 'banking')
}

export function isPropertyOfferLocked(offer: PropertyOffer, bankingLevel: number) {
  return bankingLevel < offer.requiredBankingLevel
}

export function applyBankingLevelToPropertyOffer(
  offer: PropertyOffer,
  bankingLevel: number,
): PropertyOffer {
  const isLocked = isPropertyOfferLocked(offer, bankingLevel)
  if (offer.isLocked === isLocked) return offer
  return { ...offer, isLocked }
}

export function applyBankingLevelToPropertyOffers(
  offers: PropertyOffer[],
  bankingLevel: number,
): PropertyOffer[] {
  return offers.map((offer) => applyBankingLevelToPropertyOffer(offer, bankingLevel))
}
