import { db } from "@/server/db";
import {
  projects,
  interviews,
  narratives,
  clusters,
  invitations,
  clusteringRuns,
} from "@/server/db/schema";
import { eq, sql, avg, count } from "drizzle-orm";

export async function getDashboardMetrics(projectId: string) {
  // 1. Interview stats
  const interviewStats = await db
    .select({
      total: count(interviews.id),
      completed: sql<number>`count(case when ${interviews.status} = 'completed' then 1 end)`,
    })
    .from(interviews)
    .where(eq(interviews.projectId, projectId));

  // 2. Invitation stats (for participation rate)
  const invitationStats = await db
    .select({
      total: count(invitations.id),
    })
    .from(invitations)
    .where(eq(invitations.projectId, projectId));

  // 3. Narrative count
  const narrativeStats = await db
    .select({
      total: count(narratives.id),
      avgSentiment: avg(narratives.sentiment),
    })
    .from(narratives)
    .where(eq(narratives.projectId, projectId));

  // 4. Cluster count (from latest run)
  const latestRun = await db.query.clusteringRuns.findFirst({
    where: eq(clusteringRuns.projectId, projectId),
    orderBy: (runs, { desc }) => [desc(runs.createdAt)],
  });

  const clusterCount = latestRun?.clusterCount || 0;

  const totalInvited = Number(invitationStats[0]?.total || 0);
  const completedInterviews = Number(interviewStats[0]?.completed || 0);

  return {
    totalInterviews: Number(interviewStats[0]?.total || 0),
    completedInterviews,
    narrativeCount: Number(narrativeStats[0]?.total || 0),
    clusterCount,
    avgSentiment: Number(narrativeStats[0]?.avgSentiment || 0),
    participationRate:
      totalInvited > 0 ? (completedInterviews / totalInvited) * 100 : 0,
  };
}

export async function getSentimentHeatmap(projectId: string, category: string) {
  // We want to group by demographic category values and get average sentiment
  // This requires joining interviews with invitations to get categoryValues

  const results = await db
    .select({
      value: sql<string>`${invitations.categoryValues}->>${sql.raw(`'${category}'`)}`,
      avgSentiment: avg(narratives.sentiment),
      count: count(narratives.id),
    })
    .from(narratives)
    .innerJoin(interviews, eq(narratives.interviewId, interviews.id))
    .innerJoin(invitations, eq(interviews.invitationId, invitations.id))
    .where(eq(narratives.projectId, projectId))
    .groupBy(sql`${invitations.categoryValues}->>${sql.raw(`'${category}'`)}`);

  return results.map((r) => ({
    label: r.value || "Unknown",
    sentiment: Number(r.avgSentiment || 0),
    narrativeCount: Number(r.count || 0),
  }));
}
