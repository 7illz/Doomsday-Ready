import { describe, expect, it } from 'vitest';
import { detectCircularDependency } from './circular-dependency-detector.js';

describe('detectCircularDependency candidate implementation', () => {
  it('detects a direct self-dependency', () => {
    const movieId = '11111111-1111-4111-8111-111111111111';

    expect(
      detectCircularDependency({
        targetMovieId: movieId,
        proposedPrerequisiteIds: [movieId],
        graph: [{ id: movieId, prerequisiteIds: [] }],
      }),
    ).toBe(true);
  });

  it('detects an indirect dependency cycle', () => {
    const first = '11111111-1111-4111-8111-111111111111';
    const second = '22222222-2222-4222-8222-222222222222';
    const third = '33333333-3333-4333-8333-333333333333';

    expect(
      detectCircularDependency({
        targetMovieId: first,
        proposedPrerequisiteIds: [second],
        graph: [
          { id: first, prerequisiteIds: [] },
          { id: second, prerequisiteIds: [third] },
          { id: third, prerequisiteIds: [first] },
        ],
      }),
    ).toBe(true);
  });

  it('detects a two-movie cycle', () => {
    const first = '11111111-1111-4111-8111-111111111111';
    const second = '22222222-2222-4222-8222-222222222222';

    expect(
      detectCircularDependency({
        targetMovieId: first,
        proposedPrerequisiteIds: [second],
        graph: [
          { id: first, prerequisiteIds: [] },
          { id: second, prerequisiteIds: [first] },
        ],
      }),
    ).toBe(true);
  });

  it('accepts an acyclic prerequisite proposal', () => {
    const first = '11111111-1111-4111-8111-111111111111';
    const second = '22222222-2222-4222-8222-222222222222';

    expect(
      detectCircularDependency({
        targetMovieId: first,
        proposedPrerequisiteIds: [second],
        graph: [
          { id: first, prerequisiteIds: [] },
          { id: second, prerequisiteIds: [] },
        ],
      }),
    ).toBe(false);
  });

  it('replaces rather than merges the target movie edges', () => {
    const first = '11111111-1111-4111-8111-111111111111';
    const second = '22222222-2222-4222-8222-222222222222';

    expect(
      detectCircularDependency({
        targetMovieId: first,
        proposedPrerequisiteIds: [],
        graph: [
          { id: first, prerequisiteIds: [second] },
          { id: second, prerequisiteIds: [first] },
        ],
      }),
    ).toBe(false);
  });

  it('accepts an empty prerequisite proposal', () => {
    const first = '11111111-1111-4111-8111-111111111111';

    expect(
      detectCircularDependency({
        targetMovieId: first,
        proposedPrerequisiteIds: [],
        graph: [{ id: first, prerequisiteIds: [] }],
      }),
    ).toBe(false);
  });

  it('handles disconnected acyclic components', () => {
    const first = '11111111-1111-4111-8111-111111111111';
    const second = '22222222-2222-4222-8222-222222222222';
    const third = '33333333-3333-4333-8333-333333333333';
    const fourth = '44444444-4444-4444-8444-444444444444';

    expect(
      detectCircularDependency({
        targetMovieId: first,
        proposedPrerequisiteIds: [second],
        graph: [
          { id: first, prerequisiteIds: [] },
          { id: second, prerequisiteIds: [] },
          { id: third, prerequisiteIds: [fourth] },
          { id: fourth, prerequisiteIds: [] },
        ],
      }),
    ).toBe(false);
  });

  it('does not mutate the input graph or proposed prerequisite list', () => {
    const first = '11111111-1111-4111-8111-111111111111';
    const second = '22222222-2222-4222-8222-222222222222';
    const proposedPrerequisiteIds = [second];
    const graph = [
      { id: first, prerequisiteIds: [] as string[] },
      { id: second, prerequisiteIds: [] as string[] },
    ];
    const originalGraph = structuredClone(graph);
    const originalProposal = [...proposedPrerequisiteIds];

    detectCircularDependency({
      targetMovieId: first,
      proposedPrerequisiteIds,
      graph,
    });

    expect(graph).toEqual(originalGraph);
    expect(proposedPrerequisiteIds).toEqual(originalProposal);
  });
});
