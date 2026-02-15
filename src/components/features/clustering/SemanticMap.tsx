"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Narrative } from "@/lib/types/narrative";

interface SemanticMapProps {
  coordinates: Record<string, [number, number]>;
  narratives: any[];
  clusters: any[];
  onNarrativeClick?: (narrative: any) => void;
}

export function SemanticMap({
  coordinates,
  narratives,
  clusters,
  onNarrativeClick,
}: SemanticMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || narratives.length === 0) return;

    const width = 800;
    const height = 600;
    const padding = 40;

    // Clear SVG
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "auto")
      .attr("role", "img")
      .attr(
        "aria-label",
        "Semantic map of interview narratives clustered by theme",
      );

    // Tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr(
        "class",
        "absolute hidden bg-popover text-popover-foreground p-2 rounded shadow-md text-xs pointer-events-none max-w-xs border",
      )
      .style("z-index", "100");

    // Scales
    const xExtent = d3.extent(Object.values(coordinates), (d) => d[0]) as [
      number,
      number,
    ];
    const yExtent = d3.extent(Object.values(coordinates), (d) => d[1]) as [
      number,
      number,
    ];

    const xScale = d3
      .scaleLinear()
      .domain(xExtent)
      .range([padding, width - padding]);

    const yScale = d3
      .scaleLinear()
      .domain(yExtent)
      .range([height - padding, padding]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Zoom behavior
    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 10])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Map narratives to data points
    const dataPoints = narratives.map((n) => {
      const coord = coordinates[n.id] || [0, 0];
      const cluster = clusters.find((c) =>
        c.narratives.some((cn: any) => cn.narrativeId === n.id),
      );
      return {
        ...n,
        x: xScale(coord[0]),
        y: yScale(coord[1]),
        clusterColor: cluster
          ? colorScale(cluster.labelIndex.toString())
          : "#94a3b8",
        clusterName: cluster ? cluster.name : "Unclustered",
      };
    });

    // Draw points
    g.selectAll("circle")
      .data(dataPoints)
      .enter()
      .append("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", 6)
      .attr("fill", (d) => d.clusterColor)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("class", "cursor-pointer transition-transform hover:scale-150")
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip
          .html(
            `
          <div class="font-bold">${d.clusterName}</div>
          <div class="mt-1">${d.text.substring(0, 100)}${d.text.length > 100 ? "..." : ""}</div>
          <div class="mt-1 text-[10px] opacity-70">Sentiment: ${d.sentiment.toFixed(1)} | Abstraction: ${d.abstraction}</div>
        `,
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px")
          .classed("hidden", false);

        d3.select(event.currentTarget).attr("r", 10).attr("stroke", "#000");
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", (event) => {
        tooltip
          .transition()
          .duration(500)
          .style("opacity", 0)
          .on("end", () => tooltip.classed("hidden", true));
        d3.select(event.currentTarget).attr("r", 6).attr("stroke", "#fff");
      })
      .on("click", (event, d) => {
        if (onNarrativeClick) onNarrativeClick(d);
      });

    return () => {
      tooltip.remove();
    };
  }, [coordinates, narratives, clusters, onNarrativeClick]);

  return (
    <div className="relative border rounded-xl bg-background/50 overflow-hidden shadow-inner aspect-[4/3] w-full">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-background/80 p-2 rounded-lg border text-[10px] backdrop-blur-sm">
        <div className="font-bold mb-1">Clusters</div>
        {clusters.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: d3.scaleOrdinal(d3.schemeCategory10)(
                  c.labelIndex.toString(),
                ),
              }}
            />
            <span className="truncate max-w-[120px]">{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
