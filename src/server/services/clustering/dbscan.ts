export function performDBSCAN(
  points: number[][],
  epsilon: number,
  minPts: number,
): number[] {
  const n = points.length;
  const labels = new Array(n).fill(0); // 0: unvisited, -1: noise, >0: cluster ID
  let clusterId = 0;

  for (let i = 0; i < n; i++) {
    if (labels[i] !== 0) continue;

    const neighbors = findNeighbors(points, i, epsilon);
    if (neighbors.length < minPts) {
      labels[i] = -1;
    } else {
      clusterId++;
      expandCluster(points, labels, i, neighbors, clusterId, epsilon, minPts);
    }
  }

  return labels.map((l) => (l > 0 ? l - 1 : -1));
}

function findNeighbors(
  points: number[][],
  pointIdx: number,
  epsilon: number,
): number[] {
  const neighbors = [];
  for (let i = 0; i < points.length; i++) {
    const dist = Math.sqrt(
      Math.pow(points[pointIdx][0] - points[i][0], 2) +
        Math.pow(points[pointIdx][1] - points[i][1], 2),
    );
    if (dist <= epsilon) {
      neighbors.push(i);
    }
  }
  return neighbors;
}

function expandCluster(
  points: number[][],
  labels: number[],
  pointIdx: number,
  neighbors: number[],
  clusterId: number,
  epsilon: number,
  minPts: number,
) {
  labels[pointIdx] = clusterId;
  let i = 0;
  while (i < neighbors.length) {
    const nextIdx = neighbors[i];
    if (labels[nextIdx] === -1) {
      labels[nextIdx] = clusterId;
    } else if (labels[nextIdx] === 0) {
      labels[nextIdx] = clusterId;
      const nextNeighbors = findNeighbors(points, nextIdx, epsilon);
      if (nextNeighbors.length >= minPts) {
        neighbors.push(...nextNeighbors);
      }
    }
    i++;
  }
}
