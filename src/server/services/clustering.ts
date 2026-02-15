import { db } from "@/server/db";
import {
  clusteringRuns,
  clusters,
  clusterNarratives,
  narratives,
  projects,
} from "@/server/db/schema";
import { eq, inArray } from "drizzle-orm";
import { reduceDimensions } from "./clustering/umap";
import { performDBSCAN } from "./clustering/dbscan";
import {
  calculatePopularity,
  calculateAverageSentiment,
} from "./clustering/metrics";
import { describeCluster } from "@/server/ai/cluster-namer";

export interface ClusteringParameters {
  neighbors: number;
  minDist: number;
  minClusterSize: number;
  threshold: number;
}

export async function runClustering(
  projectId: string,
  params: ClusteringParameters,
) {
  // 0. Get project context
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });
  const locale = project?.locale || "es";

  // 1. Get all narratives with embeddings for the project
  const projectNarratives = await db.query.narratives.findMany({
    where: eq(narratives.projectId, projectId),
  });

  if (projectNarratives.length < params.minClusterSize) {
    throw new Error("NOT_ENOUGH_DATA");
  }

  // Filter out narratives without embeddings
  const validNarratives = projectNarratives.filter(
    (n) => n.embedding && n.embedding.length > 0,
  );
  const data = validNarratives.map((n) => n.embedding as number[]);
  const ids = validNarratives.map((n) => n.id);
  const sentiments = validNarratives.map((n) => n.sentiment);
  const texts = validNarratives.map((n) => n.text);

  // 2. Run UMAP (Phase 1 Refactor)
  const coords = await reduceDimensions(data, params.neighbors, params.minDist);

  const umapCoordinates: Record<string, [number, number]> = {};
  coords.forEach((coord, i) => {
    umapCoordinates[ids[i]] = [coord[0], coord[1]];
  });

  // 3. Create Clustering Run
  const [run] = await db
    .insert(clusteringRuns)
    .values({
      projectId,
      status: "processing",
      parameters: params,
      umapCoordinates,
      narrativeCount: validNarratives.length,
      startedAt: new Date(),
    })
    .returning();

  // 4. Clustering (Phase 2 Refactor)
  const labels = performDBSCAN(coords, params.threshold, params.minClusterSize);

  // Group by labels
  const clustersMap = new Map<
    number,
    { ids: string[]; sentiments: number[]; texts: string[] }
  >();
  labels.forEach((label, i) => {
    if (label === -1) return; // Noise
    if (!clustersMap.has(label)) {
      clustersMap.set(label, { ids: [], sentiments: [], texts: [] });
    }
    clustersMap.get(label)!.ids.push(ids[i]);
    clustersMap.get(label)!.sentiments.push(sentiments[i]);
    clustersMap.get(label)!.texts.push(texts[i]);
  });

  // 5. Create Clusters and naming
  const createdClusters = [];
  for (const [label, members] of clustersMap.entries()) {
    // Generate AI description
    let name = `Cluster ${label + 1}`;
    let summary = "";

    try {
      // Pick top 15 narratives for naming
      const sample = members.texts.slice(0, 15);
      const description = await describeCluster(sample, locale);
      name = description.name;
      summary = description.summary;
    } catch (error) {
      console.error("Naming error:", error);
    }

    // Metrics (Phase 3 Refactor)
    const popularity = calculatePopularity(
      members.ids.length,
      validNarratives.length,
    );
    const avgSentiment = calculateAverageSentiment(members.sentiments);

    const [cluster] = await db
      .insert(clusters)
      .values({
        clusteringRunId: run.id,
        projectId,
        name,
        summary,
        labelIndex: label,
        popularity,
        averageSentiment: avgSentiment,
      })
      .returning();

    // Link narratives
    const links = members.ids.map((nid) => ({
      clusterId: cluster.id,
      narrativeId: nid,
    }));
    await db.insert(clusterNarratives).values(links);

    createdClusters.push(cluster);
  }

  // Update run
  await db
    .update(clusteringRuns)
    .set({
      status: "completed",
      clusterCount: createdClusters.length,
      completedAt: new Date(),
    })
    .where(eq(clusteringRuns.id, run.id));

  return { runId: run.id, clusters: createdClusters };
}

export async function getClusteringRun(runId: string) {
  return db.query.clusteringRuns.findFirst({
    where: eq(clusteringRuns.id, runId),
    with: {
      clusters: {
        with: {
          narratives: {
            with: {
              narrative: true,
            },
          },
        },
      },
    },
  });
}

export async function getClusteringRunsByProject(projectId: string) {
  return db
    .select()
    .from(clusteringRuns)
    .where(eq(clusteringRuns.projectId, projectId))
    .orderBy(clusteringRuns.createdAt);
}
