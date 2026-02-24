"use client";

import { use, useMemo } from "react";
import { trpc } from "@/lib/api/trpc";
import { MarketIntelligencePanel } from "@/components/market/MarketIntelligencePanel";
import { TeamState, type Segment } from "@/engine/types";

interface PageProps {
  params: Promise<{ gameId: string }>;
}

export default function MarketPage({ params }: PageProps) {
  const { gameId } = use(params);

  const { data: teamState, isLoading } = trpc.team.getMyState.useQuery();

  const state: TeamState | null = useMemo(() => {
    if (!teamState?.state) return null;
    try {
      return typeof teamState.state === "string"
        ? (JSON.parse(teamState.state) as TeamState)
        : (teamState.state as TeamState);
    } catch {
      return null;
    }
  }, [teamState?.state]);

  const marketState = useMemo(() => {
    if (!teamState?.marketState) return null;
    try {
      const raw = typeof teamState.marketState === "string"
        ? JSON.parse(teamState.marketState)
        : teamState.marketState;
      return raw as {
        demandBySegment?: Record<Segment, { totalDemand: number; priceRange: { min: number; max: number }; growthRate: number }>;
      };
    } catch {
      return null;
    }
  }, [teamState?.marketState]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-700 rounded w-1/3" />
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-40 bg-slate-700 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-700 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Market Intelligence</h1>
        <p className="text-slate-400">Understand market segments and scoring to plan your strategy</p>
      </div>

      <MarketIntelligencePanel
        state={state}
        marketState={marketState}
        currentRound={teamState?.game.currentRound ?? 1}
      />
    </div>
  );
}
