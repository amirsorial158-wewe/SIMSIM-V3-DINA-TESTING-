"use client";

import { useMemo } from "react";
import type { TeamState } from "@/engine/types";
import type { UIMarketingDecisions } from "@/lib/stores/decisionStore";
import { convertMarketingDecisions } from "@/lib/converters/decisionConverters";
import { MarketingModule } from "@/engine/modules/MarketingModule";

export function useMarketingPreview(state: TeamState | null, decisions: UIMarketingDecisions) {
  return useMemo(() => {
    if (!state) return { previewState: null, result: null, costs: 0, messages: [] };
    try {
      const engineDecisions = convertMarketingDecisions(decisions);
      const { newState, result } = MarketingModule.process(state, engineDecisions);
      return { previewState: newState, result, costs: result.costs, messages: result.messages };
    } catch {
      return { previewState: null, result: null, costs: 0, messages: [] };
    }
  }, [state, decisions]);
}
