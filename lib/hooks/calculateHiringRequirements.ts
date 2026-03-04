import type { TeamState } from "@/engine/types";
import { CONSTANTS } from "@/engine/types";
import {
  getWorkersRequired,
  getEngineersRequired,
  getSupervisorsRequired,
  getEmployeeCounts,
} from "@/lib/utils/stateHelpers";
import { getArchetype } from "@/engine/types/archetypes";
import { getMachineryRequirements } from "@/engine/types/machineryRequirements";

export interface HiringRequirement {
  role: "worker" | "engineer" | "supervisor";
  currentCount: number;
  requiredCount: number;
  shortfall: number;
  reason: string[];
  urgency: "critical" | "recommended" | "optional";
}

export interface ProductStaffingNeed {
  productName: string;
  segment: string;
  machinesNeeded: number;
  workersNeeded: number;
}

export interface HiringRequirementsResult {
  requirements: HiringRequirement[];
  productStaffingNeeds: ProductStaffingNeed[];
}

export function calculateHiringRequirements(state: TeamState): HiringRequirement[] {
  return calculateHiringRequirementsDetailed(state).requirements;
}

export function calculateHiringRequirementsDetailed(state: TeamState): HiringRequirementsResult {
  const counts = getEmployeeCounts(state);
  const requirements: HiringRequirement[] = [];

  // Compute product-driven staffing needs
  const productStaffingNeeds: ProductStaffingNeed[] = [];
  for (const p of state.products ?? []) {
    if (p.developmentStatus !== "launched" && p.developmentStatus !== "in_development") continue;
    const tier = p.archetypeId ? (getArchetype(p.archetypeId)?.tier ?? 0) : 0;
    const machineReqs = getMachineryRequirements(tier);
    const machinesNeeded = machineReqs.length;
    const workersNeeded = Math.ceil(machinesNeeded * CONSTANTS.WORKERS_PER_MACHINE);
    productStaffingNeeds.push({
      productName: p.name,
      segment: p.segment,
      machinesNeeded,
      workersNeeded,
    });
  }

  // Workers
  const workersRequired = getWorkersRequired(state);
  const workerShortfall = Math.max(0, workersRequired - counts.workers);
  const workerReasons: string[] = [];
  if (workerShortfall > 0) {
    workerReasons.push(`Need ${workersRequired} workers for operational machines`);
    if (productStaffingNeeds.length > 0) {
      const totalFromProducts = productStaffingNeeds.reduce((s, p) => s + p.workersNeeded, 0);
      workerReasons.push(`Products need ~${totalFromProducts} workers total (${CONSTANTS.WORKERS_PER_MACHINE} per machine)`);
    }
  }
  requirements.push({
    role: "worker",
    currentCount: counts.workers,
    requiredCount: workersRequired,
    shortfall: workerShortfall,
    reason: workerReasons,
    urgency: counts.workers < workersRequired * 0.7 ? "critical" : workerShortfall > 0 ? "recommended" : "optional",
  });

  // Engineers
  const engineersRequired = getEngineersRequired(state);
  const engineerShortfall = Math.max(0, engineersRequired - counts.engineers);
  requirements.push({
    role: "engineer",
    currentCount: counts.engineers,
    requiredCount: engineersRequired,
    shortfall: engineerShortfall,
    reason: engineerShortfall > 0
      ? [`Need ${engineersRequired} engineers for ${state.factories?.length ?? 0} factory(ies) (${CONSTANTS.ENGINEERS_PER_FACTORY} per factory)`]
      : [],
    urgency: engineerShortfall > 0 ? "critical" : "optional",
  });

  // Supervisors
  const supervisorsRequired = getSupervisorsRequired(state);
  const supervisorShortfall = Math.max(0, supervisorsRequired - counts.supervisors);
  requirements.push({
    role: "supervisor",
    currentCount: counts.supervisors,
    requiredCount: supervisorsRequired,
    shortfall: supervisorShortfall,
    reason: supervisorShortfall > 0 ? [`Need 1 supervisor per ${CONSTANTS.WORKERS_PER_SUPERVISOR} staff`] : [],
    urgency: supervisorShortfall > 0 ? "recommended" : "optional",
  });

  return { requirements, productStaffingNeeds };
}
