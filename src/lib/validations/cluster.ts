import { z } from "zod";

export const clusterSchema = z.object({
  clusteringRunId: z.string(),
  projectId: z.string(),
  name: z.string().max(500),
  summary: z.string().optional(),
  popularity: z.number().min(0).max(100).optional(),
  averageSentiment: z.number().min(-2).max(2).optional(),
  labelIndex: z.number().int().default(0),
});

export const clusteringParametersSchema = z.object({
  neighbors: z.number().int().default(15),
  minDist: z.number().default(0.1),
  minClusterSize: z.number().int().default(5),
  threshold: z.number().default(0.2),
});

export type ClusterInput = z.infer<typeof clusterSchema>;
export type ClusteringParameters = z.infer<typeof clusteringParametersSchema>;
