import type { Team } from "@/lib/types";

// A colored rounded square showing a team's short code.
// Used everywhere a team appears (cards, tables, bracket, ticker).
export default function Crest({
  team,
  size = "md",
}: {
  team: Pick<Team, "short" | "color" | "name"> | null;
  size?: "sm" | "md" | "lg";
}) {
  const dims =
    size === "lg"
      ? "h-12 w-12 text-base"
      : size === "sm"
        ? "h-7 w-7 text-[10px]"
        : "h-9 w-9 text-xs";

  if (!team) {
    return (
      <span
        className={`${dims} inline-flex shrink-0 items-center justify-center rounded-lg border border-dashed border-cream/30 font-display text-cream/40`}
        aria-hidden
      >
        ?
      </span>
    );
  }

  return (
    <span
      className={`${dims} inline-flex shrink-0 items-center justify-center rounded-lg font-display uppercase leading-none shadow-inner`}
      style={{
        backgroundColor: team.color,
        color: readableText(team.color),
      }}
      title={team.name}
      aria-label={team.name}
    >
      {team.short}
    </span>
  );
}

// Pick black or white text for contrast against the crest color.
function readableText(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length < 6) return "#14110E";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#14110E" : "#F5F1E6";
}
