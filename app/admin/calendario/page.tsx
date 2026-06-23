import { requireOwner } from "@/lib/auth";
import { isServiceConfigured } from "@/lib/supabaseServer";
import { getAdminBundle } from "@/lib/adminQueries";
import ConfigNotice from "@/components/admin/ConfigNotice";
import ScheduleEditor from "@/components/admin/ScheduleEditor";
import { generateSchedule, togglePublish } from "../actions";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  await requireOwner();
  if (!isServiceConfigured) return <ConfigNotice />;

  const { tournament, teams, games } = await getAdminBundle();
  const groupGames = games.filter((g) => g.stage.startsWith("Grupo"));
  const koGames = games.filter((g) => !g.stage.startsWith("Grupo"));
  const published = tournament?.published ?? false;

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-gold/30 bg-cancha-dark/60 p-4">
        <h1 className="mb-1 font-display text-lg text-gold">Calendario</h1>
        <p className="mb-3 text-sm text-cream/60">
          {teams.length} equipos · {groupGames.length} partidos de grupo ·{" "}
          {koGames.length} de eliminatoria
        </p>
        <form action={generateSchedule}>
          <button className="rounded-lg bg-gold px-4 py-2 font-display text-ink">
            Generar calendario
          </button>
        </form>
        <p className="mt-2 text-xs text-cream/50">
          Crea el round-robin de cada grupo y los partidos de eliminatoria
          (Octavos → Final). Reemplaza cualquier calendario existente.
        </p>
      </section>

      <section className="rounded-xl border border-gold/30 bg-cancha-dark/60 p-4">
        <h2 className="mb-2 font-display text-base text-gold">Publicación</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-cream">
            Estado:{" "}
            <span className={published ? "text-gold" : "text-cream/50"}>
              {published ? "Publicado (visible al público)" : "Borrador (oculto)"}
            </span>
          </span>
          <form action={togglePublish}>
            <input type="hidden" name="published" value={String(!published)} />
            <button
              className={`rounded-lg px-4 py-2 font-display ${
                published
                  ? "bg-burgundy text-cream"
                  : "bg-gold text-ink"
              }`}
            >
              {published ? "Despublicar" : "Publicar"}
            </button>
          </form>
        </div>
      </section>

      {games.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base text-gold">
              Horarios y canchas ({games.length})
            </h2>
            <span className="text-xs text-cream/50">Hora local de Fontana</span>
          </div>
          <p className="text-xs text-cream/50">
            Ajusta la cancha y la hora de cada partido. Los cambios se publican
            al instante.
          </p>
          <ScheduleEditor games={games} teams={teams} />
        </section>
      )}
    </div>
  );
}
