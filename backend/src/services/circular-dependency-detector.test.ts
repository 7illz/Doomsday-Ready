import { describe, expect, it } from 'vitest';
import { detectCircularDependency } from './circular-dependency-detector.js';

describe('detectCircularDependency candidate implementation', () => {
  it.todo('detects a direct self-dependency', () => {
    const movieId = '11111111-1111-4111-8111-111111111111';

    expect(
      detectCircularDependency({
        targetMovieId: movieId,
        proposedPrerequisiteIds: [movieId],
        graph: [{ id: movieId, prerequisiteIds: [] }],
      }),
    ).toBe(true);
  });

  it.todo('detects an indirect dependency cycle', () => {
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

  it.todo('accepts an acyclic prerequisite proposal', () => {
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
});
