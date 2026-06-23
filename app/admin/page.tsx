import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { loginOwner, loginScorer } from "./actions";

const ERRORS: Record<string, string> = {
  owner: "Contraseña incorrecta.",
  pin: "PIN inválido.",
  notournament: "No hay torneo configurado todavía.",
};

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session?.role === "owner") redirect("/admin/equipos");
  if (session?.role === "scorer") redirect("/admin/marcador");

  const { error } = await searchParams;
  const message = error ? ERRORS[error] ?? "Error al iniciar sesión." : null;

  return (
    <div className="mx-auto max-w-sm space-y-6 py-6">
      {message && (
        <p className="rounded-lg border border-live/50 bg-live/10 px-3 py-2 text-sm text-live">
          {message}
        </p>
      )}

      <section className="rounded-xl border border-gold/30 bg-cancha-dark/60 p-4">
        <h1 className="mb-3 font-display text-lg text-gold">Acceso Dueño</h1>
        <form action={loginOwner} className="space-y-3">
          <input
            type="password"
            name="password"
            placeholder="Contraseña de administrador"
            autoComplete="current-password"
            className="w-full rounded-lg border border-cream/20 bg-ink/40 px-3 py-2 text-cream placeholder:text-cream/40"
            required
          />
          <button className="w-full rounded-lg bg-gold px-3 py-2 font-display text-ink">
            Entrar
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-gold/30 bg-cancha-dark/60 p-4">
        <h1 className="mb-3 font-display text-lg text-gold">Acceso Capturista</h1>
        <p className="mb-3 text-xs text-cream/60">
          Ingresa el PIN de tu cancha para capturar marcadores.
        </p>
        <form action={loginScorer} className="space-y-3">
          <input
            type="text"
            inputMode="numeric"
            name="pin"
            placeholder="PIN (4–6 dígitos)"
            className="w-full rounded-lg border border-cream/20 bg-ink/40 px-3 py-2 tracking-widest text-cream placeholder:text-cream/40"
            required
          />
          <button className="w-full rounded-lg bg-burgundy px-3 py-2 font-display text-cream">
            Capturar marcador
          </button>
        </form>
      </section>
    </div>
  );
}
