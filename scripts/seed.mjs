// Seed script for La Copa Mariachi Internacional 7v7.
//
//   npm run seed
//
// Inserts one tournament, 32 teams across 8 groups (A–H), a generated schedule
// (round-robin per group + the full knockout bracket), 3 field PINs, and a few
// sample scorers — so the app shows real data on first run.
//
// Idempotent: it deletes any existing tournament (cascades to all child rows)
// and reseeds from scratch. Uses the SERVICE ROLE key, so run it locally only.
//
// NOTE: the round-robin + bracket logic here mirrors lib/schedule.ts and
// lib/standings.ts. If you change the bracket topology, update both.

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local",
  );
  process.exit(1);
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const FIELDS = ["Cancha 1", "Cancha 2", "Cancha 3"];

const TEAM_COLORS = [
  "#0B5D34", "#7A1F2B", "#E8B423", "#1D4E89",
  "#C84B31", "#2A9D8F", "#6A4C93", "#E76F51",
  "#264653", "#B5179E", "#3A0CA3", "#4361EE",
  "#F72585", "#7209B7", "#3F37C9", "#4895EF",
];

// 32 team names (4 per group).
const TEAM_NAMES = [
  "Águilas Doradas", "Toros de Fontana", "Charros FC", "Mariachi United",
  "Halcones Rojos", "Pumas del Valle", "Leones de Jalisco", "Diablos Verdes",
  "Tigres del Sol", "Coyotes FC", "Gallos de Oro", "Rayos del Norte",
  "Cóndores", "Pioneros", "Vaqueros FC", "Tecos Inland",
  "Lobos Plateados", "Zorros FC", "Jaguares Negros", "Venados Azules",
  "Cometas", "Guerreros del Sur", "Potros Salvajes", "Real Mariachi",
  "Bravos de Fontana", "Sultanes FC", "Halcones del Desierto", "Pericos Verdes",
  "Atlético Jalisco", "Caudillos FC", "Centellas", "Olímpico Latino",
];

const SHORTS = [
  "AGU", "TOR", "CHA", "MAR", "HAL", "PUM", "LEO", "DIA",
  "TIG", "COY", "GAL", "RAY", "CON", "PIO", "VAQ", "TEC",
  "LOB", "ZOR", "JAG", "VEN", "COM", "GUE", "POT", "RMA",
  "BRA", "SUL", "HDD", "PER", "ATJ", "CAU", "CEN", "OLI",
];

// Knockout topology (mirror of lib/standings.ts BRACKET).
const BRACKET = [
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

// Circle-method round-robin → rounds of [home, away] pairs.
function roundRobin(items) {
  const arr = items.slice();
  if (arr.length % 2 === 1) arr.push(null);
  const n = arr.length;
  const rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a && b) pairs.push([a, b]);
    }
    rounds.push(pairs);
    arr.splice(1, 0, arr.pop());
  }
  return rounds;
}

async function main() {
  console.log("Limpiando torneos existentes…");
  await sb.from("tournaments").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("Creando torneo…");
  const { data: tRows, error: tErr } = await sb
    .from("tournaments")
    .insert({
      name: "La Copa Mariachi Internacional 7v7",
      prize_amount: 20000,
      location: "Fontana, California",
      start_date: "2026-08-22",
      end_date: "2026-08-23",
      published: true,
    })
    .select()
    .single();
  if (tErr) throw tErr;
  const tournament = tRows;

  console.log("Creando 32 equipos…");
  const teamRows = TEAM_NAMES.map((name, i) => ({
    tournament_id: tournament.id,
    name,
    short: SHORTS[i],
    color: TEAM_COLORS[i % TEAM_COLORS.length],
    group_label: GROUPS[Math.floor(i / 4)],
  }));
  const { data: teams, error: teamErr } = await sb
    .from("teams")
    .insert(teamRows)
    .select();
  if (teamErr) throw teamErr;

  console.log("Generando calendario…");
  // Anchor 9:00 AM to venue time (Pacific), independent of this machine's tz.
  const VENUE_TZ = "America/Los_Angeles";
  const venueOffsetMin = (instant) => {
    const dtf = new Intl.DateTimeFormat("en-CA", {
      timeZone: VENUE_TZ, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });
    const o = {};
    for (const p of dtf.formatToParts(instant)) o[p.type] = p.value;
    if (o.hour === "24") o.hour = "00";
    const asIfUtc = Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour, +o.minute, +o.second);
    return (asIfUtc - instant.getTime()) / 60000;
  };
  const guess = Date.UTC(2026, 7, 22, 9, 0, 0); // 2026-08-22 09:00 as-if-UTC
  const base = new Date(guess - venueOffsetMin(new Date(guess)) * 60000);
  const games = [];
  let order = 0;
  const timeFor = (slot) =>
    new Date(base.getTime() + slot * 40 * 60 * 1000).toISOString();

  for (const g of GROUPS) {
    const groupTeams = teams.filter((t) => t.group_label === g);
    for (const round of roundRobin(groupTeams)) {
      for (const [home, away] of round) {
        games.push({
          tournament_id: tournament.id,
          stage: `Grupo ${g}`,
          home_team_id: home.id,
          away_team_id: away.id,
          status: "upcoming",
          field: FIELDS[order % FIELDS.length],
          scheduled_time: timeFor(Math.floor(order / FIELDS.length)),
          sort_order: order,
        });
        order += 1;
      }
    }
  }
  for (const slot of BRACKET) {
    games.push({
      tournament_id: tournament.id,
      stage: slot.stage,
      home_source: slot.home,
      away_source: slot.away,
      status: "upcoming",
      field: FIELDS[order % FIELDS.length],
      scheduled_time: timeFor(Math.floor(order / FIELDS.length)),
      sort_order: order,
    });
    order += 1;
  }
  const { error: gErr } = await sb.from("games").insert(games);
  if (gErr) throw gErr;

  console.log("Creando PINs de capturista…");
  const { error: pErr } = await sb.from("scorekeeper_pins").insert([
    { tournament_id: tournament.id, label: "Cancha 1", pin: "1111" },
    { tournament_id: tournament.id, label: "Cancha 2", pin: "2222" },
    { tournament_id: tournament.id, label: "Cancha 3", pin: "3333" },
  ]);
  if (pErr) throw pErr;

  console.log("Agregando goleadores de muestra…");
  const sampleScorers = [
    { team: teams[0], name: "Juan Pérez", goals: 3 },
    { team: teams[1], name: "Luis Hernández", goals: 2 },
    { team: teams[4], name: "Carlos Ramírez", goals: 2 },
    { team: teams[8], name: "Miguel Torres", goals: 1 },
  ].map((s) => ({
    tournament_id: tournament.id,
    team_id: s.team.id,
    player_name: s.name,
    goals: s.goals,
  }));
  const { error: sErr } = await sb.from("scorers").insert(sampleScorers);
  if (sErr) throw sErr;

  console.log("\n✅ Seed completo:");
  console.log(`   Torneo: ${tournament.name}`);
  console.log(`   Equipos: ${teams.length} · Partidos: ${games.length}`);
  console.log("   PINs: Cancha 1 → 1111 | Cancha 2 → 2222 | Cancha 3 → 3333");
}

main().catch((err) => {
  console.error("Error en el seed:", err.message ?? err);
  process.exit(1);
});
