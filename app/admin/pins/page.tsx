import { requireOwner } from "@/lib/auth";
import { isServiceConfigured } from "@/lib/supabaseServer";
import { getAdminBundle } from "@/lib/adminQueries";
import { FIELDS } from "@/lib/types";
import ConfigNotice from "@/components/admin/ConfigNotice";
import { createPin, deletePin } from "../actions";

export const dynamic = "force-dynamic";

export default async function PinsPage() {
  await requireOwner();
  if (!isServiceConfigured) return <ConfigNotice />;

  const { pins } = await getAdminBundle();

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-gold/30 bg-cancha-dark/60 p-4">
        <h1 className="mb-3 font-display text-lg text-gold">PIN de capturista</h1>
        <form action={createPin} className="grid grid-cols-2 gap-2">
          <select
            name="label"
            className="rounded-lg border border-cream/20 bg-ink/40 px-3 py-2 text-cream"
          >
            {FIELDS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <input
            name="pin"
            placeholder="PIN (4–6 dígitos)"
            inputMode="numeric"
            pattern="[0-9]{4,6}"
            required
            className="rounded-lg border border-cream/20 bg-ink/40 px-3 py-2 tracking-widest text-cream placeholder:text-cream/40"
          />
          <button className="col-span-2 rounded-lg bg-gold px-3 py-2 font-display text-ink">
            Crear PIN
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-gold/20 bg-cancha-dark/60 p-3">
        <h2 className="mb-2 font-display text-sm text-gold">PINs activos</h2>
        {pins.length === 0 ? (
          <p className="text-xs text-cream/40">Aún no hay PINs.</p>
        ) : (
          <ul className="space-y-1.5">
            {pins.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-2 rounded-lg bg-ink/30 px-3 py-2"
              >
                <span className="font-display text-sm text-cream">{p.label}</span>
                <span className="rounded bg-gold/15 px-2 py-0.5 font-mono text-sm tracking-widest text-gold">
                  {p.pin}
                </span>
                <form action={deletePin} className="ml-auto">
                  <input type="hidden" name="id" value={p.id} />
                  <button className="rounded px-1.5 py-0.5 text-xs text-live hover:bg-live/10">
                    Eliminar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-cream/50">
          Comparte cada PIN solo con el capturista de esa cancha. Los PINs nunca
          se exponen al público.
        </p>
      </section>
    </div>
  );
}
