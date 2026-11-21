import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import type {
  DependencyRecord,
  MovieCreateRecord,
  MovieRecord,
  MovieRepository,
  MovieSummary,
  MovieUpdateRecord,
} from './repositories/movie.repository.js';
import { MovieService } from './services/movie.service.js';

const IRON_MAN_ID = '11111111-1111-4111-8111-111111111111';
const AVENGERS_ID = '22222222-2222-4222-8222-222222222222';
const MISSING_ID = '99999999-9999-4999-8999-999999999999';

function copyMovie(movie: MovieRecord): MovieRecord {
  return { ...movie, prerequisites: movie.prerequisites.map((item) => ({ ...item })) };
}

function toSummary(movie: MovieRecord): MovieSummary {
  const { id, title, releaseYear, runtimeMinutes, watched } = movie;
  return { id, title, releaseYear, runtimeMinutes, watched };
}

class MemoryMovieRepository implements MovieRepository {
  private movies = new Map<string, MovieRecord>();

  constructor(movies: MovieRecord[] = []) {
    for (const movie of movies) this.movies.set(movie.id, copyMovie(movie));
  }

  async transaction<T>(
    operation: (repository: MovieRepository) => Promise<T>,
  ): Promise<T> {
    const transaction = new MemoryMovieRepository(await this.findAll());
    const result = await operation(transaction);
    this.movies = transaction.movies;
    return result;
  }

  async findAll(): Promise<MovieRecord[]> {
    return [...this.movies.values()]
      .map(copyMovie)
      .sort(
        (left, right) =>
          left.releaseYear - right.releaseYear || left.title.localeCompare(right.title),
      );
  }

  async findById(id: string): Promise<MovieRecord | null> {
    const movie = this.movies.get(id);
    return movie ? copyMovie(movie) : null;
  }

  async findExistingIds(ids: readonly string[]): Promise<string[]> {
    return ids.filter((id) => this.movies.has(id));
  }

  async getDependencyGraph(): Promise<DependencyRecord[]> {
    return [...this.movies.values()].map((movie) => ({
      id: movie.id,
      prerequisiteIds: movie.prerequisites.map(({ id }) => id),
    }));
  }

  async create(input: MovieCreateRecord): Promise<MovieRecord> {
    this.assertUniqueTitle(input.title);
    const movie: MovieRecord = {
      id: input.id,
      title: input.title,
      releaseYear: input.releaseYear,
      runtimeMinutes: input.runtimeMinutes,
      watched: input.watched,
      prerequisites: input.prerequisiteIds.map((id) => toSummary(this.movies.get(id)!)),
    };
    this.movies.set(movie.id, movie);
    return copyMovie(movie);
  }

  async update(id: string, input: MovieUpdateRecord): Promise<MovieRecord> {
    const existing = this.movies.get(id)!;
    if (input.title !== undefined && input.title !== existing.title) {
      this.assertUniqueTitle(input.title);
    }
    const { prerequisiteIds, ...metadata } = input;
    const movie: MovieRecord = {
      ...existing,
      ...metadata,
      prerequisites:
        prerequisiteIds?.map((prerequisiteId) =>
          toSummary(this.movies.get(prerequisiteId)!),
        ) ?? existing.prerequisites,
    };
    this.movies.set(id, movie);
    return copyMovie(movie);
  }

  private assertUniqueTitle(title: string): void {
    if ([...this.movies.values()].some((movie) => movie.title === title)) {
      throw Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    }
  }
}

const initialMovies: MovieRecord[] = [
  {
    id: IRON_MAN_ID,
    title: 'Iron Man',
    releaseYear: 2008,
    runtimeMinutes: 126,
    watched: false,
    prerequisites: [],
  },
  {
    id: AVENGERS_ID,
    title: 'The Avengers',
    releaseYear: 2012,
    runtimeMinutes: 143,
    watched: false,
    prerequisites: [],
  },
];

describe('movies API', () => {
  let repository: MemoryMovieRepository;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    repository = new MemoryMovieRepository(initialMovies);
    const service = new MovieService(repository, () => false);
    app = createApp('http://localhost:5173', { movieService: service });
  });

  it('creates a movie', async () => {
    const response = await request(app).post('/api/movies').send({
      title: 'Avengers: Endgame',
      releaseYear: 2019,
      runtimeMinutes: 181,
      prerequisiteIds: [AVENGERS_ID],
    });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      title: 'Avengers: Endgame',
      watched: false,
      prerequisites: [{ id: AVENGERS_ID, title: 'The Avengers' }],
    });
    expect(response.body.data.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('lists movies with metadata and prerequisites', async () => {
    const response = await request(app).get('/api/movies');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0]).toEqual(initialMovies[0]);
  });

  it('updates watched status', async () => {
    const response = await request(app)
      .patch(`/api/movies/${IRON_MAN_ID}`)
      .send({ watched: true });

    expect(response.status).toBe(200);
    expect(response.body.data.watched).toBe(true);
  });

  it('replaces prerequisites', async () => {
    const response = await request(app)
      .patch(`/api/movies/${AVENGERS_ID}`)
      .send({ prerequisiteIds: [IRON_MAN_ID] });

    expect(response.status).toBe(200);
    expect(response.body.data.prerequisites).toEqual([
      expect.objectContaining({ id: IRON_MAN_ID, title: 'Iron Man' }),
    ]);
  });

  it('returns 409 and rolls back when the injected detector reports a cycle', async () => {
    const cycleService = new MovieService(repository, () => true);
    const cycleApp = createApp('http://localhost:5173', {
      movieService: cycleService,
    });

    const response = await request(cycleApp)
      .patch(`/api/movies/${AVENGERS_ID}`)
      .send({ title: 'Changed Title', prerequisiteIds: [IRON_MAN_ID] });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CIRCULAR_DEPENDENCY');
    expect((await repository.findById(AVENGERS_ID))?.title).toBe('The Avengers');
  });

  it('rejects an invalid runtime without writing a movie', async () => {
    const response = await request(app).post('/api/movies').send({
      title: 'Invalid Runtime',
      releaseYear: 2020,
      runtimeMinutes: 301,
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(await repository.findAll()).toHaveLength(2);
  });

  it.each([
    ['minimum runtime', { title: 'One Minute', releaseYear: 2020, runtimeMinutes: 1 }],
    ['maximum runtime', { title: 'Five Hours', releaseYear: 2020, runtimeMinutes: 300 }],
    ['minimum release year', { title: 'Early Cinema', releaseYear: 1888, runtimeMinutes: 60 }],
    ['maximum release year', { title: 'Future Cinema', releaseYear: 2100, runtimeMinutes: 120 }],
  ])('accepts the documented %s boundary', async (_label, payload) => {
    const response = await request(app).post('/api/movies').send(payload);

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject(payload);
  });

  it('returns a conflict for a duplicate title', async () => {
    const response = await request(app).post('/api/movies').send({
      title: 'Iron Man',
      releaseYear: 2008,
      runtimeMinutes: 126,
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('DUPLICATE_TITLE');
  });

  it('returns a conflict when an update duplicates a title', async () => {
    const response = await request(app)
      .patch(`/api/movies/${AVENGERS_ID}`)
      .send({ title: 'Iron Man' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('DUPLICATE_TITLE');
  });

  it('rejects a nonexistent prerequisite without partial writes', async () => {
    const response = await request(app).post('/api/movies').send({
      title: 'Missing Link',
      releaseYear: 2020,
      runtimeMinutes: 120,
      prerequisiteIds: [MISSING_ID],
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { missingPrerequisiteIds: [MISSING_ID] },
    });
    expect(await repository.findAll()).toHaveLength(2);
  });

  it('returns 404 for a nonexistent movie', async () => {
    const response = await request(app)
      .patch(`/api/movies/${MISSING_ID}`)
      .send({ watched: true });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('MOVIE_NOT_FOUND');
  });

  it('rejects a nonexistent prerequisite during update without partial writes', async () => {
    const response = await request(app)
      .patch(`/api/movies/${AVENGERS_ID}`)
      .send({ title: 'Changed Title', prerequisiteIds: [MISSING_ID] });

    expect(response.status).toBe(400);
    expect((await repository.findById(AVENGERS_ID))?.title).toBe('The Avengers');
  });

  it.each([
    [{ title: '', releaseYear: 2020, runtimeMinutes: 120 }],
    [{ title: 'Bad Year', releaseYear: 1887, runtimeMinutes: 120 }],
    [{ title: 'Bad Watched', releaseYear: 2020, runtimeMinutes: 120, watched: 'yes' }],
    [{ title: 'Unknown Field', releaseYear: 2020, runtimeMinutes: 120, extra: true }],
    [
      {
        title: 'Duplicate Prerequisites',
        releaseYear: 2020,
        runtimeMinutes: 120,
        prerequisiteIds: [IRON_MAN_ID, IRON_MAN_ID],
      },
    ],
  ])('rejects malformed payload %#', async (payload) => {
    const response = await request(app).post('/api/movies').send(payload);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an empty patch payload', async () => {
    const response = await request(app).patch(`/api/movies/${IRON_MAN_ID}`).send({});

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a malformed movie ID', async () => {
    const response = await request(app).patch('/api/movies/not-a-uuid').send({
      watched: true,
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
