"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getBrowserSupabase } from "@/lib/supabaseClient";
import type { Game, Scorer, Team, Tournament } from "@/lib/types";

interface PublicData {
  tournament: Tournament | null;
  teams: Team[];
  games: Game[];
  scorers: Scorer[];
  live: boolean; // realtime connected
}

const Ctx = createContext<PublicData | null>(null);

export function usePublicData(): PublicData {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePublicData must be used inside <RealtimeProvider>");
  return v;
}

interface Row {
  id: string;
}

// Apply a postgres_changes event to a local array, keyed by id.
function applyChange<T extends Row>(
  prev: T[],
  eventType: string,
  newRow: T | null,
  oldRow: Partial<T> | null,
): T[] {
  if (eventType === "DELETE") {
    const id = (oldRow?.id ?? newRow?.id) as string | undefined;
    if (!id) return prev;
    return prev.filter((r) => r.id !== id);
  }
  if (!newRow) return prev;
  const idx = prev.findIndex((r) => r.id === newRow.id);
  if (idx === -1) return [...prev, newRow];
  const next = prev.slice();
  next[idx] = newRow;
  return next;
}

export default function RealtimeProvider({
  initial,
  children,
}: {
  initial: {
    tournament: Tournament | null;
    teams: Team[];
    games: Game[];
    scorers: Scorer[];
  };
  children: React.ReactNode;
}) {
  const [teams, setTeams] = useState<Team[]>(initial.teams);
  const [games, setGames] = useState<Game[]>(initial.games);
  const [scorers, setScorers] = useState<Scorer[]>(initial.scorers);
  const [live, setLive] = useState(false);
  const tournament = initial.tournament;
  const tournamentId = tournament?.id;

  // Keep latest initial in a ref so resubscribes don't churn.
  const initialRef = useRef(initial);
  initialRef.current = initial;

  useEffect(() => {
    if (!tournamentId) return;
    const sb = getBrowserSupabase();
    if (!sb) return;

    const filter = `tournament_id=eq.${tournamentId}`;
    const channel = sb
      .channel(`public:${tournamentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games", filter },
        (payload) =>
          setGames((prev) =>
            applyChange(
              prev,
              payload.eventType,
              payload.new as Game,
              payload.old as Partial<Game>,
            ),
          ),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams", filter },
        (payload) =>
          setTeams((prev) =>
            applyChange(
              prev,
              payload.eventType,
              payload.new as Team,
              payload.old as Partial<Team>,
            ),
          ),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scorers", filter },
        (payload) =>
          setScorers((prev) =>
            applyChange(
              prev,
              payload.eventType,
              payload.new as Scorer,
              payload.old as Partial<Scorer>,
            ),
          ),
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      sb.removeChannel(channel);
    };
  }, [tournamentId]);

  const value = useMemo<PublicData>(
    () => ({ tournament, teams, games, scorers, live }),
    [tournament, teams, games, scorers, live],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
