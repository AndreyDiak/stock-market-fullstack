import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef } from 'react'
import { useDashboardTheme } from '../../_model/use_dashboard_theme'
import { useDashboardUi } from '../../_model/dashboard_ui_context'
import {
  realEstateCardsContainerVariants,
  realEstateOfferCardVariants,
  realEstatePanelVariants,
  realEstateSectionVariants,
} from '../../_model/real_estate_panel_animation'
import { useGameStore } from '../../../../stores/game.store'
import { PanelSectionHeading } from '../shared'
import { applyBankingLevelToPropertyOffers, getPlayerBankingLevel } from './_property_offer_access'
import { PropertyOfferCard } from './_property_offer_card'
import { sortPropertyOffersByTtl } from './_property_offers_sort'

const SECONDARY_TEXT = 'text-slate-400'

function PropertyOffersSection({
  highlightedOfferId,
}: {
  highlightedOfferId?: string | null
}) {
  const propertyOffers = useGameStore((state) => state.propertyOffers)
  const characterSkills = useGameStore((state) => state.characterSkills)
  const sortedOffers = useMemo(() => {
    const bankingLevel = getPlayerBankingLevel(characterSkills)
    return sortPropertyOffersByTtl(
      applyBankingLevelToPropertyOffers(propertyOffers, bankingLevel),
    )
  }, [propertyOffers, characterSkills])
  const propertyOfferBusy = useGameStore((state) => state.propertyOfferBusy)
  const acceptOffer = useGameStore((state) => state.acceptPropertyOffer)
  const negotiateOffer = useGameStore((state) => state.negotiatePropertyOffer)
  const acceptNegotiatedOffer = useGameStore((state) => state.acceptNegotiatedPropertyOffer)
  const declineNegotiatedOffer = useGameStore((state) => state.declineNegotiatedPropertyOffer)
  const highlightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!highlightedOfferId) return
    const node = document.getElementById(`property-offer-${highlightedOfferId}`)
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightedOfferId, sortedOffers])

  return (
    <section ref={highlightRef} className="px-1 pb-2">
      {sortedOffers.length === 0 ? (
        <motion.div
          className="rounded-2xl border border-dashed border-white/10 bg-slate-800/25 px-6 py-10 text-center"
          variants={realEstateSectionVariants}
          initial="hidden"
          animate="show"
        >
          <p className="text-base font-semibold text-white">Нет активных предложений</p>
          <p className={`mt-2 text-sm ${SECONDARY_TEXT}`}>
            Сейчас имущество можно купить или продать только через предложения на рынке и сделки.
            Завершайте ходы и следите за новостями — новые лоты появляются регулярно.
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-5 px-1 pt-1 min-[720px]:grid-cols-2"
          variants={realEstateCardsContainerVariants}
          initial="hidden"
          animate="show"
        >
          {sortedOffers.map((offer) => (
            <motion.div
              key={offer.id}
              variants={realEstateOfferCardVariants}
              className="min-w-0 overflow-visible"
            >
              <PropertyOfferCard
                offer={offer}
                highlighted={offer.id === highlightedOfferId}
                busy={propertyOfferBusy}
                onAccept={(id, paymentMode) => acceptOffer(id, paymentMode)}
                onNegotiate={(id, adjustmentPercent) => negotiateOffer(id, adjustmentPercent)}
                onAcceptNegotiated={(id, paymentMode) => acceptNegotiatedOffer(id, paymentMode)}
                onDeclineNegotiated={(id) => declineNegotiatedOffer(id)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  )
}

function RealEstateMarketList() {
  const theme = useDashboardTheme()
  const { highlightPropertyOfferId } = useDashboardUi()

  return (
    <motion.div
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      variants={realEstatePanelVariants}
      initial="hidden"
      animate="show"
    >
      <motion.header
        className="mb-4 px-1"
        variants={realEstateSectionVariants}
        initial="hidden"
        animate="show"
      >
        <PanelSectionHeading
          title="Рынок имущества"
          subtitle="Покупка и продажа только через предложения и сделки"
        />
      </motion.header>

      <div className={`min-h-0 flex-1 overflow-auto px-1 pb-2 pr-0.5 ${theme.scrollArea}`}>
        <PropertyOffersSection highlightedOfferId={highlightPropertyOfferId} />
      </div>
    </motion.div>
  )
}

export function RealEstatePanel() {
  return <RealEstateMarketList />
}
