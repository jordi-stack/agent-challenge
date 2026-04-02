"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FloatingCard } from "./floating-card";

interface HistoryPoint {
  time: string;
  latency: number;
}

const chartTooltipStyle = {
  backgroundColor: "#0a0f1a",
  border: "1px solid #0f1f1a",
  borderRadius: "8px",
  fontSize: "12px",
};

export default function InfraCharts({ history }: { history: HistoryPoint[] }) {
  return (
    <FloatingCard>
      <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">
        Latency (ms) - Live
      </h3>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#0f1f1a" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "#71717a" }}
              tickLine={false}
              axisLine={{ stroke: "#0f1f1a" }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#71717a" }}
              tickLine={false}
              axisLine={{ stroke: "#0f1f1a" }}
              width={35}
            />
            <Tooltip contentStyle={chartTooltipStyle} />
            <Line
              type="monotone"
              dataKey="latency"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#10b981" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </FloatingCard>
  );
}
