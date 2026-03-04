"use client";

import { useMemo } from "react";
import { useDecisionStore } from "@/lib/stores/decisionStore";
import { CONSTANTS } from "@/engine/types";
import type { TeamState, Segment } from "@/engine/types";
import { BRAND_ACTIVITY_MAP } from "@/lib/converters/decisionConverters";
import { MaterialEngine } from "@/engine/materials";
import { getKit, getKitForSegment } from "@/engine/materials/KitCatalog";
import { getKitSupplier } from "@/engine/materials/SupplierCatalog";
import { getMachineConfig } from "@/engine/machinery/MachineCatalog";

// =============================================================================
// Types
// =============================================================================

export interface FactoryRequirements {
  productsToManufacture: Array<{
    name: string;
    segment: string;
    qualityTarget: number;
    capacityNeeded: number;
    isLaunched: boolean;
    recommendedMachines: Array<{
      type: string;
      reason: string;
      cost: number;
      priority: "essential" | "recommended" | "optional";
      owned: boolean;
    }>;
    // Kit info
    kitName: string;
    kitInventory: number;
    kitNeededPerRound: number;
    // Machine readiness
    hasMissingEssential: boolean;
  }>;
  totalCapacityNeeded: number;
  currentCapacity: number;
  capacityGap: number;
  usingActualShare: boolean;
  // Staffing context
  workerGap: number;
  workersNeeded: number;
  workersHave: number;
}

export interface HRRequirements {
  workersNeeded: number;
  workersHave: number;
  workerGap: number;
  supervisorsNeeded: number;
  supervisorsHave: number;
  supervisorGap: number;
  engineersNeeded: number;
  engineersHave: number;
  engineerGap: number;
  hasAutomation: boolean;
  automationReduction: number;
  totalMachines: number;
  notes: string[];
}

export interface MaterialRequirements {
  productMaterials: Array<{
    name: string;
    segment: string;
    costPerUnit: number;
    estimatedProduction: number;
    totalCost: number;
    materialBreakdown: Array<{
      type: string;
      spec: string;
      costPerUnit: number;
    }>;
  }>;
  totalMaterialCost: number;
  inventoryValue: number;
  activeOrderCount: number;
  roundsCoveredEstimate: number;
  warnings: string[];
}

export interface FinanceRequirements {
  rdCommitted: number;
  factoryCommitted: number;
  hrEstimated: number;
  marketingEstimated: number;
  materialEstimated: number;
  totalCommitted: number;
  cashAvailable: number;
  shortfall: number;
  recurringCosts: number;
  suggestedAction: string | null;

  // Module submission status (true = submitted/committed)
  moduleSubmitted: {
    rd: boolean;
    factory: boolean;
    supplyChain: boolean;
    hr: boolean;
    marketing: boolean;
  };

  // Supply chain committed cost (actual kit orders this round)
  supplyChainCommitted: number;
  supplyChainDetail: string; // e.g., "8,000 Professional Kits + 40,000 Budget Kits"

  // Recurring cost breakdown
  recurringBreakdown: {
    salaries: number;
    materials: number;
    maintenance: number;
    loanPayments: number;
  };

  // Revenue & sustainability
  lastRevenue: number;
  netCashFlow: number;
  sustainabilityStatus: "sustainable" | "burning" | "critical";
  burnRate: number;
  runwayRounds: number;
  cashAfterSpending: number;
}

export interface MarketingRequirements {
  activeProducts: Array<{
    name: string;
    targetSegment: string;
    segmentWeights: {
      price: number;
      quality: number;
      brand: number;
      esg: number;
      features: number;
    };
  }>;
  brandValue: number;
  brandBelowCriticalMass: boolean;
  esgScore: number;
  esgBelowThreshold: boolean;
}

// Machine cost lookup (simplified from catalog)
const MACHINE_COSTS: Record<string, number> = {
  assembly_line: 5_000_000,
  cnc_machine: 8_000_000,
  welding_station: 4_000_000,
  injection_molder: 7_000_000,
  pcb_assembler: 10_000_000,
  paint_booth: 3_000_000,
  laser_cutter: 6_000_000,
  robotic_arm: 12_000_000,
  conveyor_system: 3_000_000,
  quality_scanner: 6_000_000,
  testing_rig: 4_000_000,
  "3d_printer": 2_000_000,
  clean_room_unit: 15_000_000,
  packaging_system: 2_500_000,
  forklift_fleet: 1_000_000,
};

// Segment demand estimates (units per round)
const SEGMENT_DEMAND: Record<string, number> = {
  Budget: 500_000,
  General: 400_000,
  Enthusiast: 200_000,
  Professional: 100_000,
  "Active Lifestyle": 150_000,
};

// =============================================================================
// Factory Requirements (from R&D decisions)
// =============================================================================

export interface FactoryRequirementsOptions {
  marketState?: { demandBySegment?: Record<string, { totalDemand: number }> } | null;
  numberOfTeams?: number;
  currentRound?: number;
}

export function useFactoryRequirements(
  state: TeamState | null,
  options?: FactoryRequirementsOptions
): FactoryRequirements {
  const rd = useDecisionStore((s) => s.rd);
  const factory = useDecisionStore((s) => s.factory);

  return useMemo(() => {
    const empty: FactoryRequirements = {
      productsToManufacture: [],
      totalCapacityNeeded: 0,
      currentCapacity: 0,
      capacityGap: 0,
      usingActualShare: false,
      workerGap: 0,
      workersNeeded: 0,
      workersHave: 0,
    };

    if (!state) return empty;

    const numberOfTeams = options?.numberOfTeams ?? 4;
    const currentRound = options?.currentRound ?? 1;
    const usingActualShare = currentRound > 1;

    // Current capacity from production lines
    const currentCapacity = state.factories?.reduce((sum, f) => {
      const lineCapacity = (f.productionLines ?? []).reduce(
        (lsum: number, line: { capacity?: number }) => lsum + (line.capacity ?? 0),
        0
      );
      return sum + lineCapacity;
    }, 0) ?? 0;

    // Compute owned machine counts for readiness checks (count-based)
    const ownedCounts: Record<string, number> = {};
    if (state.machineryStates) {
      for (const ms of Object.values(state.machineryStates)) {
        for (const m of ms.machines ?? []) {
          ownedCounts[m.type] = (ownedCounts[m.type] ?? 0) + 1;
        }
      }
    }
    // Include pending purchases in the available pool
    for (const up of factory.upgradePurchases ?? []) {
      ownedCounts[up.upgradeName] = (ownedCounts[up.upgradeName] ?? 0) + 1;
    }
    // Depleting pool: as each product claims machines, they're removed from the pool
    const availablePool = { ...ownedCounts };
    // Legacy boolean set for backward compat with getRecommendedMachines
    const owned = new Set<string>(Object.keys(ownedCounts));

    // Staffing context (inline calculation — mirrors useHRRequirements logic)
    let totalMachines = 0;
    let hasAutomation = false;
    for (const f of state.factories ?? []) {
      const ms = state.machineryStates?.[f.id];
      totalMachines += (ms?.machines ?? []).length;
      if ((f.upgrades ?? []).includes("automation")) hasAutomation = true;
    }
    // Count new machine purchases from factory decisions
    const MACHINE_TYPE_SET = new Set([
      "assembly_line", "cnc_machine", "robotic_arm", "conveyor_system",
      "quality_scanner", "3d_printer", "welding_station", "packaging_system",
      "injection_molder", "pcb_assembler", "paint_booth", "laser_cutter",
      "testing_rig", "clean_room_unit", "forklift_fleet",
    ]);
    for (const up of factory.upgradePurchases ?? []) {
      if (MACHINE_TYPE_SET.has(up.upgradeName)) totalMachines++;
      if (up.upgradeName === "automation") hasAutomation = true;
    }
    let workersNeeded = Math.ceil(totalMachines * CONSTANTS.WORKERS_PER_MACHINE);
    if (hasAutomation) workersNeeded = Math.ceil(workersNeeded * 0.2);
    const workersHave = (state.employees ?? []).filter(e => e.role === "worker").length;
    const workerGap = Math.max(0, workersNeeded - workersHave);

    // Products from existing launched + in-development + new R&D decisions
    const products: FactoryRequirements["productsToManufacture"] = [];
    let totalCapacityNeeded = 0;

    // Helper: compute demand-based capacity for a segment
    function getCapacityNeeded(segment: string, isNew: boolean): number {
      const dynamicDemand = options?.marketState?.demandBySegment?.[segment]?.totalDemand;
      const demand = dynamicDemand ?? SEGMENT_DEMAND[segment] ?? 200_000;
      let share: number;
      if (isNew) {
        share = 1 / numberOfTeams;
      } else {
        const ms = state!.marketShare;
        const actualShare = ms?.[segment as keyof typeof ms];
        share = usingActualShare && actualShare != null
          ? actualShare
          : 1 / numberOfTeams;
      }
      return Math.ceil(demand * Math.max(share, 0.01));
    }

    // Existing launched products
    for (const p of state.products ?? []) {
      if (p.developmentStatus !== "launched") continue;
      const segment = p.segment || "General";
      const capacityNeeded = getCapacityNeeded(segment, false);
      totalCapacityNeeded += capacityNeeded;

      const kit = getKitForSegment(segment);
      const recs = getRecommendedMachines(p.quality ?? 50, segment, state, availablePool);
      const hasMissingEssential = recs.some(r => r.priority === "essential");

      products.push({
        name: p.name || "Launched Product",
        segment,
        qualityTarget: p.quality ?? 50,
        capacityNeeded,
        isLaunched: true,
        recommendedMachines: recs,
        kitName: kit?.name ?? `${segment} Kit`,
        kitInventory: state.kitInventory?.[kit?.id ?? ""] ?? 0,
        kitNeededPerRound: capacityNeeded,
        hasMissingEssential,
      });
    }

    // In-development products (show for awareness, but don't add to capacity)
    for (const p of state.products ?? []) {
      if (p.developmentStatus !== "in_development") continue;
      const segment = p.segment || "General";
      const kit = getKitForSegment(segment);
      const recs = getRecommendedMachines(p.targetQuality ?? 50, segment, state, availablePool);
      const hasMissingEssential = recs.some(r => r.priority === "essential");

      products.push({
        name: p.name || "Developing Product",
        segment,
        qualityTarget: p.targetQuality ?? 50,
        capacityNeeded: 0, // Not producing yet
        isLaunched: false,
        recommendedMachines: recs,
        kitName: kit?.name ?? `${segment} Kit`,
        kitInventory: state.kitInventory?.[kit?.id ?? ""] ?? 0,
        kitNeededPerRound: 0,
        hasMissingEssential,
      });
    }

    // New products from R&D decisions (queued this round)
    for (const p of rd.newProducts ?? []) {
      const segment = p.segment || "General";
      const kit = getKitForSegment(segment);
      const recs = getRecommendedMachines(p.qualityTarget ?? 50, segment, state, availablePool);
      const hasMissingEssential = recs.some(r => r.priority === "essential");

      products.push({
        name: p.name || "New Product",
        segment,
        qualityTarget: p.qualityTarget ?? 50,
        capacityNeeded: 0, // Not producing yet
        isLaunched: false,
        recommendedMachines: recs,
        kitName: kit?.name ?? `${segment} Kit`,
        kitInventory: state.kitInventory?.[kit?.id ?? ""] ?? 0,
        kitNeededPerRound: 0,
        hasMissingEssential,
      });
    }

    return {
      productsToManufacture: products,
      totalCapacityNeeded,
      currentCapacity,
      capacityGap: Math.max(0, totalCapacityNeeded - currentCapacity),
      usingActualShare,
      workerGap,
      workersNeeded,
      workersHave,
    };
  }, [rd, factory, state, options?.marketState, options?.numberOfTeams, options?.currentRound]);
}

function getRecommendedMachines(
  qualityTarget: number,
  segment: string,
  state: TeamState,
  availablePool?: Record<string, number>
): FactoryRequirements["productsToManufacture"][0]["recommendedMachines"] {
  // If a pool is provided, use it (count-based, depleting). Otherwise, fall back to boolean set.
  const pool = availablePool;
  const ownedSet = new Set<string>();
  if (!pool) {
    if (state.machineryStates) {
      for (const ms of Object.values(state.machineryStates)) {
        for (const m of ms.machines ?? []) {
          ownedSet.add(m.type);
        }
      }
    }
  }

  // Helper: check if machine is available (claims from pool if so)
  function isOwned(machineType: string): boolean {
    if (pool) {
      return (pool[machineType] ?? 0) > 0;
    }
    return ownedSet.has(machineType);
  }
  // Helper: claim a machine from the pool (call after determining ownership for this product)
  function claimFromPool(machineType: string) {
    if (pool && (pool[machineType] ?? 0) > 0) {
      pool[machineType]--;
    }
  }

  const recs: FactoryRequirements["productsToManufacture"][0]["recommendedMachines"] = [];

  // Kit-required machines — ESSENTIAL (without them, production = 0)
  // Show ALL kit-required machines (owned and missing) so players see the full picture
  const kit = getKitForSegment(segment);
  if (kit) {
    for (const mt of kit.requiredMachines) {
      const config = getMachineConfig(mt);
      const available = isOwned(mt);
      recs.push({
        type: config?.name ?? mt.replace(/_/g, " "),
        cost: config?.baseCost ?? MACHINE_COSTS[mt] ?? 5_000_000,
        reason: available ? "ready" : `processes ${kit.name} components — without this: production = 0`,
        priority: "essential",
        owned: available,
      });
      // Claim from pool so next product won't see this machine as available
      if (available) claimFromPool(mt);
    }
  }

  // High quality (>85) needs defect reduction
  if (qualityTarget > 85) {
    if (!kit?.requiredMachines.includes("clean_room_unit")) {
      const available = isOwned("clean_room_unit");
      recs.push({
        type: "Clean Room Unit",
        cost: MACHINE_COSTS.clean_room_unit,
        reason: "Quality target >85 requires ultra-low defect rate",
        priority: "essential",
        owned: available,
      });
      if (available) claimFromPool("clean_room_unit");
    }
    if (!kit?.requiredMachines.includes("quality_scanner")) {
      const available = isOwned("quality_scanner");
      recs.push({
        type: "Quality Scanner",
        cost: MACHINE_COSTS.quality_scanner,
        reason: "-3% defects, critical for premium products",
        priority: "recommended",
        owned: available,
      });
      if (available) claimFromPool("quality_scanner");
    }
  }

  // High volume (Budget/General) needs capacity
  if (segment === "Budget" || segment === "General") {
    if (!kit?.requiredMachines.includes("assembly_line")) {
      const available = isOwned("assembly_line");
      recs.push({
        type: "Assembly Line",
        cost: MACHINE_COSTS.assembly_line,
        reason: "+10,000 capacity for volume manufacturing",
        priority: "essential",
        owned: available,
      });
      if (available) claimFromPool("assembly_line");
    }
    if (!isOwned("conveyor_system")) {
      recs.push({
        type: "Conveyor System",
        cost: MACHINE_COSTS.conveyor_system,
        reason: "+15,000 capacity, -8% labor",
        priority: "recommended",
        owned: false,
      });
    }
  }

  // Precision segments need PCB assembler
  if ((segment === "Enthusiast" || segment === "Professional") && !kit?.requiredMachines.includes("pcb_assembler")) {
    if (!isOwned("pcb_assembler")) {
      recs.push({
        type: "PCB Assembler",
        cost: MACHINE_COSTS.pcb_assembler,
        reason: "-1.5% defects, -15% labor for precision manufacturing",
        priority: "recommended",
        owned: false,
      });
    }
  }

  // Medium quality (>65) benefits from CNC
  if (qualityTarget > 65 && !isOwned("cnc_machine") && !kit?.requiredMachines.includes("cnc_machine")) {
    recs.push({
      type: "CNC Machine",
      cost: MACHINE_COSTS.cnc_machine,
      reason: "-1% defects, -10% labor — good for mid-to-high quality",
      priority: "optional",
      owned: false,
    });
  }

  return recs;
}

// =============================================================================
// Material Requirements (from products + inventory)
// =============================================================================

export function useMaterialRequirements(state: TeamState | null): MaterialRequirements {
  return useMemo(() => {
    const empty: MaterialRequirements = {
      productMaterials: [],
      totalMaterialCost: 0,
      inventoryValue: 0,
      activeOrderCount: 0,
      roundsCoveredEstimate: 0,
      warnings: [],
    };
    if (!state) return empty;

    const productMaterials: MaterialRequirements["productMaterials"] = [];
    let totalMaterialCost = 0;

    // Calculate material costs per launched product
    for (const p of state.products ?? []) {
      if (p.developmentStatus !== "launched") continue;
      const segment = p.segment as Segment;
      const segReqs = MaterialEngine.SEGMENT_MATERIAL_REQUIREMENTS[segment];
      if (!segReqs) continue;

      const demand = SEGMENT_DEMAND[segment] ?? 200_000;
      const share = state.marketShare?.[segment] ?? 0.05;
      const estimatedProduction = Math.ceil(demand * Math.max(share, 0.05));
      const cost = segReqs.totalCost * estimatedProduction;

      productMaterials.push({
        name: p.name,
        segment: p.segment,
        costPerUnit: segReqs.totalCost,
        estimatedProduction,
        totalCost: cost,
        materialBreakdown: segReqs.materials.map((m) => ({
          type: m.type,
          spec: m.spec,
          costPerUnit: m.costPerUnit,
        })),
      });
      totalMaterialCost += cost;
    }

    // Inventory info
    const inventoryValue = state.materials?.totalInventoryValue ?? 0;
    const activeOrderCount = state.materials?.activeOrders?.length ?? 0;

    // Estimate rounds covered by current inventory
    let roundsCoveredEstimate = 0;
    if (totalMaterialCost > 0 && inventoryValue > 0) {
      roundsCoveredEstimate = Math.floor(inventoryValue / totalMaterialCost);
    }

    // Warnings
    const warnings: string[] = [];
    if (productMaterials.length > 0 && inventoryValue === 0 && activeOrderCount === 0) {
      warnings.push("No materials in inventory and no active orders. Production will be limited.");
    } else if (roundsCoveredEstimate < 1 && productMaterials.length > 0) {
      warnings.push("Current inventory may not cover this round's production. Order more materials.");
    }

    return {
      productMaterials,
      totalMaterialCost,
      inventoryValue,
      activeOrderCount,
      roundsCoveredEstimate,
      warnings,
    };
  }, [state]);
}

// =============================================================================
// HR Requirements (from Factory decisions + state)
// =============================================================================

export function useHRRequirements(state: TeamState | null): HRRequirements {
  const factory = useDecisionStore((s) => s.factory);

  return useMemo(() => {
    const empty: HRRequirements = {
      workersNeeded: 0, workersHave: 0, workerGap: 0,
      supervisorsNeeded: 0, supervisorsHave: 0, supervisorGap: 0,
      engineersNeeded: 0, engineersHave: 0, engineerGap: 0,
      hasAutomation: false, automationReduction: 0, totalMachines: 0, notes: [],
    };
    if (!state) return empty;

    // Count current machines + newly purchased
    let totalMachines = 0;
    let hasAutomation = false;

    for (const f of state.factories ?? []) {
      // Count machines from machineryStates
      const ms = state.machineryStates?.[f.id];
      totalMachines += (ms?.machines ?? []).length;
      if ((f.upgrades ?? []).includes("automation")) hasAutomation = true;
    }

    // Count new machine purchases from factory decisions
    const MACHINE_TYPES = new Set([
      "assembly_line", "cnc_machine", "robotic_arm", "conveyor_system",
      "quality_scanner", "3d_printer", "welding_station", "packaging_system",
      "injection_molder", "pcb_assembler", "paint_booth", "laser_cutter",
      "testing_rig", "clean_room_unit", "forklift_fleet",
    ]);
    for (const up of factory.upgradePurchases ?? []) {
      if (MACHINE_TYPES.has(up.upgradeName)) totalMachines++;
      if (up.upgradeName === "automation") hasAutomation = true;
    }

    // Worker calculation
    let rawWorkersNeeded = Math.ceil(totalMachines * CONSTANTS.WORKERS_PER_MACHINE);
    const automationReduction = hasAutomation ? 0.8 : 0;
    if (hasAutomation) rawWorkersNeeded = Math.ceil(rawWorkersNeeded * 0.2);

    const supervisorsNeeded = Math.ceil(rawWorkersNeeded / CONSTANTS.WORKERS_PER_SUPERVISOR);
    const engineersNeeded = Math.max(2, Math.ceil((state.rdBudget ?? 0) / 2_000_000));

    // Current counts
    let workersHave = 0, supervisorsHave = 0, engineersHave = 0;
    for (const emp of state.employees ?? []) {
      if (emp.role === "worker") workersHave++;
      else if (emp.role === "supervisor") supervisorsHave++;
      else if (emp.role === "engineer") engineersHave++;
    }

    const notes: string[] = [];
    if (hasAutomation) {
      notes.push(`Automation upgrade active: worker need reduced by 80% (from ${Math.ceil(totalMachines * CONSTANTS.WORKERS_PER_MACHINE)} to ${rawWorkersNeeded})`);
    }
    if (rawWorkersNeeded > workersHave) {
      notes.push(`Hire ${rawWorkersNeeded - workersHave} more workers to run all machines at capacity`);
    }
    if (supervisorsNeeded > supervisorsHave) {
      notes.push(`Need ${supervisorsNeeded - supervisorsHave} more supervisor(s) — 1 per ${CONSTANTS.WORKERS_PER_SUPERVISOR} workers`);
    }

    return {
      workersNeeded: rawWorkersNeeded,
      workersHave,
      workerGap: Math.max(0, rawWorkersNeeded - workersHave),
      supervisorsNeeded,
      supervisorsHave,
      supervisorGap: Math.max(0, supervisorsNeeded - supervisorsHave),
      engineersNeeded,
      engineersHave,
      engineerGap: Math.max(0, engineersNeeded - engineersHave),
      hasAutomation,
      automationReduction,
      totalMachines,
      notes,
    };
  }, [factory, state]);
}

// =============================================================================
// Finance Requirements (from all upstream decisions)
// =============================================================================

export function useFinanceRequirements(state: TeamState | null): FinanceRequirements {
  const rd = useDecisionStore((s) => s.rd);
  const factory = useDecisionStore((s) => s.factory);
  const hr = useDecisionStore((s) => s.hr);
  const marketing = useDecisionStore((s) => s.marketing);
  const supplyChain = useDecisionStore((s) => s.supplyChain);
  const submissionStatus = useDecisionStore((s) => s.submissionStatus);

  return useMemo(() => {
    const empty: FinanceRequirements = {
      rdCommitted: 0, factoryCommitted: 0, hrEstimated: 0, marketingEstimated: 0, materialEstimated: 0,
      totalCommitted: 0, cashAvailable: 0, shortfall: 0, recurringCosts: 0,
      suggestedAction: null,
      moduleSubmitted: { rd: false, factory: false, supplyChain: false, hr: false, marketing: false },
      supplyChainCommitted: 0, supplyChainDetail: "",
      recurringBreakdown: { salaries: 0, materials: 0, maintenance: 0, loanPayments: 0 },
      lastRevenue: 0, netCashFlow: 0, sustainabilityStatus: "sustainable",
      burnRate: 0, runwayRounds: 0, cashAfterSpending: 0,
    };
    if (!state) return empty;

    // Module submission status
    const moduleSubmitted = {
      rd: submissionStatus.RD?.isSubmitted ?? false,
      factory: submissionStatus.FACTORY?.isSubmitted ?? false,
      supplyChain: submissionStatus.SUPPLY_CHAIN?.isSubmitted ?? false,
      hr: submissionStatus.HR?.isSubmitted ?? false,
      marketing: submissionStatus.MARKETING?.isSubmitted ?? false,
    };

    const rdCommitted = rd.rdInvestment ?? 0;

    // Factory costs
    let factoryCommitted = 0;
    const eff = factory.efficiencyInvestment;
    factoryCommitted += (eff?.workers ?? 0) + (eff?.engineers ?? 0) + (eff?.equipment ?? 0);
    factoryCommitted += factory.esgInvestment ?? 0;
    factoryCommitted += (factory.newFactories?.length ?? 0) * CONSTANTS.NEW_FACTORY_COST;
    for (const up of factory.upgradePurchases ?? []) {
      const cost = (CONSTANTS.UPGRADE_COSTS as Record<string, number>)[up.upgradeName] ?? MACHINE_COSTS[up.upgradeName] ?? 0;
      factoryCommitted += cost;
    }

    // Supply chain costs (actual kit orders this round)
    let supplyChainCommitted = 0;
    const scParts: string[] = [];
    for (const order of supplyChain.orders ?? []) {
      const kit = getKit(order.kitId);
      const supplier = getKitSupplier(order.supplierId);
      const unitCost = (kit?.baseCostPerUnit ?? 0) * (supplier?.costMultiplier ?? 1);
      const orderCost = unitCost * order.quantity;
      supplyChainCommitted += orderCost;
      const kitName = kit?.name ?? order.kitId;
      scParts.push(`${order.quantity.toLocaleString()} ${kitName}`);
    }
    const supplyChainDetail = scParts.join(" + ");

    // HR estimate (hiring fees — one-time cost)
    let hrEstimated = 0;
    for (const hire of hr.hires ?? []) {
      const salary = hire.candidateData?.salary ?? 45_000;
      hrEstimated += salary * CONSTANTS.HIRING_COST_MULTIPLIER;
    }

    // Marketing costs
    let marketingEstimated = 0;
    if (marketing.adBudgets) {
      for (const channels of Object.values(marketing.adBudgets)) {
        for (const amount of Object.values(channels as Record<string, number>)) {
          marketingEstimated += amount;
        }
      }
    }
    marketingEstimated += marketing.brandInvestment ?? 0;
    for (const actId of marketing.brandActivities ?? []) {
      marketingEstimated += BRAND_ACTIVITY_MAP[actId]?.cost ?? 0;
    }

    // Material cost estimate (recurring every round of production)
    let materialEstimated = 0;
    for (const p of state.products ?? []) {
      if (p.developmentStatus !== "launched") continue;
      const segment = p.segment as Segment;
      const segReqs = MaterialEngine.SEGMENT_MATERIAL_REQUIREMENTS[segment];
      if (!segReqs) continue;
      const demand = SEGMENT_DEMAND[segment] ?? 200_000;
      const share = state.marketShare?.[segment] ?? 0.05;
      const estimatedProduction = Math.ceil(demand * Math.max(share, 0.05));
      materialEstimated += segReqs.totalCost * estimatedProduction;
    }

    const totalCommitted = rdCommitted + factoryCommitted + supplyChainCommitted + hrEstimated;
    const cashAvailable = state.cash ?? 0;
    const cashAfterSpending = cashAvailable - totalCommitted - marketingEstimated;
    const shortfall = Math.max(0, totalCommitted + marketingEstimated - cashAvailable);

    // Recurring obligations breakdown
    const salaries = state.workforce?.laborCost ?? 0;
    const maintenance = state.maintenanceSpend ?? 0;

    // Loan payments: sum interest on active debt instruments
    let loanPayments = 0;
    for (const debt of state.debts ?? []) {
      // Per-round payment: principal / remaining rounds + interest per round
      const interestPerRound = (debt.remainingPrincipal * debt.interestRate) / 100 / 4; // ~4 rounds/year
      const principalPerRound = debt.remainingRounds > 0 ? debt.remainingPrincipal / debt.remainingRounds : 0;
      loanPayments += interestPerRound + principalPerRound;
    }

    const recurringBreakdown = {
      salaries,
      materials: materialEstimated,
      maintenance,
      loanPayments,
    };
    const recurringCosts = salaries + materialEstimated + maintenance + loanPayments;

    // Revenue & sustainability
    const lastRevenue = state.revenue ?? 0;
    const netCashFlow = lastRevenue - recurringCosts;

    let sustainabilityStatus: "sustainable" | "burning" | "critical";
    let burnRate = 0;
    let runwayRounds = 0;

    if (netCashFlow >= 0) {
      sustainabilityStatus = "sustainable";
    } else {
      burnRate = Math.abs(netCashFlow);
      const projectedCash = cashAfterSpending > 0 ? cashAfterSpending : cashAvailable - totalCommitted;
      runwayRounds = projectedCash > 0 ? Math.floor(projectedCash / burnRate) : 0;
      sustainabilityStatus = runwayRounds <= 3 ? "critical" : "burning";
    }

    let suggestedAction: string | null = null;
    if (shortfall > 0) {
      if (shortfall < 20_000_000) {
        suggestedAction = `Consider issuing $${(shortfall / 1_000_000).toFixed(0)}M in corporate bonds to cover the shortfall.`;
      } else {
        suggestedAction = `Significant shortfall of $${(shortfall / 1_000_000).toFixed(0)}M. Consider a mix of bonds and stock issuance.`;
      }
    } else if (sustainabilityStatus === "critical") {
      suggestedAction = `Cash may run out in ~${runwayRounds} round${runwayRounds !== 1 ? "s" : ""}. Raise capital now.`;
    } else if (sustainabilityStatus === "burning") {
      suggestedAction = `Recurring costs exceed revenue by ${fmtMoney(burnRate)}/round. Consider raising capital or cutting costs.`;
    }

    return {
      rdCommitted, factoryCommitted, hrEstimated, marketingEstimated, materialEstimated,
      totalCommitted, cashAvailable, shortfall, recurringCosts, suggestedAction,
      moduleSubmitted, supplyChainCommitted, supplyChainDetail,
      recurringBreakdown, lastRevenue, netCashFlow, sustainabilityStatus,
      burnRate, runwayRounds, cashAfterSpending,
    };
  }, [rd, factory, hr, marketing, supplyChain, submissionStatus, state]);
}

function fmtMoney(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

// =============================================================================
// Marketing Requirements (from product/brand/ESG state)
// =============================================================================

export function useMarketingRequirements(state: TeamState | null): MarketingRequirements {
  return useMemo(() => {
    const empty: MarketingRequirements = {
      activeProducts: [],
      brandValue: 0,
      brandBelowCriticalMass: false,
      esgScore: 0,
      esgBelowThreshold: false,
    };
    if (!state) return empty;

    const activeProducts = (state.products ?? [])
      .filter((p) => p.developmentStatus === "launched")
      .map((p) => {
        const seg = p.segment as keyof typeof CONSTANTS.SEGMENT_WEIGHTS;
        const weights = CONSTANTS.SEGMENT_WEIGHTS[seg] ?? {
          price: 20, quality: 20, brand: 20, esg: 20, features: 20,
        };
        return {
          name: p.name,
          targetSegment: p.segment,
          segmentWeights: weights,
        };
      });

    const brandValue = state.brandValue ?? 0;
    const esgScore = state.esgScore ?? 0;

    return {
      activeProducts,
      brandValue,
      brandBelowCriticalMass: brandValue < 0.15,
      esgScore,
      esgBelowThreshold: esgScore < 300,
    };
  }, [state]);
}

// =============================================================================
// Produceable Capacity (shown on Marketing page, per-segment production status)
// =============================================================================

export interface SegmentCapacity {
  segment: string;
  productName: string;
  canProduce: boolean;
  blockedReason: string | null;   // e.g., "missing Clean Room"
  missingMachines: string[];
}

export interface ProduceableCapacityData {
  segments: SegmentCapacity[];
  hasBlockedSegments: boolean;
}

export function useProduceableCapacity(state: TeamState | null): ProduceableCapacityData {
  return useMemo(() => {
    const empty: ProduceableCapacityData = { segments: [], hasBlockedSegments: false };
    if (!state) return empty;

    // Owned machine types across all factories
    const ownedTypes = new Set<string>();
    if (state.machineryStates) {
      for (const ms of Object.values(state.machineryStates)) {
        for (const m of ms.machines ?? []) {
          ownedTypes.add(m.type);
        }
      }
    }

    const segments: SegmentCapacity[] = [];
    for (const p of state.products ?? []) {
      if (p.developmentStatus !== "launched") continue;
      const kit = getKitForSegment(p.segment);
      if (!kit) {
        segments.push({
          segment: p.segment,
          productName: p.name,
          canProduce: true,
          blockedReason: null,
          missingMachines: [],
        });
        continue;
      }

      const missing = kit.requiredMachines
        .filter((mt) => !ownedTypes.has(mt))
        .map((mt) => {
          const config = getMachineConfig(mt);
          return config?.name ?? mt.replace(/_/g, " ");
        });

      segments.push({
        segment: p.segment,
        productName: p.name,
        canProduce: missing.length === 0,
        blockedReason: missing.length > 0 ? `missing ${missing.join(", ")}` : null,
        missingMachines: missing,
      });
    }

    return {
      segments,
      hasBlockedSegments: segments.some((s) => !s.canProduce),
    };
  }, [state]);
}
