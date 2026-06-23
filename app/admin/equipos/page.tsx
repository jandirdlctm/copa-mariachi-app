import { requireOwner } from "@/lib/auth";
import { isServiceConfigured } from "@/lib/supabaseServer";
import { getAdminBundle } from "@/lib/adminQueries";
import { GROUP_LABELS } from "@/lib/types";
import Crest from "@/components/Crest";
import ConfigNotice from "@/components/admin/ConfigNotice";
import { addTeam, deleteTeam, moveTeam } from "../actions";

export const dynamic = "force-dynamic";

export default async function EquiposPage() {
  await requireOwner();
  if (!isServiceConfigured) return <ConfigNotice />;

  const { teams } = await getAdminBundle();

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-gold/30 bg-cancha-dark/60 p-4">
        <h1 className="mb-3 font-display text-lg text-gold">Agregar equipo</h1>
        <form action={addTeam} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <input
            name="name"
            placeholder="Nombre"
            required
            className="col-span-2 rounded-lg border border-cream/20 bg-ink/40 px-3 py-2 text-cream placeholder:text-cream/40"
          />
          <input
            name="short"
            placeholder="Abrev (≤4)"
            maxLength={4}
            required
            className="rounded-lg border border-cream/20 bg-ink/40 px-3 py-2 uppercase text-cream placeholder:text-cream/40"
          />
          <select
            name="group"
            className="rounded-lg border border-cream/20 bg-ink/40 px-3 py-2 text-cream"
          >
            {GROUP_LABELS.map((g) => (
              <option key={g} value={g}>
                Grupo {g}
              </option>
            ))}
          </select>
          <button className="col-span-2 rounded-lg bg-gold px-3 py-2 font-display text-ink sm:col-span-4">
            Agregar
          </button>
        </form>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {GROUP_LABELS.map((g) => {
          const list = teams.filter((t) => t.group_label === g);
          return (
            <section
              key={g}
              className="rounded-xl border border-gold/20 bg-cancha-dark/60 p-3"
            >
              <h2 className="mb-2 font-display text-sm text-gold">
                Grupo {g}{" "}
                <span className="text-cream/40">({list.length})</span>
              </h2>
              {list.length === 0 ? (
                <p className="text-xs text-cream/40">Sin equipos.</p>
              ) : (
                <ul className="space-y-1.5">
                  {list.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center gap-2 rounded-lg bg-ink/30 p-1.5"
                    >
                      <Crest team={t} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-sm text-cream">
                        {t.name}
                      </span>
                      <form action={moveTeam} className="flex items-center">
                        <input type="hidden" name="id" value={t.id} />
                        <select
                          name="group"
                          defaultValue={t.group_label}
                          className="rounded border border-cream/20 bg-ink/40 px-1 py-0.5 text-xs text-cream"
                          // submit on change
                        >
                          {GROUP_LABELS.map((gl) => (
                            <option key={gl} value={gl}>
                              {gl}
                            </option>
                          ))}
                        </select>
                        <button className="ml-1 rounded bg-cancha px-1.5 py-0.5 text-[10px] text-cream">
                          Mover
                        </button>
                      </form>
                      <form action={deleteTeam}>
                        <input type="hidden" name="id" value={t.id} />
                        <button className="rounded px-1.5 py-0.5 text-xs text-live hover:bg-live/10">
                          ✕
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
