/**
 * Team state types for the Business Simulation Engine
 */

import type { Employee, CompanyBenefits } from "./employee";
import type { Factory, Segment } from "./factory";
import type { Product } from "./product";
import type { MaterialInventory, MaterialOrder, Region } from "../materials/types";
import type { TariffState } from "../tariffs/types";
import type { FinancialStatements } from "../finance/types";
import type { FactoryMachineryState } from "../machinery/types";
import type { Patent } from "./patents";
import type { UnlockedAchievement } from "./achievements";

// ============================================
// STATE VERSIONING (Required for compatibility)
// ============================================

export interface StateVersion {
  /** Engine version that produced this state */
  engineVersion: string;
  /** Schema version for state structure */
  schemaVersion: string;
}

// ============================================
// FINANCIAL STATE
// ============================================

export interface FinancialState {
  cash: number;
  revenue: number;
  netIncome: number;
  totalAssets: number;
  totalLiabilities: number;
  shareholdersEquity: number;

  // Stock
  marketCap: number;
  sharesIssued: number;
  sharePrice: number;
  eps: number;

  // Debt
  treasuryBills: number;
  corporateBonds: number;
  bankLoans: number;

  // Dividends
  dividendPerShare: number;

  // Ratios (calculated)
  currentRatio?: number;
  quickRatio?: number;
  cashRatio?: number;
  debtToEquity?: number;
  roe?: number;
  profitMargin?: number;
}

// ============================================
// ESG STATE
// ============================================

export interface ESGState {
  score: number;                  // 0-1000
  charitableDonations: number;
  communityInvestment: number;
  workplaceHealthSafety: boolean;
  fairWageProgram: boolean;
  codeOfEthics: boolean;
  supplierEthicsProgram: boolean;
}

// ============================================
// TEAM STATE
// ============================================

export interface TeamState {
  // Versioning (Required for compatibility checks)
  version: StateVersion;

  // Financial
  cash: number;
  revenue: number;
  netIncome: number;
  totalAssets: number;
  totalLiabilities: number;          // Computed: shortTermDebt + longTermDebt
  shortTermDebt: number;             // Treasury bills, credit lines, short-term loans
  longTermDebt: number;              // Corporate bonds, long-term bank loans
  shareholdersEquity: number;
  marketCap: number;
  sharesIssued: number;
  sharePrice: number;
  eps: number;

  // PATCH 6: Foreign revenue tracking for FX impact
  revenueByRegion?: Record<string, number>;  // Revenue by region for FX calculations

  // Financial Statements (complete three-statement model)
  financialStatements?: FinancialStatements;  // Current round's complete financial statements
  previousFinancialStatements?: FinancialStatements;  // Previous round for trend analysis

  // Inventory & COGS
  inventory: {
    finishedGoods: Record<Segment, number>;  // Units by segment
    rawMaterials: number;                     // Dollar value
    workInProgress: number;                   // Dollar value
  };
  cogs: number;                               // Cost of goods sold this round
  accountsReceivable: number;                 // Money owed by customers
  accountsPayable: number;                    // Money owed to suppliers

  // Materials & Supply Chain (optional for backward compatibility)
  materials?: {
    inventory: MaterialInventory[];          // Material inventory
    activeOrders: MaterialOrder[];           // Pending material orders
    totalInventoryValue: number;             // Total value of material inventory
    holdingCosts: number;                    // Storage costs per round
    region: Region;                          // Team's primary region for shipping
  };

  // Tariffs (optional for backward compatibility)
  tariffs?: TariffState;

  // Operations
  factories: Factory[];
  products: Product[];
  employees: Employee[];

  // Workforce Summary
  workforce: {
    totalHeadcount: number;
    averageMorale: number;
    averageEfficiency: number;
    laborCost: number;
    turnoverRate: number;
  };

  // Brand & Market
  brandValue: number;             // 0-1
  marketShare: Record<Segment, number>;

  // R&D
  rdBudget: number;
  rdProgress: number;             // Accumulated R&D points
  patents: number | Patent[];     // number for backward compat, Patent[] for new games
  unlockedTechnologies?: string[]; // IDs of researched technologies

  // Achievements (new - victory condition)
  achievements?: UnlockedAchievement[];
  achievementScore?: number;      // Computed: sum of achievement points

  // ESG
  esgScore: number;
  co2Emissions: number;

  // Benefits
  benefits: CompanyBenefits;

  // Game complexity settings (for filtering features)
  complexityLevel?: "simple" | "standard" | "advanced";

  // Current round number
  round: number;

  // Machinery states per factory
  machineryStates?: Record<string, FactoryMachineryState>;

  // === Phase 6: New Game Mechanics ===

  /** Waste & efficiency tracking per factory per round */
  wasteMetrics?: {
    totalWasteUnits: number;
    wasteDisposalCost: number;
    efficiencyRating: number;  // 0-100 percentage
    wasteByFactory: Record<string, { units: number; cost: number; efficiency: number }>;
  };

  /** Customer loyalty per segment (0-100). Consistent supply builds loyalty. */
  customerLoyalty?: Record<Segment, number>;

  /** Active contract orders from NPC buyers */
  activeContracts?: ContractOrder[];

  /** Active research track for this round (only one allowed per round) */
  activeResearchTrack?: "process" | "commerce" | "innovation";

  /** Research decay timers: techId -> rounds since completion without application */
  researchDecayTimers?: Record<string, number>;

  /** Collaborative research proposals (multiplayer only) */
  researchProposals?: ResearchProposal[];
}

/** Collaborative research proposal (multiplayer) */
export interface ResearchProposal {
  id: string;
  /** Team that proposed the collaboration */
  proposerTeamId: string;
  /** Target tech ID to research jointly */
  techId: string;
  /** Each participating team pays this share of the cost */
  costPerTeam: number;
  /** Total cost split between participants */
  totalCost: number;
  /** Teams that have accepted */
  acceptedTeamIds: string[];
  /** Round the proposal was created */
  proposedRound: number;
  /** Deadline round (expires if not accepted) */
  deadlineRound: number;
  /** Status of the proposal */
  status: "pending" | "accepted" | "completed" | "expired";
  /** Type: joint = shared upgrade, race = first to finish wins patent */
  type: "joint" | "race";
}

/** NPC bulk purchase contract */
export interface ContractOrder {
  id: string;
  buyerName: string;
  segment: Segment;
  volumeRequired: number;
  pricePerUnit: number;
  deadlineRound: number;
  status: "active" | "fulfilled" | "expired";
}
