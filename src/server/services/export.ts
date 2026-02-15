import { db } from "@/server/db";
import {
  narratives,
  clusters,
  projects,
  clusteringRuns,
} from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";

export async function generateNarrativeCSV(projectId: string) {
  const data = await db.query.narratives.findMany({
    where: eq(narratives.projectId, projectId),
  });

  const header = [
    "ID",
    "Text",
    "Sentiment",
    "Abstraction",
    "Anonymized",
    "Created At",
  ];
  const rows = data.map((n) => [
    n.id,
    `"${n.text.replace(/"/g, '""')}"`,
    n.sentiment,
    n.abstraction,
    n.isAnonymized,
    n.createdAt.toISOString(),
  ]);

  return [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export async function generateClusterCSV(projectId: string) {
  const latestRun = await db.query.clusteringRuns.findFirst({
    where: eq(clusteringRuns.projectId, projectId),
    orderBy: [desc(clusteringRuns.createdAt)],
    with: {
      clusters: true,
    },
  });

  if (!latestRun) return "No clusters found";

  const header = ["ID", "Name", "Summary", "Popularity", "Average Sentiment"];
  const rows = latestRun.clusters.map((c) => [
    c.id,
    `"${c.name.replace(/"/g, '""')}"`,
    `"${(c.summary || "").replace(/"/g, '""')}"`,
    c.popularity,
    c.averageSentiment,
  ]);

  return [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
