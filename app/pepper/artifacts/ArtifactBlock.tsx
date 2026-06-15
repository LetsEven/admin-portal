"use client";

import type { Artifact, ChartPayload, MetricPayload } from "./types";
import { ChartArtifact } from "./ChartArtifact";
import { MetricArtifact } from "./MetricArtifact";

export function ArtifactBlock({ artifact }: { artifact: Artifact }) {
  try {
    switch (artifact.type) {
      case "chart":
        return <ChartArtifact payload={artifact.payload as ChartPayload} />;
      case "metric":
        return <MetricArtifact payload={artifact.payload as MetricPayload} />;
      default:
        return null;
    }
  } catch {
    return (
      <p className="text-xs text-gray-400 italic px-1">
        No se pudo renderizar la visualización.
      </p>
    );
  }
}
