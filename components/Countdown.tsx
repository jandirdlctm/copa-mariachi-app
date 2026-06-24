"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Target: Aug 22, 2026 · 8:00 AM Pacific. August is PDT (UTC-7) → 15:00 UTC.
const TARGET = new Date("2026-08-22T15:00:00Z").getTime();

interface TimeLeft {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
}

function timeLeft(): TimeLeft | null {
  const diff = TARGET - Date.now();
  if (diff <= 0) return null;
  const s = Math.floor(diff / 1000);
  return {
    dias: Math.floor(s / 86400),
    horas: Math.floor((s % 86400) / 3600),
    minutos: Math.floor((s % 3600) / 60),
    segundos: s % 60,
  };
}

export default function Countdown() {
  // `undefined` until mounted, so server and first client render match.
  const [t, setT] = useState<TimeLeft | null | undefined>(undefined);

  useEffect(() => {
    setT(timeLeft());
    const id = setInterval(() => setT(timeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  if (t === null) {
    return (
      <div className="flex flex-col items-center gap-6">
        <p className="gold-shimmer font-display text-5xl sm:text-7xl">
          ¡Ya comenzó!
        </p>
        <Link
          href="/"
          className="gold-fill rounded-full px-7 py-3.5 font-display text-lg shadow-[0_10px_40px_-8px_rgba(231,181,60,0.6)] transition-transform duration-300 hover:scale-105 active:scale-95"
        >
          Entrar al torneo
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 sm:gap-4">
      <Unit label="Días" value={t?.dias} />
      <Sep />
      <Unit label="Horas" value={t?.horas} />
      <Sep />
      <Unit label="Min" value={t?.minutos} />
      <Sep />
      <Unit label="Seg" value={t?.segundos} />
    </div>
  );
}

function Unit({ label, value }: { label: string; value: number | undefined }) {
  const text = value === undefined ? "––" : String(value).padStart(2, "0");
  return (
    <div className="relative flex min-w-[72px] flex-col items-center overflow-hidden rounded-2xl border border-gold/40 bg-ink/55 px-3 py-3 shadow-[0_10px_34px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md [perspective:700px] sm:min-w-[110px] sm:px-6 sm:py-5">
      {/* glossy top highlight */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />
      <span className="font-display text-4xl tabular-nums sm:text-7xl">
        <span key={text} className="digit-roll gold-gradient">
          {text}
        </span>
      </span>
      <span className="mt-1.5 text-[10px] uppercase tracking-[0.25em] text-cream/70 sm:text-xs">
        {label}
      </span>
    </div>
  );
}

function Sep() {
  return (
    <span className="hidden self-center font-display text-3xl text-gold/40 sm:inline sm:text-5xl">
      :
    </span>
  );
}
