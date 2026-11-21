import { describe, expect, it } from 'vitest';
import { findMinimumBundleCombination } from './minimum-bundle-optimizer.js';

describe('findMinimumBundleCombination candidate implementation', () => {
  it('uses two size-3 bundles for [1, 3, 4] and group 6', () => {
    expect(findMinimumBundleCombination([1, 3, 4], 6)).toEqual({
      possible: true,
      totalBundles: 2,
      bundles: [{ size: 3, quantity: 2 }],
    });
  });

  it('solves [2, 5] and group 11', () => {
    expect(findMinimumBundleCombination([2, 5], 11)).toEqual({
      possible: true,
      totalBundles: 4,
      bundles: [
        { size: 5, quantity: 1 },
        { size: 2, quantity: 3 },
      ],
    });
  });

  it('solves [6, 9, 20] and group 44', () => {
    expect(findMinimumBundleCombination([6, 9, 20], 44)).toEqual({
      possible: true,
      totalBundles: 4,
      bundles: [
        { size: 20, quantity: 1 },
        { size: 9, quantity: 2 },
        { size: 6, quantity: 1 },
      ],
    });
  });

  it('reports group 7 as impossible for [4, 6]', () => {
    expect(findMinimumBundleCombination([4, 6], 7)).toEqual({
      possible: false,
      totalBundles: null,
      bundles: [],
    });
  });

  it('handles the minimum group size', () => {
    expect(findMinimumBundleCombination([1, 3], 1)).toEqual({
      possible: true,
      totalBundles: 1,
      bundles: [{ size: 1, quantity: 1 }],
    });
  });

  it('handles the maximum group size', () => {
    expect(findMinimumBundleCombination([500], 10_000)).toEqual({
      possible: true,
      totalBundles: 20,
      bundles: [{ size: 500, quantity: 20 }],
    });
  });

  it('handles a single bundle size', () => {
    expect(findMinimumBundleCombination([7], 21)).toEqual({
      possible: true,
      totalBundles: 3,
      bundles: [{ size: 7, quantity: 3 }],
    });
  });

  it('prefers larger sizes for equally optimal combinations', () => {
    expect(findMinimumBundleCombination([2, 3, 4], 6)).toEqual({
      possible: true,
      totalBundles: 2,
      bundles: [
        { size: 4, quantity: 1 },
        { size: 2, quantity: 1 },
      ],
    });
  });

  it('applies the larger-size tie rule independently of input order', () => {
    expect(findMinimumBundleCombination([4, 3, 5], 8)).toEqual({
      possible: true,
      totalBundles: 2,
      bundles: [
        { size: 5, quantity: 1 },
        { size: 3, quantity: 1 },
      ],
    });
  });

  it('handles unsorted bundle sizes', () => {
    expect(findMinimumBundleCombination([4, 1, 3], 6)).toEqual({
      possible: true,
      totalBundles: 2,
      bundles: [{ size: 3, quantity: 2 }],
    });
  });

  it('reports impossible when the group is smaller than every bundle', () => {
    expect(findMinimumBundleCombination([5, 7], 3)).toEqual({
      possible: false,
      totalBundles: null,
      bundles: [],
    });
  });

  it('beats greedy selection for [1, 3, 4] and group 6', () => {
    const result = findMinimumBundleCombination([1, 3, 4], 6);

    expect(result.possible).toBe(true);
    if (result.possible) expect(result.totalBundles).toBe(2);
  });
});
