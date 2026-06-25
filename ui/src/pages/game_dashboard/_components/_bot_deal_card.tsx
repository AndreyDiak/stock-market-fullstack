import { useState } from "react";
import { GameButton } from "../../../components/game_ui/game_button";
import { MoneyValue } from "../../../components/money/money_value";
import { getBotAvatar } from "../../../constants/botAvatars";
import { DealArrowIcon, UserIcon } from "../../../shared/icons";
import type { bot_deal, bot_deal_side } from "../_model/types";
import {
  bot_deal_action_label,
  format_turns_left_label,
} from "../_model/utils";

function BotAvatar({ src, name }: { src?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <div className="relative h-12 w-12 shrink-0">
      {showImage ? (
        <img
          src={src}
          alt={name}
          onError={() => setFailed(true)}
          className="h-12 w-12 rounded-full object-cover ring-2 ring-white/10"
        />
      ) : (
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 ring-2 ring-white/10"
          aria-hidden
        >
          <UserIcon className="h-5 w-5 text-slate-500" />
        </div>
      )}
    </div>
  );
}

function DealSideArrow({ side }: { side: bot_deal_side }) {
  const playerBuys = side === "sell";

  return (
    <span
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
        playerBuys
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-red-500/15 text-red-400"
      }`}
      aria-hidden
    >
      <DealArrowIcon
        direction={playerBuys ? "buy" : "sell"}
        className="h-4 w-4"
      />
    </span>
  );
}

export function BotDealCard({
  deal,
  onAccept,
  onDecline,
}: {
  deal: bot_deal;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const total = deal.qty * deal.price;
  const lastTurn = deal.turnsLeft === 1;

  return (
    <article
      className={`rounded-2xl border p-4 transition ${
        lastTurn
          ? "border-yellow-500/50 bg-yellow-500/10 shadow-[0_0_24px_rgba(234,179,8,0.12)]"
          : "border-white/5 bg-slate-800/40 hover:border-emerald-400/15 hover:bg-slate-800/55"
      }`}
    >
      <div className="flex gap-3">
        <BotAvatar
          src={deal.avatarSrc ?? getBotAvatar(deal.botName, deal.profession)}
          name={deal.botName}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-bold text-white">{deal.botName}</p>
              <p className="truncate text-xs text-emerald-200/45">
                {deal.companyName}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                lastTurn
                  ? "animate-pulse bg-yellow-500/25 text-yellow-200 ring-1 ring-yellow-400/40"
                  : "bg-slate-700/50 text-slate-400"
              }`}
            >
              {format_turns_left_label(deal.turnsLeft)}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="font-mono text-xl font-black tracking-wide text-white">
              {deal.ticker}
            </span>
            <span className="text-sm font-semibold text-slate-400">
              ×{deal.qty}
            </span>
            <DealSideArrow side={deal.side} />
          </div>

          <div className="mt-2">
            <MoneyValue amount={total} size="lg" color="emerald" />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <GameButton
          variant="muted"
          size="sm"
          onClick={() => onDecline(deal.id)}
        >
          Отклонить
        </GameButton>
        <GameButton size="sm" onClick={() => onAccept(deal.id)}>
          {bot_deal_action_label(deal.side)}
        </GameButton>
      </div>
    </article>
  );
}
