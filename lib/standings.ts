// Pure, dependency-free derivation of everything downstream of raw results:
// group standings, qualifiers, the knockout bracket, and prize progress.
//
// NOTHING here is stored in the database. The public site re-runs these
// functions whenever Realtime pushes a change, so the UI is always in sync
// with games + teams. Keep this module pure and side-effect free so it stays
// trivially unit-testable.

import type { Game, GroupLabel, StandingsRow, Team } from "./types";
import { GROUP_LABELS } from "./types";

const COUNTED_STATUSES = new Set(["live", "final"]);

export function groupStageName(group: GroupLabel): string {
  return `Grupo ${group}`;
}

/**
 * Compute the standings table for a single group.
 * Only games with status "live" or "final" and both teams assigned count.
 * Sorted by: points, then goal difference, then goals for, then name.
 * 3 pts win / 1 draw / 0 loss.
 */
export function computeStandings(
  teams: Team[],
  games: Game[],
  groupLabel: GroupLabel,
): StandingsRow[] {
  const groupTeams = teams.filter((t) => t.group_label === groupLabel);
  const rows = new Map<string, StandingsRow>();
  for (const team of groupTeams) {
    rows.set(team.id, {
      team,
      pj: 0,
      g: 0,
      e: 0,
      p: 0,
      gf: 0,
      gc: 0,
      dg: 0,
      pts: 0,
    });
  }

  const stage = groupStageName(groupLabel);
  for (const game of games) {
    if (game.stage !== stage) continue;
    if (!COUNTED_STATUSES.has(game.status)) continue;
    if (!game.home_team_id || !game.away_team_id) continue;
    const home = rows.get(game.home_team_id);
    const away = rows.get(game.away_team_id);
    if (!home || !away) continue;

    home.pj += 1;
    away.pj += 1;
    home.gf += game.home_score;
    home.gc += game.away_score;
    away.gf += game.away_score;
    away.gc += game.home_score;

    if (game.home_score > game.away_score) {
      home.g += 1;
      home.pts += 3;
      away.p += 1;
    } else if (game.home_score < game.away_score) {
      away.g += 1;
      away.pts += 3;
      home.p += 1;
    } else {
      home.e += 1;
      away.e += 1;
      home.pts += 1;
      away.pts += 1;
    }
  }

  for (const row of rows.values()) {
    row.dg = row.gf - row.gc;
  }

  return [...rows.values()].sort(compareStandings);
}

function compareStandings(a: StandingsRow, b: StandingsRow): number {
  if (b.pts !== a.pts) return b.pts - a.pts;
  if (b.dg !== a.dg) return b.dg - a.dg;
  if (b.gf !== a.gf) return b.gf - a.gf;
  return a.team.name.localeCompare(b.team.name, "es");
}

/** The top two rows of a group's standings (the qualifiers). */
export function topTwo(rows: StandingsRow[]): [StandingsRow?, StandingsRow?] {
  return [rows[0], rows[1]];
}

/**
 * A group is "complete" once every one of its games is final. Qualifiers (and
 * therefore the knockout slots they feed) are only resolved once the group is
 * complete — never while games are still upcoming or in progress.
 */
export function isGroupComplete(games: Game[], group: GroupLabel): boolean {
  const stage = groupStageName(group);
  const groupGames = games.filter((g) => g.stage === stage);
  return groupGames.length > 0 && groupGames.every((g) => g.status === "final");
}

// ---------------------------------------------------------------------------
// Bracket
// ---------------------------------------------------------------------------

// Single source of truth for the knockout topology (World Cup-style seeding
// for 8 groups, top two each → Round of 16). The calendar generator, the seed
// script, and the resolver below all use this so labels and pairings agree.
export interface BracketSlot {
  stage: string;
  home: string; // source label, e.g. "1° Grupo A" or "Ganador Octavos 1"
  away: string;
}

export const BRACKET: BracketSlot[] = [
  { stage: "Octavos 1", home: "1° Grupo A", away: "2° Grupo B" },
  { stage: "Octavos 2", home: "1° Grupo C", away: "2° Grupo D" },
  { stage: "Octavos 3", home: "1° Grupo E", away: "2° Grupo F" },
  { stage: "Octavos 4", home: "1° Grupo G", away: "2° Grupo H" },
  { stage: "Octavos 5", home: "1° Grupo B", away: "2° Grupo A" },
  { stage: "Octavos 6", home: "1° Grupo D", away: "2° Grupo C" },
  { stage: "Octavos 7", home: "1° Grupo F", away: "2° Grupo E" },
  { stage: "Octavos 8", home: "1° Grupo H", away: "2° Grupo G" },
  { stage: "Cuartos 1", home: "Ganador Octavos 1", away: "Ganador Octavos 2" },
  { stage: "Cuartos 2", home: "Ganador Octavos 3", away: "Ganador Octavos 4" },
  { stage: "Cuartos 3", home: "Ganador Octavos 5", away: "Ganador Octavos 6" },
  { stage: "Cuartos 4", home: "Ganador Octavos 7", away: "Ganador Octavos 8" },
  { stage: "Semifinal 1", home: "Ganador Cuartos 1", away: "Ganador Cuartos 2" },
  { stage: "Semifinal 2", home: "Ganador Cuartos 3", away: "Ganador Cuartos 4" },
  { stage: "Final", home: "Ganador Semifinal 1", away: "Ganador Semifinal 2" },
];

export interface ResolvedKoGame {
  stage: string;
  game: Game | null; // the DB row for this stage, if created
  home: Team | null; // resolved team, or null while pending
  away: Team | null;
  homeLabel: string; // source label, shown while a slot is unresolved
  awayLabel: string;
  winner: Team | null;
}

const GROUP_SRC = /^([12])° Grupo ([A-H])$/;
const WINNER_SRC = /^Ganador (.+)$/;

/**
 * Resolve every knockout slot from group results + earlier knockout winners.
 * Returns the bracket in BRACKET order. Slots that can't be resolved yet keep
 * their source label and a null team. Knockout games that end level produce no
 * winner (penalties are not modeled) so downstream slots stay pending until the
 * result is corrected.
 */
export function resolveBracket(teams: Team[], games: Game[]): ResolvedKoGame[] {
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const gameByStage = new Map(games.map((g) => [g.stage, g]));

  // Precompute group qualifiers — but only for groups whose games are ALL
  // final. Until a group is complete, its slots stay unresolved (TBD).
  const qualifiers = new Map<string, Team | null>(); // key: `${rank}${group}`
  for (const group of GROUP_LABELS) {
    if (!isGroupComplete(games, group)) {
      qualifiers.set(`1${group}`, null);
      qualifiers.set(`2${group}`, null);
      continue;
    }
    const [first, second] = topTwo(computeStandings(teams, games, group));
    qualifiers.set(`1${group}`, first?.team ?? null);
    qualifiers.set(`2${group}`, second?.team ?? null);
  }

  // Memoized winner of a knockout stage.
  const winnerCache = new Map<string, Team | null>();

  function resolveLabel(label: string): Team | null {
    const groupMatch = label.match(GROUP_SRC);
    if (groupMatch) {
      const [, rank, group] = groupMatch;
      return qualifiers.get(`${rank}${group}`) ?? null;
    }
    const winnerMatch = label.match(WINNER_SRC);
    if (winnerMatch) {
      return winnerOfStage(winnerMatch[1]);
    }
    return null;
  }

  function winnerOfStage(stage: string): Team | null {
    if (winnerCache.has(stage)) return winnerCache.get(stage) ?? null;
    // Guard against pathological cycles in topology.
    winnerCache.set(stage, null);

    const slot = BRACKET.find((b) => b.stage === stage);
    const game = gameByStage.get(stage) ?? null;
    if (!slot || !game) return null;

    const home = resolveSlot(game.home_team_id, slot.home);
    const away = resolveSlot(game.away_team_id, slot.away);
    let winner: Team | null = null;
    if (game.status === "final" && home && away) {
      if (game.home_score > game.away_score) winner = home;
      else if (game.away_score > game.home_score) winner = away;
    }
    winnerCache.set(stage, winner);
    return winner;
  }

  // Prefer a team id already written into the DB row (server auto-advancement);
  // otherwise resolve purely from the source label.
  function resolveSlot(storedId: string | null, label: string): Team | null {
    if (storedId) return teamById.get(storedId) ?? null;
    return resolveLabel(label);
  }

  return BRACKET.map((slot) => {
    const game = gameByStage.get(slot.stage) ?? null;
    const home = resolveSlot(game?.home_team_id ?? null, slot.home);
    const away = resolveSlot(game?.away_team_id ?? null, slot.away);
    return {
      stage: slot.stage,
      game,
      home,
      away,
      homeLabel: slot.home,
      awayLabel: slot.away,
      winner: game ? winnerOfStage(slot.stage) : null,
    };
  });
}

/** The tournament champion, or null until the Final is decided. */
export function champion(teams: Team[], games: Game[]): Team | null {
  const bracket = resolveBracket(teams, games);
  return bracket.find((b) => b.stage === "Final")?.winner ?? null;
}

// ---------------------------------------------------------------------------
// Prize progress
// ---------------------------------------------------------------------------

export interface PrizeProgress {
  total: number;
  finalized: number;
  pct: number; // 0–100, rounded
}

/** Share of all scheduled games that are finalized — drives the $20k tracker. */
export function prizeProgress(games: Game[]): PrizeProgress {
  const total = games.length;
  const finalized = games.filter((g) => g.status === "final").length;
  const pct = total === 0 ? 0 : Math.round((finalized / total) * 100);
  return { total, finalized, pct };
}
