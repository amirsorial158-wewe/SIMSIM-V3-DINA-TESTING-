/**
 * Material Kit Catalog
 *
 * Defines the 5 segment-based material kits that products consume during production.
 * Each kit maps to a market segment and specifies which machines are required to
 * process it. Higher-tier kits require more sophisticated factory equipment.
 */

import type { MachineType } from "../machinery/types";

export interface MaterialKit {
  id: string;
  name: string;
  segment: string;
  baseCostPerUnit: number;
  requiredMachines: MachineType[];
  description: string;
}

/**
 * 5 kit types — one per market segment.
 * requiredMachines uses the exact MachineType IDs from MachineCatalog.ts.
 */
export const KIT_CATALOG: MaterialKit[] = [
  {
    id: "kit-budget",
    name: "Budget Kit",
    segment: "Budget",
    baseCostPerUnit: 50,
    requiredMachines: [],
    description:
      "Basic components — standard displays, simple chipsets, polycarbonate housing",
  },
  {
    id: "kit-general",
    name: "General Kit",
    segment: "General",
    baseCostPerUnit: 120,
    requiredMachines: ["welding_station"],
    description:
      "Mid-grade components — OLED displays, multi-layer PCBs requiring precision soldering",
  },
  {
    id: "kit-enthusiast",
    name: "Enthusiast Kit",
    segment: "Enthusiast",
    baseCostPerUnit: 280,
    requiredMachines: ["cnc_machine", "pcb_assembler"],
    description:
      "Premium components — flagship processors need precision mounting, HDI circuit boards",
  },
  {
    id: "kit-professional",
    name: "Professional Kit",
    segment: "Professional",
    baseCostPerUnit: 450,
    requiredMachines: [
      "cnc_machine",
      "clean_room_unit",
      "pcb_assembler",
      "quality_scanner",
    ],
    description:
      "Top-tier components — precision optics need dust-free assembly, every component inspected",
  },
  {
    id: "kit-active",
    name: "Active Kit",
    segment: "Active Lifestyle",
    baseCostPerUnit: 160,
    requiredMachines: ["injection_molder"],
    description:
      "Durable components — ruggedized impact housing needs injection molding",
  },
];

// ============================================
// LOOKUP HELPERS
// ============================================

const kitByIdMap = new Map(KIT_CATALOG.map((k) => [k.id, k]));
const kitBySegmentMap = new Map(KIT_CATALOG.map((k) => [k.segment, k]));

/** Get a kit definition by its ID (e.g. 'kit-budget'). */
export function getKit(kitId: string): MaterialKit | undefined {
  return kitByIdMap.get(kitId);
}

/** Get the kit required for a given product segment (e.g. 'Professional' → kit-professional). */
export function getKitForSegment(segment: string): MaterialKit | undefined {
  return kitBySegmentMap.get(segment);
}

/** Get the kit ID for a product segment. Returns undefined if segment has no kit. */
export function getKitIdForSegment(segment: string): string | undefined {
  return kitBySegmentMap.get(segment)?.id;
}
