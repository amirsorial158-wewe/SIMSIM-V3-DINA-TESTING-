"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import type { HiringRequirement, ProductStaffingNeed } from "@/lib/hooks/calculateHiringRequirements";

interface HiringRequirementsPanelProps {
  requirements: HiringRequirement[];
  productStaffingNeeds?: ProductStaffingNeed[];
}

const URGENCY_STYLES = {
  critical: "bg-red-500/10 border-red-500/30 text-red-400",
  recommended: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  optional: "bg-slate-500/10 border-slate-600 text-slate-400",
};

const URGENCY_LABELS = {
  critical: "Critical",
  recommended: "Recommended",
  optional: "Sufficient",
};

export function HiringRequirementsPanel({ requirements, productStaffingNeeds }: HiringRequirementsPanelProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const hasShortfall = requirements.some(r => r.shortfall > 0);
  if (!hasShortfall) return null;

  return (
    <Card className="bg-slate-800 border-slate-700 border-amber-500/20">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-white font-semibold text-sm">Staffing Requirements</h3>
            <p className="text-slate-400 text-xs">Based on your products and operations</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {requirements.filter(r => r.shortfall > 0).map((req) => (
            <div
              key={req.role}
              className={`flex items-center justify-between p-3 rounded-lg border ${URGENCY_STYLES[req.urgency]}`}
            >
              <div className="flex items-center gap-3">
                {req.urgency === "critical" ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <div>
                  <span className="text-white font-medium text-sm capitalize">{req.role}s</span>
                  <p className="text-slate-400 text-xs">
                    {req.currentCount}/{req.requiredCount} — need {req.shortfall} more
                  </p>
                  {req.reason.length > 0 && (
                    <p className="text-slate-500 text-xs">{req.reason[0]}</p>
                  )}
                </div>
              </div>
              <Badge className={URGENCY_STYLES[req.urgency]}>
                {URGENCY_LABELS[req.urgency]}
              </Badge>
            </div>
          ))}
        </div>

        {/* Product staffing breakdown */}
        {productStaffingNeeds && productStaffingNeeds.length > 0 && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white text-xs h-7 px-2"
              onClick={() => setShowBreakdown(!showBreakdown)}
            >
              {showBreakdown ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
              Why these numbers?
            </Button>
            {showBreakdown && (
              <div className="mt-2 p-3 bg-slate-700/30 rounded-lg space-y-1.5">
                <p className="text-slate-400 text-xs font-medium mb-2">Staffing breakdown by product:</p>
                {productStaffingNeeds.map((pn, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-slate-300">{pn.productName} ({pn.segment})</span>
                    <span className="text-slate-400">
                      {pn.machinesNeeded} machines &rarr; {pn.workersNeeded} workers
                    </span>
                  </div>
                ))}
                <div className="pt-1.5 border-t border-slate-600 flex justify-between text-xs font-medium">
                  <span className="text-slate-300">Total from products</span>
                  <span className="text-amber-400">
                    {productStaffingNeeds.reduce((s, p) => s + p.workersNeeded, 0)} workers needed
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
