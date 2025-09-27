"use client"

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"

export interface DonutDatum {
  label: string
  value: number
  color?: string
}

export function PieDonut({
  data,
  height = 220,
  valueFormatter = (v: number) => `${v.toFixed(2)} h`,
  colors = [
    "#7c3aed", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#84cc16",
  ],
}: {
  data: DonutDatum[]
  height?: number
  valueFormatter?: (v: number) => string
  colors?: string[]
}) {
  const sum = data.reduce((a, b) => a + (b.value || 0), 0)
  const series = data.map((d, i) => ({ name: d.label, value: d.value, fill: d.color || colors[i % colors.length] }))

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            dataKey="value"
            data={series}
            innerRadius={60}
            outerRadius={90}
            strokeWidth={1}
          >
            {series.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any, name: any) => [valueFormatter(Number(value)), name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 text-center text-xs text-muted-foreground">Total: {valueFormatter(sum)}</div>
    </div>
  )
}

export default PieDonut


