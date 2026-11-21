import { BundleOptimizerNotImplementedError } from '../errors/app-error.js';

export interface BundleQuantity {
  size: number;
  quantity: number;
}

export type BundleOptimizationResult =
  | {
      possible: true;
      totalBundles: number;
      bundles: BundleQuantity[];
    }
  | {
      possible: false;
      totalBundles: null;
      bundles: [];
    };

export type MinimumBundleOptimizer = (
  bundleSizes: readonly number[],
  groupSize: number,
) => BundleOptimizationResult;

/**
 * Candidate-owned assessment algorithm.
 *
 * Implement this function in Phase 5 without a coin-change library. When
 * several minimum-count solutions exist, prefer larger bundle sizes in a
 * deterministic way and return selected sizes in descending order.
 */
export const findMinimumBundleCombination: MinimumBundleOptimizer = (
  _bundleSizes,
  _groupSize,
) => {
  throw new BundleOptimizerNotImplementedError();
};
