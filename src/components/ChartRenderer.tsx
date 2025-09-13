"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

export type ChartSpec = {
  type: "bar" | "pie" | "line";
  title?: string;
  xKey?: string;
  yKey?: string;
  data: Array<{ name: string; value: number } & Record<string, any>>;
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "#a78bfa",
  "#fbbf24",
  "#34d399",
  "#f472b6",
  "#22d3ee",
];

export interface ChartRendererProps {
  spec: ChartSpec;
  className?: string;
  height?: number;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({ spec, className = "", height = 260 }) => {
  const xKey = spec.xKey || "name";
  const yKey = spec.yKey || "value";

  return (
    <div className={`w-full rounded-lg overflow-hidden ${className}`}>
      {spec.title && (
        <div className="text-lg font-semibold mb-3 text-foreground">{spec.title}</div>
      )}
      <div className="w-full" style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          {spec.type === "bar" ? (
            <BarChart data={spec.data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                strokeOpacity={0.3}
              />
              <XAxis 
                dataKey={xKey} 
                stroke="hsl(var(--muted-foreground))" 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip 
                content={(props) => (
                  <div className="glass-premium rounded-lg p-3 text-sm shadow-lg">
                    <div className="text-foreground font-medium mb-1">{props.payload?.[0]?.payload[xKey]}</div>
                    <div className="text-foreground/80">
                      {yKey}: <span className="text-primary font-medium">{props.payload?.[0]?.value}</span>
                    </div>
                  </div>
                )}
              />
              <Bar 
                dataKey={yKey} 
                fill="hsl(var(--primary))" 
                radius={[6, 6, 0, 0]} 
                animationDuration={1200}
              />
            </BarChart>
          ) : spec.type === "pie" ? (
            <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <Pie 
                data={spec.data} 
                dataKey={yKey} 
                nameKey={xKey} 
                outerRadius={90} 
                innerRadius={50} 
                paddingAngle={4}
                animationDuration={1200}
              >
                {spec.data.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                content={(props) => (
                  <div className="glass-premium rounded-lg p-3 text-sm shadow-lg">
                    <div className="text-foreground font-medium">{props.payload?.[0]?.name}</div>
                    <div className="text-foreground/80">
                      Value: <span className="text-primary font-medium">{props.payload?.[0]?.value}</span>
                    </div>
                  </div>
                )}
              />
              <Legend 
                verticalAlign="bottom" 
                height={30}
                wrapperStyle={{ color: "hsl(var(--foreground))", fontSize: "12px" }}
              />
            </PieChart>
          ) : (
            <LineChart data={spec.data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                strokeOpacity={0.3}
              />
              <XAxis 
                dataKey={xKey} 
                stroke="hsl(var(--muted-foreground))" 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip 
                content={(props) => (
                  <div className="glass-premium rounded-lg p-3 text-sm shadow-lg">
                    <div className="text-foreground font-medium mb-1">{props.payload?.[0]?.payload[xKey]}</div>
                    <div className="text-foreground/80">
                      {yKey}: <span className="text-primary font-medium">{props.payload?.[0]?.value}</span>
                    </div>
                  </div>
                )}
              />
              <Line 
                type="monotone" 
                dataKey={yKey} 
                stroke="hsl(var(--primary))" 
                strokeWidth={2} 
                dot={{ r: 3, stroke: "hsl(var(--primary))", fill: "hsl(var(--background))", strokeWidth: 2 }} 
                activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
                animationDuration={1200}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartRenderer;