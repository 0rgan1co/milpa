"use client";

import { cn } from "@/lib/utils";

interface HeatmapData {
  label: string;
  sentiment: number;
  narrativeCount: number;
}

interface SentimentHeatmapProps {
  data: HeatmapData[];
  title: string;
}

export function SentimentHeatmap({ data, title }: SentimentHeatmapProps) {
  // Sort data by label
  const sortedData = [...data].sort((a, b) => a.label.localeCompare(b.label));

  const getColor = (sentiment: number) => {
    // sentiment is -2 to 2
    if (sentiment > 1) return "bg-green-600 text-white";
    if (sentiment > 0.3) return "bg-green-200 text-green-800";
    if (sentiment > -0.3) return "bg-blue-100 text-blue-800";
    if (sentiment > -1) return "bg-red-200 text-red-800";
    return "bg-red-600 text-white";
  };

  const getLabel = (sentiment: number) => {
    if (sentiment > 1) return "Very Positive";
    if (sentiment > 0.3) return "Positive";
    if (sentiment > -0.3) return "Neutral";
    if (sentiment > -1) return "Negative";
    return "Very Negative";
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedData.map((item) => (
          <div
            key={item.label}
            className="border rounded-lg p-4 flex justify-between items-center bg-card"
          >
            <div>
              <div className="font-bold">{item.label}</div>
              <div className="text-xs text-muted-foreground">
                {item.narrativeCount} narratives
              </div>
            </div>
            <div
              className={cn(
                "px-3 py-1 rounded-full text-xs font-bold",
                getColor(item.sentiment),
              )}
            >
              {item.sentiment.toFixed(1)}
            </div>
          </div>
        ))}
      </div>
      {sortedData.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-xl text-muted-foreground">
          No demographic data available for this category.
        </div>
      )}
    </div>
  );
}
