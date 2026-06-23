"use client";

import { useMemo } from "react";
import { usePublicData } from "./RealtimeProvider";
import Crest from "./Crest";
import TeamLink from "./TeamLink";
import { champion, resolveBracket, type ResolvedKoGame } from "@/lib/standings";
import type { Team } from "@/lib/types";

const ROUNDS: { title: string; prefix: string }[] = [
  { title: "Octavos", prefix: "Octavos" },
  { title: "Cuartos", prefix: "Cuartos" },
  { title: "Semifinales", prefix: "Semifinal" },
  { title: "Final", prefix: "Final" },
];

export default function Bracket() {
  const { teams, games, tournament } = usePublicData();
  const prize = tournament?.prize_amount ?? 20000;

  const bracket = useMemo(() => resolveBracket(teams, games), [teams, games]);
  const champ = useMemo(() => champion(teams, games), [teams, games]);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4">
          {ROUNDS.map((round) => {
            const slots = bracket.filter((b) => b.stage.startsWith(round.prefix));
            return (
              <div key={round.title} className="flex w-52 flex-col gap-3">
                <h3 className="text-center font-display text-sm uppercase text-gold">
                  {round.title}
                </h3>
                <div className="flex flex-1 flex-col justify-around gap-3">
                  {slots.map((slot) => (
                    <BracketMatch key={slot.stage} slot={slot} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ChampionCard team={champ} prize={prize} />
    </div>
  );
}

function BracketMatch({ slot }: { slot: ResolvedKoGame }) {
  const g = slot.game;
  const status = g?.status ?? "upcoming";
  const homeWins = slot.winner && slot.home && slot.winner.id === slot.home.id;
  const awayWins = slot.winner && slot.away && slot.winner.id === slot.away.id;

  return (
    <div className="rounded-lg border border-gold/20 bg-cancha-dark/60 p-2">
      <div className="mb-1 flex items-center justify-between text-[9px] uppercase text-cream/40">
        <span>{slot.stage}</span>
        {status === "live" && (
          <span className="flex items-center gap-1 text-live">
            <span className="inline-block h-1.5 w-1.5 animate-pulseLive rounded-full bg-live" />
            EN VIVO
          </span>
        )}
        {status === "final" && <span>FIN</span>}
      </div>
      <Slot team={slot.home} label={slot.homeLabel} score={g?.home_score} show={status !== "upcoming"} winner={!!homeWins} />
      <div className="my-1 h-px bg-cream/10" />
      <Slot team={slot.away} label={slot.awayLabel} score={g?.away_score} show={status !== "upcoming"} winner={!!awayWins} />
    </div>
  );
}

function Slot({
  team,
  label,
  score,
  show,
  winner,
}: {
  team: Team | null;
  label: string;
  score?: number;
  show: boolean;
  winner: boolean;
}) {
  return (
    <div className={`flex items-center gap-1.5 ${winner ? "text-gold" : "text-cream"}`}>
      <TeamLink
        teamId={team?.id}
        className="flex min-w-0 flex-1 items-center gap-1.5 hover:text-gold"
      >
        <Crest team={team} size="sm" />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold">
          {team ? team.name : <span className="text-cream/40">{label}</span>}
        </span>
      </TeamLink>
      {show && (
        <span className="font-display text-sm tabular-nums">{score ?? 0}</span>
      )}
    </div>
  );
}

function ChampionCard({ team, prize }: { team: Team | null; prize: number }) {
  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-gold bg-gradient-to-br from-gold/20 via-burgundy/30 to-cancha-dark p-5 text-center">
      <div className="text-4xl" aria-hidden>
        🏆
      </div>
      <h3 className="mt-1 font-display text-sm uppercase tracking-wide text-gold">
        Campeón
      </h3>
      {team ? (
        <TeamLink
          teamId={team.id}
          className="mt-2 flex items-center justify-center gap-2 hover:text-gold"
        >
          <Crest team={team} size="lg" />
          <span className="font-display text-xl text-cream">{team.name}</span>
        </TeamLink>
      ) : (
        <p className="mt-2 text-sm text-cream/50">Por definir</p>
      )}
      <p className="gold-gradient mt-3 font-display text-3xl">
        ${prize.toLocaleString("en-US")}
      </p>
    </div>
  );
}
