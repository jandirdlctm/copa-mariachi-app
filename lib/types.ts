// Shared domain types for La Copa Mariachi Internacional 7v7.
// These mirror the Postgres schema in /supabase/migrations.

export type GroupLabel = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";

export type GameStatus = "upcoming" | "live" | "final";

export type Field = "Cancha 1" | "Cancha 2" | "Cancha 3";

export const GROUP_LABELS: GroupLabel[] = ["A", "B", "C", "D", "E", "F", "G", "H"];

export const FIELDS: Field[] = ["Cancha 1", "Cancha 2", "Cancha 3"];

// Knockout stages, in order. Group stages are "Grupo A".."Grupo H".
export const KO_STAGES = [
  "Octavos 1",
  "Octavos 2",
  "Octavos 3",
  "Octavos 4",
  "Octavos 5",
  "Octavos 6",
  "Octavos 7",
  "Octavos 8",
  "Cuartos 1",
  "Cuartos 2",
  "Cuartos 3",
  "Cuartos 4",
  "Semifinal 1",
  "Semifinal 2",
  "Final",
] as const;

export type KoStage = (typeof KO_STAGES)[number];

export interface Tournament {
  id: string;
  name: string;
  prize_amount: number;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  published: boolean;
  created_at: string;
}

export interface Team {
  id: string;
  tournament_id: string;
  name: string;
  short: string;
  color: string;
  group_label: GroupLabel;
  created_at: string;
}

export interface Game {
  id: string;
  tournament_id: string;
  stage: string;
  home_team_id: string | null;
  away_team_id: string | null;
  home_source: string | null;
  away_source: string | null;
  home_score: number;
  away_score: number;
  status: GameStatus;
  field: string;
  scheduled_time: string | null;
  minute: number;
  sort_order: number;
  created_at: string;
}

export interface Scorer {
  id: string;
  tournament_id: string;
  team_id: string;
  player_name: string;
  goals: number;
  created_at: string;
}

export interface ScorekeeperPin {
  id: string;
  tournament_id: string;
  label: string;
  pin: string;
  created_at: string;
}

// A derived standings row (computed, never stored).
export interface StandingsRow {
  team: Team;
  pj: number; // partidos jugados
  g: number; // ganados
  e: number; // empatados
  p: number; // perdidos
  gf: number; // goles a favor
  gc: number; // goles en contra
  dg: number; // diferencia de goles
  pts: number; // puntos
}
