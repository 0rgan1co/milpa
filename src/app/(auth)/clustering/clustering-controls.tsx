"use client";

import { useState } from "react";
import { runClustering } from "@/server/actions/clustering-actions";
import { SemanticMap } from "@/components/features/clustering/SemanticMap";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { RefreshCw, Play, Info } from "lucide-react";

export function ClusteringControls({
  projectId,
  initialRun,
}: {
  projectId: string;
  initialRun: any;
}) {
  const [run, setRun] = useState(initialRun);
  const [loading, setLoading] = useState(false);

  // Parameters
  const [neighbors, setNeighbors] = useState(15);
  const [minDist, setMinDist] = useState(0.1);
  const [threshold, setThreshold] = useState(0.2);
  const [minClusterSize, setMinClusterSize] = useState(5);

  const handleRun = async () => {
    setLoading(true);
    try {
      const result = await runClustering(projectId, {
        neighbors,
        minDist,
        threshold,
        minClusterSize,
      });
      // In a real app we'd redirect or fetch specific run
      window.location.href = `/clustering?projectId=${projectId}&runId=${result.runId}`;
    } catch (err: any) {
      alert(
        err.message ||
          "Clustering failed. Make sure you have enough narratives.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar Controls */}
      <div className="space-y-6">
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            Parameters
            <Info className="h-4 w-4 text-muted-foreground" />
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label>Neighbors</label>
              <span>{neighbors}</span>
            </div>
            <Slider
              value={[neighbors]}
              onValueChange={([v]: number[]) => setNeighbors(v)}
              min={2}
              max={50}
              step={1}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label>Min Distance</label>
              <span>{minDist.toFixed(2)}</span>
            </div>
            <Slider
              value={[minDist]}
              onValueChange={([v]: number[]) => setMinDist(v)}
              min={0}
              max={1}
              step={0.01}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label>Similarity Threshold</label>
              <span>{threshold.toFixed(2)}</span>
            </div>
            <Slider
              value={[threshold]}
              onValueChange={([v]: number[]) => setThreshold(v)}
              min={0.01}
              max={2}
              step={0.01}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label>Min Cluster Size</label>
              <span>{minClusterSize}</span>
            </div>
            <Slider
              value={[minClusterSize]}
              onValueChange={([v]: number[]) => setMinClusterSize(v)}
              min={2}
              max={20}
              step={1}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label>Min Distance</label>
              <span>{minDist.toFixed(2)}</span>
            </div>
            <Slider
              value={[minDist]}
              onValueChange={([v]) => setMinDist(v)}
              min={0}
              max={1}
              step={0.01}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label>Similarity Threshold</label>
              <span>{threshold.toFixed(2)}</span>
            </div>
            <Slider
              value={[threshold]}
              onValueChange={([v]) => setThreshold(v)}
              min={0.01}
              max={2}
              step={0.01}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label>Min Cluster Size</label>
              <span>{minClusterSize}</span>
            </div>
            <Slider
              value={[minClusterSize]}
              onValueChange={([v]) => setMinClusterSize(v)}
              min={2}
              max={20}
              step={1}
              disabled={loading}
            />
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleRun}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {run ? "Re-run Clustering" : "Run Clustering"}
          </Button>
        </Card>

        {run && (
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Run Details</h3>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Clusters:</span>
                <span className="text-foreground font-medium">
                  {run.clusterCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Narratives:</span>
                <span className="text-foreground font-medium">
                  {run.narrativeCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(run.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Main Map View */}
      <div className="lg:col-span-3 space-y-6">
        {run ? (
          <>
            <SemanticMap
              coordinates={run.umapCoordinates}
              narratives={run.clusters.flatMap((c: any) =>
                c.narratives.map((cn: any) => cn.narrative),
              )}
              clusters={run.clusters}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {run.clusters.map((c: any) => (
                <Card
                  key={c.id}
                  className="p-4 border-l-4"
                  style={{ borderLeftColor: "#3b82f6" }}
                >
                  <h4 className="font-bold text-sm">{c.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {c.summary}
                  </p>
                  <div className="flex justify-between items-center mt-3 text-[10px]">
                    <span className="bg-secondary px-2 py-0.5 rounded">
                      {c.narratives.length} narratives
                    </span>
                    <span>{c.popularity.toFixed(1)}% weight</span>
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-xl p-12 text-center text-muted-foreground">
            <div className="bg-muted p-4 rounded-full mb-4">
              <Play className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium text-foreground">
              Ready to Cluster
            </h3>
            <p className="max-w-xs mt-2">
              Adjust the parameters on the left and run the analysis to discover
              semantic patterns.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
