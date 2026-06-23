// Shown in admin pages when Supabase env vars are missing, so the panel
// degrades gracefully instead of throwing.
export default function ConfigNotice() {
  return (
    <div className="rounded-xl border border-gold/40 bg-burgundy/30 p-4 text-sm text-cream">
      <p className="font-display text-gold">Supabase no está configurado</p>
      <p className="mt-1 text-cream/70">
        Copia <code className="text-gold">.env.local.example</code> a{" "}
        <code className="text-gold">.env.local</code>, agrega las llaves de tu
        proyecto Supabase (incluyendo <code>SUPABASE_SERVICE_ROLE_KEY</code>),
        corre las migraciones y el seed, y reinicia el servidor.
      </p>
    </div>
  );
}
