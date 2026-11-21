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

export interface BookingResult {
  possible: boolean;
  totalBundles: number | null;
  breakdown: Record<number, number>;
}

/** Candidate-authored dynamic-programming bundle optimizer. */
export function minimumBundles(
  bundleSizes: readonly number[],
  groupSize: number,
): BookingResult {
  // Sort a copy in descending order without mutating the input.
  const sortedBundles = [...bundleSizes].sort((a, b) => b - a);

  const dp = Array<number>(groupSize + 1).fill(Infinity);
  const chosen = Array<number>(groupSize + 1).fill(-1);

  dp[0] = 0;

  for (let seats = 1; seats <= groupSize; seats++) {
    for (const bundle of sortedBundles) {
      if (
        bundle <= seats &&
        dp[seats - bundle] !== Infinity &&
        dp[seats - bundle] + 1 < dp[seats]
      ) {
        dp[seats] = dp[seats - bundle] + 1;
        chosen[seats] = bundle;
      }
    }
  }

  if (dp[groupSize] === Infinity) {
    return {
      possible: false,
      totalBundles: null,
      breakdown: {},
    };
  }

  const breakdown: Record<number, number> = {};
  let remaining = groupSize;

  while (remaining > 0) {
    const bundle = chosen[remaining];

    if (bundle === -1) {
      throw new Error('INVALID_DP_STATE');
    }

    breakdown[bundle] = (breakdown[bundle] ?? 0) + 1;
    remaining -= bundle;
  }

  return {
    possible: true,
    totalBundles: dp[groupSize],
    breakdown,
  };
}

/**
 * Candidate-owned assessment algorithm.
 *
 * Implement this function in Phase 5 without a coin-change library. When
 * several minimum-count solutions exist, prefer larger bundle sizes in a
 * deterministic way and return selected sizes in descending order.
 */
export const findMinimumBundleCombination: MinimumBundleOptimizer = (
  bundleSizes,
  groupSize,
) => {
  const result = minimumBundles(bundleSizes, groupSize);
  if (!result.possible || result.totalBundles === null) {
    return { possible: false, totalBundles: null, bundles: [] };
  }

  const bundles = Object.entries(result.breakdown)
    .map(([size, quantity]) => ({ size: Number(size), quantity }))
    .sort((left, right) => right.size - left.size);

  return {
    possible: true,
    totalBundles: result.totalBundles,
    bundles,
  };
};
