import Header from "@/components/Header";
import TabNav from "@/components/TabNav";
import Ticker from "@/components/Ticker";
import RealtimeProvider from "@/components/RealtimeProvider";
import { getPublicBundle } from "@/lib/queries";

// Always render fresh data per request; Realtime takes over on the client.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bundle = await getPublicBundle();

  return (
    <RealtimeProvider initial={bundle}>
      <Header
        name={bundle.tournament?.name}
        prize={bundle.tournament?.prize_amount ?? 20000}
      />
      <Ticker />
      <TabNav />
      <main className="mx-auto max-w-5xl px-3 py-4 sm:px-5 sm:py-6">
        {!bundle.tournament && (
          <div className="mb-4 rounded-xl border border-gold/40 bg-burgundy/30 p-4 text-sm text-cream">
            <p className="font-display text-gold">Aún no hay torneo publicado</p>
            <p className="mt-1 text-cream/70">
              Configura Supabase (.env.local), corre las migraciones y el seed,
              y publica el torneo desde el panel de administración.
            </p>
          </div>
        )}
        {children}
      </main>
      <footer className="mx-auto max-w-5xl px-3 py-6 text-center text-xs text-cream/40">
        La Copa Mariachi Internacional 7v7 · Fontana, CA
      </footer>
    </RealtimeProvider>
  );
}
