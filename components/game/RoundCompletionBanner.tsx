"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAllModulesSubmitted } from "@/components/game/DecisionStepper";
import { useBudgetSummary } from "@/lib/hooks/useBudgetSummary";
import { CheckCircle2, Clock, Eye, BarChart3, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface RoundCompletionBannerProps {
  gameId: string;
  currentRound: number;
  startingCash: number;
}

function formatMoney(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function RoundCompletionBanner({
  gameId,
  currentRound,
  startingCash,
}: RoundCompletionBannerProps) {
  const allSubmitted = useAllModulesSubmitted();
  const { modules, totalCommitted, remaining } = useBudgetSummary(startingCash);
  const basePath = gameId === "demo" ? "/demo" : `/game/${gameId}`;

  if (!allSubmitted) return null;

  return (
    <Card className="bg-emerald-900/20 border-emerald-700/40 mb-6">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-full shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm">
              Round {currentRound} Decisions Complete
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              <span>Waiting for facilitator to advance the round.</span>
            </div>

            {/* Cost summary */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {modules.map((m) => (
                <div key={m.module} className="p-2 bg-slate-800/60 rounded text-center">
                  <div className="text-[10px] text-slate-400 uppercase">{m.label}</div>
                  <div className={cn(
                    "text-xs font-medium tabular-nums mt-0.5",
                    m.cost > 0 ? "text-emerald-400" : m.cost < 0 ? "text-slate-300" : "text-slate-500"
                  )}>
                    {m.cost === 0 ? "$0" : `${m.cost > 0 ? "+" : "-"}${formatMoney(Math.abs(m.cost))}`}
                  </div>
                </div>
              ))}
              <div className="p-2 bg-emerald-900/30 rounded text-center border border-emerald-700/30">
                <div className="text-[10px] text-emerald-400 uppercase">Remaining</div>
                <div className="text-xs font-bold text-emerald-400 tabular-nums mt-0.5">
                  {formatMoney(remaining)}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <Link href={`${basePath}/rnd`}>
                <Button variant="outline" size="sm" className="text-xs border-slate-600 text-slate-300 hover:text-white">
                  <Eye className="w-3 h-3 mr-1.5" />
                  Review Decisions
                </Button>
              </Link>
              <Link href={`${basePath}/market`}>
                <Button variant="outline" size="sm" className="text-xs border-slate-600 text-slate-300 hover:text-white">
                  <BarChart3 className="w-3 h-3 mr-1.5" />
                  Market Intelligence
                </Button>
              </Link>
              {currentRound > 1 && (
                <Link href={`${basePath}/results`}>
                  <Button variant="outline" size="sm" className="text-xs border-slate-600 text-slate-300 hover:text-white">
                    <Trophy className="w-3 h-3 mr-1.5" />
                    View Results
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
