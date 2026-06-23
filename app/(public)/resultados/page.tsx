"use client";

import { useMemo, useState } from "react";
import { usePublicData } from "@/components/RealtimeProvider";
import GameCard from "@/components/GameCard";
import SponsorSlot from "@/components/SponsorSlot";
import Scorers from "@/components/Scorers";
import { GROUP_LABELS } from "@/lib/types";

const ALL = "todos";

// Knockout rounds, in order. `match` maps a round to its game stages.
const KO_ROUNDS: { value: string; label: string; match: (stage: string) => boolean }[] = [
  { value: "Octavos", label: "Octavos de final", match: (s) => s.startsWith("Octavos") },
  { value: "Cuartos", label: "Cuartos de final", match: (s) => s.startsWith("Cuartos") },
  { value: "Semifinales", label: "Semifinales", match: (s) => s.startsWith("Semifinal") },
  { value: "Final", label: "Final", match: (s) => s === "Final" },
];

export default function ResultadosPage() {
  const { games, teams } = usePublicData();
  const [filter, setFilter] = useState<string>(ALL);

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  // Only offer groups / rounds that actually exist in the schedule.
  const groups = useMemo(
    () => GROUP_LABELS.filter((g) => teams.some((t) => t.group_label === g)),
    [teams],
  );
  const koRounds = useMemo(
    () => KO_ROUNDS.filter((r) => games.some((g) => r.match(g.stage))),
    [games],
  );

  // Finished games for the current filter, most recent first.
  const results = useMemo(() => {
    const finals = games.filter((g) => g.status === "final");
    let scoped = finals;
    if (filter === ALL) {
      scoped = finals;
    } else if ((GROUP_LABELS as readonly string[]).includes(filter)) {
      scoped = finals.filter((g) => g.stage === `Grupo ${filter}`);
    } else {
      const round = KO_ROUNDS.find((r) => r.value === filter);
      scoped = round ? finals.filter((g) => round.match(g.stage)) : finals;
    }
    return scoped.slice().sort((a, b) => b.sort_order - a.sort_order);
  }, [games, filter]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <label htmlFor="filtro-res" className="text-sm text-cream/60">
            Mostrar:
          </label>
          <select
            id="filtro-res"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-gold/30 bg-cancha-dark/80 px-3 py-1.5 text-sm font-semibold text-cream"
          >
            <option value={ALL}>Todos los Resultados</option>
            {groups.length > 0 && (
              <optgroup label="Fase de grupos">
                {groups.map((g) => (
                  <option key={g} value={g}>
                    Grupo {g}
                  </option>
                ))}
              </optgroup>
            )}
            {koRounds.length > 0 && (
              <optgroup label="Eliminatoria">
                {koRounds.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {results.length === 0 ? (
          <p className="rounded-xl border border-gold/20 bg-cancha-dark/60 p-6 text-center text-sm text-cream/50">
            {filter === ALL
              ? "Todavía no hay partidos finalizados."
              : "No hay resultados para esta selección."}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {results.map((g) => (
              <GameCard key={g.id} game={g} teamById={teamById} />
            ))}
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <Scorers />
        <SponsorSlot />
      </aside>
    </div>
  );
}
