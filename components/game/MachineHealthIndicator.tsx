"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedProgress } from "@/components/ui/enhanced-progress";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, Cog, Wrench, Clock, Activity } from "lucide-react";
import type { Machine } from "@/engine/machinery";
import { MACHINE_CONFIGS } from "@/engine/machinery";

// ---- Per-machine health bar ----

interface MachineHealthBarProps {
  machine: Machine;
  compact?: boolean;
}

function getMaintenanceInterval(machineType: string): number {
  const config = MACHINE_CONFIGS.find((c) => c.type === machineType);
  return config?.maintenanceInterval ?? 6;
}

export function MachineHealthBar({ machine, compact }: MachineHealthBarProps) {
  const maintenanceInterval = getMaintenanceInterval(machine.type);
  const isOverdue = machine.roundsSinceLastMaintenance > maintenanceInterval;
  const maintenanceSoon =
    machine.roundsSinceLastMaintenance >= maintenanceInterval - 1 &&
    !isOverdue;
  const lifespanPct = Math.min(
    100,
    (machine.ageRounds / machine.expectedLifespanRounds) * 100
  );
  const pastLifespan = machine.ageRounds > machine.expectedLifespanRounds;

  if (compact) {
    return (
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1">
          <EnhancedProgress
            value={machine.healthPercent}
            variant={
              machine.healthPercent >= 70
                ? "success"
                : machine.healthPercent >= 40
                ? "warning"
                : "danger"
            }
            size="sm"
          />
        </div>
        <span
          className={`text-xs font-medium tabular-nums w-8 text-right ${
            machine.healthPercent >= 70
              ? "text-green-400"
              : machine.healthPercent >= 40
              ? "text-yellow-400"
              : "text-red-400"
          }`}
        >
          {machine.healthPercent}%
        </span>
        {isOverdue && (
          <Wrench className="w-3 h-3 text-orange-400 shrink-0" />
        )}
      </div>
    );
  }

  return (
    <div className="p-3 bg-slate-700/50 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-white text-sm font-medium">{machine.name}</p>
          <Badge
            className={`text-[10px] ${
              machine.status === "operational"
                ? "bg-green-500/20 text-green-400"
                : machine.status === "breakdown"
                ? "bg-red-500/20 text-red-400"
                : machine.status === "maintenance"
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-slate-500/20 text-slate-400"
            }`}
          >
            {machine.status}
          </Badge>
        </div>
        <span className="text-xs text-slate-400">
          {formatCurrency(machine.maintenanceCostPerRound)}/rd
        </span>
      </div>

      {/* Health bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-400 w-10">Health</span>
        <div className="flex-1">
          <EnhancedProgress
            value={machine.healthPercent}
            variant={
              machine.healthPercent >= 70
                ? "success"
                : machine.healthPercent >= 40
                ? "warning"
                : "danger"
            }
            size="sm"
          />
        </div>
        <span
          className={`text-xs font-medium tabular-nums w-8 text-right ${
            machine.healthPercent >= 70
              ? "text-green-400"
              : machine.healthPercent >= 40
              ? "text-yellow-400"
              : "text-red-400"
          }`}
        >
          {machine.healthPercent}%
        </span>
      </div>

      {/* Lifespan bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-400 w-10">Life</span>
        <div className="flex-1">
          <EnhancedProgress
            value={lifespanPct}
            variant={pastLifespan ? "danger" : lifespanPct > 75 ? "warning" : "default"}
            size="sm"
          />
        </div>
        <span
          className={`text-xs tabular-nums w-8 text-right ${
            pastLifespan ? "text-red-400" : "text-slate-400"
          }`}
        >
          {machine.ageRounds}/{machine.expectedLifespanRounds}
        </span>
      </div>

      {/* Indicators row */}
      <div className="flex items-center gap-3 text-[10px]">
        {machine.capacityUnits > 0 && (
          <span className="text-slate-400">
            {machine.capacityUnits.toLocaleString()} units
          </span>
        )}
        {isOverdue && (
          <span className="flex items-center gap-1 text-orange-400">
            <Wrench className="w-3 h-3" />
            Maintenance overdue ({machine.roundsSinceLastMaintenance} rds)
          </span>
        )}
        {maintenanceSoon && (
          <span className="flex items-center gap-1 text-yellow-400">
            <Clock className="w-3 h-3" />
            Maintenance due soon
          </span>
        )}
        {pastLifespan && (
          <span className="flex items-center gap-1 text-red-400">
            <AlertTriangle className="w-3 h-3" />
            Past expected lifespan
          </span>
        )}
      </div>
    </div>
  );
}

// ---- Fleet summary card for overview ----

interface MachineFleetSummaryProps {
  machines: Machine[];
}

export function MachineFleetSummary({ machines }: MachineFleetSummaryProps) {
  if (machines.length === 0) return null;

  const operational = machines.filter((m) => m.status === "operational").length;
  const inMaintenance = machines.filter(
    (m) => m.status === "maintenance"
  ).length;
  const broken = machines.filter((m) => m.status === "breakdown").length;
  const offline = machines.filter((m) => m.status === "offline").length;
  const avgHealth =
    machines.reduce((sum, m) => sum + m.healthPercent, 0) / machines.length;
  const overdueCount = machines.filter((m) => {
    const interval = getMaintenanceInterval(m.type);
    return m.roundsSinceLastMaintenance > interval;
  }).length;
  const totalCapacity = machines
    .filter((m) => m.status === "operational")
    .reduce((sum, m) => sum + m.capacityUnits, 0);
  const totalMaintCost = machines.reduce(
    (sum, m) => sum + m.maintenanceCostPerRound,
    0
  );

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Cog className="w-4 h-4 text-cyan-400" />
          Machine Fleet
          <Badge className="bg-cyan-500/20 text-cyan-400 text-[10px] ml-auto">
            {machines.length} machines
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status distribution */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-slate-700/40 rounded">
            <div className="text-lg font-bold text-green-400">{operational}</div>
            <div className="text-[10px] text-slate-400">Running</div>
          </div>
          <div className="text-center p-2 bg-slate-700/40 rounded">
            <div className={`text-lg font-bold ${inMaintenance > 0 ? "text-yellow-400" : "text-slate-500"}`}>
              {inMaintenance}
            </div>
            <div className="text-[10px] text-slate-400">Service</div>
          </div>
          <div className="text-center p-2 bg-slate-700/40 rounded">
            <div className={`text-lg font-bold ${broken > 0 ? "text-red-400" : "text-slate-500"}`}>
              {broken}
            </div>
            <div className="text-[10px] text-slate-400">Broken</div>
          </div>
          <div className="text-center p-2 bg-slate-700/40 rounded">
            <div className={`text-lg font-bold ${offline > 0 ? "text-slate-400" : "text-slate-500"}`}>
              {offline}
            </div>
            <div className="text-[10px] text-slate-400">Offline</div>
          </div>
        </div>

        {/* Avg health bar */}
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-400 w-16">Avg Health</span>
          <div className="flex-1">
            <EnhancedProgress
              value={avgHealth}
              variant={avgHealth >= 70 ? "success" : avgHealth >= 40 ? "warning" : "danger"}
              size="sm"
            />
          </div>
          <span
            className={`text-xs font-medium tabular-nums ${
              avgHealth >= 70 ? "text-green-400" : avgHealth >= 40 ? "text-yellow-400" : "text-red-400"
            }`}
          >
            {avgHealth.toFixed(0)}%
          </span>
        </div>

        {/* Summary row */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-700/50">
          <span>{totalCapacity.toLocaleString()} units capacity</span>
          <span>{formatCurrency(totalMaintCost)}/rd maint.</span>
        </div>

        {/* Warnings */}
        {overdueCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded p-2">
            <Wrench className="w-3.5 h-3.5 shrink-0" />
            <span>{overdueCount} machine(s) overdue for maintenance</span>
          </div>
        )}
        {broken > 0 && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{broken} machine(s) broken down — production impacted</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
