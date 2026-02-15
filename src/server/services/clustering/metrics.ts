export function calculatePopularity(
  clusterSize: number,
  totalSize: number,
): number {
  return totalSize > 0 ? (clusterSize / totalSize) * 100 : 0;
}

export function calculateAverageSentiment(sentiments: number[]): number {
  if (sentiments.length === 0) return 0;
  return sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
}

export function calculateCentroid(points: number[][]): number[] {
  if (points.length === 0) return [0, 0];
  const n = points.length;
  const sumX = points.reduce((acc, p) => acc + p[0], 0);
  const sumY = points.reduce((acc, p) => acc + p[1], 0);
  return [sumX / n, sumY / n];
}
