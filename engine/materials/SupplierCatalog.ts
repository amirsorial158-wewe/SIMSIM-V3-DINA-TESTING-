/**
 * Kit Supplier Catalog
 *
 * Defines the 3 suppliers teams can order material kits from.
 * Each supplier has a different cost/lead-time/reliability trade-off.
 */

export interface KitSupplier {
  id: string;
  name: string;
  costMultiplier: number;
  leadTimeRounds: number;
  reliability: number;
  description: string;
}

export const KIT_SUPPLIERS: KitSupplier[] = [
  {
    id: "supplier-asia",
    name: "Asia Direct",
    costMultiplier: 0.85,
    leadTimeRounds: 2,
    reliability: 0.85,
    description: "Save money, can wait, accepts risk",
  },
  {
    id: "supplier-balanced",
    name: "Balanced Supply Co.",
    costMultiplier: 1.0,
    leadTimeRounds: 1,
    reliability: 0.9,
    description: "Middle ground",
  },
  {
    id: "supplier-euro",
    name: "Euro Express",
    costMultiplier: 1.1,
    leadTimeRounds: 0,
    reliability: 0.95,
    description: "Need it NOW, pay premium for reliability",
  },
];

const supplierMap = new Map(KIT_SUPPLIERS.map((s) => [s.id, s]));

/** Get a supplier definition by ID. */
export function getKitSupplier(supplierId: string): KitSupplier | undefined {
  return supplierMap.get(supplierId);
}
