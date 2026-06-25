import type { ReactNode } from "react";
import { ExitIcon, SettingsIcon } from "../../../shared/icons";
import { NAV_ITEMS, SIDEBAR_PRIMARY_ITEMS } from "../_model/nav_items";
import type {
  dashboard_tab,
  left_sidebar_props,
  sidebar_nav_item,
} from "../_model/types";
import type { GameDashboardThemeTokens } from "./game_dashboard_theme";

function SidebarNavButton({
  item,
  active,
  onSelect,
  theme,
  notify,
}: {
  item: sidebar_nav_item;
  active: boolean;
  onSelect: () => void;
  theme: GameDashboardThemeTokens;
  notify?: boolean;
}) {
  return (
    <button
      type="button"
      title={item.label}
      onClick={onSelect}
      className={`group relative flex w-full items-center gap-3 rounded-[28px] border px-4 py-3 text-left backdrop-blur-md transition ${
        active ? theme.navActive : theme.navIdle
      }`}
    >
      <div
        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition ${
          active ? theme.navIconActive : theme.navIconIdle
        }`}
      >
        {item.icon}
        {notify ? (
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] ring-2 ring-slate-900"
          />
        ) : null}
      </div>
      <span className="text-sm font-bold leading-tight tracking-wide">
        {item.label}
      </span>
    </button>
  );
}

function SidebarFooterButton({
  label,
  icon,
  active,
  onClick,
  theme,
  danger,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick: () => void;
  theme: GameDashboardThemeTokens;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-[28px] border px-4 py-2.5 text-left backdrop-blur-md transition ${
        danger
          ? theme.isLight
            ? "border-red-200/80 bg-red-50/80 text-red-700 hover:border-red-300 hover:bg-red-50"
            : "border-red-900/40 bg-red-950/30 text-red-300 hover:border-red-500/35 hover:bg-red-950/50"
          : active
            ? theme.navActive
            : theme.navIdle
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition ${
          danger
            ? theme.isLight
              ? "bg-red-100 text-red-600"
              : "bg-red-500/15 text-red-400"
            : active
              ? theme.navIconActive
              : theme.navIconIdle
        }`}
      >
        {icon}
      </div>
      <span className="text-sm font-bold leading-tight tracking-wide">
        {label}
      </span>
    </button>
  );
}

export function LeftSidebar({
  activeTab,
  onTabChange,
  theme,
  onOpenExit,
  showNewsInsiderAlert,
}: left_sidebar_props) {
  const go = (tab: dashboard_tab) => () => onTabChange(tab);

  return (
    <nav className="flex shrink-0 flex-col gap-3 lg:w-48 lg:min-h-0 lg:self-stretch">
      {SIDEBAR_PRIMARY_ITEMS.map((item) => (
        <SidebarNavButton
          key={item.id}
          item={item}
          theme={theme}
          active={activeTab === item.id}
          onSelect={go(item.id)}
        />
      ))}

      <div className={`my-1 h-px ${theme.headerDivider}`} />

      {NAV_ITEMS.map((item) => (
        <SidebarNavButton
          key={item.id}
          item={item}
          theme={theme}
          active={activeTab === item.id}
          onSelect={go(item.id)}
          notify={item.id === 'news' && showNewsInsiderAlert && activeTab !== 'news'}
        />
      ))}

      <div
        className={`mt-auto flex flex-col gap-2 border-t pt-3 ${
          theme.isLight ? "border-slate-200/80" : "border-slate-700/50"
        }`}
      >
        <SidebarFooterButton
          label="Настройки"
          icon={<SettingsIcon className="h-6 w-6" />}
          theme={theme}
          active={activeTab === "settings"}
          onClick={go("settings")}
        />
        <SidebarFooterButton
          label="Выход"
          icon={<ExitIcon className="h-6 w-6" />}
          theme={theme}
          danger
          onClick={onOpenExit}
        />
      </div>
    </nav>
  );
}
