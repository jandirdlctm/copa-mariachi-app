"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Partidos" },
  { href: "/resultados", label: "Resultados" },
  { href: "/bracket", label: "Bracket" },
  { href: "/tabla", label: "Tabla" },
];

export default function TabNav() {
  const pathname = usePathname();
  return (
    <nav
      className="sticky top-0 z-20 border-b border-gold/20 bg-cancha-dark/95 backdrop-blur"
      aria-label="Secciones"
    >
      <div className="mx-auto flex max-w-5xl">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`flex-1 whitespace-nowrap px-1 py-3 text-center font-display text-[11px] uppercase tracking-tight transition-colors sm:px-2 sm:text-sm sm:tracking-normal md:text-base ${
                active
                  ? "border-b-2 border-gold text-gold"
                  : "border-b-2 border-transparent text-cream/60 hover:text-cream"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
