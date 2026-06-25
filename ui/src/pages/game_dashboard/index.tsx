import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { Game } from "../../api/types";
import { GameShell } from "../../components/game_ui/game_shell";
import { useGameStore } from "../../stores/game.store";
import { useGameSettingsStore } from "../../stores/game_settings.store";
import { BackgroundEffects } from "./_components/_background_effects";
import { CenterPanel } from "./_components/_center_panel";
import { Header } from "./_components/_header";
import { LeftSidebar } from "./_components/_left_sidebar";
import { RightPanel } from "./_components/_right_panel";
import { ExitGameModal } from "./_components/exit_game_modal";
import { getGameDashboardTheme } from "./_components/game_dashboard_theme";
import type { dashboard_tab } from "./_model/types";
import { calc_passive_income, turnsUntilSalary } from "./_model/utils";

export function GameDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("id");
  const initialGame = (location.state as { initialGame?: Game } | null)
    ?.initialGame;

  const { dynamicBackground, colorTheme, setDynamicBackground, setColorTheme } =
    useGameSettingsStore();

  const loading = useGameStore((state) => state.loading);
  const turn = useGameStore((state) => state.turn);
  const balance = useGameStore((state) => state.balance);
  const news = useGameStore((state) => state.news);
  const otcDeals = useGameStore((state) => state.otcDeals);
  const portfolio = useGameStore((state) => state.portfolio);
  const characterProfile = useGameStore((state) => state.characterProfile);
  const characterUpgrades = useGameStore((state) => state.characterUpgrades);
  const bankLoans = useGameStore((state) => state.bankLoans);
  const bankSummary = useGameStore((state) => state.bankSummary);
  const propertySlots = useGameStore((state) => state.propertySlots);
  const nextTurnForecast = useGameStore((state) => state.nextTurnForecast);
  const creditRating = useGameStore((state) => state.creditRating);
  const endingTurn = useGameStore((state) => state.endingTurn);

  const init = useGameStore((state) => state.init);
  const reset = useGameStore((state) => state.reset);
  const setBalance = useGameStore((state) => state.setBalance);
  const removeOtcDeal = useGameStore((state) => state.removeOtcDeal);
  const purchaseUpgrade = useGameStore((state) => state.purchaseUpgrade);
  const payOffLoan = useGameStore((state) => state.payOffLoan);
  const endTurn = useGameStore((state) => state.endTurn);

  const [activeTab, setActiveTab] = useState<dashboard_tab>("exchange");
  const [exitModalOpen, setExitModalOpen] = useState(false);

  const dashboardTheme = useMemo(
    () => getGameDashboardTheme(colorTheme),
    [colorTheme],
  );

  useEffect(() => {
    if (!gameId) {
      navigate("/slots", { replace: true });
      return;
    }
    void init(gameId, initialGame);
    return () => {
      reset();
    };
  }, [gameId, initialGame, init, reset, navigate]);

  return (
    <GameShell
      fixedHeight
      showAtmosphere={dynamicBackground}
      colorTheme={colorTheme}
      className={dashboardTheme.shellClass}
    >
      {loading ? (
        <div className="flex h-full items-center justify-center p-4">
          <p className={`text-sm ${dashboardTheme.secondaryText}`}>
            Загрузка игры...
          </p>
        </div>
      ) : (
        <div className="relative mx-auto flex h-full max-w-[100rem] flex-col gap-4 overflow-hidden p-3 md:p-4">
          {dynamicBackground && <BackgroundEffects />}

          <div className="relative z-10 flex h-full min-h-0 flex-col gap-4">
            <Header
              turn={turn}
              balance={balance}
              passiveIncome={calc_passive_income(propertySlots)}
              reputation={characterProfile.reputation}
              tradingLevel={characterProfile.tradingLevel}
              onEndTurn={() => void endTurn()}
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
                portfolio={portfolio}
                otcDeals={otcDeals}
                onOtcDealAccept={removeOtcDeal}
                onOtcDealDecline={removeOtcDeal}
                characterProfile={characterProfile}
                characterUpgrades={characterUpgrades}
                balance={balance}
                onBalanceChange={setBalance}
                onPurchaseUpgrade={purchaseUpgrade}
                bankSummary={bankSummary}
                bankLoans={bankLoans}
                onLoanPayOff={payOffLoan}
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
                salary={characterProfile.salary}
                turnsUntilSalary={turnsUntilSalary(turn)}
                propertySlots={propertySlots}
                theme={dashboardTheme}
              />
            </div>
          </div>
        </div>
      )}

      <ExitGameModal
        open={exitModalOpen}
        theme={dashboardTheme}
        onCancel={() => setExitModalOpen(false)}
        onConfirm={() => navigate("/slots")}
      />
    </GameShell>
  );
}
