"use client";

import { useMemo, useState } from "react";
import { usePublicData } from "@/components/RealtimeProvider";
import GameCard from "@/components/GameCard";
import SponsorSlot from "@/components/SponsorSlot";
import Scorers from "@/components/Scorers";
import { GROUP_LABELS } from "@/lib/types";

const STATUS_ORDER: Record<string, number> = { live: 0, upcoming: 1, final: 2 };

// "proximos" = all live + upcoming games; otherwise a group label ("A".."H").
const UPCOMING = "proximos";

export default function PartidosPage() {
  const { games, teams } = usePublicData();
  const [filter, setFilter] = useState<string>(UPCOMING);

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  // Only offer groups that actually have teams.
  const groups = useMemo(
    () => GROUP_LABELS.filter((g) => teams.some((t) => t.group_label === g)),
    [teams],
  );

  const visible = useMemo(() => {
    const list =
      filter === UPCOMING
        ? // What's next: live + upcoming across the whole tournament.
          games.filter((g) => g.status !== "final")
        : // A specific group's full fixture list (all statuses).
          games.filter((g) => g.stage === `Grupo ${filter}`);

    return list.slice().sort((a, b) => {
      const s = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
      if (s !== 0) return s;
      return a.sort_order - b.sort_order;
    });
  }, [games, filter]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div>
        {/* Group filter */}
        <div className="mb-3 flex items-center gap-2">
          <label htmlFor="filtro" className="text-sm text-cream/60">
            Mostrar:
          </label>
          <select
            id="filtro"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-gold/30 bg-cancha-dark/80 px-3 py-1.5 text-sm font-semibold text-cream"
          >
            <option value={UPCOMING}>Próximos Partidos</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                Grupo {g}
              </option>
            ))}
          </select>
        </div>

        {visible.length === 0 ? (
          <p className="rounded-xl border border-gold/20 bg-cancha-dark/60 p-6 text-center text-sm text-cream/50">
            {filter === UPCOMING
              ? "No hay partidos próximos por ahora."
              : `No hay partidos para el Grupo ${filter}.`}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {visible.map((g) => (
              <GameCard key={g.id} game={g} teamById={teamById} />
            ))}
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <Scorers />
        <SponsorSlot />
        <SponsorSlot label="Tu marca aquí" />
      </aside>
    </div>
  );
}
