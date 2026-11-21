import { AppError } from '../errors/app-error.js';
import type {
  CinemaRecord,
  CinemaRepository,
} from '../repositories/cinema.repository.js';
import type { CreateCinemaInput } from '../validation/cinema.schemas.js';
import type {
  BundleOptimizationResult,
  MinimumBundleOptimizer,
} from './minimum-bundle-optimizer.js';

export type BookingQuote = BundleOptimizationResult & {
  cinema: CinemaRecord;
  groupSize: number;
};

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

export class CinemaService {
  constructor(
    private readonly repository: CinemaRepository,
    private readonly optimizeBundles: MinimumBundleOptimizer,
  ) {}

  async create(input: CreateCinemaInput): Promise<CinemaRecord> {
    try {
      return await this.repository.create(input.name, input.bundleSizes);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new AppError(
          409,
          'DUPLICATE_CINEMA_NAME',
          'A cinema with this name already exists.',
        );
      }
      throw error;
    }
  }

  list(): Promise<CinemaRecord[]> {
    return this.repository.findAll();
  }

  async getBookingQuote(cinemaId: string, groupSize: number): Promise<BookingQuote> {
    const cinema = await this.repository.findById(cinemaId);
    if (!cinema) {
      throw new AppError(404, 'CINEMA_NOT_FOUND', 'Cinema not found.');
    }

    const result = this.optimizeBundles(cinema.bundleSizes, groupSize);
    return { cinema, groupSize, ...result };
  }
}
