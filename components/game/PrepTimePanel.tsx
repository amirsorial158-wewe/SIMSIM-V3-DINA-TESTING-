"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAllModulesSubmitted } from "@/components/game/DecisionStepper";
import {
  BarChart3,
  Newspaper,
  Trophy,
  Target,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  BookOpen,
  AlertTriangle,
} from "lucide-react";

interface PrepTimePanelProps {
  gameId: string;
  currentRound: number;
  /** Strategic warnings based on team state */
  warnings?: { severity: "critical" | "warning" | "info"; text: string }[];
}

/** Shown after all decisions are submitted — turns dead wait into prep time */
export function PrepTimePanel({
  gameId,
  currentRound,
  warnings,
}: PrepTimePanelProps) {
  const allSubmitted = useAllModulesSubmitted();
  if (!allSubmitted) return null;

  const basePath = gameId === "demo" ? "/demo" : `/game/${gameId}`;

  const quickLinks = [
    {
      href: `${basePath}/market`,
      icon: BarChart3,
      label: "Market Intel",
      desc: "Study segments & pricing",
      color: "text-blue-400",
    },
    {
      href: `${basePath}/news`,
      icon: Newspaper,
      label: "News Feed",
      desc: "Check economic events",
      color: "text-purple-400",
    },
    {
      href: `${basePath}/achievements`,
      icon: Trophy,
      label: "Achievements",
      desc: "Track your progress",
      color: "text-amber-400",
    },
    ...(currentRound > 1
      ? [
          {
            href: `${basePath}/results`,
            icon: TrendingUp,
            label: "Results",
            desc: "Analyze past rounds",
            color: "text-emerald-400",
          },
        ]
      : []),
  ];

  // Strategy tips vary by round
  const strategyTips = getStrategyTips(currentRound);

  return (
    <Card className="bg-gradient-to-br from-slate-800/80 to-slate-800/50 border-slate-700/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          Prep Time — Use this time wisely
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <div className="p-3 bg-slate-700/40 hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer group">
                <link.icon
                  className={`w-4 h-4 ${link.color} mb-1.5 group-hover:scale-110 transition-transform`}
                />
                <p className="text-white text-xs font-medium">{link.label}</p>
                <p className="text-slate-400 text-[10px]">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Priority warnings */}
        {warnings && warnings.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">
              Key Issues for Next Round
            </p>
            {warnings.slice(0, 3).map((w, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 p-2 rounded text-xs ${
                  w.severity === "critical"
                    ? "bg-red-500/10 border border-red-500/20 text-red-200"
                    : w.severity === "warning"
                    ? "bg-amber-500/10 border border-amber-500/20 text-amber-200"
                    : "bg-blue-500/10 border border-blue-500/20 text-blue-200"
                }`}
              >
                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                <span>{w.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Strategy tip */}
        {strategyTips.length > 0 && (
          <div className="p-3 bg-slate-700/30 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                Round {currentRound} Strategy Tip
              </p>
            </div>
            {strategyTips.map((tip, i) => (
              <p key={i} className="text-xs text-slate-300">
                {tip}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getStrategyTips(round: number): string[] {
  if (round === 1) {
    return [
      "Round 1 is about establishing your foundation. Focus on getting at least one product launched and setting up core infrastructure.",
      "Budget segment has lowest material costs ($60/unit) — a safe starting point. Professional segment is most profitable but requires $600/unit in materials.",
    ];
  }
  if (round === 2) {
    return [
      "Review your Round 1 results carefully. Revenue vs. spending tells you if your strategy is sustainable.",
      "Consider expanding to a second segment to diversify. Check Market Intel for the highest-growth segment.",
    ];
  }
  if (round <= 4) {
    return [
      "Mid-game is about efficiency: machine health, worker morale, and brand building compound over rounds.",
      "ESG score below 300 causes a revenue penalty. Check if investments in sustainability would pay off.",
    ];
  }
  return [
    "Late game favors differentiation. Teams with strong brand value (>15%) get significant market advantages.",
    "Watch competitor rankings closely — small adjustments in pricing or quality can shift market share significantly.",
  ];
}
