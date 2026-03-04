"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/api/trpc";
import Link from "next/link";
import {
  Radio,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  Leaf,
  Package,
  Globe,
  DollarSign,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  User,
} from "lucide-react";
import { KIT_SUPPLIERS } from "@/engine/materials/SupplierCatalog";
import { getKit } from "@/engine/materials/KitCatalog";
import type { TeamState, Segment } from "@/engine/types";

interface EventBannerProps {
  gameId: string;
  currentRound: number;
}

interface NewsItem {
  id: string;
  type: string;
  title: string;
  description: string;
  round: number;
  severity: string;
  effects: Array<{ target: string; modifier: number }>;
}

const EVENT_ICONS: Record<string, React.ElementType> = {
  recession: TrendingDown,
  boom: TrendingUp,
  inflation_spike: DollarSign,
  tech_breakthrough: Zap,
  sustainability_regulation: Leaf,
  green_regulation: Leaf,
  supply_chain_crisis: Package,
  supply_crisis: Package,
  currency_crisis: Globe,
  price_war: AlertTriangle,
  custom: Radio,
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "border-blue-500/30 bg-blue-500/5",
  medium: "border-amber-500/30 bg-amber-500/5",
  high: "border-orange-500/30 bg-orange-500/5",
  critical: "border-red-500/30 bg-red-500/5",
};

const SEVERITY_TEXT: Record<string, string> = {
  low: "text-blue-400",
  medium: "text-amber-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

function formatMoney(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

// ============================================================================
// Personalized impact generation
// ============================================================================

function generatePersonalizedImpact(
  news: NewsItem,
  state: TeamState | null,
): string[] {
  if (!state) return [];
  const bullets: string[] = [];

  const launchedProducts = (state.products ?? []).filter(p => p.developmentStatus === "launched");
  const pendingOrders = state.pendingKitOrders ?? [];
  const kitInventory = state.kitInventory ?? {};
  const cash = state.cash ?? 0;
  const factories = state.factories ?? [];

  // Which segments are we active in?
  const activeSegments = new Set<string>(launchedProducts.map(p => p.segment || "General"));

  // Segment-specific effects
  const affectedSegments = news.effects
    .filter(e => e.target && e.target !== "all" && activeSegments.has(e.target))
    .map(e => e.target);

  const allSegmentsAffected = news.effects.some(e => e.target === "all");

  switch (news.type) {
    case "supply_chain_crisis":
    case "supply_crisis": {
      // Show pending orders at risk
      if (pendingOrders.length > 0) {
        const ordersBySupplier = new Map<string, { qty: number; kits: string[] }>();
        for (const o of pendingOrders) {
          const entry = ordersBySupplier.get(o.supplierId) ?? { qty: 0, kits: [] };
          entry.qty += o.quantity;
          const kitName = getKit(o.kitId)?.name ?? o.kitId;
          if (!entry.kits.includes(kitName)) entry.kits.push(kitName);
          ordersBySupplier.set(o.supplierId, entry);
        }
        for (const [suppId, info] of ordersBySupplier) {
          const supplier = KIT_SUPPLIERS.find(s => s.id === suppId);
          bullets.push(
            `Your pending order of ${info.qty.toLocaleString()} ${info.kits.join(", ")} from ${supplier?.name ?? suppId} may be delayed`
          );
        }
      }
      // Show inventory buffer
      const totalKits = Object.values(kitInventory).reduce((s, v) => s + v, 0);
      if (totalKits > 0) {
        bullets.push(`Current kit inventory: ${totalKits.toLocaleString()} units — buffer against disruption`);
      } else {
        bullets.push("No kit inventory buffer — consider ordering backup kits");
      }
      // Suggest alternative supplier
      const asiaOrders = pendingOrders.filter(o => o.supplierId === "supplier-asia");
      if (asiaOrders.length > 0) {
        bullets.push("Consider ordering backup kits from Euro Express (higher cost but 95% reliability)");
      }
      break;
    }

    case "recession": {
      // Show which products face demand drop
      if (affectedSegments.length > 0) {
        const products = launchedProducts.filter(p => affectedSegments.includes(p.segment || "General"));
        bullets.push(`Demand drop hits your ${products.map(p => p.name).join(", ")} (${affectedSegments.join(", ")} segment${affectedSegments.length > 1 ? "s" : ""})`);
      } else if (allSegmentsAffected) {
        bullets.push(`All segments affected — you have ${launchedProducts.length} launched product${launchedProducts.length !== 1 ? "s" : ""}`);
      }
      bullets.push(`Cash position: ${formatMoney(cash)} — ensure enough runway for reduced revenue`);
      break;
    }

    case "boom": {
      if (affectedSegments.length > 0 || allSegmentsAffected) {
        const totalCapacity = factories.reduce((sum, f) =>
          sum + ((f.productionLines ?? []).reduce((s, l) => s + (l.capacity ?? 0), 0)), 0);
        bullets.push(`Factory capacity: ${totalCapacity.toLocaleString()} units — ensure you can meet increased demand`);
      }
      if (launchedProducts.length > 0) {
        bullets.push(`Your ${launchedProducts.map(p => p.name).join(", ")} will benefit from higher demand`);
      }
      break;
    }

    case "inflation_spike": {
      // Show material cost exposure
      const totalPending = pendingOrders.reduce((sum, o) => sum + o.totalCost, 0);
      if (totalPending > 0) {
        bullets.push(`${formatMoney(totalPending)} in pending material orders — costs may increase`);
      }
      bullets.push(`Cash position: ${formatMoney(cash)} — budget for higher input costs`);
      break;
    }

    case "tech_breakthrough": {
      const rdProgress = state.rdProgress ?? 0;
      bullets.push(`Your R&D progress: ${rdProgress} pts — invest to capitalize on the breakthrough`);
      if (launchedProducts.length > 0) {
        bullets.push(`${launchedProducts.length} product${launchedProducts.length !== 1 ? "s" : ""} could benefit from quality/feature upgrades`);
      }
      break;
    }

    case "sustainability_regulation":
    case "green_regulation": {
      const esgScore = state.esgScore ?? 0;
      bullets.push(`Your ESG score: ${esgScore} ${esgScore < 300 ? "— below 300 threshold, revenue penalty risk" : "— above threshold"}`);
      const avgEmissions = factories.length > 0
        ? Math.round(factories.reduce((s, f) => s + (f.co2Emissions ?? 0), 0) / factories.length)
        : 0;
      if (avgEmissions > 0) {
        bullets.push(`Average factory emissions: ${avgEmissions} CO₂ — green investments can help`);
      }
      break;
    }

    case "currency_crisis": {
      const regions = new Set(factories.map(f => f.region));
      if (regions.size > 0) {
        bullets.push(`Your factories: ${[...regions].join(", ")} — regional costs may shift`);
      }
      if (pendingOrders.length > 0) {
        bullets.push(`${pendingOrders.length} pending kit order${pendingOrders.length !== 1 ? "s" : ""} may see price adjustments`);
      }
      bullets.push(`Cash: ${formatMoney(cash)} — monitor exchange rate exposure`);
      break;
    }

    case "price_war": {
      if (affectedSegments.length > 0) {
        const products = launchedProducts.filter(p => affectedSegments.includes(p.segment || "General"));
        bullets.push(`Your ${products.map(p => p.name).join(", ")} face price pressure in ${affectedSegments.join(", ")}`);
      } else if (allSegmentsAffected) {
        bullets.push(`All-segment price war — ${launchedProducts.length} of your products affected`);
      }
      bullets.push("Consider adjusting marketing spend or pricing strategy");
      break;
    }

    default: {
      // Generic fallback: show key team metrics alongside any event
      if (affectedSegments.length > 0) {
        const products = launchedProducts.filter(p => affectedSegments.includes(p.segment || "General"));
        if (products.length > 0) {
          bullets.push(`Affects your: ${products.map(p => `${p.name} (${p.segment})`).join(", ")}`);
        }
      }
      if (pendingOrders.length > 0) {
        const totalKits = pendingOrders.reduce((s, o) => s + o.quantity, 0);
        bullets.push(`Supply chain: ${totalKits.toLocaleString()} kits pending delivery`);
      }
      if (bullets.length === 0 && launchedProducts.length > 0) {
        bullets.push(`You have ${launchedProducts.length} active product${launchedProducts.length !== 1 ? "s" : ""} in ${[...activeSegments].join(", ")}`);
      }
      break;
    }
  }

  return bullets.slice(0, 3);
}

// ============================================================================
// Component
// ============================================================================

export function EventBanner({ gameId, currentRound }: EventBannerProps) {
  const { data } = trpc.game.getNews.useQuery({ gameId });
  const { data: teamState } = trpc.team.getMyState.useQuery();
  const [expanded, setExpanded] = useState(false);

  // Parse team state
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

  // Only show events from the current round or one round before
  const relevantNews = (data?.news ?? []).filter(
    (n) => n.round >= currentRound - 1
  );

  if (relevantNews.length === 0) return null;

  // Show most recent first, limit to 3 visible
  const displayedNews = expanded ? relevantNews : relevantNews.slice(0, 1);
  const basePath = gameId === "demo" ? "/demo" : `/game/${gameId}`;

  return (
    <div className="space-y-1.5 mb-4">
      {displayedNews.map((news) => {
        const Icon = EVENT_ICONS[news.type] ?? Radio;
        const severityColor = SEVERITY_COLORS[news.severity] ?? SEVERITY_COLORS.medium;
        const severityText = SEVERITY_TEXT[news.severity] ?? SEVERITY_TEXT.medium;
        const impact = generatePersonalizedImpact(news, state);

        return (
          <div
            key={news.id}
            className={cn(
              "px-4 py-2.5 border rounded-lg text-xs",
              severityColor
            )}
          >
            <div className="flex items-start gap-2.5">
              <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", severityText)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("font-medium", severityText)}>
                    {news.title}
                  </span>
                  <span className="text-slate-500 shrink-0">R{news.round}</span>
                </div>
                <p className="text-slate-400 line-clamp-2 mt-0.5">
                  {news.description}
                </p>
                {news.effects.length > 0 && (
                  <div className="flex gap-2 mt-1">
                    {news.effects.slice(0, 3).map((eff, i) => (
                      <span key={i} className="text-[10px] text-slate-500 tabular-nums">
                        {eff.target}: {eff.modifier > 0 ? "+" : ""}
                        {(eff.modifier * 100).toFixed(0)}%
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Personalized impact section */}
            {impact.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-700/30">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mb-1">
                  <User className="w-3 h-3" />
                  Impact on YOUR company:
                </div>
                <div className="space-y-0.5 ml-4">
                  {impact.map((bullet, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                      <span className="text-slate-500 shrink-0">&rarr;</span>
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Expand/collapse + link to full news page */}
      <div className="flex items-center justify-between">
        {relevantNews.length > 1 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
            type="button"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" /> Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" /> +{relevantNews.length - 1} more event{relevantNews.length - 1 !== 1 ? "s" : ""}
              </>
            )}
          </button>
        )}
        <Link
          href={`${basePath}/news`}
          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors ml-auto"
        >
          All News <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      </div>
    </div>
  );
}
