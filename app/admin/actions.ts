"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceClient } from "@/lib/supabaseServer";
import {
  checkAdminPassword,
  clearSession,
  getSession,
  requireOwner,
  requireScorerOrOwner,
  setOwnerSession,
  setScorerSession,
} from "@/lib/auth";
import { buildSchedule } from "@/lib/schedule";
import { advanceBracket } from "@/lib/advance";
import { venueInputToISO } from "@/lib/time";
import type { Game, Team, Tournament } from "@/lib/types";

const TEAM_COLORS = [
  "#0B5D34", "#7A1F2B", "#E8B423", "#1D4E89",
  "#C84B31", "#2A9D8F", "#6A4C93", "#E76F51",
  "#264653", "#B5179E", "#3A0CA3", "#4361EE",
  "#F72585", "#7209B7", "#3F37C9", "#4895EF",
];

async function activeTournament(
  sb: SupabaseClient,
): Promise<Tournament | null> {
  const { data } = await sb
    .from("tournaments")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1);
  return (data?.[0] as Tournament | undefined) ?? null;
}

function revalidateAdmin() {
  revalidatePath("/admin/equipos");
  revalidatePath("/admin/calendario");
  revalidatePath("/admin/marcador");
  revalidatePath("/admin/pins");
  revalidatePath("/admin/tabla");
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function loginOwner(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!checkAdminPassword(password)) {
    redirect("/admin?error=owner");
  }
  await setOwnerSession();
  redirect("/admin/equipos");
}

export async function loginScorer(formData: FormData) {
  const pin = String(formData.get("pin") ?? "").trim();
  const sb = getServiceClient();
  const t = await activeTournament(sb);
  if (!t) redirect("/admin?error=notournament");

  const { data } = await sb
    .from("scorekeeper_pins")
    .select("*")
    .eq("tournament_id", t!.id)
    .eq("pin", pin)
    .limit(1);

  const match = data?.[0];
  if (!match) redirect("/admin?error=pin");
  await setScorerSession(match.label as string);
  redirect("/admin/marcador");
}

export async function logout() {
  await clearSession();
  redirect("/admin");
}

// ---------------------------------------------------------------------------
// Teams (owner)
// ---------------------------------------------------------------------------

export async function addTeam(formData: FormData) {
  await requireOwner();
  const sb = getServiceClient();
  const t = await activeTournament(sb);
  if (!t) return;

  const name = String(formData.get("name") ?? "").trim();
  const short = String(formData.get("short") ?? "").trim().slice(0, 4).toUpperCase();
  const group = String(formData.get("group") ?? "A");
  if (!name || !short) return;

  const { count } = await sb
    .from("teams")
    .select("*", { count: "exact", head: true })
    .eq("tournament_id", t.id);
  const color = TEAM_COLORS[(count ?? 0) % TEAM_COLORS.length];

  await sb.from("teams").insert({
    tournament_id: t.id,
    name,
    short,
    color,
    group_label: group,
  });
  revalidateAdmin();
}

export async function deleteTeam(formData: FormData) {
  await requireOwner();
  const sb = getServiceClient();
  const id = String(formData.get("id") ?? "");
  if (id) await sb.from("teams").delete().eq("id", id);
  revalidateAdmin();
}

export async function moveTeam(formData: FormData) {
  await requireOwner();
  const sb = getServiceClient();
  const id = String(formData.get("id") ?? "");
  const group = String(formData.get("group") ?? "A");
  if (id) await sb.from("teams").update({ group_label: group }).eq("id", id);
  revalidateAdmin();
}

// ---------------------------------------------------------------------------
// Calendar / publish (owner)
// ---------------------------------------------------------------------------

export async function generateSchedule() {
  await requireOwner();
  const sb = getServiceClient();
  const t = await activeTournament(sb);
  if (!t) return;

  const { data: teamsData } = await sb
    .from("teams")
    .select("*")
    .eq("tournament_id", t.id);
  const teams = (teamsData as Team[]) ?? [];

  // Replace any existing schedule.
  await sb.from("games").delete().eq("tournament_id", t.id);

  const games = buildSchedule(teams, {
    tournamentId: t.id,
    startDate: t.start_date,
  });
  if (games.length > 0) {
    await sb.from("games").insert(games);
  }
  revalidateAdmin();
}

// Owner sets a single game's field and/or kickoff time. Time arrives as a
// venue-local "YYYY-MM-DDTHH:mm" string and is stored as UTC.
export async function updateGameSchedule(formData: FormData) {
  await requireOwner();
  const sb = getServiceClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const field = String(formData.get("field") ?? "");
  const timeValue = String(formData.get("time") ?? "");

  const patch: { field?: string; scheduled_time?: string | null } = {};
  if (field) patch.field = field;
  patch.scheduled_time = venueInputToISO(timeValue); // null clears the time

  await sb.from("games").update(patch).eq("id", id);
  revalidateAdmin();
}

export async function togglePublish(formData: FormData) {
  await requireOwner();
  const sb = getServiceClient();
  const t = await activeTournament(sb);
  if (!t) return;
  const published = String(formData.get("published") ?? "") === "true";
  await sb.from("tournaments").update({ published }).eq("id", t.id);
  revalidateAdmin();
  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// PINs (owner)
// ---------------------------------------------------------------------------

export async function createPin(formData: FormData) {
  await requireOwner();
  const sb = getServiceClient();
  const t = await activeTournament(sb);
  if (!t) return;
  const label = String(formData.get("label") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();
  if (!label || pin.length < 4 || pin.length > 6) return;
  await sb.from("scorekeeper_pins").insert({
    tournament_id: t.id,
    label,
    pin,
  });
  revalidateAdmin();
}

export async function deletePin(formData: FormData) {
  await requireOwner();
  const sb = getServiceClient();
  const id = String(formData.get("id") ?? "");
  if (id) await sb.from("scorekeeper_pins").delete().eq("id", id);
  revalidateAdmin();
}

// ---------------------------------------------------------------------------
// Scoring console (owner or scorer)
// ---------------------------------------------------------------------------

// Load a game and ensure the caller may modify it. Scorers are restricted to
// games on their assigned field.
async function loadGameForScoring(
  sb: SupabaseClient,
  gameId: string,
): Promise<Game | null> {
  const session = await requireScorerOrOwner();
  const { data } = await sb.from("games").select("*").eq("id", gameId).limit(1);
  const game = (data?.[0] as Game | undefined) ?? null;
  if (!game) return null;
  if (session?.role === "scorer" && game.field !== session.field) {
    return null; // not their field
  }
  return game;
}

export async function startGame(formData: FormData) {
  const sb = getServiceClient();
  const game = await loadGameForScoring(sb, String(formData.get("id") ?? ""));
  if (!game) return;
  await sb
    .from("games")
    .update({ status: "live", minute: 0 })
    .eq("id", game.id);
  revalidateAdmin();
}

export async function adjustScore(formData: FormData) {
  const sb = getServiceClient();
  const game = await loadGameForScoring(sb, String(formData.get("id") ?? ""));
  if (!game) return;
  const side = String(formData.get("side") ?? ""); // "home" | "away"
  const delta = Number(formData.get("delta") ?? 0);
  if (side !== "home" && side !== "away") return;

  const field = side === "home" ? "home_score" : "away_score";
  const next = Math.max(0, (side === "home" ? game.home_score : game.away_score) + delta);
  await sb.from("games").update({ [field]: next }).eq("id", game.id);
  revalidateAdmin();
}

export async function setMinute(formData: FormData) {
  const sb = getServiceClient();
  const game = await loadGameForScoring(sb, String(formData.get("id") ?? ""));
  if (!game) return;
  const minute = Math.max(0, Number(formData.get("minute") ?? 0));
  await sb.from("games").update({ minute }).eq("id", game.id);
  revalidateAdmin();
}

// Record a goal for a named player: bumps that team's score AND the scorer's
// goal tally in one action (the natural scorekeeper workflow).
export async function addGoal(formData: FormData) {
  const sb = getServiceClient();
  const game = await loadGameForScoring(sb, String(formData.get("id") ?? ""));
  if (!game) return;
  const teamId = String(formData.get("team_id") ?? "");
  const player = String(formData.get("player_name") ?? "").trim();
  const side = teamId === game.home_team_id ? "home" : teamId === game.away_team_id ? "away" : null;
  if (!side || !teamId) return;

  const scoreField = side === "home" ? "home_score" : "away_score";
  const nextScore = (side === "home" ? game.home_score : game.away_score) + 1;
  await sb.from("games").update({ [scoreField]: nextScore }).eq("id", game.id);

  if (player) {
    const { data: existing } = await sb
      .from("scorers")
      .select("*")
      .eq("tournament_id", game.tournament_id)
      .eq("team_id", teamId)
      .ilike("player_name", player)
      .limit(1);
    const row = existing?.[0];
    if (row) {
      await sb.from("scorers").update({ goals: row.goals + 1 }).eq("id", row.id);
    } else {
      await sb.from("scorers").insert({
        tournament_id: game.tournament_id,
        team_id: teamId,
        player_name: player,
        goals: 1,
      });
    }
  }
  revalidateAdmin();
}

export async function finalizeGame(formData: FormData) {
  const sb = getServiceClient();
  const game = await loadGameForScoring(sb, String(formData.get("id") ?? ""));
  if (!game) return;
  await sb.from("games").update({ status: "final" }).eq("id", game.id);
  // Propagate winners into the next knockout round.
  await advanceBracket(sb, game.tournament_id);
  revalidateAdmin();
}

export async function reopenGame(formData: FormData) {
  const sb = getServiceClient();
  const game = await loadGameForScoring(sb, String(formData.get("id") ?? ""));
  if (!game) return;
  const session = await getSession();
  // Simple audit trail for corrections.
  console.log(
    `[audit] reopen game ${game.id} (${game.stage}) by ${session?.role ?? "?"} at ${new Date().toISOString()}`,
  );
  await sb.from("games").update({ status: "live" }).eq("id", game.id);
  await advanceBracket(sb, game.tournament_id);
  revalidateAdmin();
}
