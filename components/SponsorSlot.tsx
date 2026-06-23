// Dashed placeholder for a sponsor ad. Swap in a real <Image> later.
export default function SponsorSlot({ label = "Espacio Patrocinador" }: { label?: string }) {
  return (
    <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-gold/40 bg-cancha-dark/40 text-center text-xs uppercase tracking-wide text-gold/70">
      {label}
    </div>
  );
}
