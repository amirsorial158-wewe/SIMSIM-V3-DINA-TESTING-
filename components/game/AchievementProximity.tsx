"use client";

import { useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/api/trpc";
import { Trophy, ArrowRight } from "lucide-react";
import {
  EXTENDED_TIER_CONFIG,
  type ExtendedAchievementCategory,
  type ExtendedAchievement,
} from "@/engine/achievements";

interface AchievementProximityProps {
  /** Achievement category matching this module (e.g., "rd", "factory", "finance") */
  category: ExtendedAchievementCategory;
  /** Team ID for fetching progress */
  teamId: string | undefined;
  /** Game ID for "View All" link */
  gameId: string;
  /** Max achievements to show (default 3) */
  maxItems?: number;
  /** Minimum percentComplete to show (default 40) */
  minPercent?: number;
}

interface NearbyAchievement {
  id: string;
  name: string;
  description: string;
  tier: ExtendedAchievement["tier"];
  percentComplete: number;
  currentValue: number;
  targetValue: number;
}

export function AchievementProximity({
  category,
  teamId,
  gameId,
  maxItems = 3,
  minPercent = 40,
}: AchievementProximityProps) {
  const { data } = trpc.achievement.getTeamAchievements.useQuery(
    { teamId: teamId ?? "" },
    { enabled: !!teamId }
  );

  const nearby = useMemo<NearbyAchievement[]>(() => {
    if (!data) return [];

    const earnedIds = new Set(data.earned.map((e) => e.achievementId));

    // Filter visible achievements by category, not yet earned
    const categoryAchievements = data.visibleAchievements.filter(
      (a) => a.category === category && !earnedIds.has(a.id) && !a.isNegative
    );

    // Build progress map
    const progressMap = new Map<string, { currentValue: number; targetValue: number; percentComplete: number }>();
    for (const p of data.progress) {
      progressMap.set(p.achievementId, {
        currentValue: p.currentValue,
        targetValue: p.targetValue,
        percentComplete: p.percentComplete,
      });
    }

    // Join and filter by minPercent
    const candidates: NearbyAchievement[] = [];
    for (const ach of categoryAchievements) {
      const prog = progressMap.get(ach.id);
      const pct = prog?.percentComplete ?? 0;
      if (pct >= minPercent && pct < 100) {
        candidates.push({
          id: ach.id,
          name: ach.name,
          description: ach.description,
          tier: ach.tier,
          percentComplete: pct,
          currentValue: prog?.currentValue ?? 0,
          targetValue: prog?.targetValue ?? 0,
        });
      }
    }

    // Sort by percentComplete descending, take top N
    candidates.sort((a, b) => b.percentComplete - a.percentComplete);
    return candidates.slice(0, maxItems);
  }, [data, category, maxItems, minPercent]);

  if (!teamId || nearby.length === 0) return null;

  const basePath = gameId === "demo" ? "/demo" : `/game/${gameId}`;

  return (
    <Card className="bg-slate-800/40 border-slate-700/30">
      <CardHeader className="pb-1.5 pt-3 px-4">
        <CardTitle className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          Almost There
          <Link
            href={`${basePath}/achievements`}
            className="ml-auto text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-0.5 transition-colors"
          >
            All <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        {nearby.map((ach) => {
          const tierCfg = EXTENDED_TIER_CONFIG[ach.tier];
          return (
            <div key={ach.id} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span>{tierCfg.icon}</span>
                  <span className="text-slate-200 truncate">{ach.name}</span>
                </div>
                <span className={cn("tabular-nums shrink-0 ml-2", tierCfg.color)}>
                  {Math.round(ach.percentComplete)}%
                </span>
              </div>
              <div className="h-1 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", tierCfg.bgColor.replace("/20", "/60"))}
                  style={{ width: `${Math.min(100, ach.percentComplete)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 truncate">{ach.description}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
