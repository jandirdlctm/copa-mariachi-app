"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePublicData } from "./RealtimeProvider";
import type { Game, Team } from "@/lib/types";

const LOOP_SECONDS = 60; // must match ticker-loop duration in globals.css

// Scrolling marquee of live + recent results. Duplicated once so the CSS
// translateX(-50%) loop is seamless.
export default function Ticker() {
  const { games, teams, live } = usePublicData();

  const items = useMemo(() => {
    const byId = new Map(teams.map((t) => [t.id, t]));
    const playable = games.filter((g) => g.home_team_id && g.away_team_id);
    // Live games first (chronological), then finished games newest-first so the
    // freshest results lead instead of the oldest.
    const liveGames = playable
      .filter((g) => g.status === "live")
      .sort((a, b) => a.sort_order - b.sort_order);
    const finalGames = playable
      .filter((g) => g.status === "final")
      .sort((a, b) => b.sort_order - a.sort_order);
    return [...liveGames, ...finalGames]
      .slice(0, 20)
      .map((g) => formatItem(g, byId));
  }, [games, teams]);

  // Match the intro speed to the loop speed: the loop covers one set (half the
  // doubled track) in LOOP_SECONDS, so speed = (scrollWidth/2)/LOOP_SECONDS.
  // The intro travels one container width (100vw) at that same speed.
  const trackRef = useRef<HTMLDivElement>(null);
  const [introDur, setIntroDur] = useState<number | null>(null);

  useEffect(() => {
    function measure() {
      const el = trackRef.current;
      if (!el) return;
      const containerW = el.parentElement?.clientWidth ?? window.innerWidth;
      const trackW = el.scrollWidth;
      if (trackW > 0) {
        const speed = trackW / 2 / LOOP_SECONDS; // px per second
        setIntroDur(containerW / speed);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="border-b border-gold/20 bg-cancha px-3 py-1.5 text-center text-xs text-cream/70">
        Pronto: marcadores en vivo de La Copa Mariachi
      </div>
    );
  }

  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-b border-gold/20 bg-cancha py-1.5">
      <div
        ref={trackRef}
        className="ticker-stream flex w-max gap-6 whitespace-nowrap px-3"
        style={
          introDur
            ? ({ "--intro-dur": `${introDur}s` } as React.CSSProperties)
            : undefined
        }
      >
        {doubled.map((it, i) => (
          <span key={i} className="flex items-center gap-2 text-xs">
            {it.isLive && (
              <span className="inline-block h-2 w-2 animate-pulseLive rounded-full bg-live" />
            )}
            <span className="font-display text-cream">{it.text}</span>
            {it.isLive ? (
              <span className="rounded bg-live/15 px-1.5 py-0.5 font-display text-[10px] text-live">
                {it.minute}&apos;
              </span>
            ) : (
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-display text-[10px] uppercase tracking-wide text-emerald-300">
                Final
              </span>
            )}
          </span>
        ))}
      </div>
      {live && (
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded bg-cancha-dark/70 px-1.5 text-[9px] text-gold">
          EN VIVO
        </span>
      )}
    </div>
  );
}

function formatItem(g: Game, byId: Map<string, Team>) {
  const h = byId.get(g.home_team_id!);
  const a = byId.get(g.away_team_id!);
  const home = h?.name ?? "?";
  const away = a?.name ?? "?";
  const isLive = g.status === "live";
  return {
    isLive,
    minute: g.minute,
    text: `${home} ${g.home_score}–${g.away_score} ${away}`,
  };
}
