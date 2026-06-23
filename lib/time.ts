// Timezone helpers pinned to the venue (Fontana, CA = America/Los_Angeles).
//
// We store scheduled_time as a UTC timestamptz, but the owner edits — and fans
// see — wall-clock time at the venue. Forcing a single zone means a fan in
// Texas or Jalisco still sees the real kickoff time, not their device's local
// shift. No external date library; uses Intl only.

export const VENUE_TZ = "America/Los_Angeles";

function partsInTz(date: Date) {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: VENUE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const out: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) out[p.type] = p.value;
  // Intl can emit "24" for midnight — normalize.
  if (out.hour === "24") out.hour = "00";
  return out;
}

// Minutes the venue zone is offset from UTC at a given instant (handles DST).
function venueOffsetMinutes(instant: Date): number {
  const p = partsInTz(instant);
  const asIfUtc = Date.UTC(
    +p.year,
    +p.month - 1,
    +p.day,
    +p.hour,
    +p.minute,
    +p.second,
  );
  return (asIfUtc - instant.getTime()) / 60000;
}

// ISO (UTC) -> "YYYY-MM-DDTHH:mm" for a <input type="datetime-local"> default.
export function toVenueInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = partsInTz(d);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

// "YYYY-MM-DDTHH:mm" (venue wall clock) -> UTC ISO string for storage.
export function venueInputToISO(value: string): string | null {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return null;
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi] = timePart.split(":").map(Number);
  if ([y, mo, d, h, mi].some((n) => Number.isNaN(n))) return null;
  // Interpret the wall clock as if UTC, then correct by the venue offset.
  const guess = Date.UTC(y, mo - 1, d, h, mi, 0);
  const offset = venueOffsetMinutes(new Date(guess));
  return new Date(guess - offset * 60000).toISOString();
}

// Pretty display, e.g. "sáb 9:00 a.m." in venue time.
export function formatVenueTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: VENUE_TZ,
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}
