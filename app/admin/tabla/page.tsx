import { requireOwner } from "@/lib/auth";
import { isServiceConfigured } from "@/lib/supabaseServer";
import { getAdminBundle } from "@/lib/adminQueries";
import { computeStandings, prizeProgress } from "@/lib/standings";
import { GROUP_LABELS } from "@/lib/types";
import StandingsTable from "@/components/StandingsTable";
import ConfigNotice from "@/components/admin/ConfigNotice";

export const dynamic = "force-dynamic";

export default async function AdminTablaPage() {
  await requireOwner();
  if (!isServiceConfigured) return <ConfigNotice />;

  const { teams, games } = await getAdminBundle();
  const { pct, finalized, total } = prizeProgress(games);
  const groups = GROUP_LABELS.filter((g) =>
    teams.some((t) => t.group_label === g),
  );

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gold/30 bg-cancha-dark/60 p-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-lg text-gold">Tabla (vista previa)</h1>
          <span className="text-sm text-cream/60">
            {finalized}/{total} finalizados · {pct}%
          </span>
        </div>
        <p className="mt-1 text-xs text-cream/50">
          Calculado automáticamente desde los resultados. Solo lectura.
        </p>
      </section>

      {groups.length === 0 ? (
        <p className="rounded-xl border border-gold/20 bg-cancha-dark/60 p-6 text-center text-sm text-cream/50">
          Aún no hay grupos con equipos.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((g) => (
            <StandingsTable
              key={g}
              group={g}
              rows={computeStandings(teams, games, g)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
