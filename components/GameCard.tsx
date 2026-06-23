import Link from "next/link";
import Crest from "./Crest";
import { formatVenueTime } from "@/lib/time";
import type { Game, Team } from "@/lib/types";

type Outcome = "win" | "lose" | undefined;

// One match card. Pure presentational; resolves team names from a lookup map
// and accepts optional source labels for TBD slots. For finished games it
// highlights the winner with a premium gold treatment.
export default function GameCard({
  game,
  teamById,
}: {
  game: Game;
  teamById: Map<string, Team>;
}) {
  const home = game.home_team_id ? teamById.get(game.home_team_id) ?? null : null;
  const away = game.away_team_id ? teamById.get(game.away_team_id) ?? null : null;
  const isLive = game.status === "live";
  const isFinal = game.status === "final";

  const winner =
    isFinal && game.home_score !== game.away_score
      ? game.home_score > game.away_score
        ? "home"
        : "away"
      : null;
  const isDraw = isFinal && game.home_score === game.away_score;

  return (
    <div
      className={`rounded-xl border bg-cancha-dark/60 p-3 ${
        winner
          ? "border-gold/40 shadow-[0_0_0_1px_rgba(231,181,60,0.15),0_6px_20px_-8px_rgba(231,181,60,0.4)]"
          : "border-gold/20"
      }`}
    >
      <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wide text-cream/50">
        <span>{game.stage}</span>
        <span className="flex items-center gap-2">
          <span>{game.field}</span>
          {game.scheduled_time && !isLive && !isFinal && (
            <span>{formatVenueTime(game.scheduled_time)}</span>
          )}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <TeamSide
          team={home}
          label={game.home_source}
          align="left"
          outcome={winner === "home" ? "win" : winner === "away" ? "lose" : undefined}
        />

        <div className="flex flex-col items-center">
          <div className="font-display text-2xl tabular-nums">
            {game.status === "upcoming" ? (
              <span className="text-cream/40">vs</span>
            ) : (
              <span className="flex items-baseline gap-1">
                <Score value={game.home_score} outcome={winner === "home" ? "win" : winner === "away" ? "lose" : undefined} />
                <span className="text-cream/30">–</span>
                <Score value={game.away_score} outcome={winner === "away" ? "win" : winner === "home" ? "lose" : undefined} />
              </span>
            )}
          </div>
        </div>

        <TeamSide
          team={away}
          label={game.away_source}
          align="right"
          outcome={winner === "away" ? "win" : winner === "home" ? "lose" : undefined}
        />
      </div>

      <div className="mt-2 flex items-center justify-center">
        {isLive ? (
          <span className="flex items-center gap-1.5 rounded-full bg-live/15 px-2 py-0.5 text-xs font-semibold text-live">
            <span className="inline-block h-2 w-2 animate-pulseLive rounded-full bg-live" />
            EN VIVO · {game.minute}&apos;
          </span>
        ) : isDraw ? (
          <span className="rounded-full bg-cream/10 px-2 py-0.5 text-xs font-semibold text-cream/70">
            FINAL · EMPATE
          </span>
        ) : isFinal ? (
          <span className="rounded-full bg-cream/10 px-2 py-0.5 text-xs font-semibold text-cream/70">
            FINAL
          </span>
        ) : (
          <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold">
            POR JUGAR
          </span>
        )}
      </div>
    </div>
  );
}

function Score({ value, outcome }: { value: number; outcome: Outcome }) {
  if (outcome === "win") return <span className="gold-gradient">{value}</span>;
  return <span className="text-cream">{value}</span>;
}

function TeamSide({
  team,
  label,
  align,
  outcome,
}: {
  team: Team | null;
  label: string | null;
  align: "left" | "right";
  outcome?: Outcome;
}) {
  const justify = align === "left" ? "justify-start" : "justify-end flex-row-reverse";
  if (!team) {
    return (
      <div className={`flex min-w-0 items-center gap-2 ${justify}`}>
        <Crest team={null} />
        <span className="min-w-0 truncate text-sm font-semibold text-cream/40">
          {label ?? "Por definir"}
        </span>
      </div>
    );
  }

  const win = outcome === "win";

  return (
    <Link
      href={`/equipo/${team.id}`}
      className={`flex min-w-0 items-center gap-2 rounded-lg transition-colors hover:opacity-90 ${justify}`}
    >
      <span
        className={`shrink-0 ${
          win ? "rounded-lg ring-2 ring-gold/70 shadow-[0_0_12px_rgba(231,181,60,0.5)]" : ""
        }`}
      >
        <Crest team={team} />
      </span>
      <span
        className={`flex min-w-0 items-center gap-1 text-sm font-semibold ${
          win ? "" : "text-cream"
        }`}
      >
        <span className={`min-w-0 truncate ${win ? "gold-gradient font-bold" : ""}`}>
          {team.name}
        </span>
      </span>
    </Link>
  );
}

