"use client";

import { useMemo } from "react";
import type { TeamState } from "@/engine/types";
import type { UIFactoryDecisions } from "@/lib/stores/decisionStore";
import { convertFactoryDecisions } from "@/lib/converters/decisionConverters";
import { FactoryModule } from "@/engine/modules/FactoryModule";
import { createEngineContext } from "@/engine/core/EngineContext";

export function useFactoryPreview(state: TeamState | null, decisions: UIFactoryDecisions) {
  return useMemo(() => {
    if (!state) return { previewState: null, result: null, costs: 0, messages: [] };
    try {
      const engineDecisions = convertFactoryDecisions(decisions, state);
      const ctx = createEngineContext("preview", state.round ?? 1, "preview");
      const { newState, result } = FactoryModule.process(state, engineDecisions, ctx);
      return { previewState: newState, result, costs: result.costs, messages: result.messages };
    } catch {
      return { previewState: null, result: null, costs: 0, messages: [] };
    }
  }, [state, decisions]);
}
