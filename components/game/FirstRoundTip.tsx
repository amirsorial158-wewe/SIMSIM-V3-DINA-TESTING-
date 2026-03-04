"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

type ModuleName = "rnd" | "factory" | "finance" | "hr" | "marketing";

const TIPS: Record<ModuleName, string> = {
  rnd: "Create 1-2 products to start. Budget phones (target quality ~50) are easiest — they need basic factories and fewer workers. Professional phones (quality ~90) are lucrative but need advanced machinery and skilled staff.",
  factory: "Your R&D products need factory capacity. Each machine needs ~3 workers (you'll hire them next in HR). Start with Assembly Lines for volume. Check the requirements panel above to see exactly what your products need.",
  finance: "Check the requirements panel — it shows your total committed spend. If you're short on cash, issue bonds. Keep debt-to-equity below 1.0 or your stock price gets penalized.",
  hr: "The requirements panel shows exactly how many workers and engineers your factory needs. Each worker produces 100 units/round. Each engineer generates 5 R&D points/round. Don't forget supervisors — 1 per 15 workers.",
  marketing: "Your products target specific segments — the requirements panel shows what each segment values. Budget buyers care about PRICE (65%). Professional buyers care about QUALITY (48%) and ESG (20%). Put your ad dollars where your products compete.",
};

interface FirstRoundTipProps {
  module: ModuleName;
  currentRound: number;
}

export function FirstRoundTip({ module, currentRound }: FirstRoundTipProps) {
  if (currentRound !== 1) return null;

  return (
    <Card className="bg-purple-500/10 border-purple-500/20 mb-4">
      <CardContent className="p-3 flex items-start gap-3">
        <Lightbulb className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
        <p className="text-sm text-purple-200">{TIPS[module]}</p>
      </CardContent>
    </Card>
  );
}
