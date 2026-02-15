export type Narrative = {
  id: string;
  projectId: string;
  interviewId: string;
  text: string;
  originalText: string | null;
  sentiment: number;
  abstraction: number;
  embedding: number[] | null;
  isAnonymized: boolean;
  isLowYield: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ClusteringRunStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type ClusteringRun = {
  id: string;
  projectId: string;
  status: ClusteringRunStatus;
  parameters: {
    neighbors: number;
    minDist: number;
    minClusterSize: number;
    threshold: number;
  };
  umapCoordinates: Record<string, [number, number]>;
  clusterCount: number | null;
  narrativeCount: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
};

export type Cluster = {
  id: string;
  clusteringRunId: string;
  projectId: string;
  name: string;
  summary: string | null;
  popularity: number | null;
  averageSentiment: number | null;
  labelIndex: number;
  createdAt: Date;
};
