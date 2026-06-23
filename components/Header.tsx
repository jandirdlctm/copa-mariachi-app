import Image from "next/image";
import Link from "next/link";

// Public-site header: logo, tournament name, location, and the $20,000 pill.
export default function Header({
  name = "La Copa Mariachi Internacional 7v7",
  prize = 20000,
}: {
  name?: string;
  prize?: number;
}) {
  return (
    <header className="border-b border-gold/30 bg-cancha-dark/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4">
        <Link href="/" className="shrink-0">
          <Image
            src="/images/logo.png"
            alt="Logo La Copa Mariachi Internacional"
            width={88}
            height={88}
            priority
            className="h-14 w-14 rounded-full ring-2 ring-gold/70 shadow-lg shadow-black/40 sm:h-16 sm:w-16 md:h-[5.5rem] md:w-[5.5rem]"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="gold-gradient line-clamp-2 font-display text-[15px] leading-tight sm:text-lg md:text-2xl">
            {name}
          </h1>
          <p className="mt-0.5 truncate text-[10px] uppercase tracking-wide text-cream/60 sm:text-xs md:text-sm">
            Fontana, CA · 22–23 agosto
          </p>
        </div>
        <span className="gold-fill shrink-0 self-center whitespace-nowrap rounded-full px-3 py-1 font-display text-sm sm:px-4 sm:py-1.5 sm:text-base md:text-lg">
          ${prize.toLocaleString("en-US")}
        </span>
      </div>
    </header>
  );
}
