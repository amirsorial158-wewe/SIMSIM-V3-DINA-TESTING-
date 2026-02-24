"use client";

import { useMemo } from "react";
import type { TeamState } from "@/engine/types";
import type { UIRDDecisions } from "@/lib/stores/decisionStore";
import { convertRDDecisions } from "@/lib/converters/decisionConverters";
import { RDModule } from "@/engine/modules/RDModule";
import { createEngineContext } from "@/engine/core/EngineContext";

export function useRDPreview(state: TeamState | null, decisions: UIRDDecisions) {
  return useMemo(() => {
    if (!state) return { previewState: null, result: null, costs: 0, messages: [] };
    try {
      const engineDecisions = convertRDDecisions(decisions);
      const ctx = createEngineContext("preview", state.round ?? 1, "preview");
      const { newState, result } = RDModule.process(state, engineDecisions, ctx);
      return { previewState: newState, result, costs: result.costs, messages: result.messages };
    } catch {
      return { previewState: null, result: null, costs: 0, messages: [] };
    }
  }, [state, decisions]);
}
