// Pure schedule generation: round-robin within each group + the knockout
// bracket games (with source labels). No DB access here — the server action
// feeds the output straight into an insert.

import { BRACKET, groupStageName } from "./standings";
import { venueInputToISO } from "./time";
import { FIELDS, GROUP_LABELS } from "./types";
import type { Game, Team } from "./types";

// A game ready to insert (DB fills id / created_at / defaults).
export type InsertGame = Pick<
  Game,
  | "tournament_id"
  | "stage"
  | "home_team_id"
  | "away_team_id"
  | "home_source"
  | "away_source"
  | "status"
  | "field"
  | "scheduled_time"
  | "sort_order"
>;

// Circle-method round-robin. Returns rounds, each a list of [home, away] pairs.
// Handles odd counts with a bye (null).
export function roundRobin<T>(items: T[]): [T, T][][] {
  const arr: (T | null)[] = items.slice();
  if (arr.length % 2 === 1) arr.push(null);
  const n = arr.length;
  const rounds: [T, T][][] = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs: [T, T][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a !== null && b !== null) pairs.push([a as T, b as T]);
    }
    rounds.push(pairs);
    // rotate all but the first element
    arr.splice(1, 0, arr.pop() as T | null);
  }
  return rounds;
}

export interface BuildOptions {
  tournamentId: string;
  startDate?: string | null; // e.g. "2026-08-22"
  slotMinutes?: number; // minutes between time slots
}

export function buildSchedule(teams: Team[], opts: BuildOptions): InsertGame[] {
  const { tournamentId, startDate, slotMinutes = 40 } = opts;
  const games: InsertGame[] = [];
  let order = 0;

  // Anchor the first slot to 9:00 AM venue time (Pacific), not server-local.
  const baseIso = startDate ? venueInputToISO(`${startDate}T09:00`) : null;
  const base = baseIso ? new Date(baseIso) : null;
  const fieldCount = FIELDS.length;

  function timeForSlot(slot: number): string | null {
    if (!base || Number.isNaN(base.getTime())) return null;
    const t = new Date(base.getTime() + slot * slotMinutes * 60 * 1000);
    return t.toISOString();
  }

  // --- Group stage: round-robin per group, fields rotate, slots stagger. ---
  for (const group of GROUP_LABELS) {
    const groupTeams = teams.filter((t) => t.group_label === group);
    if (groupTeams.length < 2) continue;
    const rounds = roundRobin(groupTeams);
    for (const round of rounds) {
      round.forEach((pair, i) => {
        games.push({
          tournament_id: tournamentId,
          stage: groupStageName(group),
          home_team_id: pair[0].id,
          away_team_id: pair[1].id,
          home_source: null,
          away_source: null,
          status: "upcoming",
          field: FIELDS[order % fieldCount],
          scheduled_time: timeForSlot(Math.floor(order / fieldCount)),
          sort_order: order,
        });
        order += 1;
        void i;
      });
    }
  }

  // --- Knockout stage: empty games with source labels (TBD teams). ---
  for (const slot of BRACKET) {
    games.push({
      tournament_id: tournamentId,
      stage: slot.stage,
      home_team_id: null,
      away_team_id: null,
      home_source: slot.home,
      away_source: slot.away,
      status: "upcoming",
      field: FIELDS[order % fieldCount],
      scheduled_time: timeForSlot(Math.floor(order / fieldCount)),
      sort_order: order,
    });
    order += 1;
  }

  return games;
}
