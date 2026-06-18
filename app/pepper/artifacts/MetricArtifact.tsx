"use client";

import type { MetricPayload, MetricItem } from "./types";

function safeStr(s: unknown): string {
  if (typeof s !== "string") return String(s ?? "");
  return s.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
}

function formatValue(item: MetricItem): string {
  const v = item.value;
  if (typeof v === "string") return v;
  const n = Number(v);
  if (isNaN(n)) return String(v);
  if (item.unit === "MXN" || item.unit === "$") {
    // Mostrar el monto completo con separadores; abreviar solo de millones en
    // adelante. Evita que $5,554.96 se deforme a "$6K".
    return Math.abs(n) >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(2)}M`
      : n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  }
  if (item.unit === "%") return `${n.toFixed(1)}%`;
  return Math.abs(n) >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n.toLocaleString("es-MX", { maximumFractionDigits: 2 });
}

function TrendArrow({ trend, change }: { trend?: string; change?: number }) {
  const isUp = trend === "up" || (trend == null && (change ?? 0) >= 0);
  const isDown = trend === "down" || (trend == null && (change ?? 0) < 0);

  if (isUp)
    return (
      <svg
        className="w-3 h-3"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M2 9L6 3L10 9" />
      </svg>
    );
  if (isDown)
    return (
      <svg
        className="w-3 h-3"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M2 3L6 9L10 3" />
      </svg>
    );
  return null;
}

function MetricCard({ item }: { item: MetricItem }) {
  const changePos = (item.change ?? 0) >= 0;
  const changeColor =
    item.trend === "down"
      ? changePos
        ? "text-red-500"
        : "text-[#173E44]"
      : changePos
        ? "text-[#173E44]"
        : "text-red-500";

  return (
    <div className="flex flex-col gap-1 bg-white border-r border-gray-100 last:border-r-0 px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 leading-tight">
        {safeStr(item.label)}
      </p>
      <div className="flex items-baseline gap-1.5 mt-0.5">
        <span className="text-2xl font-bold text-gray-900 leading-none tracking-tight tabular-nums">
          {formatValue(item)}
        </span>
        {item.unit && !["MXN", "$", "%"].includes(item.unit) && (
          <span className="text-xs text-gray-400 font-medium">{item.unit}</span>
        )}
      </div>
      {item.change !== undefined && (
        <p className={`text-[11px] font-semibold flex items-center gap-0.5 ${changeColor} mt-0.5`}>
          <TrendArrow trend={item.trend} change={item.change} />
          {item.change >= 0 ? "+" : ""}
          {item.change.toFixed(1)}%
          {item.description && (
            <span className="text-gray-400 font-normal ml-1">
              {safeStr(item.description)}
            </span>
          )}
        </p>
      )}
      {item.change === undefined && item.description && (
        <p className="text-[10px] text-gray-400 leading-snug mt-0.5">
          {safeStr(item.description)}
        </p>
      )}
    </div>
  );
}

export function MetricArtifact({ payload }: { payload: MetricPayload }) {
  const { metrics } = payload;
  if (!metrics?.length) return null;

  const cols =
    metrics.length <= 2
      ? 2
      : metrics.length === 3
        ? 3
        : metrics.length === 4
          ? 4
          : 3;

  return (
    <div
      className="bg-white border border-gray-100 rounded-xl overflow-hidden w-full grid animate-in fade-in slide-in-from-bottom-2 duration-500"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {metrics.map((m, i) => (
        <MetricCard key={i} item={m} />
      ))}
    </div>
  );
}
