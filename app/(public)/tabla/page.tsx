"use client";

import { useMemo } from "react";
import { usePublicData } from "@/components/RealtimeProvider";
import StandingsTable from "@/components/StandingsTable";
import PrizeTracker from "@/components/PrizeTracker";
import Scorers from "@/components/Scorers";
import { computeStandings } from "@/lib/standings";
import { GROUP_LABELS } from "@/lib/types";

export default function TablaPage() {
  const { teams, games } = usePublicData();

  // Only show groups that actually have teams.
  const groups = useMemo(() => {
    return GROUP_LABELS.filter((g) =>
      teams.some((t) => t.group_label === g),
    ).map((g) => ({ group: g, rows: computeStandings(teams, games, g) }));
  }, [teams, games]);

  return (
    <div className="space-y-4">
      <PrizeTracker />

      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map(({ group, rows }) => (
          <StandingsTable key={group} group={group} rows={rows} />
        ))}
      </div>

      {groups.length === 0 && (
        <p className="rounded-xl border border-gold/20 bg-cancha-dark/60 p-6 text-center text-sm text-cream/50">
          Aún no hay grupos configurados.
        </p>
      )}

      <Scorers limit={15} />
    </div>
  );
}
