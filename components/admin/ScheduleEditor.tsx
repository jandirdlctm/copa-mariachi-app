import { FIELDS, type Game, type Team } from "@/lib/types";
import { toVenueInputValue } from "@/lib/time";
import { updateGameSchedule } from "@/app/admin/actions";

// Owner-only editor: set each game's field + kickoff time. One server-action
// form per game (no client JS needed). Times are venue-local (Pacific).
export default function ScheduleEditor({
  games,
  teams,
}: {
  games: Game[];
  teams: Team[];
}) {
  const teamById = new Map(teams.map((t) => [t.id, t]));

  // Group rows under their stage heading, preserving sort order.
  const byStage = new Map<string, Game[]>();
  for (const g of games.slice().sort((a, b) => a.sort_order - b.sort_order)) {
    const list = byStage.get(g.stage) ?? [];
    list.push(g);
    byStage.set(g.stage, list);
  }

  function label(g: Game, side: "home" | "away"): string {
    const id = side === "home" ? g.home_team_id : g.away_team_id;
    const src = side === "home" ? g.home_source : g.away_source;
    if (id) return teamById.get(id)?.short ?? teamById.get(id)?.name ?? "?";
    return src ?? "?";
  }

  return (
    <div className="space-y-4">
      {[...byStage.entries()].map(([stage, list]) => (
        <section
          key={stage}
          className="rounded-xl border border-gold/20 bg-cancha-dark/60 p-3"
        >
          <h3 className="mb-2 font-display text-sm text-gold">{stage}</h3>
          <ul className="space-y-2">
            {list.map((g) => (
              <li key={g.id}>
                <form
                  action={updateGameSchedule}
                  className="flex flex-wrap items-center gap-2"
                >
                  <input type="hidden" name="id" value={g.id} />
                  <span className="w-28 shrink-0 truncate text-sm text-cream">
                    {label(g, "home")}{" "}
                    <span className="text-cream/40">vs</span>{" "}
                    {label(g, "away")}
                  </span>
                  <select
                    name="field"
                    defaultValue={g.field}
                    className="rounded border border-cream/20 bg-ink/40 px-2 py-1 text-sm text-cream"
                  >
                    {FIELDS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                  <input
                    type="datetime-local"
                    name="time"
                    defaultValue={toVenueInputValue(g.scheduled_time)}
                    className="rounded border border-cream/20 bg-ink/40 px-2 py-1 text-sm text-cream"
                  />
                  <button className="rounded bg-gold px-3 py-1 text-sm font-semibold text-ink">
                    Guardar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
