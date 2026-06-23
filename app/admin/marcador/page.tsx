import { requireScorerOrOwner } from "@/lib/auth";
import { isServiceConfigured } from "@/lib/supabaseServer";
import { getAdminBundle } from "@/lib/adminQueries";
import ScoreConsole from "@/components/ScoreConsole";
import ConfigNotice from "@/components/admin/ConfigNotice";

export const dynamic = "force-dynamic";

export default async function MarcadorPage() {
  const session = await requireScorerOrOwner();
  if (!isServiceConfigured) return <ConfigNotice />;

  const { teams, games } = await getAdminBundle();

  // Scorers only see (and can act on) games for their field.
  const visible =
    session?.role === "scorer"
      ? games.filter((g) => g.field === session.field)
      : games;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-lg text-gold">Marcador en vivo</h1>
        <span className="text-xs text-cream/50">
          {session?.role === "scorer" ? session.field : "Todas las canchas"}
        </span>
      </div>
      <ScoreConsole games={visible} teams={teams} />
    </div>
  );
}
