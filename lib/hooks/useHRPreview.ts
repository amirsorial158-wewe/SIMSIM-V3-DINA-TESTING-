"use client";

import { useMemo } from "react";
import type { TeamState } from "@/engine/types";
import type { UIHRDecisions } from "@/lib/stores/decisionStore";
import { convertHRDecisions } from "@/lib/converters/decisionConverters";
import { HRModule } from "@/engine/modules/HRModule";
import { createEngineContext } from "@/engine/core/EngineContext";

export function useHRPreview(state: TeamState | null, decisions: UIHRDecisions) {
  return useMemo(() => {
    if (!state) return { previewState: null, result: null, costs: 0, messages: [] };
    try {
      const engineDecisions = convertHRDecisions(decisions);
      const ctx = createEngineContext("preview", state.round ?? 1, "preview");
      const { newState, result } = HRModule.process(state, engineDecisions, ctx);
      return { previewState: newState, result, costs: result.costs, messages: result.messages };
    } catch {
      return { previewState: null, result: null, costs: 0, messages: [] };
    }
  }, [state, decisions]);
}
