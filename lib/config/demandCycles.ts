/**
 * Dynamic Demand Cycles - Seasonal/event-based demand multipliers per segment.
 *
 * Each segment has a characteristic demand pattern that fluctuates across rounds.
 * Players must anticipate and plan production in advance.
 */

import type { Segment } from "@/engine/types";

export interface DemandCyclePoint {
  /** Round number within the cycle (wraps around) */
  roundInCycle: number;
  /** Demand multiplier (1.0 = baseline, >1 = surge, <1 = slump) */
  multiplier: number;
  /** Optional label for the seasonal event */
  label?: string;
}

export interface SegmentDemandCycle {
  segment: Segment;
  /** Number of rounds per full cycle */
  cycleLength: number;
  /** Points defining the demand curve within a cycle */
  points: DemandCyclePoint[];
  /** Description for Market Intelligence panel */
  description: string;
}

/**
 * Get the demand multiplier for a given segment and round.
 * Uses linear interpolation between defined cycle points.
 */
export function getDemandMultiplier(segment: Segment, round: number): number {
  const cycle = SEGMENT_DEMAND_CYCLES[segment];
  if (!cycle) return 1.0;

  const roundInCycle = ((round - 1) % cycle.cycleLength);

  // Find the two bounding points
  const sorted = [...cycle.points].sort((a, b) => a.roundInCycle - b.roundInCycle);
  let before = sorted[sorted.length - 1]; // wrap around
  let after = sorted[0];

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].roundInCycle <= roundInCycle) {
      before = sorted[i];
      after = sorted[(i + 1) % sorted.length];
    }
  }

  if (before.roundInCycle === after.roundInCycle) return before.multiplier;

  // Linear interpolation
  let range = after.roundInCycle - before.roundInCycle;
  if (range <= 0) range += cycle.cycleLength; // handle wrap
  let progress = roundInCycle - before.roundInCycle;
  if (progress < 0) progress += cycle.cycleLength;

  const t = progress / range;
  return before.multiplier + (after.multiplier - before.multiplier) * t;
}

export const SEGMENT_DEMAND_CYCLES: Record<Segment, SegmentDemandCycle> = {
  "Budget": {
    segment: "Budget",
    cycleLength: 8,
    description: "Steady demand with slight holiday surge. Most predictable segment.",
    points: [
      { roundInCycle: 0, multiplier: 1.0 },
      { roundInCycle: 2, multiplier: 0.95 },
      { roundInCycle: 4, multiplier: 1.0 },
      { roundInCycle: 6, multiplier: 1.15, label: "Holiday Season" },
      { roundInCycle: 7, multiplier: 1.05 },
    ],
  },
  "General": {
    segment: "General",
    cycleLength: 8,
    description: "Moderate seasonal variance. Peaks during product launch windows.",
    points: [
      { roundInCycle: 0, multiplier: 0.9 },
      { roundInCycle: 2, multiplier: 1.1, label: "Spring Launch" },
      { roundInCycle: 4, multiplier: 0.85, label: "Summer Lull" },
      { roundInCycle: 6, multiplier: 1.2, label: "Holiday Season" },
      { roundInCycle: 7, multiplier: 1.0 },
    ],
  },
  "Enthusiast": {
    segment: "Enthusiast",
    cycleLength: 6,
    description: "Tech event driven. Demand spikes during launch cycles, crashes between.",
    points: [
      { roundInCycle: 0, multiplier: 0.8 },
      { roundInCycle: 1, multiplier: 1.3, label: "Tech Launch Event" },
      { roundInCycle: 2, multiplier: 1.1 },
      { roundInCycle: 3, multiplier: 0.75, label: "Post-Launch Slump" },
      { roundInCycle: 5, multiplier: 0.9 },
    ],
  },
  "Professional": {
    segment: "Professional",
    cycleLength: 8,
    description: "Business purchasing cycles. Q1 and Q3 budget allocations drive demand.",
    points: [
      { roundInCycle: 0, multiplier: 1.2, label: "Q1 Budget Cycle" },
      { roundInCycle: 2, multiplier: 0.85 },
      { roundInCycle: 4, multiplier: 1.15, label: "Q3 Refresh" },
      { roundInCycle: 6, multiplier: 0.9, label: "Year-End Freeze" },
      { roundInCycle: 7, multiplier: 0.95 },
    ],
  },
  "Active Lifestyle": {
    segment: "Active Lifestyle",
    cycleLength: 8,
    description: "Fitness-driven peaks. Summer and New Year resolutions drive demand.",
    points: [
      { roundInCycle: 0, multiplier: 1.25, label: "New Year Resolutions" },
      { roundInCycle: 2, multiplier: 0.9 },
      { roundInCycle: 4, multiplier: 1.2, label: "Summer Fitness" },
      { roundInCycle: 6, multiplier: 0.85, label: "Autumn Lull" },
      { roundInCycle: 7, multiplier: 1.0 },
    ],
  },
};
