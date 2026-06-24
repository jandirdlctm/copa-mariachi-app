import type { Metadata } from "next";
import Image from "next/image";
import Countdown from "@/components/Countdown";

export const metadata: Metadata = {
  title: "La Copa Mariachi Internacional 7v7 — Próximamente",
  description: "Cuenta regresiva para La Copa Mariachi Internacional 7v7 en Fontana, CA.",
};

export default function ProximamentePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-ink">
      {/* Cinematic hero photo with a slow Ken Burns drift */}
      <Image
        src="/images/hero_image.jpeg"
        alt="La Copa Mariachi Internacional 7v7"
        fill
        priority
        sizes="100vw"
        className="kenburns object-cover object-center"
      />

      {/* Legibility gradient + vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/45 to-ink/90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(7,6,5,0.8))]" />

      {/* Floating gold light orbs for depth */}
      <div className="orb left-[-12%] top-[8%] h-72 w-72 bg-gold/25" />
      <div
        className="orb bottom-[4%] right-[-10%] h-80 w-80 bg-burgundy/40"
        style={{ animationDelay: "-7s" }}
      />
      <div
        className="orb left-[20%] bottom-[20%] h-56 w-56 bg-gold/15"
        style={{ animationDelay: "-3s" }}
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center">
        {/* rise-in on the wrapper, logo-glow on the image (two animations can't
            live on the same element). */}
        <div className="rise-in" style={{ animationDelay: "0.15s" }}>
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={120}
            height={120}
            priority
            className="logo-glow h-24 w-24 rounded-full ring-2 ring-gold/70 sm:h-32 sm:w-32"
          />
        </div>

        <div
          className="rise-in mt-6 max-w-3xl"
          style={{ animationDelay: "0.35s" }}
        >
          <h1 className="gold-shimmer font-display text-3xl leading-tight sm:text-5xl md:text-6xl">
            La Copa Mariachi Internacional 7v7
          </h1>
        </div>

        <p
          className="rise-in mt-3 text-sm uppercase tracking-[0.3em] text-gold sm:text-base"
          style={{ animationDelay: "0.5s" }}
        >
          Fontana, CA · 22–23 agosto
        </p>

        {/* Prize badge — the hook. rise-in on the wrapper, pulsing glow on the
            pill (two animations can't share one element). */}
        <div className="rise-in mt-7" style={{ animationDelay: "0.6s" }}>
          <div className="logo-glow inline-flex items-center gap-3 rounded-full border border-gold/50 bg-gradient-to-b from-gold/20 to-ink/60 px-6 py-2.5 backdrop-blur-md">
            <span className="gold-shimmer font-display text-3xl leading-none sm:text-4xl">
              $20,000
            </span>
            <span className="text-left text-[10px] font-bold uppercase leading-tight tracking-[0.2em] text-gold/90">
              en
              <br />
              premios
            </span>
          </div>
        </div>

        <p
          className="rise-in mt-10 text-xs uppercase tracking-[0.4em] text-cream/70 sm:text-sm"
          style={{ animationDelay: "0.78s" }}
        >
          Faltan
        </p>

        <div className="rise-in mt-5" style={{ animationDelay: "0.95s" }}>
          <Countdown />
        </div>
      </div>
    </main>
  );
}
