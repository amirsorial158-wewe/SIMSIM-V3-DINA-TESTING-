"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MiniSparkline } from "@/components/ui/mini-sparkline";
import { Clock, TrendingUp, TrendingDown } from "lucide-react";

interface RoundSnapshot {
  round: number;
  revenue: number;
  netIncome: number;
  cash: number;
  rank?: number;
  employees?: number;
  products?: number;
}

interface CompanyTimelineProps {
  history: RoundSnapshot[];
  currentRound: number;
}

function formatMoney(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function CompanyTimeline({ history, currentRound }: CompanyTimelineProps) {
  if (history.length < 2) return null;

  const sorted = useMemo(
    () => [...history].sort((a, b) => a.round - b.round),
    [history]
  );

  const revenueData = sorted.map((h) => h.revenue);
  const profitData = sorted.map((h) => h.netIncome);
  const cashData = sorted.map((h) => h.cash);

  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];

  const revenueDelta = latest.revenue - previous.revenue;
  const profitDelta = latest.netIncome - previous.netIncome;
  const cashDelta = latest.cash - previous.cash;

  return (
    <Card className="bg-slate-800/60 border-slate-700/50">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Company Timeline — {sorted.length} Round{sorted.length !== 1 ? "s" : ""}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="grid grid-cols-3 gap-3">
          {/* Revenue */}
          <TimelineMetric
            label="Revenue"
            value={latest.revenue}
            delta={revenueDelta}
            sparkData={revenueData}
            positiveIsGood
          />
          {/* Net Income */}
          <TimelineMetric
            label="Net Income"
            value={latest.netIncome}
            delta={profitDelta}
            sparkData={profitData}
            positiveIsGood
          />
          {/* Cash */}
          <TimelineMetric
            label="Cash"
            value={latest.cash}
            delta={cashDelta}
            sparkData={cashData}
            positiveIsGood
          />
        </div>

        {/* Carried forward strip */}
        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-700/30 text-[10px] text-slate-500 overflow-x-auto">
          <span className="text-slate-400 font-medium shrink-0">Carrying into R{currentRound}:</span>
          <span className="tabular-nums">{formatMoney(latest.cash)} cash</span>
          {latest.employees !== undefined && (
            <span className="tabular-nums">{latest.employees} staff</span>
          )}
          {latest.products !== undefined && (
            <span className="tabular-nums">{latest.products} product{latest.products !== 1 ? "s" : ""}</span>
          )}
          {latest.rank !== undefined && (
            <span className="tabular-nums">Rank #{latest.rank}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineMetric({
  label,
  value,
  delta,
  sparkData,
  positiveIsGood,
}: {
  label: string;
  value: number;
  delta: number;
  sparkData: number[];
  positiveIsGood?: boolean;
}) {
  const isPositive = delta > 0;
  const isNegative = delta < 0;

  return (
    <div className="space-y-1">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="text-xs text-white font-medium tabular-nums">
        {formatMoney(value)}
      </div>
      <div className="flex items-center gap-1 text-[10px] tabular-nums">
        {isPositive && (
          <>
            <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-emerald-400">+{formatMoney(delta)}</span>
          </>
        )}
        {isNegative && (
          <>
            <TrendingDown className="w-2.5 h-2.5 text-red-400" />
            <span className="text-red-400">{formatMoney(delta)}</span>
          </>
        )}
        {!isPositive && !isNegative && (
          <span className="text-slate-500">—</span>
        )}
      </div>
      <MiniSparkline data={sparkData} height={20} positiveIsGood={positiveIsGood} />
    </div>
  );
}
