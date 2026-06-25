import { motion } from "framer-motion";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { GameButton } from "../../components/game_ui/game_button";
import { GameShell } from "../../components/game_ui/game_shell";
import { sessionCardVariants } from "../../components/game_ui/session_animations";
import { SessionCard } from "../../components/game_ui/session_card";
import { useGameSettingsStore } from "../../stores/game_settings.store";
import { getGameDashboardTheme } from "../game_dashboard/_components/game_dashboard_theme";
import { GameSettingsPanel } from "../game_dashboard/_components/game_settings_panel";

export function SettingsPage() {
  const navigate = useNavigate();
  const { dynamicBackground, colorTheme, setDynamicBackground, setColorTheme } =
    useGameSettingsStore();
  const theme = useMemo(() => getGameDashboardTheme(colorTheme), [colorTheme]);
  const cardTheme = useMemo(() => getGameDashboardTheme("dark"), []);

  return (
    <GameShell
      showAtmosphere={dynamicBackground}
      colorTheme={colorTheme}
      className={theme.shellClass}
    >
      <div className="flex min-h-dvh items-center justify-center p-4 md:p-6">
        <motion.div
          className="w-full max-w-md"
          variants={sessionCardVariants}
          initial="hidden"
          animate="show"
        >
          <SessionCard badge="SETTINGS">
            <GameSettingsPanel
              animated
              theme={cardTheme}
              dynamicBackground={dynamicBackground}
              colorTheme={colorTheme}
              onDynamicBackgroundChange={setDynamicBackground}
              onColorThemeChange={setColorTheme}
              footer={
                <GameButton
                  fullWidth
                  variant="muted"
                  onClick={() => navigate("/menu")}
                >
                  Назад в меню
                </GameButton>
              }
            />
          </SessionCard>
        </motion.div>
      </div>
    </GameShell>
  );
}
