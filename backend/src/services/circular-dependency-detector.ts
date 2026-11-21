export interface DependencyGraphNode {
  id: string;
  prerequisiteIds: readonly string[];
}

export interface CycleCheckInput {
  /** The movie whose prerequisite list is being created or replaced. */
  targetMovieId: string;
  /** The complete proposed prerequisite list for the target movie. */
  proposedPrerequisiteIds: readonly string[];
  /** The persisted graph before applying the proposal. */
  graph: readonly DependencyGraphNode[];
}

export type CircularDependencyDetector = (
  input: CycleCheckInput,
) => boolean | Promise<boolean>;

export type MovieGraph = Map<string, string[]>;

/** Candidate-authored three-state DFS cycle detector. */
export function hasCircularDependency(graph: MovieGraph): boolean {
  // 0 = unvisited, 1 = visiting, 2 = visited
  const state = new Map<string, number>();

  function dfs(movieId: string): boolean {
    const currentState = state.get(movieId) ?? 0;

    if (currentState === 1) return true;
    if (currentState === 2) return false;

    state.set(movieId, 1);

    for (const prerequisiteId of graph.get(movieId) ?? []) {
      if (dfs(prerequisiteId)) {
        return true;
      }
    }

    state.set(movieId, 2);
    return false;
  }

  for (const movieId of graph.keys()) {
    if (dfs(movieId)) {
      return true;
    }
  }

  return false;
}

/**
 * Candidate-owned assessment algorithm.
 *
 * Replace this function body in Phase 4. It must return true when replacing
 * targetMovieId's outgoing prerequisite edges with proposedPrerequisiteIds
 * would make the graph cyclic. Do not use a graph-algorithm library.
 */
export const detectCircularDependency: CircularDependencyDetector = ({
  targetMovieId,
  proposedPrerequisiteIds,
  graph,
}) => {
  const proposedGraph: MovieGraph = new Map(
    graph.map(({ id, prerequisiteIds }) => [id, [...prerequisiteIds]]),
  );
  proposedGraph.set(targetMovieId, [...proposedPrerequisiteIds]);

  return hasCircularDependency(proposedGraph);
};
