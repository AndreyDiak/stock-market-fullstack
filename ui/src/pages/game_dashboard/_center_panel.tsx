import { CharacterProfilePanel } from '../../components/game_dashboard/character_profile_panel'
import { BankView } from '../../components/game_dashboard/bank_view'
import { RealEstatePanel } from '../../components/game_dashboard/real_estate_panel'
import { GameSettingsPanel } from '../../components/game_dashboard/game_settings_panel'
import type { center_panel_props } from './model/types'
import { ExchangeTable } from './_exchange_table'
import { OtcDealsPanel } from './_otc_deals_panel'

export function CenterPanel({
  activeTab,
  portfolio,
  otcDeals,
  onOtcDealAccept,
  onOtcDealDecline,
  characterProfile,
  characterUpgrades,
  balance,
  onBalanceChange,
  onPurchaseUpgrade,
  bankSummary,
  bankLoans,
  onLoanPayOff,
  creditRating,
  theme,
  dynamicBackground,
  colorTheme,
  onDynamicBackgroundChange,
  onColorThemeChange,
}: center_panel_props) {
  return (
    <section className={`flex min-h-0 min-w-0 flex-1 flex-col p-4 md:p-5 ${theme.frameDeep}`}>
      {activeTab === 'settings' && (
        <GameSettingsPanel
          theme={theme}
          dynamicBackground={dynamicBackground}
          colorTheme={colorTheme}
          onDynamicBackgroundChange={onDynamicBackgroundChange}
          onColorThemeChange={onColorThemeChange}
        />
      )}
      {activeTab === 'character' && (
        <CharacterProfilePanel
          profile={characterProfile}
          upgrades={characterUpgrades}
          balance={balance}
          onPurchaseUpgrade={onPurchaseUpgrade}
        />
      )}
      {activeTab === 'bank' && (
        <BankView
          balance={balance}
          creditRating={creditRating}
          summary={bankSummary}
          loans={bankLoans}
          onPayOff={onLoanPayOff}
        />
      )}
      {activeTab === 'exchange' && (
        <ExchangeTable portfolio={portfolio} availableCash={balance} theme={theme} />
      )}
      {activeTab === 'otc' && (
        <OtcDealsPanel
          deals={otcDeals}
          onAccept={onOtcDealAccept}
          onDecline={onOtcDealDecline}
          theme={theme}
        />
      )}
      {activeTab === 'real-estate' && (
        <RealEstatePanel balance={balance} onBalanceChange={onBalanceChange} />
      )}
    </section>
  )
}
