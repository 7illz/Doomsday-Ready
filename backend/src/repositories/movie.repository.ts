import type { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../database/client.js';

export interface MovieSummary {
  id: string;
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  watched: boolean;
}

export interface MovieRecord extends MovieSummary {
  prerequisites: MovieSummary[];
}

export interface DependencyRecord {
  id: string;
  prerequisiteIds: string[];
}

export interface MovieCreateRecord {
  id: string;
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  watched: boolean;
  prerequisiteIds: string[];
}

export interface MovieUpdateRecord {
  title?: string;
  releaseYear?: number;
  runtimeMinutes?: number;
  watched?: boolean;
  prerequisiteIds?: string[];
}

export interface MovieRepository {
  transaction<T>(operation: (repository: MovieRepository) => Promise<T>): Promise<T>;
  findAll(): Promise<MovieRecord[]>;
  findById(id: string): Promise<MovieRecord | null>;
  findExistingIds(ids: readonly string[]): Promise<string[]>;
  getDependencyGraph(): Promise<DependencyRecord[]>;
  create(input: MovieCreateRecord): Promise<MovieRecord>;
  update(id: string, input: MovieUpdateRecord): Promise<MovieRecord>;
}

const movieInclude = {
  prerequisites: {
    include: { prerequisite: true },
    orderBy: { prerequisite: { title: 'asc' } },
  },
} satisfies Prisma.MovieInclude;

type MovieWithPrerequisites = Prisma.MovieGetPayload<{
  include: typeof movieInclude;
}>;

type MovieDatabaseClient = Pick<Prisma.TransactionClient, 'movie' | 'moviePrerequisite'>;

function toMovieRecord(movie: MovieWithPrerequisites): MovieRecord {
  return {
    id: movie.id,
    title: movie.title,
    releaseYear: movie.releaseYear,
    runtimeMinutes: movie.runtimeMinutes,
    watched: movie.watched,
    prerequisites: movie.prerequisites.map(({ prerequisite }) => ({
      id: prerequisite.id,
      title: prerequisite.title,
      releaseYear: prerequisite.releaseYear,
      runtimeMinutes: prerequisite.runtimeMinutes,
      watched: prerequisite.watched,
    })),
  };
}

export class PrismaMovieRepository implements MovieRepository {
  constructor(private readonly client: MovieDatabaseClient = prisma) {}

  transaction<T>(operation: (repository: MovieRepository) => Promise<T>): Promise<T> {
    return prisma.$transaction(
      (transaction) => operation(new PrismaMovieRepository(transaction)),
      { isolationLevel: 'Serializable' },
    );
  }

  async findAll(): Promise<MovieRecord[]> {
    const movies = await this.client.movie.findMany({
      orderBy: [{ releaseYear: 'asc' }, { title: 'asc' }],
      include: movieInclude,
    });
    return movies.map(toMovieRecord);
  }

  async findById(id: string): Promise<MovieRecord | null> {
    const movie = await this.client.movie.findUnique({
      where: { id },
      include: movieInclude,
    });
    return movie ? toMovieRecord(movie) : null;
  }

  async findExistingIds(ids: readonly string[]): Promise<string[]> {
    if (ids.length === 0) return [];
    const movies = await this.client.movie.findMany({
      where: { id: { in: [...ids] } },
      select: { id: true },
    });
    return movies.map(({ id }) => id);
  }

  async getDependencyGraph(): Promise<DependencyRecord[]> {
    const movies = await this.client.movie.findMany({
      select: {
        id: true,
        prerequisites: { select: { prerequisiteId: true } },
      },
    });
    return movies.map((movie) => ({
      id: movie.id,
      prerequisiteIds: movie.prerequisites.map(({ prerequisiteId }) => prerequisiteId),
    }));
  }

  async create(input: MovieCreateRecord): Promise<MovieRecord> {
    const movie = await this.client.movie.create({
      data: {
        id: input.id,
        title: input.title,
        releaseYear: input.releaseYear,
        runtimeMinutes: input.runtimeMinutes,
        watched: input.watched,
        prerequisites: {
          create: input.prerequisiteIds.map((prerequisiteId) => ({
            prerequisite: { connect: { id: prerequisiteId } },
          })),
        },
      },
      include: movieInclude,
    });
    return toMovieRecord(movie);
  }

  async update(id: string, input: MovieUpdateRecord): Promise<MovieRecord> {
    const { prerequisiteIds, ...metadata } = input;

    if (prerequisiteIds !== undefined) {
      await this.client.moviePrerequisite.deleteMany({ where: { movieId: id } });
      if (prerequisiteIds.length > 0) {
        await this.client.moviePrerequisite.createMany({
          data: prerequisiteIds.map((prerequisiteId) => ({
            movieId: id,
            prerequisiteId,
          })),
        });
      }
    }

    const movie = await this.client.movie.update({
      where: { id },
      data: metadata,
      include: movieInclude,
    });
    return toMovieRecord(movie);
  }
}
