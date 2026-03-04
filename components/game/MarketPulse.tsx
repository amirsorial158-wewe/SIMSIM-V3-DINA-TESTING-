"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronDown,
  ChevronUp,
  Activity,
  Target,
  TrendingUp,
  Shield,
  Users,
  DollarSign,
  Factory,
  Beaker,
  Megaphone,
} from "lucide-react";

// =============================================================================
// Types
// =============================================================================

type ModuleName = "rnd" | "factory" | "finance" | "hr" | "marketing";

interface RankingEntry {
  teamId: string;
  teamName: string;
  teamColor: string;
  rank: number;
  metrics: Record<string, number>;
}

interface MarketPulseProps {
  module: ModuleName;
  currentRound: number;
  rankings: RankingEntry[];
  totalTeams: number;
  myTeamId?: string;
}

interface Signal {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

// =============================================================================
// Helpers
// =============================================================================

function formatMoney(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

const MODULE_COLORS: Record<ModuleName, string> = {
  rnd: "text-purple-400",
  factory: "text-orange-400",
  finance: "text-green-400",
  hr: "text-blue-400",
  marketing: "text-pink-400",
};

// =============================================================================
// Signal Extractors per Module
// =============================================================================

function extractSignals(
  module: ModuleName,
  rankings: RankingEntry[],
  totalTeams: number,
  myTeamId?: string
): Signal[] {
  if (rankings.length === 0) return [];

  // Helper to find averages across all teams
  const avg = (key: string) => {
    const values = rankings.map((r) => r.metrics[key] ?? 0);
    return values.reduce((s, v) => s + v, 0) / Math.max(1, values.length);
  };

  // Helper to find the leader
  const leader = (key: string) => {
    const sorted = [...rankings].sort((a, b) => (b.metrics[key] ?? 0) - (a.metrics[key] ?? 0));
    const top = sorted[0];
    return top ? { name: top.teamName, value: top.metrics[key] ?? 0, isMe: top.teamId === myTeamId } : null;
  };

  // Helper for my rank
  const myRank = rankings.find((r) => r.teamId === myTeamId)?.rank;

  switch (module) {
    case "rnd": {
      const avgRevenue = avg("revenue");
      const revenueLeader = leader("revenue");
      return [
        {
          icon: <Target className="w-3.5 h-3.5" />,
          label: "Your Rank",
          value: myRank ? `#${myRank} of ${totalTeams}` : `${totalTeams} teams`,
          color: myRank && myRank <= Math.ceil(totalTeams / 3) ? "text-emerald-400" : "text-slate-300",
        },
        {
          icon: <TrendingUp className="w-3.5 h-3.5" />,
          label: "Avg Revenue",
          value: formatMoney(avgRevenue),
          color: "text-slate-300",
        },
        {
          icon: <Shield className="w-3.5 h-3.5" />,
          label: "Revenue Leader",
          value: revenueLeader
            ? `${revenueLeader.isMe ? "You!" : revenueLeader.name}`
            : "—",
          color: revenueLeader?.isMe ? "text-emerald-400" : "text-amber-300",
        },
      ];
    }

    case "factory": {
      const avgRevenue = avg("revenue");
      const avgShare = avg("totalMarketShare") || avg("marketShare");
      return [
        {
          icon: <Factory className="w-3.5 h-3.5" />,
          label: "Your Rank",
          value: myRank ? `#${myRank} of ${totalTeams}` : `${totalTeams} teams`,
          color: myRank && myRank <= Math.ceil(totalTeams / 3) ? "text-emerald-400" : "text-slate-300",
        },
        {
          icon: <TrendingUp className="w-3.5 h-3.5" />,
          label: "Avg Revenue",
          value: formatMoney(avgRevenue),
          color: "text-slate-300",
        },
        {
          icon: <Activity className="w-3.5 h-3.5" />,
          label: "Avg Market Share",
          value: `${(avgShare * 100).toFixed(1)}%`,
          color: "text-slate-300",
        },
      ];
    }

    case "finance": {
      const avgRevenue = avg("revenue");
      const avgNetIncome = avg("netIncome");
      const revenueLeader = leader("revenue");
      return [
        {
          icon: <DollarSign className="w-3.5 h-3.5" />,
          label: "Your Rank",
          value: myRank ? `#${myRank} of ${totalTeams}` : `${totalTeams} teams`,
          color: myRank && myRank <= Math.ceil(totalTeams / 3) ? "text-emerald-400" : "text-slate-300",
        },
        {
          icon: <TrendingUp className="w-3.5 h-3.5" />,
          label: "Avg Net Income",
          value: formatMoney(avgNetIncome),
          color: avgNetIncome > 0 ? "text-emerald-300" : "text-red-300",
        },
        {
          icon: <Shield className="w-3.5 h-3.5" />,
          label: "Top Revenue",
          value: revenueLeader
            ? `${revenueLeader.isMe ? "You!" : revenueLeader.name} (${formatMoney(revenueLeader.value)})`
            : "—",
          color: revenueLeader?.isMe ? "text-emerald-400" : "text-amber-300",
        },
      ];
    }

    case "hr": {
      const avgShare = avg("totalMarketShare") || avg("marketShare");
      return [
        {
          icon: <Users className="w-3.5 h-3.5" />,
          label: "Your Rank",
          value: myRank ? `#${myRank} of ${totalTeams}` : `${totalTeams} teams`,
          color: myRank && myRank <= Math.ceil(totalTeams / 3) ? "text-emerald-400" : "text-slate-300",
        },
        {
          icon: <Activity className="w-3.5 h-3.5" />,
          label: "Avg Market Share",
          value: `${(avgShare * 100).toFixed(1)}%`,
          color: "text-slate-300",
        },
        {
          icon: <TrendingUp className="w-3.5 h-3.5" />,
          label: "Competition",
          value: `${totalTeams} teams competing`,
          color: "text-slate-300",
        },
      ];
    }

    case "marketing": {
      const avgShare = avg("totalMarketShare") || avg("marketShare");
      const shareLeader = leader("totalMarketShare") || leader("marketShare");
      return [
        {
          icon: <Megaphone className="w-3.5 h-3.5" />,
          label: "Your Rank",
          value: myRank ? `#${myRank} of ${totalTeams}` : `${totalTeams} teams`,
          color: myRank && myRank <= Math.ceil(totalTeams / 3) ? "text-emerald-400" : "text-slate-300",
        },
        {
          icon: <Activity className="w-3.5 h-3.5" />,
          label: "Avg Share",
          value: `${(avgShare * 100).toFixed(1)}%`,
          color: "text-slate-300",
        },
        {
          icon: <Shield className="w-3.5 h-3.5" />,
          label: "Share Leader",
          value: shareLeader
            ? `${shareLeader.isMe ? "You!" : shareLeader.name}`
            : "—",
          color: shareLeader?.isMe ? "text-emerald-400" : "text-amber-300",
        },
      ];
    }
  }
}

// =============================================================================
// Component
// =============================================================================

export function MarketPulse({
  module,
  currentRound,
  rankings,
  totalTeams,
  myTeamId,
}: MarketPulseProps) {
  const [expanded, setExpanded] = useState(false);

  const signals = useMemo(
    () => extractSignals(module, rankings, totalTeams, myTeamId),
    [module, rankings, totalTeams, myTeamId]
  );

  // Round 1 — no competition data yet
  if (currentRound <= 1 || signals.length === 0) return null;

  return (
    <Card className="bg-slate-800/30 border-slate-700/20 mb-3">
      <CardHeader
        className="pb-0 pt-2.5 px-4 cursor-pointer hover:bg-slate-700/20 rounded-t-lg transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <CardTitle className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Activity className={`w-3 h-3 ${MODULE_COLORS[module]}`} />
            <span>Market Pulse</span>
          </div>
          {expanded ? (
            <ChevronUp className="w-3 h-3 text-slate-500" />
          ) : (
            <ChevronDown className="w-3 h-3 text-slate-500" />
          )}
        </CardTitle>
      </CardHeader>

      {/* Collapsed: inline signal summary */}
      {!expanded && (
        <CardContent className="px-4 pb-2.5 pt-1.5">
          <div className="flex items-center gap-4 flex-wrap">
            {signals.map((s, i) => (
              <div key={i} className="flex items-center gap-1 text-[11px]">
                <span className="text-slate-500">{s.icon}</span>
                <span className="text-slate-500">{s.label}:</span>
                <span className={`font-medium ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      )}

      {/* Expanded: full signal cards */}
      {expanded && (
        <CardContent className="px-4 pb-3 pt-2">
          <div className="grid grid-cols-3 gap-2">
            {signals.map((s, i) => (
              <div key={i} className="p-2 bg-slate-700/20 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={MODULE_COLORS[module]}>{s.icon}</span>
                  <span className="text-[10px] text-slate-500">{s.label}</span>
                </div>
                <span className={`text-xs font-medium ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
