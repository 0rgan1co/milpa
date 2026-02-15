import { UMAP } from "umap-js";

export async function reduceDimensions(
  data: number[][],
  neighbors: number,
  minDist: number,
): Promise<number[][]> {
  const umap = new UMAP({
    nComponents: 2,
    nNeighbors: neighbors,
    minDist: minDist,
  });

  return umap.fit(data) as number[][];
}
