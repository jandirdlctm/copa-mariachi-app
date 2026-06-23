"use client";

import { useMemo } from "react";
import { usePublicData } from "./RealtimeProvider";
import Crest from "./Crest";
import TeamLink from "./TeamLink";

// Live top scorers (Goleadores), highest first.
export default function Scorers({ limit = 10 }: { limit?: number }) {
  const { scorers, teams } = usePublicData();

  const rows = useMemo(() => {
    const byId = new Map(teams.map((t) => [t.id, t]));
    return scorers
      .filter((s) => s.goals > 0)
      .sort((a, b) => b.goals - a.goals || a.player_name.localeCompare(b.player_name, "es"))
      .slice(0, limit)
      .map((s) => ({ ...s, team: byId.get(s.team_id) ?? null }));
  }, [scorers, teams, limit]);

  return (
    <section className="rounded-xl border border-gold/20 bg-cancha-dark/60 p-3">
      <h2 className="mb-2 font-display text-base text-gold">Goleadores</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-cream/50">Aún no hay goles registrados.</p>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((s, i) => (
            <li key={s.id} className="flex items-center gap-2 text-sm">
              <span className="w-4 text-right font-display text-cream/50">{i + 1}</span>
              <TeamLink teamId={s.team?.id} className="flex items-center hover:opacity-80">
                <Crest team={s.team} size="sm" />
              </TeamLink>
              <span className="min-w-0 flex-1 truncate text-cream">{s.player_name}</span>
              <span className="font-display text-gold">{s.goals}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
