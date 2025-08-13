"use client"

import { useMemo, useRef, useState } from "react"

type Point = { x: number; y: number; label: string }

export function SmoothLineChart({
  width = 720,
  height = 200,
  data,
  stroke = "hsl(var(--primary))",
  fill = "hsl(var(--primary) / 0.18)",
  strokeWidth = 2,
  valueFormatter = (y: number) => `${y}`,
  className,
}: {
  width?: number
  height?: number
  data: Point[]
  stroke?: string
  fill?: string
  strokeWidth?: number
  valueFormatter?: (y: number) => string
  className?: string
}) {
  const padding = 28
  const [hover, setHover] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { points, path, areaPath, yTicks, xTicks, yMin, yMax } = useMemo(() => {
    const xs = data.map((p, i) => i)
    const ys = data.map((p) => p.y)
    const minX = 0
    const maxX = Math.max(1, data.length - 1)
    const minY = Math.min(0, ...ys)
    const maxY = Math.max(1, ...ys)
    const scaleX = (x: number) => padding + ((x - minX) / (maxX - minX || 1)) * (width - padding * 2)
    const scaleY = (y: number) => height - padding - ((y - minY) / (maxY - minY || 1)) * (height - padding * 2)

    const pts = xs.map((x, i) => ({ X: scaleX(x), Y: scaleY(ys[i]), label: data[i].label, rawX: x, rawY: ys[i] }))

    const d: string[] = []
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]
      if (i === 0) {
        d.push(`M ${p.X} ${p.Y}`)
      } else {
        const prev = pts[i - 1]
        const cpx = (prev.X + p.X) / 2
        d.push(`C ${cpx} ${prev.Y}, ${cpx} ${p.Y}, ${p.X} ${p.Y}`)
      }
    }
    const pathStr = d.join(" ")
    const area = `${pathStr} L ${pts[pts.length - 1].X} ${height - padding} L ${pts[0].X} ${height - padding} Z`

    // y ticks (4 lines)
    const steps = 4
    const yTicks = Array.from({ length: steps + 1 }, (_, i) => {
      const t = i / steps
      const val = minY + (maxY - minY) * (1 - t)
      return { y: scaleY(val), value: val }
    })
    // x ticks: adaptive downsampling to avoid overlap
    const n = data.length
    const available = width - padding * 2
    const approxLabel = 28 // px per label
    const step = Math.max(1, Math.ceil((n * approxLabel) / Math.max(1, available)))
    const xTicks = Array.from({ length: n }, (_, i) => i).filter((i) => i % step === 0 || i === n - 1)
    return { points: pts, path: pathStr, areaPath: area, yTicks, xTicks, yMin: minY, yMax: maxY }
  }, [data, width, height])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || points.length === 0) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    // find nearest point by screen X
    let nearest = 0
    let best = Infinity
    for (let i = 0; i < points.length; i++) {
      const dx = Math.abs(points[i].X - x)
      if (dx < best) {
        best = dx
        nearest = i
      }
    }
    setHover(nearest)
  }

  const handleLeave = () => setHover(null)

  return (
    <div ref={containerRef} className={className} style={{ position: "relative" }} onMouseMove={handleMouseMove} onMouseLeave={handleLeave}>
      <svg width={width} height={height} style={{ filter: "drop-shadow(0 10px 22px hsl(var(--primary) / 0.12))" }}>
        <defs>
          <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={fill} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="hsl(var(--primary) / 0.35)" flood-opacity="1" />
          </filter>
        </defs>
        {/* grid */}
        {yTicks.map((t, i) => (
          <g key={`g-${i}`}>
            <line x1={padding} x2={width - padding} y1={t.y} y2={t.y} stroke="hsl(var(--muted-foreground) / 0.15)" strokeDasharray="4 4" />
            <text x={8} y={t.y + 4} fontSize={10} fill="hsl(var(--muted-foreground))">{valueFormatter(Number(Math.max(0, t.value).toFixed(1)))}</text>
          </g>
        ))}
        {/* x labels */}
        {xTicks.map((i, idx) => (
          <text key={`x-${idx}`} x={points[i]?.X || padding} y={height - 6} fontSize={10} textAnchor="middle" fill="hsl(var(--muted-foreground))">
            {data[i]?.label || ""}
          </text>
        ))}

        {areaPath && <path d={areaPath} fill="url(#grad)" opacity={1} />}
        {path && (
          <path
            d={path}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ transition: "d 300ms ease" }}
            filter="url(#lineGlow)"
          />
        )}

        {/* hover marker */}
        {hover !== null && points[hover] && (
          <g>
            <line x1={points[hover].X} x2={points[hover].X} y1={padding} y2={height - padding} stroke="hsl(var(--primary) / 0.25)" />
            <circle cx={points[hover].X} cy={points[hover].Y} r={5} fill={stroke} />
            <circle cx={points[hover].X} cy={points[hover].Y} r={10} fill={stroke} opacity={0.2} />
          </g>
        )}
      </svg>
      {/* tooltip */}
      {hover !== null && points[hover] && (
        <div
          style={{ position: "absolute", left: points[hover].X + 12, top: points[hover].Y - 10 }}
          className="pointer-events-none rounded-md border bg-background px-2 py-1 text-xs shadow-md"
        >
          <div className="font-medium">{data[hover].label}</div>
          <div className="text-muted-foreground">{valueFormatter(points[hover].rawY)}</div>
        </div>
      )}
    </div>
  )
}


