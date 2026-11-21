import type { MovieGraph } from './circular-dependency-detector.js';

/** Candidate-authored postorder DFS rewatch ordering. */
export function getRewatchOrder(targetId: string, graph: MovieGraph): string[] {
  if (!graph.has(targetId)) {
    throw new Error('TARGET_NOT_FOUND');
  }

  const visited = new Set<string>();
  const result: string[] = [];

  function dfs(movieId: string): void {
    if (visited.has(movieId)) return;

    visited.add(movieId);

    for (const prerequisiteId of graph.get(movieId) ?? []) {
      dfs(prerequisiteId);
    }

    if (movieId !== targetId) {
      result.push(movieId);
    }
  }

  dfs(targetId);

  return result;
}
