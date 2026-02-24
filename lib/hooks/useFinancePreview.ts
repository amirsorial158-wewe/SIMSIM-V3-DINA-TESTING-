"use client";

import { useMemo } from "react";
import type { TeamState } from "@/engine/types";
import type { MarketState } from "@/engine/types/market";
import type { UIFinanceDecisions } from "@/lib/stores/decisionStore";
import { convertFinanceDecisions } from "@/lib/converters/decisionConverters";
import { FinanceModule } from "@/engine/modules/FinanceModule";

export function useFinancePreview(
  state: TeamState | null,
  decisions: UIFinanceDecisions,
  marketState: MarketState | null
) {
  return useMemo(() => {
    if (!state || !marketState) return { previewState: null, result: null, costs: 0, messages: [] };
    try {
      const engineDecisions = convertFinanceDecisions(decisions);
      const { newState, result } = FinanceModule.process(state, engineDecisions, marketState);
      return { previewState: newState, result, costs: result.costs, messages: result.messages };
    } catch {
      return { previewState: null, result: null, costs: 0, messages: [] };
    }
  }, [state, decisions, marketState]);
}
