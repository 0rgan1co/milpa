"use server";

import { getAuthenticatedUser } from "@/server/auth/middleware";
import * as projectService from "@/server/services/projects";
import * as dashboardService from "@/server/services/dashboard";
import * as clusteringService from "@/server/services/clustering";
import { redirect } from "next/navigation";
import { SentimentHeatmap } from "@/components/features/dashboard/SentimentHeatmap";
import { Card } from "@/components/ui/card";
import {
  Users,
  MessageCircle,
  Database,
  Layers,
  TrendingUp,
  ArrowUpRight,
  Download,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { projectId } = await searchParams;
  const user = await getAuthenticatedUser();
  if (!user) redirect("/");

  // Get active project
  let targetProjectId = projectId;
  if (!targetProjectId) {
    const userProjects = await projectService.getProjectsByUser(user.uid);
    if (userProjects.length > 0) {
      targetProjectId = userProjects[0].id;
    }
  }

  if (!targetProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-xl font-semibold">Welcome to Milpa</h2>
        <p className="text-muted-foreground mt-2">
          Create your first project to start discovery.
        </p>
        <Link href="/projects/new" className="mt-4">
          <Button>Create Project</Button>
        </Link>
      </div>
    );
  }

  const project = await projectService.getProjectById(
    targetProjectId,
    user.uid,
  );
  const metrics = await dashboardService.getDashboardMetrics(targetProjectId);

  // Get heatmap for the first available demographic category
  const heatmapData = project?.demographicCategories.length
    ? await dashboardService.getSentimentHeatmap(
        targetProjectId,
        project.demographicCategories[0],
      )
    : [];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project?.name}</h1>
          <p className="text-muted-foreground mt-1">
            Project discovery dashboard and insights.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a
              href={`/api/export?projectId=${targetProjectId}&type=csv&scope=narratives`}
            >
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </a>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/clustering?projectId=${targetProjectId}`}>
              Analyze <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Interviews"
          value={metrics.totalInterviews}
          icon={Users}
          description={`${metrics.completedInterviews} completed`}
        />
        <MetricCard
          title="Narrative Fragments"
          value={metrics.narrativeCount}
          icon={Database}
          description="Extracted from transcripts"
        />
        <MetricCard
          title="Semantic Clusters"
          value={metrics.clusterCount}
          icon={Layers}
          description="Discovered themes"
        />
        <MetricCard
          title="Avg Sentiment"
          value={metrics.avgSentiment.toFixed(1)}
          icon={TrendingUp}
          description={
            metrics.avgSentiment > 0 ? "Overall Positive" : "Needs Attention"
          }
          trend={metrics.avgSentiment > 0 ? "up" : "down"}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <Card className="p-6">
            <SentimentHeatmap
              data={heatmapData}
              title={
                project?.demographicCategories[0] || "Sentiment by Category"
              }
            />
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Recent Narrative Activity
            </h3>
            <div className="text-center py-12 text-muted-foreground text-sm italic">
              Recent narratives and real-time activity feed coming soon.
            </div>
          </Card>
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-8">
          <Card className="p-6 bg-primary/5 border-primary/20">
            <h3 className="font-bold flex items-center gap-2 text-primary">
              <TrendingUp className="h-5 w-5" />
              Key Participation
            </h3>
            <div className="mt-4">
              <div className="text-4xl font-bold">
                {metrics.participationRate.toFixed(0)}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Total participation rate across all invitations.
              </p>
              <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${metrics.participationRate}%` }}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, description, trend }: any) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-start">
        <div className="p-2 bg-muted rounded-lg">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-sm font-medium text-muted-foreground mt-1">
          {title}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-2">{description}</p>
      </div>
    </Card>
  );
}
