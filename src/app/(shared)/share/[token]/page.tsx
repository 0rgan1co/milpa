import { getShareLinkByToken } from "@/server/services/share-links";
import { notFound } from "next/navigation";
import { SemanticMap } from "@/components/features/clustering/SemanticMap";
import { Card } from "@/components/ui/card";

type SharedNarrative = {
  id: string;
  text: string;
  sentiment: number;
  abstraction: number;
};

type SharedCluster = {
  id: string;
  name: string;
  summary: string | null;
  averageSentiment: number | null;
  labelIndex: number;
  narratives: Array<{ narrative: SharedNarrative }>;
};

export default async function SharedProjectPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const link = await getShareLinkByToken(token);

  if (!link) notFound();

  const { project, clusteringRun } = link;
  const clusters = (clusteringRun?.clusters ?? []) as SharedCluster[];
  const narratives = clusters.flatMap((cluster) =>
    cluster.narratives.map((item) => item.narrative),
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
        <p className="text-muted-foreground mt-1">
          Shared project insights and discovery data.
        </p>
      </div>

      {/* Metrics (Simplified for viewer) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 text-center">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Themes
          </p>
          <div className="text-3xl font-bold mt-2">
            {clusteringRun?.clusterCount || 0}
          </div>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Stories
          </p>
          <div className="text-3xl font-bold mt-2">
            {clusteringRun?.narrativeCount || 0}
          </div>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Analysis Status
          </p>
          <div className="text-3xl font-bold mt-2 text-green-500 uppercase text-sm tracking-widest">
            Active
          </div>
        </Card>
      </div>

      {clusteringRun ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold">Semantic Map</h2>
            <SemanticMap
              coordinates={
                clusteringRun.umapCoordinates as Record<
                  string,
                  [number, number]
                >
              }
              narratives={narratives}
              clusters={clusters}
            />
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Top Clusters</h2>
            <div className="space-y-4">
              {clusters.map((c) => (
                <Card
                  key={c.id}
                  className="p-4 border-l-4"
                  style={{ borderLeftColor: "#3b82f6" }}
                >
                  <h4 className="font-bold text-sm">{c.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.summary}
                  </p>
                  <div className="flex justify-between items-center mt-3 text-[10px]">
                    <span className="bg-secondary px-2 py-0.5 rounded">
                      {c.narratives.length} narratives
                    </span>
                    <span>
                      Sentiment: {c.averageSentiment?.toFixed(1) ?? "N/A"}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 border-2 border-dashed rounded-xl text-center text-muted-foreground">
          No clustering data available for this view.
        </div>
      )}
    </div>
  );
}
