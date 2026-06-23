"use client";

import { useMemo } from "react";
import { usePublicData } from "./RealtimeProvider";
import { prizeProgress } from "@/lib/standings";

// "Camino al Premio $20,000" — fills as games finalize.
export default function PrizeTracker() {
  const { games, tournament } = usePublicData();
  const prize = tournament?.prize_amount ?? 20000;
  const { pct, finalized, total } = useMemo(() => prizeProgress(games), [games]);

  return (
    <section className="rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 via-burgundy/20 to-cancha-dark p-4 shadow-lg shadow-black/30">
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="font-display text-base text-cream">Camino al Premio</h2>
        <span className="gold-gradient font-display text-2xl">
          ${prize.toLocaleString("en-US")}
        </span>
      </div>
      <p className="mb-2 text-xs text-cream/60">
        {finalized} de {total} partidos finalizados
      </p>
      <div
        className="h-4 w-full overflow-hidden rounded-full bg-cancha-dark"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Avance del torneo"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold-dark via-gold to-gold-bright transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-right font-display text-sm text-gold">{pct}%</p>
    </section>
  );
}
