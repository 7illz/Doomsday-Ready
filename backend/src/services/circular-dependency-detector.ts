import { CycleDetectorNotImplementedError } from '../errors/app-error.js';

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

/**
 * Candidate-owned assessment algorithm.
 *
 * Replace this function body in Phase 4. It must return true when replacing
 * targetMovieId's outgoing prerequisite edges with proposedPrerequisiteIds
 * would make the graph cyclic. Do not use a graph-algorithm library.
 */
export const detectCircularDependency: CircularDependencyDetector = (_input) => {
  throw new CycleDetectorNotImplementedError();
};
