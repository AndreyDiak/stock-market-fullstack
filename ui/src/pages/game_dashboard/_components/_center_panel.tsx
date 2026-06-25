import type { center_panel_props } from "../_model/types";
import { ExchangeTable } from "./_exchange_table";
import { NewsPanel } from "./_news_panel";
import { OtcDealsPanel } from "./_otc_deals_panel";
import { BankView } from "./bank_view";
import { CharacterProfilePanel } from "./character_profile_panel";
import { GameSettingsPanel } from "./game_settings_panel";
import { RealEstatePanel } from "./real_estate_panel";

export function CenterPanel({
  activeTab,
  portfolio,
  otcDeals,
  onOtcDealAccept,
  onOtcDealDecline,
  characterProfile,
  characterSkills,
  balance,
  onBalanceChange,
  onPurchaseSkill,
  bankSummary,
  bankLoans,
  onLoanPayOff,
  creditRating,
  news,
  turn,
  onSelectNews,
  theme,
  dynamicBackground,
  colorTheme,
  onDynamicBackgroundChange,
  onColorThemeChange,
}: center_panel_props) {
  return (
    <section
      className={`flex min-h-0 min-w-0 flex-1 flex-col p-4 md:p-5 ${theme.frameDeep}`}
    >
      {activeTab === "settings" && (
        <GameSettingsPanel
          theme={theme}
          dynamicBackground={dynamicBackground}
          colorTheme={colorTheme}
          onDynamicBackgroundChange={onDynamicBackgroundChange}
          onColorThemeChange={onColorThemeChange}
        />
      )}
      {activeTab === "character" && (
        <CharacterProfilePanel
          profile={characterProfile}
          skills={characterSkills}
          balance={balance}
          onPurchaseSkill={onPurchaseSkill}
        />
      )}
      {activeTab === "bank" && (
        <BankView
          balance={balance}
          creditRating={creditRating}
          summary={bankSummary}
          loans={bankLoans}
          onPayOff={onLoanPayOff}
        />
      )}
      {activeTab === "exchange" && (
        <ExchangeTable
          portfolio={portfolio}
          availableCash={balance}
          theme={theme}
        />
      )}
      {activeTab === "news" && (
        <NewsPanel news={news} turn={turn} theme={theme} onSelectNews={onSelectNews} />
      )}
      {activeTab === "otc" && (
        <OtcDealsPanel
          deals={otcDeals}
          onAccept={onOtcDealAccept}
          onDecline={onOtcDealDecline}
          theme={theme}
        />
      )}
      {activeTab === "real-estate" && (
        <RealEstatePanel balance={balance} onBalanceChange={onBalanceChange} />
      )}
    </section>
  );
}
