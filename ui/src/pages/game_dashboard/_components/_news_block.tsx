import type { news_item } from "../_model/types";
import { is_insider_news, news_border_class } from "../_model/utils";
import { InsiderNewsBadge } from "./_insider_news_badge";
import type { GameDashboardThemeTokens } from "./game_dashboard_theme";

export function NewsBlock({
  news,
  theme,
}: {
  news: news_item[];
  theme: GameDashboardThemeTokens;
}) {
  return (
    <section
      className={`rounded-[24px] border p-3 ring-1 ${
        theme.isLight
          ? "border-slate-200/80 bg-white/70 ring-slate-200/60"
          : "border-slate-700/40 bg-slate-800/50 ring-slate-700/20"
      }`}
    >
      <h3 className={theme.sectionTitle}>Новости</h3>
      <div className="space-y-2">
        {news.map((item) => {
          const insider = is_insider_news(item);

          return (
            <article
              key={item.id}
              className={
                insider
                  ? "rounded-2xl border border-amber-400/35 border-l-4 border-l-amber-400 bg-gradient-to-br from-amber-500/12 via-slate-900/75 to-slate-900/60 p-2.5 shadow-[0_0_18px_rgba(251,191,36,0.14)] ring-1 ring-amber-400/25 transition hover:border-amber-300/55 hover:shadow-[0_0_26px_rgba(251,191,36,0.28)]"
                  : `rounded-2xl border border-l-4 p-2.5 transition hover:border-emerald-400/25 hover:shadow-[0_0_16px_rgba(16,185,129,0.12)] ${news_border_class(item.sentiment)} ${
                      theme.isLight
                        ? "border-slate-200/80 bg-white/80"
                        : "border-slate-700/40 bg-slate-900/60"
                    }`
              }
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                {insider ? <InsiderNewsBadge /> : <span />}
                <span
                  className={`shrink-0 text-[10px] font-bold uppercase tracking-wider ${
                    insider
                      ? "text-amber-300/90"
                      : item.hot
                        ? "text-emerald-400"
                        : theme.secondaryText
                  }`}
                >
                  {item.timeLabel}
                </span>
              </div>
              <h4
                className={`text-sm font-bold leading-snug ${
                  insider ? "text-amber-50" : theme.primaryText
                }`}
              >
                {item.title}
              </h4>
              <p
                className={`mt-1 line-clamp-2 text-xs ${
                  insider ? "text-amber-100/75" : theme.secondaryText
                }`}
              >
                {item.excerpt}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
