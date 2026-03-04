"use client";

import { ResponsiveContainer, LineChart, Line, YAxis } from "recharts";

interface MiniSparklineProps {
  /** Array of numeric values (one per round) */
  data: number[];
  /** Stroke color (default slate) */
  color?: string;
  /** Height in pixels (default 24) */
  height?: number;
  /** Whether positive trend is good (green) or bad (red) — auto-colors last segment */
  positiveIsGood?: boolean;
}

export function MiniSparkline({
  data,
  color,
  height = 24,
  positiveIsGood,
}: MiniSparklineProps) {
  if (data.length < 2) return null;

  // Auto-color based on trend of last two points
  let strokeColor = color ?? "#94a3b8"; // slate-400
  if (!color && positiveIsGood !== undefined && data.length >= 2) {
    const last = data[data.length - 1];
    const prev = data[data.length - 2];
    if (last > prev) {
      strokeColor = positiveIsGood ? "#34d399" : "#f87171"; // emerald-400 / red-400
    } else if (last < prev) {
      strokeColor = positiveIsGood ? "#f87171" : "#34d399";
    }
  }

  const chartData = data.map((v, i) => ({ v, i }));

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis domain={["auto", "auto"]} hide />
          <Line
            type="monotone"
            dataKey="v"
            stroke={strokeColor}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
