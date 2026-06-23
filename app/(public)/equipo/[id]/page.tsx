"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePublicData } from "@/components/RealtimeProvider";
import Crest from "@/components/Crest";
import GameCard from "@/components/GameCard";
import { computeStandings } from "@/lib/standings";

export default function EquipoPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { teams, games } = usePublicData();

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const team = id ? teamById.get(id) ?? null : null;

  // This team's standings row + position within its group.
  const standing = useMemo(() => {
    if (!team) return null;
    const rows = computeStandings(teams, games, team.group_label);
    const idx = rows.findIndex((r) => r.team.id === team.id);
    return idx === -1 ? null : { row: rows[idx], position: idx + 1 };
  }, [team, teams, games]);

  // Every game this team appears in, in schedule order.
  const myGames = useMemo(() => {
    if (!team) return [];
    return games
      .filter((g) => g.home_team_id === team.id || g.away_team_id === team.id)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [team, games]);

  const played = myGames.filter((g) => g.status === "live" || g.status === "final");
  const upcoming = myGames.filter((g) => g.status === "upcoming");

  if (!team) {
    return (
      <div className="space-y-3">
        <p className="rounded-xl border border-gold/20 bg-cancha-dark/60 p-6 text-center text-sm text-cream/50">
          Equipo no encontrado.
        </p>
        <Link href="/" className="text-sm text-gold hover:underline">
          ← Volver a Partidos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link href="/tabla" className="inline-block text-sm text-cream/60 hover:text-gold">
        ← Volver
      </Link>

      {/* Header */}
      <section className="flex items-center gap-3 rounded-xl border border-gold/30 bg-gradient-to-br from-burgundy/30 to-cancha-dark p-4">
        <Crest team={team} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl text-cream">{team.name}</h1>
          <p className="text-sm text-gold">Grupo {team.group_label}</p>
        </div>
      </section>

      {/* Group summary */}
      {standing && (
        <section className="rounded-xl border border-gold/20 bg-cancha-dark/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-sm text-gold">En el grupo</h2>
            <span className="text-sm text-cream/70">
              {standing.position}° de Grupo {team.group_label}
              {standing.position <= 2 && (
                <span className="ml-2 rounded bg-gold/15 px-1.5 py-0.5 text-xs text-gold">
                  Clasifica
                </span>
              )}
            </span>
          </div>
          <dl className="grid grid-cols-4 gap-2 text-center sm:grid-cols-7">
            <Stat label="PJ" value={standing.row.pj} />
            <Stat label="G" value={standing.row.g} />
            <Stat label="E" value={standing.row.e} />
            <Stat label="P" value={standing.row.p} />
            <Stat label="GF" value={standing.row.gf} />
            <Stat label="GC" value={standing.row.gc} />
            <Stat label="Pts" value={standing.row.pts} highlight />
          </dl>
        </section>
      )}

      {/* Played */}
      <section className="space-y-2">
        <h2 className="font-display text-base text-gold">
          Jugados <span className="text-cream/40">({played.length})</span>
        </h2>
        {played.length === 0 ? (
          <p className="text-sm text-cream/50">Aún no ha jugado.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {played.map((g) => (
              <GameCard key={g.id} game={g} teamById={teamById} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      <section className="space-y-2">
        <h2 className="font-display text-base text-gold">
          Próximos <span className="text-cream/40">({upcoming.length})</span>
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-cream/50">No hay partidos próximos.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((g) => (
              <GameCard key={g.id} game={g} teamById={teamById} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg bg-ink/30 py-1.5">
      <dt className="text-[10px] uppercase text-cream/50">{label}</dt>
      <dd
        className={`font-display tabular-nums ${
          highlight ? "text-gold" : "text-cream"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
