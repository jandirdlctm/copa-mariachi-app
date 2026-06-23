import Link from "next/link";
import Crest from "./Crest";
import type { StandingsRow } from "@/lib/types";

// One group's standings table. The top two rows are highlighted as qualifiers.
export default function StandingsTable({
  group,
  rows,
}: {
  group: string;
  rows: StandingsRow[];
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-gold/20 bg-cancha-dark/60">
      <h3 className="border-b border-gold/20 bg-cancha px-3 py-2 font-display text-sm text-gold">
        Grupo {group}
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase text-cream/50">
            <th className="px-2 py-1.5 text-left font-medium">Equipo</th>
            <th className="px-1 py-1.5 text-center font-medium">PJ</th>
            <th className="px-1 py-1.5 text-center font-medium">G</th>
            <th className="px-1 py-1.5 text-center font-medium">E</th>
            <th className="px-1 py-1.5 text-center font-medium">P</th>
            <th className="px-1 py-1.5 text-center font-medium">DG</th>
            <th className="px-2 py-1.5 text-center font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const qualifies = i < 2;
            return (
              <tr
                key={r.team.id}
                className={`border-t border-cream/5 ${
                  qualifies ? "bg-gold/10" : ""
                }`}
              >
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 text-center font-display text-xs ${
                        qualifies ? "text-gold" : "text-cream/40"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <Link
                      href={`/equipo/${r.team.id}`}
                      className="flex min-w-0 items-center gap-2 transition-colors hover:text-gold"
                    >
                      <Crest team={r.team} size="sm" />
                      <span className="min-w-0 truncate text-cream hover:text-gold">
                        {r.team.name}
                      </span>
                    </Link>
                  </div>
                </td>
                <td className="px-1 py-1.5 text-center tabular-nums text-cream/80">{r.pj}</td>
                <td className="px-1 py-1.5 text-center tabular-nums text-cream/80">{r.g}</td>
                <td className="px-1 py-1.5 text-center tabular-nums text-cream/80">{r.e}</td>
                <td className="px-1 py-1.5 text-center tabular-nums text-cream/80">{r.p}</td>
                <td className="px-1 py-1.5 text-center tabular-nums text-cream/80">
                  {r.dg > 0 ? `+${r.dg}` : r.dg}
                </td>
                <td className="px-2 py-1.5 text-center font-display tabular-nums text-gold">
                  {r.pts}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
