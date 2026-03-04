"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ClipboardList,
  Factory,
  Users,
  DollarSign,
  Megaphone,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";
import type {
  FactoryRequirements,
  HRRequirements,
  FinanceRequirements,
  MarketingRequirements,
  MaterialRequirements,
  ProduceableCapacityData,
} from "@/lib/hooks/useRequirementsChain";
import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";

function formatMoney(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

// =============================================================================
// Factory Requirements Panel (shown on Factory page, driven by R&D)
// =============================================================================

// Legacy aliases for backward compatibility
export const FactoryRequirementsPanel = ProductionReadinessPanel;
export interface ProductionBottleneckData {
  segments: never[];
  totalEstimatedUnits: number;
  factoryCapacity: number;
  isBottleneck: boolean;
  usingActualShare: boolean;
}
export function ProductionBottleneckPanel(_props: { data: ProductionBottleneckData }) {
  return null; // Replaced by ProductionReadinessPanel
}

// =============================================================================
// Production Readiness Panel (unified Factory page panel)
// =============================================================================

export function ProductionReadinessPanel({ data }: { data: FactoryRequirements }) {
  if (data.productsToManufacture.length === 0) return null;

  const launchedProducts = data.productsToManufacture.filter((p) => p.isLaunched);
  const developingProducts = data.productsToManufacture.filter((p) => !p.isLaunched);
  const hasBlockers = data.productsToManufacture.some((p) => p.hasMissingEssential);

  return (
    <Card className="bg-slate-800/60 border-slate-700/50 mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Factory className="w-4 h-4 text-orange-400" />
          Production Readiness
          {hasBlockers && (
            <Badge className="text-[10px] bg-red-500/20 text-red-400 ml-auto">
              <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
              Blocked
            </Badge>
          )}
          {!hasBlockers && data.productsToManufacture.length > 0 && (
            <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 ml-auto">
              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
              {launchedProducts.length} active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Launched products */}
        {launchedProducts.map((p, i) => (
          <ProductReadinessRow key={`launched-${i}`} product={p} statusLabel="Launched" statusColor="emerald" />
        ))}

        {/* Developing / new products */}
        {developingProducts.map((p, i) => (
          <ProductReadinessRow key={`dev-${i}`} product={p} statusLabel="In Development" statusColor="purple" />
        ))}

        {/* Capacity summary */}
        {data.totalCapacityNeeded > 0 && (
          <div className="p-2 bg-slate-700/20 rounded space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">
                Estimated demand{data.usingActualShare ? " (actual share)" : " (est. share)"}
              </span>
              <span className="text-white font-medium">{data.totalCapacityNeeded.toLocaleString()} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Factory capacity</span>
              <span className="text-white font-medium">{data.currentCapacity.toLocaleString()} units</span>
            </div>
            {data.capacityGap > 0 && (
              <div className="flex justify-between pt-1.5 border-t border-slate-700/50">
                <span className="text-amber-400 font-medium">Missed opportunity</span>
                <span className="text-amber-400 font-medium">{data.capacityGap.toLocaleString()} units</span>
              </div>
            )}
          </div>
        )}

        {/* Staffing summary */}
        {data.workerGap > 0 && (
          <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs">
            <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-amber-300">
              Need {data.workerGap} more worker{data.workerGap !== 1 ? "s" : ""} ({data.workersHave}/{data.workersNeeded}).
              Hire in HR.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProductReadinessRow({
  product,
  statusLabel,
  statusColor,
}: {
  product: FactoryRequirements["productsToManufacture"][0];
  statusLabel: string;
  statusColor: string;
}) {
  const essentialMachines = product.recommendedMachines.filter((m) => m.priority === "essential");
  const otherMachines = product.recommendedMachines.filter((m) => m.priority !== "essential");

  return (
    <div className="p-3 bg-slate-700/30 rounded-lg space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white font-medium">{product.name}</span>
          <Badge className={`text-[10px] bg-${statusColor}-500/20 text-${statusColor}-400`}>
            {statusLabel}
          </Badge>
        </div>
        <Badge className="text-[10px] bg-slate-600 text-slate-300">{product.segment}</Badge>
      </div>

      {/* Kit info */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 flex items-center gap-1">
          <Package className="w-3 h-3" />
          {product.kitName}
        </span>
        {product.isLaunched && (
          <span className={cn(
            "text-xs",
            product.kitInventory >= product.kitNeededPerRound ? "text-emerald-400" : "text-amber-400"
          )}>
            {product.kitInventory.toLocaleString()} in stock
            {product.kitNeededPerRound > 0 && ` / ~${product.kitNeededPerRound.toLocaleString()} needed`}
          </span>
        )}
      </div>

      {/* Machine checklist (essential only — show owned and missing) */}
      {essentialMachines.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {essentialMachines.map((m, j) => (
            <div
              key={j}
              className={cn(
                "flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border",
                m.owned
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              )}
            >
              {m.owned ? (
                <CheckCircle2 className="w-2.5 h-2.5" />
              ) : (
                <XCircle className="w-2.5 h-2.5" />
              )}
              {m.type}
              {!m.owned && <span className="text-red-500/70 ml-0.5">({formatMoney(m.cost)})</span>}
            </div>
          ))}
        </div>
      )}

      {/* Non-essential recommendations (collapsed) */}
      {otherMachines.length > 0 && (
        <div className="space-y-0.5">
          {otherMachines.filter(m => !m.owned).map((m, j) => (
            <div key={j} className="flex items-start gap-2 text-xs">
              <PriorityIcon priority={m.priority} />
              <span className="text-slate-400">
                {m.type} ({formatMoney(m.cost)}) — {m.reason}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Capacity for launched products */}
      {product.isLaunched && product.capacityNeeded > 0 && (
        <div className="text-[11px] text-slate-500">
          ~{product.capacityNeeded.toLocaleString()} units estimated demand
        </div>
      )}
    </div>
  );
}

// =============================================================================
// HR Requirements Panel (shown on HR page, driven by Factory)
// =============================================================================

export function HRRequirementsPanel({ data }: { data: HRRequirements }) {
  if (data.workersNeeded === 0 && data.engineersNeeded === 0) return null;

  return (
    <Card className="bg-slate-800/60 border-slate-700/50 mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-blue-400" />
          Your Factory Needs This Staff
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Workers */}
        <StaffRow
          icon={<Users className="w-3.5 h-3.5 text-slate-400" />}
          label="Workers"
          needed={data.workersNeeded}
          have={data.workersHave}
          gap={data.workerGap}
          detail={`${data.workersNeeded} needed (${data.totalMachines} machine${data.totalMachines !== 1 ? "s" : ""} × 2.75)`}
        />

        {/* Supervisors */}
        <StaffRow
          icon={<Users className="w-3.5 h-3.5 text-slate-400" />}
          label="Supervisors"
          needed={data.supervisorsNeeded}
          have={data.supervisorsHave}
          gap={data.supervisorGap}
          detail={`1 per 15 workers`}
        />

        {/* Engineers */}
        <StaffRow
          icon={<Users className="w-3.5 h-3.5 text-purple-400" />}
          label="Engineers"
          needed={data.engineersNeeded}
          have={data.engineersHave}
          gap={data.engineerGap}
          detail={`Each generates 5 R&D pts/round`}
        />

        {/* Notes */}
        {data.notes.length > 0 && (
          <div className="space-y-1 pt-1">
            {data.notes.map((note, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px]">
                <Info className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" />
                <span className="text-cyan-200">{note}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StaffRow({
  icon,
  label,
  needed,
  have,
  gap,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  needed: number;
  have: number;
  gap: number;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <div className="text-xs text-white font-medium">{label}</div>
          <div className="text-[10px] text-slate-400">{detail}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs tabular-nums">
          <span className="text-slate-300">{have}</span>
          <span className="text-slate-500"> / </span>
          <span className="text-slate-300">{needed}</span>
        </div>
        {gap > 0 ? (
          <span className="text-[10px] text-amber-400">Hire {gap} more</span>
        ) : (
          <span className="text-[10px] text-emerald-400">Staffed</span>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Material Requirements Panel (shown on Factory page, driven by products)
// =============================================================================

export function MaterialRequirementsPanel({
  data,
  gameId,
}: {
  data: MaterialRequirements;
  gameId: string;
}) {
  if (data.productMaterials.length === 0) return null;

  const basePath = gameId === "demo" ? "/demo" : `/game/${gameId}`;

  return (
    <Card className="bg-slate-800/60 border-slate-700/50 mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Package className="w-4 h-4 text-cyan-400" />
          Materials for Production
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.productMaterials.map((p, i) => (
          <div key={i} className="p-3 bg-slate-700/30 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white font-medium">{p.name}</span>
              <Badge className="text-[10px] bg-slate-600 text-slate-300">
                {p.segment}
              </Badge>
            </div>
            <div className="text-[11px] text-slate-400 space-y-0.5">
              <div className="flex justify-between">
                <span>Cost per unit:</span>
                <span className="text-slate-300 tabular-nums">{formatMoney(p.costPerUnit)}</span>
              </div>
              <div className="flex justify-between">
                <span>Est. production:</span>
                <span className="text-slate-300 tabular-nums">{p.estimatedProduction.toLocaleString()} units</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-300">Total material cost:</span>
                <span className="text-cyan-400 tabular-nums">{formatMoney(p.totalCost)}</span>
              </div>
            </div>
            {/* Component breakdown (collapsed by default, first 3 shown) */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-slate-500 pt-1 border-t border-slate-600/30">
              {p.materialBreakdown.slice(0, 4).map((m, j) => (
                <div key={j} className="flex justify-between">
                  <span className="capitalize">{m.type}:</span>
                  <span className="tabular-nums">{formatMoney(m.costPerUnit)}/unit</span>
                </div>
              ))}
              {p.materialBreakdown.length > 4 && (
                <span className="text-slate-600">+{p.materialBreakdown.length - 4} more</span>
              )}
            </div>
          </div>
        ))}

        {/* Inventory status */}
        <div className="flex items-center justify-between p-2 bg-slate-700/20 rounded text-xs">
          <span className="text-slate-400">Total material cost/round:</span>
          <span className="text-cyan-400 font-medium tabular-nums">
            {formatMoney(data.totalMaterialCost)}
          </span>
        </div>

        {data.inventoryValue > 0 && (
          <div className="flex items-center justify-between p-2 bg-slate-700/20 rounded text-xs">
            <span className="text-slate-400">Inventory value:</span>
            <span className="text-slate-300 tabular-nums">
              {formatMoney(data.inventoryValue)}
              {data.roundsCoveredEstimate > 0 && (
                <span className="text-slate-500 ml-1">
                  (~{data.roundsCoveredEstimate} round{data.roundsCoveredEstimate !== 1 ? "s" : ""})
                </span>
              )}
            </span>
          </div>
        )}

        {data.activeOrderCount > 0 && (
          <div className="flex items-center justify-between p-2 bg-slate-700/20 rounded text-xs">
            <span className="text-slate-400">Active orders:</span>
            <span className="text-slate-300">{data.activeOrderCount} in transit</span>
          </div>
        )}

        {/* Warnings */}
        {data.warnings.map((warning, i) => (
          <div key={i} className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{warning}</span>
            </div>
          </div>
        ))}

        {/* Link to supply chain */}
        <Link
          href={`${basePath}/supply-chain`}
          className="flex items-center justify-center gap-1.5 p-2 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/5 hover:bg-cyan-500/10 rounded-lg transition-colors"
        >
          Order materials in Supply Chain
          <ArrowRight className="w-3 h-3" />
        </Link>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Finance Requirements Panel — Complete Cost Picture (Part 8)
// =============================================================================

export function FinanceRequirementsPanel({ data }: { data: FinanceRequirements }) {
  if (data.totalCommitted === 0 && data.cashAvailable === 0) return null;

  const ms = data.moduleSubmitted;
  const hasMarketingProjection = !ms.marketing;

  return (
    <Card className="bg-slate-800/60 border-slate-700/50 mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-400" />
          Complete Cost Picture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* ─── COMMITTED THIS ROUND ─── */}
        <div>
          <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1.5">
            Committed This Round {ms.rd || ms.factory || ms.supplyChain || ms.hr ? "(submitted)" : ""}
          </div>
          <div className="space-y-1">
            <CostRow label="R&D" amount={data.rdCommitted} submitted={ms.rd} />
            <CostRow
              label="Factory"
              amount={data.factoryCommitted}
              submitted={ms.factory}
              detail="machines + maintenance + upgrades"
            />
            <CostRow
              label="Materials"
              amount={data.supplyChainCommitted}
              submitted={ms.supplyChain}
              detail={data.supplyChainDetail || undefined}
            />
            <CostRow
              label="HR"
              amount={data.hrEstimated}
              submitted={ms.hr}
              detail="hiring fees + salaries"
            />
          </div>

          {/* Total committed line */}
          <div className="flex justify-between text-xs mt-1.5 pt-1.5 border-t border-slate-600/30">
            <span className="text-slate-400 font-medium">Total committed</span>
            <span className="text-slate-200 font-medium tabular-nums">
              -{formatMoney(data.totalCommitted)}
            </span>
          </div>
        </div>

        {/* ─── PROJECTED (Marketing) ─── */}
        {hasMarketingProjection && (
          <div>
            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1.5">
              Projected (not yet submitted)
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 flex items-center justify-center text-slate-600">~</span>
                <span className="text-slate-500">Marketing</span>
              </div>
              <span className="text-slate-500 tabular-nums">
                {data.marketingEstimated > 0
                  ? `-${formatMoney(data.marketingEstimated)}`
                  : "-$5M to -$15M (typical)"
                }
              </span>
            </div>
          </div>
        )}
        {!hasMarketingProjection && data.marketingEstimated > 0 && (
          <CostRow label="Marketing" amount={data.marketingEstimated} submitted={true} />
        )}

        {/* ─── RECURRING OBLIGATIONS ─── */}
        {data.recurringCosts > 0 && (
          <div>
            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1.5">
              Recurring Obligations
            </div>
            <div className="space-y-1">
              {data.recurringBreakdown.materials > 0 && (
                <RecurringRow label="Materials" amount={data.recurringBreakdown.materials} note="at current ordering rate" />
              )}
              {data.recurringBreakdown.salaries > 0 && (
                <RecurringRow label="Salaries" amount={data.recurringBreakdown.salaries} note="current headcount" />
              )}
              {data.recurringBreakdown.maintenance > 0 && (
                <RecurringRow label="Maintenance" amount={data.recurringBreakdown.maintenance} note="machine upkeep" />
              )}
              {data.recurringBreakdown.loanPayments > 0 && (
                <RecurringRow label="Loan payments" amount={data.recurringBreakdown.loanPayments} note="existing debt" />
              )}
            </div>
            <div className="flex justify-between text-xs mt-1.5 pt-1.5 border-t border-slate-600/30">
              <span className="text-slate-400 font-medium">Total recurring</span>
              <span className="text-slate-300 font-medium tabular-nums">
                ~{formatMoney(data.recurringCosts)}/round
              </span>
            </div>
          </div>
        )}

        {/* ─── CASH ANALYSIS ─── */}
        <div className="p-3 bg-slate-700/30 rounded-lg space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Cash available</span>
            <span className="text-emerald-400 font-medium tabular-nums">
              {formatMoney(data.cashAvailable)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">After this round&apos;s spending</span>
            <span className={cn(
              "font-medium tabular-nums",
              data.cashAfterSpending >= 0 ? "text-slate-200" : "text-red-400"
            )}>
              ~{formatMoney(data.cashAfterSpending)}
            </span>
          </div>
          {data.lastRevenue > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Revenue last round</span>
              <span className="text-slate-300 tabular-nums">
                {formatMoney(data.lastRevenue)}
              </span>
            </div>
          )}
          {data.recurringCosts > 0 && (
            <div className="flex justify-between text-xs pt-1 border-t border-slate-600/30">
              <span className="text-slate-400">Est. net cash flow</span>
              <span className={cn(
                "font-medium tabular-nums",
                data.netCashFlow >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {data.netCashFlow >= 0 ? "+" : ""}{formatMoney(data.netCashFlow)}/round
              </span>
            </div>
          )}
        </div>

        {/* ─── SUSTAINABILITY STATUS ─── */}
        {data.sustainabilityStatus === "sustainable" && data.recurringCosts > 0 && (
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-emerald-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Sustainable — revenue covers recurring costs
            </div>
          </div>
        )}

        {data.sustainabilityStatus === "burning" && (
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Burning cash — recurring costs exceed revenue by {formatMoney(data.burnRate)}/round
            </div>
            {data.runwayRounds > 0 && (
              <p className="text-[11px] text-amber-200/70 ml-5 mt-0.5">
                ~{data.runwayRounds} round{data.runwayRounds !== 1 ? "s" : ""} of runway at current burn rate
              </p>
            )}
          </div>
        )}

        {data.sustainabilityStatus === "critical" && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-red-300 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              Critical — cash may run out in ~{data.runwayRounds} round{data.runwayRounds !== 1 ? "s" : ""} at current burn rate
            </div>
          </div>
        )}

        {/* Shortfall warning */}
        {data.shortfall > 0 && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-red-300 font-medium mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              Shortfall: {formatMoney(data.shortfall)}
            </div>
            {data.suggestedAction && (
              <p className="text-[11px] text-red-200/80 ml-5">{data.suggestedAction}</p>
            )}
          </div>
        )}

        {/* Suggested action (when no shortfall but burning) */}
        {data.shortfall === 0 && data.suggestedAction && (
          <div className="p-2 bg-slate-700/20 rounded text-[11px] text-slate-400">
            {data.suggestedAction}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CostRow({
  label,
  amount,
  submitted,
  detail,
}: {
  label: string;
  amount: number;
  submitted: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-1.5 min-w-0">
        {submitted ? (
          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
        ) : (
          <span className="w-3 h-3 flex items-center justify-center text-slate-500 shrink-0">—</span>
        )}
        <span className={submitted ? "text-slate-300" : "text-slate-500"}>{label}</span>
        {detail && amount > 0 && (
          <span className="text-[10px] text-slate-600 truncate">({detail})</span>
        )}
      </div>
      <span className={cn("tabular-nums shrink-0", submitted ? "text-slate-200" : "text-slate-500")}>
        {amount > 0 ? `-${formatMoney(amount)}` : "—"}
      </span>
    </div>
  );
}

function RecurringRow({ label, amount, note }: { label: string; amount: number; note: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-1.5">
        <span className="text-slate-500">{label}</span>
        <span className="text-[10px] text-slate-600">({note})</span>
      </div>
      <span className="text-slate-400 tabular-nums">~{formatMoney(amount)}/round</span>
    </div>
  );
}

// =============================================================================
// Marketing Requirements Panel (shown on Marketing page)
// =============================================================================

export function MarketingRequirementsPanel({ data }: { data: MarketingRequirements }) {
  if (data.activeProducts.length === 0 && !data.brandBelowCriticalMass) {
    return (
      <Card className="bg-amber-500/5 border-amber-500/20 mb-4">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-amber-200 text-sm font-medium">No Launched Products</p>
              <p className="text-slate-400 text-xs mt-0.5">
                Marketing spend requires launched products. Complete R&D first, then return here to allocate marketing budget.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/60 border-slate-700/50 mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-pink-400" />
          Your Products Need Customers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Product segment info */}
        {data.activeProducts.map((p, i) => (
          <div key={i} className="p-3 bg-slate-700/30 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white font-medium">{p.name}</span>
              <Badge className="text-[10px] bg-slate-600 text-slate-300">
                {p.targetSegment}
              </Badge>
            </div>
            <div className="text-[11px] text-slate-400 mb-1">What matters to buyers:</div>
            <div className="space-y-1">
              {Object.entries(p.segmentWeights)
                .sort(([, a], [, b]) => b - a)
                .map(([key, weight]) => (
                  <WeightBar key={key} label={key} weight={weight} />
                ))}
            </div>
          </div>
        ))}

        {/* Brand warning */}
        {data.brandBelowCriticalMass && (
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Brand: {(data.brandValue * 100).toFixed(1)}% — below critical mass (15%)
            </div>
            <p className="text-[11px] text-amber-200/70 ml-5 mt-0.5">
              -30% market score penalty on ALL segments. Invest in branding.
            </p>
          </div>
        )}

        {/* ESG warning */}
        {data.esgBelowThreshold && (
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              ESG: {data.esgScore} — below 300 threshold
            </div>
            <p className="text-[11px] text-amber-200/70 ml-5 mt-0.5">
              Up to -12% revenue penalty. ESG matters most in Professional (20% weight).
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WeightBar({ label, weight }: { label: string; weight: number }) {
  const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-16 text-slate-400 shrink-0">{displayLabel}</span>
      <div className="flex-1 h-1.5 bg-slate-600/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-pink-500/60 rounded-full"
          style={{ width: `${weight}%` }}
        />
      </div>
      <span className="w-8 text-right text-slate-500 tabular-nums">{weight}%</span>
    </div>
  );
}

// =============================================================================
// Product Requirement Chain (shown on R&D Products tab)
// =============================================================================

export interface ProductChainMachine {
  type: string;
  name: string;
  cost: number;
  owned: boolean;
}

export interface ProductChainData {
  name: string;
  segment: string;
  kitName: string;
  kitCostPerUnit: number;
  materialCostPerUnit: number;
  materialBreakdown: Array<{ type: string; spec: string; costPerUnit: number }>;
  estimatedProduction: number;
  totalMaterialCost: number;
  scoringWeights: { price: number; quality: number; brand: number; esg: number; features: number };
  topFactor: string;
  requiredMachines: ProductChainMachine[];
  missingMachineCost: number;
  workersNeeded: number;
  machineCount: number;
  ongoingCostPerRound: number;
  firstRoundCost: number;
}

export function ProductRequirementChain({
  data,
  gameId,
}: {
  data: ProductChainData;
  gameId: string;
}) {
  const basePath = gameId === "demo" ? "/demo" : `/game/${gameId}`;
  const hasMissing = data.requiredMachines.some((m) => !m.owned);

  return (
    <Card className="bg-slate-800/60 border-slate-700/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-purple-400" />
          What &ldquo;{data.name}&rdquo; Needs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Kit + materials summary */}
        <div className="p-3 bg-slate-700/30 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-cyan-400">
              <Package className="w-3 h-3" />
              {data.kitName}
            </div>
            <span className="text-[11px] text-slate-400 tabular-nums">
              {formatMoney(data.kitCostPerUnit)}/unit
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
            {data.materialBreakdown.slice(0, 4).map((m, j) => (
              <div key={j} className="flex justify-between">
                <span className="capitalize">{m.type}:</span>
                <span className="tabular-nums">{formatMoney(m.costPerUnit)}</span>
              </div>
            ))}
            {data.materialBreakdown.length > 4 && (
              <span className="text-slate-600">+{data.materialBreakdown.length - 4} more</span>
            )}
          </div>
          <div className="flex justify-between text-[11px] pt-1 border-t border-slate-600/30">
            <span className="text-slate-400">
              Est. {data.estimatedProduction.toLocaleString()} units/round
            </span>
            <span className="text-cyan-400 font-medium tabular-nums">
              {formatMoney(data.totalMaterialCost)}/round
            </span>
          </div>
        </div>

        {/* Machine requirements */}
        {data.requiredMachines.length > 0 && (
          <div className="p-3 bg-slate-700/30 rounded-lg space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-orange-400">
              <Factory className="w-3 h-3" />
              Kit Requires
            </div>
            <div className="space-y-1">
              {data.requiredMachines.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    {m.owned ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-400" />
                    )}
                    <span className={m.owned ? "text-slate-300" : "text-red-300"}>
                      {m.name}
                    </span>
                  </div>
                  <span className={cn("tabular-nums", m.owned ? "text-slate-500" : "text-red-300")}>
                    {formatMoney(m.cost)}
                  </span>
                </div>
              ))}
            </div>
            {data.missingMachineCost > 0 && (
              <div className="flex justify-between text-[11px] pt-1 border-t border-slate-600/30">
                <span className="text-red-300 font-medium">Missing machines</span>
                <span className="text-red-300 font-medium tabular-nums">
                  {formatMoney(data.missingMachineCost)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Staff needed */}
        <div className="p-3 bg-slate-700/30 rounded-lg space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-blue-400">
            <Users className="w-3 h-3" />
            Staff Needed
          </div>
          <div className="text-[11px] text-slate-400">
            {data.workersNeeded} workers for {data.machineCount} machine{data.machineCount !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Cost summary */}
        <div className="p-3 bg-slate-700/30 rounded-lg space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <DollarSign className="w-3 h-3" />
            Cost to Bring to Market
          </div>
          {data.missingMachineCost > 0 && (
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Missing machines (one-time)</span>
              <span className="text-slate-300 tabular-nums">{formatMoney(data.missingMachineCost)}</span>
            </div>
          )}
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">Materials/round</span>
            <span className="text-slate-300 tabular-nums">{formatMoney(data.totalMaterialCost)}</span>
          </div>
          <div className="flex justify-between text-[11px] pt-1 border-t border-slate-600/30">
            <span className="text-emerald-300 font-medium">First round total</span>
            <span className="text-emerald-300 font-medium tabular-nums">
              ~{formatMoney(data.firstRoundCost)}
            </span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">Ongoing</span>
            <span className="text-slate-400 tabular-nums">
              ~{formatMoney(data.ongoingCostPerRound)}/round
            </span>
          </div>
        </div>

        {/* Segment scoring weights */}
        <div className="p-3 bg-slate-700/30 rounded-lg space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-pink-400">
            <Megaphone className="w-3 h-3" />
            {data.segment} Buyers Care About
          </div>
          {Object.entries(data.scoringWeights)
            .sort(([, a], [, b]) => b - a)
            .map(([key, weight]) => (
              <div key={key} className="flex items-center gap-2 text-[11px]">
                <span className="w-14 text-slate-400 capitalize shrink-0">{key}</span>
                <div className="flex-1 h-1.5 bg-slate-600/50 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      key === data.topFactor ? "bg-pink-500/80" : "bg-slate-500/60"
                    )}
                    style={{ width: `${weight}%` }}
                  />
                </div>
                <span className="w-8 text-right text-slate-500 tabular-nums">{weight}%</span>
              </div>
            ))}
        </div>

        {/* Warning if missing machines */}
        {hasMissing && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-red-300">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Missing machines will block production of this product</span>
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="flex gap-2">
          <Link
            href={`${basePath}/supply-chain`}
            className="flex-1 flex items-center justify-center gap-1 p-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 bg-cyan-500/5 hover:bg-cyan-500/10 rounded transition-colors"
          >
            Source Materials <ArrowRight className="w-2.5 h-2.5" />
          </Link>
          <Link
            href={`${basePath}/factory`}
            className="flex-1 flex items-center justify-center gap-1 p-1.5 text-[11px] text-orange-400 hover:text-orange-300 bg-orange-500/5 hover:bg-orange-500/10 rounded transition-colors"
          >
            Set Up Factory <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Produceable Capacity Panel (shown on Marketing page)
// =============================================================================

export function ProduceableCapacityPanel({ data }: { data: ProduceableCapacityData }) {
  if (data.segments.length === 0) return null;
  if (!data.hasBlockedSegments) return null;

  return (
    <Card className="bg-slate-800/60 border-slate-700/50 mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Factory className="w-4 h-4 text-amber-400" />
          Production Readiness
          {data.hasBlockedSegments && (
            <Badge className="text-[10px] bg-red-500/20 text-red-400 ml-auto">
              <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
              Blocked
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.segments.map((s, i) => (
          <div key={i} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              {s.canProduce ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              )}
              <div>
                <span className="text-slate-200 font-medium">{s.productName}</span>
                <span className="text-slate-500 ml-1.5">({s.segment})</span>
              </div>
            </div>
            {s.canProduce ? (
              <span className="text-emerald-400 text-[11px]">Ready</span>
            ) : (
              <span className="text-red-300 text-[11px]">{s.blockedReason}</span>
            )}
          </div>
        ))}

        {data.hasBlockedSegments && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-start gap-2 text-xs text-red-300">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
              <span>
                Advertising blocked products will have NO return this round.
                Buy the missing machines in Factory first.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Utility
// =============================================================================

function PriorityIcon({ priority }: { priority: "essential" | "recommended" | "optional" }) {
  switch (priority) {
    case "essential":
      return <XCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />;
    case "recommended":
      return <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />;
    case "optional":
      return <Info className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />;
  }
}
