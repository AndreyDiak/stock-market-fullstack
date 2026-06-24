import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  endGameTurn,
  fetchGameNews,
  mapApiNewsToFeedItem,
  mapOtcDealToCard,
} from "../../api/gameTurn";
import {
  MOCK_ACTIVE_LOANS,
  MOCK_BANK_SUMMARY,
  type ActiveLoan,
  type BankSummary,
} from "../../components/game_dashboard/bank_view";
import {
  calcUpgradePrice,
  MOCK_CHARACTER_PROFILE,
  MOCK_CHARACTER_UPGRADES,
  type CharacterProfile,
  type CharacterUpgrade,
} from "../../components/game_dashboard/character_profile_panel";
import { ExitGameModal } from "../../components/game_dashboard/exit_game_modal";
import { getGameDashboardTheme } from "../../components/game_dashboard/game_dashboard_theme";
import { buildNextTurnForecast } from "../../components/game_dashboard/next_turn_forecast";
import {
  hasLockedPropertySlots,
  MOCK_PROPERTY_SLOTS,
  PROPERTY_SLOT_UPGRADE_ID,
  unlockNextPropertySlot,
  type PropertySlot,
} from "../../components/game_dashboard/property_inventory_block";
import { GameShell } from "../../components/game_ui/game_shell";
import { useGameSettingsStore } from "../../stores/game_settings.store";
import { BackgroundEffects } from "./_background_effects";
import { CenterPanel } from "./_center_panel";
import { Header } from "./_header";
import { LeftSidebar } from "./_left_sidebar";
import { RightPanel } from "./_right_panel";
import {
  MOCK_AVAILABLE_CASH,
  MOCK_NEWS,
  MOCK_OTC_DEALS,
  MOCK_PORTFOLIO,
} from "./model/mocks";
import type { bot_deal, dashboard_tab, news_item } from "./model/types";
import { calc_passive_income } from "./model/utils";

export function GameDashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("id");
  const { dynamicBackground, colorTheme, setDynamicBackground, setColorTheme } =
    useGameSettingsStore();
  const dashboardTheme = useMemo(
    () => getGameDashboardTheme(colorTheme),
    [colorTheme],
  );
  const [activeTab, setActiveTab] = useState<dashboard_tab>("exchange");
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [turn, setTurn] = useState(14);
  const [endingTurn, setEndingTurn] = useState(false);
  const [news, setNews] = useState<news_item[]>(MOCK_NEWS);
  const [otcDeals, setOtcDeals] = useState<bot_deal[]>(MOCK_OTC_DEALS);
  const [balance, setBalance] = useState(MOCK_AVAILABLE_CASH);
  const [characterProfile, setCharacterProfile] = useState<CharacterProfile>(
    MOCK_CHARACTER_PROFILE,
  );
  const [characterUpgrades, setCharacterUpgrades] = useState<
    CharacterUpgrade[]
  >(() => MOCK_CHARACTER_UPGRADES.map((upgrade) => ({ ...upgrade })));
  const [bankLoans, setBankLoans] = useState<ActiveLoan[]>(() =>
    MOCK_ACTIVE_LOANS.map((loan) => ({ ...loan })),
  );
  const [bankSummary, setBankSummary] =
    useState<BankSummary>(MOCK_BANK_SUMMARY);
  const [propertySlots, setPropertySlots] = useState<PropertySlot[]>(() =>
    MOCK_PROPERTY_SLOTS.map((slot) => ({
      ...slot,
      item: slot.item ? { ...slot.item } : undefined,
    })),
  );
  const creditRating = "A+";

  const propertySlotUpgrade = characterUpgrades.find(
    (item) => item.id === PROPERTY_SLOT_UPGRADE_ID,
  );
  const propertySlotUnlockPrice =
    propertySlotUpgrade &&
    propertySlotUpgrade.level < propertySlotUpgrade.maxLevel &&
    hasLockedPropertySlots(propertySlots)
      ? calcUpgradePrice(propertySlotUpgrade)
      : undefined;

  const nextTurnForecast = useMemo(
    () =>
      buildNextTurnForecast({
        salary: characterProfile.salary,
        propertySlots,
        loanPaymentPerTurn: bankSummary.paymentPerTurn,
      }),
    [characterProfile.salary, propertySlots, bankSummary.paymentPerTurn],
  );

  useEffect(() => {
    if (!gameId) return;

    void fetchGameNews(gameId)
      .then((response) => {
        if (response.news.length > 0) {
          setNews(
            response.news.map((item, index) =>
              mapApiNewsToFeedItem(item, index),
            ),
          );
        }
      })
      .catch(() => {
        // Остаёмся на mock-ленте, если API недоступен
      });
  }, [gameId]);

  function removeOtcDeal(id: string) {
    setOtcDeals((deals) => deals.filter((deal) => deal.id !== id));
  }

  function handlePurchaseUpgrade(upgradeId: string) {
    const upgrade = characterUpgrades.find((item) => item.id === upgradeId);
    if (!upgrade || upgrade.level >= upgrade.maxLevel) return;

    const price = calcUpgradePrice(upgrade);
    if (balance < price) return;
    if (
      upgradeId === PROPERTY_SLOT_UPGRADE_ID &&
      !hasLockedPropertySlots(propertySlots)
    )
      return;

    setBalance((current) => current - price);
    setCharacterUpgrades((items) =>
      items.map((item) =>
        item.id === upgradeId ? { ...item, level: item.level + 1 } : item,
      ),
    );

    if (upgradeId === PROPERTY_SLOT_UPGRADE_ID) {
      setPropertySlots((slots) => unlockNextPropertySlot(slots));
    }

    setCharacterProfile((profile) => {
      if (upgradeId === "qualification") {
        return { ...profile, professionLevel: profile.professionLevel + 1 };
      }
      if (upgradeId === "trading") {
        return { ...profile, tradingLevel: profile.tradingLevel + 1 };
      }
      if (upgradeId === "negotiation") {
        return { ...profile, reputation: profile.reputation + 4 };
      }
      return profile;
    });
  }

  function handleLoanPayOff(loanId: string) {
    const loan = bankLoans.find((item) => item.id === loanId);
    if (!loan || balance < loan.remainingDebt) return;

    setBalance((current) => current - loan.remainingDebt);
    setBankLoans((loans) => loans.filter((item) => item.id !== loanId));
    setBankSummary((summary) => ({
      ...summary,
      totalDebt: summary.totalDebt - loan.remainingDebt,
      paymentPerTurn: summary.paymentPerTurn - loan.paymentPerTurn,
    }));
  }

  async function handleEndTurn() {
    setEndingTurn(true);
    try {
      if (gameId) {
        const result = await endGameTurn(gameId);
        setTurn(result.step);
        setBalance(result.balance);

        if (result.news.length > 0) {
          const freshNews = result.news.map((item, index) =>
            mapApiNewsToFeedItem(item, index),
          );
          setNews((current) => [...freshNews, ...current].slice(0, 15));
        }

        if (result.otcDeal) {
          setOtcDeals((current) => [
            mapOtcDealToCard(result.otcDeal!, `otc-${Date.now()}`),
            ...current,
          ]);
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setTurn((current) => current + 1);
      }
    } finally {
      setEndingTurn(false);
    }
  }

  return (
    <GameShell
      fixedHeight
      showAtmosphere={dynamicBackground}
      colorTheme={colorTheme}
      className={dashboardTheme.shellClass}
    >
      <div className="relative mx-auto flex h-full max-w-[100rem] flex-col gap-4 overflow-hidden p-3 md:p-4">
        {dynamicBackground && <BackgroundEffects />}

        <div className="relative z-10 flex h-full min-h-0 flex-col gap-4">
          <Header
            turn={turn}
            balance={balance}
            passiveIncome={calc_passive_income(propertySlots)}
            reputation={characterProfile.reputation}
            tradingLevel={characterProfile.tradingLevel}
            onEndTurn={() => void handleEndTurn()}
            endingTurn={endingTurn}
            theme={dashboardTheme}
          />

          <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch">
            <LeftSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              theme={dashboardTheme}
              onOpenExit={() => setExitModalOpen(true)}
            />
            <CenterPanel
              activeTab={activeTab}
              portfolio={MOCK_PORTFOLIO}
              otcDeals={otcDeals}
              onOtcDealAccept={removeOtcDeal}
              onOtcDealDecline={removeOtcDeal}
              characterProfile={characterProfile}
              characterUpgrades={characterUpgrades}
              balance={balance}
              onBalanceChange={setBalance}
              onPurchaseUpgrade={handlePurchaseUpgrade}
              bankSummary={bankSummary}
              bankLoans={bankLoans}
              onLoanPayOff={handleLoanPayOff}
              creditRating={creditRating}
              theme={dashboardTheme}
              dynamicBackground={dynamicBackground}
              colorTheme={colorTheme}
              onDynamicBackgroundChange={setDynamicBackground}
              onColorThemeChange={setColorTheme}
            />
            <RightPanel
              news={news}
              nextTurnForecast={nextTurnForecast}
              careerLevel={characterProfile.professionLevel}
              careerProgress={62}
              salary={characterProfile.salary}
              turnsUntilSalary={3}
              propertySlots={propertySlots}
              propertySlotUnlockPrice={propertySlotUnlockPrice}
              onGoToProfile={() => setActiveTab("character")}
              theme={dashboardTheme}
            />
          </div>
        </div>
      </div>

      <ExitGameModal
        open={exitModalOpen}
        theme={dashboardTheme}
        onCancel={() => setExitModalOpen(false)}
        onConfirm={() => navigate("/slots")}
      />
    </GameShell>
  );
}
