import { randomUUID } from 'node:crypto';
import { AppError } from '../errors/app-error.js';
import type {
  MovieRecord,
  MovieRepository,
  MovieSummary,
} from '../repositories/movie.repository.js';
import type {
  CreateMovieInput,
  UpdateMovieInput,
} from '../validation/movie.schemas.js';
import type { CircularDependencyDetector } from './circular-dependency-detector.js';
import { getRewatchOrder } from './rewatch-order.js';

export interface RewatchPlan {
  target: MovieSummary;
  orderedPrerequisites: MovieSummary[];
  totalPrerequisiteCount: number;
  watchedCount: number;
  remainingRuntimeMinutes: number;
}

function toMovieSummary(movie: MovieRecord): MovieSummary {
  return {
    id: movie.id,
    title: movie.title,
    releaseYear: movie.releaseYear,
    runtimeMinutes: movie.runtimeMinutes,
    watched: movie.watched,
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

export class MovieService {
  constructor(
    private readonly repository: MovieRepository,
    private readonly detectCircularDependency: CircularDependencyDetector,
  ) {}

  list(): Promise<MovieRecord[]> {
    return this.repository.findAll();
  }

  async getRewatchPlan(id: string): Promise<RewatchPlan> {
    const movies = await this.repository.findAll();
    const moviesById = new Map(movies.map((movie) => [movie.id, movie]));
    const targetMovie = moviesById.get(id);
    if (!targetMovie) {
      throw new AppError(404, 'MOVIE_NOT_FOUND', 'Movie not found.');
    }

    const graph = new Map(
      movies.map((movie) => [
        movie.id,
        movie.prerequisites.map((prerequisite) => prerequisite.id),
      ]),
    );
    const orderedIds = getRewatchOrder(id, graph);
    const orderedPrerequisites = orderedIds.map((movieId) =>
      toMovieSummary(moviesById.get(movieId)!),
    );

    return {
      target: toMovieSummary(targetMovie),
      orderedPrerequisites,
      totalPrerequisiteCount: orderedPrerequisites.length,
      watchedCount: orderedPrerequisites.filter((movie) => movie.watched).length,
      remainingRuntimeMinutes: orderedPrerequisites
        .filter((movie) => !movie.watched)
        .reduce((total, movie) => total + movie.runtimeMinutes, 0),
    };
  }

  async create(input: CreateMovieInput): Promise<MovieRecord> {
    try {
      return await this.repository.transaction(async (repository) => {
        await this.assertPrerequisitesExist(repository, input.prerequisiteIds);

        const id = randomUUID();
        const graph = await repository.getDependencyGraph();
        const createsCycle = await this.detectCircularDependency({
          targetMovieId: id,
          proposedPrerequisiteIds: input.prerequisiteIds,
          graph,
        });
        if (createsCycle) {
          throw new AppError(
            409,
            'CIRCULAR_DEPENDENCY',
            'The proposed prerequisites create a circular dependency.',
          );
        }

        return repository.create({ id, ...input });
      });
    } catch (error) {
      this.rethrowDuplicateTitle(error);
    }
  }

  async update(id: string, input: UpdateMovieInput): Promise<MovieRecord> {
    try {
      return await this.repository.transaction(async (repository) => {
        const existingMovie = await repository.findById(id);
        if (!existingMovie) {
          throw new AppError(404, 'MOVIE_NOT_FOUND', 'Movie not found.');
        }

        if (input.prerequisiteIds !== undefined) {
          await this.assertPrerequisitesExist(repository, input.prerequisiteIds);
          const graph = await repository.getDependencyGraph();
          const createsCycle = await this.detectCircularDependency({
            targetMovieId: id,
            proposedPrerequisiteIds: input.prerequisiteIds,
            graph,
          });
          if (createsCycle) {
            throw new AppError(
              409,
              'CIRCULAR_DEPENDENCY',
              'The proposed prerequisites create a circular dependency.',
            );
          }
        }

        return repository.update(id, input);
      });
    } catch (error) {
      this.rethrowDuplicateTitle(error);
    }
  }

  private async assertPrerequisitesExist(
    repository: MovieRepository,
    prerequisiteIds: readonly string[],
  ): Promise<void> {
    const existingIds = new Set(await repository.findExistingIds(prerequisiteIds));
    const missingIds = prerequisiteIds.filter((id) => !existingIds.has(id));
    if (missingIds.length > 0) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'One or more prerequisite movies do not exist.',
        { missingPrerequisiteIds: missingIds },
      );
    }
  }

  private rethrowDuplicateTitle(error: unknown): never {
    if (isUniqueConstraintError(error)) {
      throw new AppError(
        409,
        'DUPLICATE_TITLE',
        'A movie with this title already exists.',
      );
    }
    throw error;
  }
}
