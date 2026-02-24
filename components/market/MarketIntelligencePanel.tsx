"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CONSTANTS, type Segment, type TeamState } from "@/engine/types";
import { SEGMENT_PROFILES } from "@/lib/config/segmentProfiles";
import { SEGMENT_PATHWAYS } from "@/lib/config/segmentPathways";
import { ALL_ACHIEVEMENTS } from "@/engine/types/achievements";
import { SEGMENT_DEMAND_CYCLES, getDemandMultiplier } from "@/lib/config/demandCycles";
import { WinConditionMatrix } from "./WinConditionMatrix";
import {
  TrendingUp,
  DollarSign,
  Smartphone,
  Gamepad2,
  Briefcase,
  Activity,
  Trophy,
  Target,
  BarChart3,
  Info,
  ArrowUpRight,
  MapPin,
  Calendar,
  Waves,
} from "lucide-react";

const SEGMENT_ICONS: Record<Segment, React.ElementType> = {
  Budget: DollarSign,
  General: Smartphone,
  Enthusiast: Gamepad2,
  Professional: Briefcase,
  "Active Lifestyle": Activity,
};

const SEGMENT_COLORS: Record<Segment, string> = {
  Budget: "text-green-400",
  General: "text-blue-400",
  Enthusiast: "text-purple-400",
  Professional: "text-amber-400",
  "Active Lifestyle": "text-pink-400",
};

const SEGMENT_BG: Record<Segment, string> = {
  Budget: "bg-green-500/10 border-green-500/20",
  General: "bg-blue-500/10 border-blue-500/20",
  Enthusiast: "bg-purple-500/10 border-purple-500/20",
  Professional: "bg-amber-500/10 border-amber-500/20",
  "Active Lifestyle": "bg-pink-500/10 border-pink-500/20",
};

interface MarketIntelligencePanelProps {
  state: TeamState | null;
  marketState?: {
    demandBySegment?: Record<Segment, { totalDemand: number; priceRange: { min: number; max: number }; growthRate: number }>;
  } | null;
  currentRound: number;
}

export function MarketIntelligencePanel({ state, marketState, currentRound }: MarketIntelligencePanelProps) {
  const segments: Segment[] = ["Budget", "General", "Enthusiast", "Professional", "Active Lifestyle"];

  // Calculate achievement opportunities
  const achievementOpportunities = useMemo(() => {
    if (!state) return [];

    const earnedIds = new Set((state.achievements ?? []).map(a => a.id));
    return ALL_ACHIEVEMENTS
      .filter(a => !earnedIds.has(a.id) && a.category !== "Bad" && a.category !== "Infamy")
      .slice(0, 5)
      .map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        category: a.category,
        points: a.points,
      }));
  }, [state]);

  return (
    <div className="space-y-6">
      {/* Section 1: Segment Overview Cards */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          Market Segments
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {segments.map((segment) => {
            const profile = SEGMENT_PROFILES[segment];
            const weights = CONSTANTS.SEGMENT_WEIGHTS[segment];
            const Icon = SEGMENT_ICONS[segment];
            const demandData = marketState?.demandBySegment?.[segment];
            const currentDemand = demandData?.totalDemand ?? profile.demandUnits;

            // Find top factor
            const factors = Object.entries(weights) as [string, number][];
            factors.sort((a, b) => b[1] - a[1]);
            const topFactor = factors[0];

            // Player's market share in this segment
            const playerShare = state?.marketShare?.[segment] ?? 0;

            return (
              <Card key={segment} className={`border ${SEGMENT_BG[segment]}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${SEGMENT_COLORS[segment]}`} />
                    <span className={`text-sm font-semibold ${SEGMENT_COLORS[segment]}`}>{segment}</span>
                  </div>
                  <div className="text-xl font-bold text-white mb-1">
                    {(currentDemand / 1000).toFixed(0)}K
                  </div>
                  <div className="text-slate-400 text-xs mb-2">
                    <span className="flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3 text-green-400" />
                      +{((demandData?.growthRate ?? profile.demandGrowthRate) * 100).toFixed(0)}%/yr
                    </span>
                  </div>
                  <div className="text-slate-400 text-xs mb-2">
                    ${demandData?.priceRange?.min ?? profile.priceRange.min}-${demandData?.priceRange?.max ?? profile.priceRange.max}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 text-[10px] uppercase">Wins on:</span>
                    <Badge variant="outline" className={`text-[10px] py-0 border-slate-600 ${SEGMENT_COLORS[segment]}`}>
                      {topFactor[0]} ({topFactor[1]}pts)
                    </Badge>
                  </div>
                  {playerShare > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-700">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Your share</span>
                        <span className="text-white font-medium">{(playerShare * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={playerShare * 100} className="h-1 mt-1" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Section 2: Win Condition Matrix */}
      <WinConditionMatrix />

      {/* Section 3: Segment Pathways */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-white font-semibold text-base">Segment Pathways</h3>
              <p className="text-slate-400 text-sm">Recommended progression for each segment</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {segments.map((segment) => {
              const pathway = SEGMENT_PATHWAYS[segment];
              const Icon = SEGMENT_ICONS[segment];

              return (
                <div key={segment} className="p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${SEGMENT_COLORS[segment]}`} />
                    <span className={`text-sm font-semibold ${SEGMENT_COLORS[segment]}`}>{segment}</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {pathway.phases.map((phase, idx) => {
                      const roundStart = parseInt(phase.rounds.split("-")[0]);
                      const isActive = phase.archetypeId !== null;
                      const isCurrent = currentRound >= roundStart && (idx === pathway.phases.length - 1 || currentRound < parseInt(pathway.phases[idx + 1].rounds.split("-")[0]));

                      return (
                        <div
                          key={idx}
                          className={`flex-shrink-0 p-2.5 rounded-lg border min-w-[180px] ${
                            isCurrent
                              ? "border-cyan-500/40 bg-cyan-500/5"
                              : "border-slate-600/50 bg-slate-700/50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white text-xs font-medium">{phase.name}</span>
                            <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400 py-0">
                              R{phase.rounds}
                            </Badge>
                          </div>
                          {isActive ? (
                            <div className="text-cyan-400 text-xs font-medium mb-1">{phase.archetypeName}</div>
                          ) : (
                            <div className="text-slate-500 text-xs italic mb-1">Build elsewhere first</div>
                          )}
                          <div className="text-slate-400 text-[10px]">{phase.rdTarget}</div>
                          {phase.note && (
                            <div className="mt-1 flex items-start gap-1">
                              <Info className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                              <span className="text-slate-500 text-[10px] leading-tight">{phase.note}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Demand Cycles & Forecasting */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="text-white font-semibold text-base">Demand Cycles</h3>
              <p className="text-slate-400 text-sm">Seasonal demand patterns by segment</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {segments.map((segment) => {
              const cycle = SEGMENT_DEMAND_CYCLES[segment];
              const currentMultiplier = getDemandMultiplier(segment, currentRound);
              const nextMultiplier = getDemandMultiplier(segment, currentRound + 1);
              const Icon = SEGMENT_ICONS[segment];
              const trend = nextMultiplier > currentMultiplier ? "rising" : nextMultiplier < currentMultiplier ? "falling" : "stable";

              // Find current cycle label
              const roundInCycle = ((currentRound - 1) % cycle.cycleLength);
              const activeLabel = cycle.points.find(p => p.roundInCycle === roundInCycle)?.label;

              return (
                <div key={segment} className="flex items-center gap-3 p-2.5 bg-slate-700/30 rounded-lg">
                  <Icon className={`w-4 h-4 ${SEGMENT_COLORS[segment]} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-medium ${SEGMENT_COLORS[segment]}`}>{segment}</span>
                      {activeLabel && (
                        <Badge variant="outline" className="text-[10px] py-0 border-slate-600 text-teal-400">
                          <Calendar className="w-2.5 h-2.5 mr-1" />
                          {activeLabel}
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-500 text-[10px] truncate">{cycle.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-sm font-bold ${
                      currentMultiplier >= 1.1 ? "text-green-400" :
                      currentMultiplier <= 0.9 ? "text-red-400" :
                      "text-slate-300"
                    }`}>
                      {(currentMultiplier * 100).toFixed(0)}%
                    </div>
                    <div className={`text-[10px] flex items-center gap-0.5 justify-end ${
                      trend === "rising" ? "text-green-400" :
                      trend === "falling" ? "text-red-400" :
                      "text-slate-500"
                    }`}>
                      {trend === "rising" ? "↑" : trend === "falling" ? "↓" : "→"} Next: {(nextMultiplier * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Achievement Opportunities */}
      {achievementOpportunities.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-white font-semibold text-base">Achievement Opportunities</h3>
                <p className="text-slate-400 text-sm">
                  Achievements you can still unlock ({state?.achievementScore ?? 0} points earned)
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {achievementOpportunities.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-2.5 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Target className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-white text-sm font-medium">{a.name}</span>
                      <p className="text-slate-400 text-xs">{a.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                      {a.category}
                    </Badge>
                    <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                      +{a.points}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
