import { describe, expect, it } from "vitest";
import {
  champion,
  computeStandings,
  prizeProgress,
  resolveBracket,
  topTwo,
} from "./standings";
import type { Game, GameStatus, GroupLabel, Team } from "./types";

let seq = 0;
function team(name: string, group: GroupLabel): Team {
  seq += 1;
  return {
    id: `team-${name}`,
    tournament_id: "t1",
    name,
    short: name.slice(0, 3).toUpperCase(),
    color: "#0B5D34",
    group_label: group,
    created_at: "2026-01-01T00:00:00Z",
  };
}

function game(
  stage: string,
  home: Team | null,
  away: Team | null,
  hs: number,
  as: number,
  status: GameStatus = "final",
): Game {
  seq += 1;
  return {
    id: `game-${seq}`,
    tournament_id: "t1",
    stage,
    home_team_id: home?.id ?? null,
    away_team_id: away?.id ?? null,
    home_source: null,
    away_source: null,
    home_score: hs,
    away_score: as,
    status,
    field: "Cancha 1",
    scheduled_time: null,
    minute: 0,
    sort_order: seq,
    created_at: "2026-01-01T00:00:00Z",
  };
}

describe("computeStandings", () => {
  const a1 = team("Aguilas", "A");
  const a2 = team("Toros", "A");
  const a3 = team("Lobos", "A");
  const a4 = team("Pumas", "A");
  const teams = [a1, a2, a3, a4];

  it("awards 3 pts for a win, 1 for a draw, 0 for a loss", () => {
    const games = [
      game("Grupo A", a1, a2, 2, 0), // a1 win
      game("Grupo A", a3, a4, 1, 1), // draw
    ];
    const rows = computeStandings(teams, games, "A");
    const byId = Object.fromEntries(rows.map((r) => [r.team.id, r]));
    expect(byId[a1.id].pts).toBe(3);
    expect(byId[a1.id].g).toBe(1);
    expect(byId[a2.id].pts).toBe(0);
    expect(byId[a2.id].p).toBe(1);
    expect(byId[a3.id].pts).toBe(1);
    expect(byId[a4.id].e).toBe(1);
  });

  it("sorts by points, then goal difference, then goals for", () => {
    const games = [
      game("Grupo A", a1, a4, 5, 0), // a1 +5
      game("Grupo A", a2, a3, 3, 0), // a2 +3
      game("Grupo A", a1, a2, 0, 0), // both draw -> a1 4pts, a2 4pts
    ];
    const rows = computeStandings(teams, games, "A");
    // a1 and a2 both 4 pts; a1 has better DG (+5 vs +3) -> a1 first.
    expect(rows[0].team.id).toBe(a1.id);
    expect(rows[1].team.id).toBe(a2.id);
  });

  it("ignores upcoming games and other groups", () => {
    const b1 = team("Otros", "B");
    const games = [
      game("Grupo A", a1, a2, 9, 0, "upcoming"), // ignored
      game("Grupo B", b1, a1, 4, 0), // wrong group, ignored for A
    ];
    const rows = computeStandings(teams, games, "A");
    expect(rows.every((r) => r.pj === 0)).toBe(true);
  });

  it("counts live games too", () => {
    const games = [game("Grupo A", a1, a2, 1, 0, "live")];
    const rows = computeStandings(teams, games, "A");
    expect(rows.find((r) => r.team.id === a1.id)!.pts).toBe(3);
  });
});

describe("topTwo", () => {
  it("returns the first two qualifiers", () => {
    const a1 = team("A1", "A");
    const a2 = team("A2", "A");
    const a3 = team("A3", "A");
    const a4 = team("A4", "A");
    const teams = [a1, a2, a3, a4];
    const games = [
      game("Grupo A", a1, a2, 3, 0),
      game("Grupo A", a3, a4, 2, 0),
      game("Grupo A", a1, a3, 1, 0),
    ];
    const rows = computeStandings(teams, games, "A");
    const [first, second] = topTwo(rows);
    expect(first!.team.id).toBe(a1.id);
    expect(second).toBeDefined();
  });
});

describe("resolveBracket", () => {
  // Build 8 minimal groups, each with a clear 1st and 2nd.
  const groups: GroupLabel[] = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const teams: Team[] = [];
  const games: Game[] = [];
  for (const g of groups) {
    const t1 = team(`${g}1`, g);
    const t2 = team(`${g}2`, g);
    const t3 = team(`${g}3`, g);
    const t4 = team(`${g}4`, g);
    teams.push(t1, t2, t3, t4);
    // t1 beats everyone, t2 second.
    games.push(game(`Grupo ${g}`, t1, t2, 1, 0));
    games.push(game(`Grupo ${g}`, t1, t3, 1, 0));
    games.push(game(`Grupo ${g}`, t1, t4, 1, 0));
    games.push(game(`Grupo ${g}`, t2, t3, 1, 0));
    games.push(game(`Grupo ${g}`, t2, t4, 1, 0));
    games.push(game(`Grupo ${g}`, t3, t4, 1, 0));
  }

  function koGame(stage: string, hs = 0, as = 0, status: GameStatus = "upcoming") {
    const g = game(stage, null, null, hs, as, status);
    return g;
  }

  it("resolves Octavos slots from group qualifiers", () => {
    const ko = [koGame("Octavos 1")];
    const bracket = resolveBracket(teams, [...games, ...ko]);
    const o1 = bracket.find((b) => b.stage === "Octavos 1")!;
    expect(o1.home?.name).toBe("A1"); // 1° Grupo A
    expect(o1.away?.name).toBe("B2"); // 2° Grupo B
  });

  it("does not resolve a slot until its feeder group is complete", () => {
    // Leave one Grupo A game unfinished; Grupo B stays complete.
    let flipped = false;
    const partial = games.map((g) => {
      if (!flipped && g.stage === "Grupo A") {
        flipped = true;
        return { ...g, status: "upcoming" as GameStatus };
      }
      return g;
    });
    const bracket = resolveBracket(teams, [...partial, koGame("Octavos 1")]);
    const o1 = bracket.find((b) => b.stage === "Octavos 1")!;
    expect(o1.home).toBeNull(); // 1° Grupo A: group not finished
    expect(o1.homeLabel).toBe("1° Grupo A");
    expect(o1.away?.name).toBe("B2"); // 2° Grupo B: group finished, resolves
  });

  it("leaves later rounds pending until feeders are final", () => {
    const ko = [koGame("Octavos 1"), koGame("Octavos 2"), koGame("Cuartos 1")];
    const bracket = resolveBracket(teams, [...games, ...ko]);
    const c1 = bracket.find((b) => b.stage === "Cuartos 1")!;
    expect(c1.home).toBeNull();
    expect(c1.homeLabel).toBe("Ganador Octavos 1");
  });

  it("advances winners up the tree", () => {
    const a1 = teams.find((t) => t.name === "A1")!;
    const ko = [
      koGame("Octavos 1", 0, 0, "upcoming"),
    ];
    // Make Octavos 1 final with A1 winning.
    ko[0].home_team_id = teams.find((t) => t.name === "A1")!.id;
    ko[0].away_team_id = teams.find((t) => t.name === "B2")!.id;
    ko[0].home_score = 2;
    ko[0].away_score = 1;
    ko[0].status = "final";
    const bracket = resolveBracket(teams, [...games, ...ko]);
    const o1 = bracket.find((b) => b.stage === "Octavos 1")!;
    expect(o1.winner?.id).toBe(a1.id);
  });

  it("crowns a champion only when the Final is decided", () => {
    const noChamp = champion(teams, games);
    expect(noChamp).toBeNull();
  });
});

describe("prizeProgress", () => {
  const a1 = team("A1", "A");
  const a2 = team("A2", "A");
  it("is the percentage of finalized games", () => {
    const games = [
      game("Grupo A", a1, a2, 1, 0, "final"),
      game("Grupo A", a1, a2, 1, 0, "live"),
      game("Grupo A", a1, a2, 1, 0, "upcoming"),
      game("Grupo A", a1, a2, 1, 0, "final"),
    ];
    const p = prizeProgress(games);
    expect(p.total).toBe(4);
    expect(p.finalized).toBe(2);
    expect(p.pct).toBe(50);
  });

  it("is 0% with no games", () => {
    expect(prizeProgress([]).pct).toBe(0);
  });
});
