import type { ReactNode } from "react";
import type { GameColorTheme } from "../../stores/game_settings.store";
import { NewGameAtmosphere } from "./new_game_atmosphere";

interface GameShellProps {
  children: ReactNode;
  className?: string;
  fixedHeight?: boolean;
  showAtmosphere?: boolean;
  colorTheme?: GameColorTheme;
}

export function GameShell({
  children,
  className = "",
  fixedHeight = false,
  showAtmosphere = true,
  colorTheme = "dark",
}: GameShellProps) {
  const baseBg =
    colorTheme === "light"
      ? "bg-gradient-to-br from-slate-100 via-white to-emerald-50 text-slate-900"
      : "bg-gradient-to-br from-[#061018] via-[#0a1628] to-[#0c2c1f] text-slate-100";

  return (
    <div
      className={`relative overflow-hidden ${baseBg} ${
        fixedHeight ? "h-dvh" : "min-h-dvh"
      } ${className}`}
    >
      {showAtmosphere && <NewGameAtmosphere />}
      <div className={`relative z-10 ${fixedHeight ? "h-full" : "min-h-dvh"}`}>
        {children}
      </div>
    </div>
  );
}
