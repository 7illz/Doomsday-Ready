import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import type {
  CinemaRecord,
  CinemaRepository,
} from './repositories/cinema.repository.js';
import { CinemaService } from './services/cinema.service.js';
import type { MinimumBundleOptimizer } from './services/minimum-bundle-optimizer.js';

const CINEMA_ID = '11111111-1111-4111-8111-111111111111';
const MISSING_ID = '99999999-9999-4999-8999-999999999999';

class MemoryCinemaRepository implements CinemaRepository {
  private readonly cinemas = new Map<string, CinemaRecord>();

  constructor(cinemaRecords: CinemaRecord[] = []) {
    for (const cinema of cinemaRecords) {
      this.cinemas.set(cinema.id, { ...cinema, bundleSizes: [...cinema.bundleSizes] });
    }
  }

  async create(name: string, bundleSizes: readonly number[]): Promise<CinemaRecord> {
    if ([...this.cinemas.values()].some((cinema) => cinema.name === name)) {
      throw Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    }
    const cinema = {
      id: randomUUID(),
      name,
      bundleSizes: [...bundleSizes].sort((left, right) => left - right),
    };
    this.cinemas.set(cinema.id, cinema);
    return { ...cinema, bundleSizes: [...cinema.bundleSizes] };
  }

  async findAll(): Promise<CinemaRecord[]> {
    return [...this.cinemas.values()]
      .map((cinema) => ({ ...cinema, bundleSizes: [...cinema.bundleSizes] }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async findById(id: string): Promise<CinemaRecord | null> {
    const cinema = this.cinemas.get(id);
    return cinema ? { ...cinema, bundleSizes: [...cinema.bundleSizes] } : null;
  }
}

const initialCinema: CinemaRecord = {
  id: CINEMA_ID,
  name: 'Cinema A',
  bundleSizes: [1, 3, 4],
};

const impossibleOptimizer: MinimumBundleOptimizer = () => ({
  possible: false,
  totalBundles: null,
  bundles: [],
});

describe('cinema API', () => {
  let repository: MemoryCinemaRepository;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    repository = new MemoryCinemaRepository([initialCinema]);
    app = createApp('http://localhost:5173', {
      cinemaService: new CinemaService(repository, impossibleOptimizer),
    });
  });

  it('creates a cinema with normalized bundle sizes', async () => {
    const response = await request(app).post('/api/cinemas').send({
      name: 'Cinema B',
      bundleSizes: [5, 2],
    });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      name: 'Cinema B',
      bundleSizes: [2, 5],
    });
  });

  it('accepts the minimum and maximum bundle sizes', async () => {
    const response = await request(app).post('/api/cinemas').send({
      name: 'Boundary Cinema',
      bundleSizes: [1, 500],
    });

    expect(response.status).toBe(201);
    expect(response.body.data.bundleSizes).toEqual([1, 500]);
  });

  it('lists cinemas', async () => {
    const response = await request(app).get('/api/cinemas');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([initialCinema]);
  });

  it('returns a conflict for a duplicate cinema name', async () => {
    const response = await request(app).post('/api/cinemas').send({
      name: 'Cinema A',
      bundleSizes: [2, 5],
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('DUPLICATE_CINEMA_NAME');
  });

  it.each([
    [{ name: '', bundleSizes: [1] }],
    [{ name: 'Empty', bundleSizes: [] }],
    [{ name: 'Duplicate', bundleSizes: [1, 1] }],
    [{ name: 'Zero', bundleSizes: [0] }],
    [{ name: 'Large', bundleSizes: [501] }],
    [{ name: 'Fraction', bundleSizes: [1.5] }],
    [{ name: 'Too Many', bundleSizes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }],
  ])('rejects invalid cinema payload %#', async (payload) => {
    const response = await request(app).post('/api/cinemas').send(payload);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns an optimizer quote for a valid booking request', async () => {
    const optimizer: MinimumBundleOptimizer = () => ({
      possible: true,
      totalBundles: 2,
      bundles: [{ size: 3, quantity: 2 }],
    });
    const quoteApp = createApp('http://localhost:5173', {
      cinemaService: new CinemaService(repository, optimizer),
    });

    const response = await request(quoteApp).get(
      `/api/cinemas/${CINEMA_ID}/booking?groupSize=6`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      cinema: initialCinema,
      groupSize: 6,
      possible: true,
      totalBundles: 2,
      bundles: [{ size: 3, quantity: 2 }],
    });
  });

  it('returns a clear impossible quote', async () => {
    const response = await request(app).get(
      `/api/cinemas/${CINEMA_ID}/booking?groupSize=2`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      groupSize: 2,
      possible: false,
      totalBundles: null,
      bundles: [],
    });
  });

  it('returns 404 for an unknown cinema', async () => {
    const response = await request(app).get(
      `/api/cinemas/${MISSING_ID}/booking?groupSize=6`,
    );

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('CINEMA_NOT_FOUND');
  });

  it.each(['', '0', '-1', '1.5', '10001', 'six']) (
    'rejects invalid group size %s',
    async (groupSize) => {
      const suffix = groupSize ? `?groupSize=${groupSize}` : '';
      const response = await request(app).get(
        `/api/cinemas/${CINEMA_ID}/booking${suffix}`,
      );

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    },
  );

  it('accepts the maximum group size', async () => {
    const response = await request(app).get(
      `/api/cinemas/${CINEMA_ID}/booking?groupSize=10000`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data.groupSize).toBe(10_000);
  });

  it('accepts the minimum group size', async () => {
    const response = await request(app).get(
      `/api/cinemas/${CINEMA_ID}/booking?groupSize=1`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data.groupSize).toBe(1);
  });
});
