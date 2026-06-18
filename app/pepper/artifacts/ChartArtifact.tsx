"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ChartPayload } from "./types";

// Palette aligned with Even/Pepper brand (dark teal primary, purple accent)
const PALETTE = [
  "#173E44",
  "#2A5A62",
  "#ebb2f4",
  "#5BA3B0",
  "#3D7A85",
  "#94A3B8",
];

function safeStr(s: unknown): string {
  if (typeof s !== "string") return "";
  return s.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
}

function color(series: { color?: string }, idx: number) {
  return series.color ?? PALETTE[idx % PALETTE.length];
}

// Formato compacto para los ejes (poco espacio). Usa 1 decimal en K para no
// deformar montos (ej. $5.6K en vez de redondear $5,554.96 a "$6K").
function fmtAxis(value: unknown, unit?: string): string {
  const n = Number(value);
  if (isNaN(n)) return String(value);
  if (unit === "MXN" || unit === "$") {
    return n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(1)}K`
        : `$${n.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;
  }
  if (unit === "%") return `${n.toFixed(1)}%`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("es-MX", { maximumFractionDigits: 0 });
}

// Formato exacto para los tooltips (al hacer hover quieres el número real).
function fmtFull(value: unknown, unit?: string): string {
  const n = Number(value);
  if (isNaN(n)) return String(value);
  if (unit === "MXN" || unit === "$")
    return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  if (unit === "%") return `${n.toFixed(1)}%`;
  return n.toLocaleString("es-MX", { maximumFractionDigits: 2 });
}

function CustomTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md text-xs">
      <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5">
        {label}
      </p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2 text-gray-700">
          <span
            className="inline-block w-2 h-2 shrink-0 rounded-sm"
            style={{ background: p.color }}
          />
          <span className="text-gray-400">{p.name}:</span>
          <span className="font-semibold tabular-nums">
            {fmtFull(p.value, unit)}
            {unit && !["MXN", "$", "%"].includes(unit) ? ` ${unit}` : ""}
          </span>
        </p>
      ))}
    </div>
  );
}

export function ChartArtifact({ payload }: { payload: ChartPayload }) {
  const { chartType, title, subtitle, data, xKey, series, unit, stacked } =
    payload;

  if (!data?.length || !series?.length) {
    return (
      <p className="text-xs text-gray-400 italic">Sin datos para graficar.</p>
    );
  }

  const axisStyle = { fontSize: 10, fill: "#94A3B8", fontWeight: 400 };
  const gridColor = "#F1F5F9";
  const height = 260;
  const margin = { top: 8, right: 4, bottom: 4, left: 4 };
  const displayTitle = title ? safeStr(title) : undefined;
  const displaySubtitle = subtitle ? safeStr(subtitle) : undefined;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
      {displayTitle && (
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
          {displayTitle}
        </p>
      )}
      {displaySubtitle && (
        <p className="text-xs text-gray-400 mb-3">{displaySubtitle}</p>
      )}

      <ResponsiveContainer width="100%" height={height}>
        {chartType === "pie" ? (
          <PieChart>
            <Pie
              data={data}
              dataKey={series[0].key}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={48}
              paddingAngle={2}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip unit={unit} />} />
          </PieChart>
        ) : chartType === "line" ? (
          <LineChart data={data} margin={margin}>
            <CartesianGrid vertical={false} stroke={gridColor} />
            <XAxis
              dataKey={xKey}
              tick={axisStyle}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={axisStyle}
              tickFormatter={(v) => fmtAxis(v, unit)}
              width={52}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            {series.length > 1 && (
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: 10, color: "#94A3B8" }}
              />
            )}
            {series.map((s, i) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={safeStr(s.label)}
                stroke={color(s, i)}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        ) : chartType === "area" ? (
          <AreaChart data={data} margin={margin}>
            <CartesianGrid vertical={false} stroke={gridColor} />
            <XAxis
              dataKey={xKey}
              tick={axisStyle}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={axisStyle}
              tickFormatter={(v) => fmtAxis(v, unit)}
              width={52}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            {series.length > 1 && (
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: 10, color: "#94A3B8" }}
              />
            )}
            {series.map((s, i) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={safeStr(s.label)}
                stroke={color(s, i)}
                fill={color(s, i)}
                fillOpacity={0.1}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        ) : chartType === "composed" ? (
          <ComposedChart data={data} margin={margin}>
            <CartesianGrid vertical={false} stroke={gridColor} />
            <XAxis
              dataKey={xKey}
              tick={axisStyle}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={axisStyle}
              tickFormatter={(v) => fmtAxis(v, unit)}
              width={52}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            {series.length > 1 && (
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: 10, color: "#94A3B8" }}
              />
            )}
            {series.map((s, i) =>
              i === 0 ? (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={safeStr(s.label)}
                  fill={color(s, i)}
                  radius={[2, 2, 0, 0]}
                  maxBarSize={40}
                />
              ) : (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={safeStr(s.label)}
                  stroke={color(s, i)}
                  strokeWidth={2}
                  dot={false}
                />
              ),
            )}
          </ComposedChart>
        ) : (
          // Default: bar
          <BarChart data={data} margin={margin}>
            <CartesianGrid vertical={false} stroke={gridColor} />
            <XAxis
              dataKey={xKey}
              tick={axisStyle}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={axisStyle}
              tickFormatter={(v) => fmtAxis(v, unit)}
              width={52}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            {series.length > 1 && (
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: 10, color: "#94A3B8" }}
              />
            )}
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={safeStr(s.label)}
                fill={color(s, i)}
                stackId={stacked ? "stack" : undefined}
                radius={stacked ? undefined : [2, 2, 0, 0]}
                maxBarSize={40}
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
