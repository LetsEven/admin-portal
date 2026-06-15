export type ArtifactType = "chart" | "metric";

export interface ChartSeries {
  key: string;
  label: string;
  color?: string;
}

export interface ChartPayload {
  chartType: "bar" | "line" | "area" | "pie" | "composed";
  title?: string;
  subtitle?: string;
  data: Record<string, unknown>[];
  xKey: string;
  series: ChartSeries[];
  unit?: string;
  stacked?: boolean;
}

export interface MetricItem {
  label: string;
  value: string | number;
  unit?: string;
  change?: number;
  trend?: "up" | "down" | "neutral";
  description?: string;
}

export interface MetricPayload {
  metrics: MetricItem[];
}

export interface Artifact {
  id: string;
  type: ArtifactType;
  payload: ChartPayload | MetricPayload;
}
