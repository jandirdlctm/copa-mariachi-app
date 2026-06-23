import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logout } from "./actions";

const OWNER_NAV = [
  { href: "/admin/equipos", label: "Equipos" },
  { href: "/admin/calendario", label: "Calendario" },
  { href: "/admin/marcador", label: "Marcador" },
  { href: "/admin/tabla", label: "Tabla" },
  { href: "/admin/pins", label: "PINs" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="min-h-screen">
      <header className="border-b border-gold/30 bg-cancha-dark/90">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-3 py-2">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={40}
            height={40}
            className="h-9 w-9 rounded-full ring-2 ring-gold/60"
          />
          <span className="font-display text-sm text-cream">
            Admin · Copa Mariachi
          </span>
          <span className="ml-auto flex items-center gap-3">
            {session && (
              <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs text-gold">
                {session.role === "owner" ? "Dueño" : `Capturista · ${session.field}`}
              </span>
            )}
            <Link href="/" className="text-xs text-cream/60 hover:text-cream">
              Ver público
            </Link>
            {session && (
              <form action={logout}>
                <button className="text-xs text-cream/60 hover:text-live">
                  Salir
                </button>
              </form>
            )}
          </span>
        </div>

        {session?.role === "owner" && (
          <nav className="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-3 pb-2">
            {OWNER_NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="whitespace-nowrap rounded-md px-3 py-1 text-sm text-cream/70 hover:bg-cancha hover:text-cream"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-4xl px-3 py-4">{children}</main>
    </div>
  );
}
