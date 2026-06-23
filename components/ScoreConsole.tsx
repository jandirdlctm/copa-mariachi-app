import Crest from "./Crest";
import type { Game, Team } from "@/lib/types";
import {
  addGoal,
  adjustScore,
  finalizeGame,
  reopenGame,
  setMinute,
  startGame,
} from "@/app/admin/actions";

const STATUS_ORDER: Record<string, number> = { live: 0, upcoming: 1, final: 2 };

// The live-scoring console. All controls are plain server-action forms, so it
// works without client JS and every write goes through an authenticated action.
export default function ScoreConsole({
  games,
  teams,
}: {
  games: Game[];
  teams: Team[];
}) {
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const ordered = games
    .slice()
    .sort(
      (a, b) =>
        (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) ||
        a.sort_order - b.sort_order,
    );

  if (ordered.length === 0) {
    return (
      <p className="rounded-xl border border-gold/20 bg-cancha-dark/60 p-6 text-center text-sm text-cream/50">
        No hay partidos asignados.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {ordered.map((g) => (
        <GameRow key={g.id} game={g} teamById={teamById} />
      ))}
    </div>
  );
}

function GameRow({
  game,
  teamById,
}: {
  game: Game;
  teamById: Map<string, Team>;
}) {
  const home = game.home_team_id ? teamById.get(game.home_team_id) ?? null : null;
  const away = game.away_team_id ? teamById.get(game.away_team_id) ?? null : null;
  const live = game.status === "live";
  const upcoming = game.status === "upcoming";
  const final = game.status === "final";
  const playable = !!home && !!away;

  return (
    <div
      className={`rounded-xl border p-3 ${
        live
          ? "border-live/50 bg-live/5"
          : "border-gold/20 bg-cancha-dark/60"
      }`}
    >
      <div className="mb-2 flex items-center justify-between text-[11px] uppercase text-cream/50">
        <span>{game.stage}</span>
        <span className="flex items-center gap-2">
          <span>{game.field}</span>
          {live && (
            <span className="flex items-center gap-1 text-live">
              <span className="inline-block h-2 w-2 animate-pulseLive rounded-full bg-live" />
              EN VIVO · {game.minute}&apos;
            </span>
          )}
          {final && <span className="text-cream/60">FINAL</span>}
        </span>
      </div>

      <ScoreSide game={game} team={home} side="home" disabled={!playable || final} />
      <div className="my-1.5 h-px bg-cream/10" />
      <ScoreSide game={game} team={away} side="away" disabled={!playable || final} />

      {/* Controls */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {upcoming && (
          <form action={startGame}>
            <input type="hidden" name="id" value={game.id} />
            <button
              disabled={!playable}
              className="rounded-lg bg-gold px-3 py-1.5 font-display text-sm text-ink disabled:opacity-40"
            >
              Iniciar
            </button>
          </form>
        )}
        {live && (
          <>
            <form action={setMinute} className="flex items-center gap-1">
              <input type="hidden" name="id" value={game.id} />
              <input
                type="number"
                name="minute"
                defaultValue={game.minute}
                min={0}
                className="w-16 rounded border border-cream/20 bg-ink/40 px-2 py-1 text-sm text-cream"
              />
              <button className="rounded bg-cancha px-2 py-1 text-xs text-cream">
                Minuto
              </button>
            </form>
            <form action={finalizeGame}>
              <input type="hidden" name="id" value={game.id} />
              <button className="rounded-lg bg-burgundy px-3 py-1.5 font-display text-sm text-cream">
                Finalizar
              </button>
            </form>
          </>
        )}
        {final && (
          <form action={reopenGame}>
            <input type="hidden" name="id" value={game.id} />
            <button className="rounded-lg border border-gold/40 px-3 py-1.5 text-sm text-gold">
              Reabrir / corregir
            </button>
          </form>
        )}
        {!playable && upcoming && (
          <span className="text-xs text-cream/40">
            Equipos por definir (eliminatoria).
          </span>
        )}
      </div>
    </div>
  );
}

function ScoreSide({
  game,
  team,
  side,
  disabled,
}: {
  game: Game;
  team: Team | null;
  side: "home" | "away";
  disabled: boolean;
}) {
  const score = side === "home" ? game.home_score : game.away_score;
  return (
    <div className="flex items-center gap-2">
      <Crest team={team} size="sm" />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-cream">
        {team ? team.name : <span className="text-cream/40">Por definir</span>}
      </span>

      {/* +/- score */}
      <div className="flex items-center gap-1">
        <form action={adjustScore}>
          <input type="hidden" name="id" value={game.id} />
          <input type="hidden" name="side" value={side} />
          <input type="hidden" name="delta" value={-1} />
          <button
            disabled={disabled || score <= 0}
            aria-label="Restar gol"
            className="h-8 w-8 rounded-lg bg-ink/40 font-display text-cream disabled:opacity-30"
          >
            −
          </button>
        </form>
        <span className="w-7 text-center font-display text-xl tabular-nums text-cream">
          {score}
        </span>
        <form action={adjustScore}>
          <input type="hidden" name="id" value={game.id} />
          <input type="hidden" name="side" value={side} />
          <input type="hidden" name="delta" value={1} />
          <button
            disabled={disabled}
            aria-label="Sumar gol"
            className="h-8 w-8 rounded-lg bg-cancha font-display text-cream disabled:opacity-30"
          >
            +
          </button>
        </form>
      </div>

      {/* goal by named player */}
      {team && !disabled && (
        <form action={addGoal} className="flex items-center gap-1">
          <input type="hidden" name="id" value={game.id} />
          <input type="hidden" name="team_id" value={team.id} />
          <input
            name="player_name"
            placeholder="Goleador"
            className="w-24 rounded border border-cream/20 bg-ink/40 px-2 py-1 text-xs text-cream placeholder:text-cream/40"
          />
          <button className="rounded bg-gold/80 px-2 py-1 text-xs text-ink">
            +Gol
          </button>
        </form>
      )}
    </div>
  );
}
