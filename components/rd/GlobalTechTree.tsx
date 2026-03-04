"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Lock, Loader2, Beaker } from "lucide-react";

interface GlobalTechTreeProps {
  unlockedTechs: string[];
  currentRdPoints?: number;
  rdPointsPerRound?: number;
}

// New thresholds matching RDModule auto-unlock logic
const TECH_LEVELS = [
  {
    id: "process_optimization",
    level: 1,
    name: "Process Optimization",
    pointsRequired: 50,
    description: "Unlocks Tier 1 archetypes: Long-Life Phone, Snapshot Phone, Smart Companion, and more",
    archetypeTier: "Tier 1",
  },
  {
    id: "advanced_manufacturing",
    level: 2,
    name: "Advanced Manufacturing",
    pointsRequired: 200,
    description: "Unlocks Tier 2 archetypes: Fast Charge Pro, Night Vision Camera, On-Device ML, and more",
    archetypeTier: "Tier 2",
  },
  {
    id: "industry_4_0",
    level: 3,
    name: "Industry 4.0",
    pointsRequired: 500,
    description: "Unlocks Tier 3 archetypes: Ultra Endurance, 8K Video, Autonomous Agent, and more",
    archetypeTier: "Tier 3",
  },
  {
    id: "breakthrough_tech",
    level: 4,
    name: "Breakthrough Technology",
    pointsRequired: 800,
    description: "Unlocks Tier 4 archetypes: Solid State Battery, Pro Cinema Suite, and more",
    archetypeTier: "Tier 4",
  },
  {
    id: "quantum_era",
    level: 5,
    name: "Quantum Era",
    pointsRequired: 1200,
    description: "Unlocks Tier 5 archetypes: Quantum Phone, Ultimate Flagship, and more",
    archetypeTier: "Tier 5",
  },
];

export function GlobalTechTree({ unlockedTechs, currentRdPoints = 0, rdPointsPerRound = 0 }: GlobalTechTreeProps) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Beaker className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="text-white font-semibold text-base">R&D Tech Levels</h3>
            <p className="text-slate-400 text-sm">
              {Math.floor(currentRdPoints)} R&D points accumulated
              {rdPointsPerRound > 0 && (
                <span className="text-cyan-400"> (+~{Math.floor(rdPointsPerRound)}/round)</span>
              )}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {TECH_LEVELS.map((tech, idx) => {
            const isUnlocked = currentRdPoints >= tech.pointsRequired;
            const prevUnlocked = idx === 0 || currentRdPoints >= TECH_LEVELS[idx - 1].pointsRequired;
            const isNext = !isUnlocked && prevUnlocked;
            const isLocked = !isUnlocked && !isNext;

            // Progress for the "next" level
            const prevThreshold = idx > 0 ? TECH_LEVELS[idx - 1].pointsRequired : 0;
            const progressInTier = Math.max(0, currentRdPoints - prevThreshold);
            const tierRange = tech.pointsRequired - prevThreshold;
            const progressPercent = isUnlocked ? 100 : Math.min(100, (progressInTier / tierRange) * 100);

            // Estimated rounds to unlock
            const remaining = Math.max(0, tech.pointsRequired - currentRdPoints);
            const estimatedRounds = rdPointsPerRound > 0 ? Math.ceil(remaining / rdPointsPerRound) : null;

            return (
              <div
                key={tech.id}
                className={`p-3 rounded-lg border ${
                  isUnlocked
                    ? "bg-purple-500/10 border-purple-500/30"
                    : isNext
                    ? "bg-cyan-500/5 border-cyan-500/30"
                    : "bg-slate-700/30 border-slate-700"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Status Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isUnlocked ? "bg-purple-500/20" : isNext ? "bg-cyan-500/20" : "bg-slate-700"
                  }`}>
                    {isUnlocked ? (
                      <CheckCircle2 className="w-5 h-5 text-purple-400" />
                    ) : isNext ? (
                      <Loader2 className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <Lock className="w-5 h-5 text-slate-500" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${isUnlocked ? "text-purple-300" : isNext ? "text-white" : "text-slate-500"}`}>
                        Level {tech.level}: {tech.name}
                      </span>
                      {isUnlocked && (
                        <Badge className="bg-purple-500/20 text-purple-400 text-[10px]">Unlocked</Badge>
                      )}
                      {isNext && (
                        <Badge className="bg-cyan-500/20 text-cyan-400 text-[10px]">Next</Badge>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${isLocked ? "text-slate-600" : "text-slate-400"}`}>
                      {tech.description}
                    </p>
                  </div>

                  {/* Requirements */}
                  <div className="text-right shrink-0">
                    <div className={`text-xs ${isUnlocked ? "text-purple-400" : isNext ? "text-cyan-400" : "text-slate-500"}`}>
                      {tech.pointsRequired} pts
                    </div>
                    {isNext && estimatedRounds !== null && (
                      <div className="text-[10px] text-cyan-300">
                        ~{estimatedRounds} round{estimatedRounds !== 1 ? "s" : ""}
                      </div>
                    )}
                    {isLocked && estimatedRounds !== null && (
                      <div className="text-[10px] text-slate-600">
                        ~{estimatedRounds} rounds
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar for next level */}
                {isNext && (
                  <div className="mt-2 ml-14">
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500/60 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] mt-0.5">
                      <span className="text-slate-500">{Math.floor(currentRdPoints)} pts</span>
                      <span className="text-slate-500">{tech.pointsRequired} pts</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
