import { describe, expect, it } from 'vitest';
import type { MovieGraph } from './circular-dependency-detector.js';
import { getRewatchOrder } from './rewatch-order.js';

const graph: MovieGraph = new Map([
  ['iron-man', []],
  ['first-avenger', []],
  ['avengers', ['iron-man', 'first-avenger']],
  ['civil-war', ['avengers']],
  ['ragnarok', []],
  ['infinity-war', ['civil-war', 'ragnarok']],
  ['endgame', ['infinity-war']],
  ['doomsday', ['endgame']],
]);

describe('getRewatchOrder candidate implementation', () => {
  it('returns all seven Doomsday prerequisites in dependency-safe order', () => {
    expect(getRewatchOrder('doomsday', graph)).toEqual([
      'iron-man',
      'first-avenger',
      'avengers',
      'civil-war',
      'ragnarok',
      'infinity-war',
      'endgame',
    ]);
  });

  it('returns the three Civil War prerequisites', () => {
    expect(getRewatchOrder('civil-war', graph)).toEqual([
      'iron-man',
      'first-avenger',
      'avengers',
    ]);
  });

  it('returns an empty plan for Ragnarok', () => {
    expect(getRewatchOrder('ragnarok', graph)).toEqual([]);
  });

  it('includes a shared prerequisite exactly once', () => {
    const sharedGraph: MovieGraph = new Map([
      ['shared', []],
      ['first', ['shared']],
      ['second', ['shared']],
      ['target', ['first', 'second']],
    ]);

    expect(getRewatchOrder('target', sharedGraph)).toEqual([
      'shared',
      'first',
      'second',
    ]);
  });

  it('rejects an unknown target', () => {
    expect(() => getRewatchOrder('missing', graph)).toThrow('TARGET_NOT_FOUND');
  });
});
