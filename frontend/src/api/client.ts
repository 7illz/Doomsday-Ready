const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

interface ApiEnvelope<T> {
  data: T;
}

interface ApiErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

export interface HealthResponse {
  status: 'ok';
  service: string;
}

export interface MovieSummary {
  id: string;
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  watched: boolean;
}

export interface Movie extends MovieSummary {
  prerequisites: MovieSummary[];
}

export interface CreateMovieRequest {
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  watched?: boolean;
  prerequisiteIds?: string[];
}

export type UpdateMovieRequest = Partial<CreateMovieRequest>;

export interface RewatchPlan {
  target: MovieSummary;
  orderedPrerequisites: MovieSummary[];
  totalPrerequisiteCount: number;
  watchedCount: number;
  remainingRuntimeMinutes: number;
}

export interface Cinema {
  id: string;
  name: string;
  bundleSizes: number[];
}

export interface CreateCinemaRequest {
  name: string;
  bundleSizes: number[];
}

export interface BundleQuantity {
  size: number;
  quantity: number;
}

export interface BookingQuote {
  cinema: Cinema;
  groupSize: number;
  possible: boolean;
  totalBundles: number | null;
  bundles: BundleQuantity[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code = 'API_ERROR',
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let payload: ApiErrorEnvelope | undefined;
    try {
      payload = (await response.json()) as ApiErrorEnvelope;
    } catch {
      payload = undefined;
    }
    throw new ApiError(
      payload?.error?.message ?? `API request failed with status ${response.status}.`,
      response.status,
      payload?.error?.code,
      payload?.error?.details,
    );
  }

  return response.json() as Promise<T>;
}

export const api = {
  getHealth: () => request<HealthResponse>('/health'),
  getMovies: async () => (await request<ApiEnvelope<Movie[]>>('/movies')).data,
  createMovie: async (input: CreateMovieRequest) =>
    (
      await request<ApiEnvelope<Movie>>('/movies', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    ).data,
  updateMovie: async (movieId: string, input: UpdateMovieRequest) =>
    (
      await request<ApiEnvelope<Movie>>(`/movies/${encodeURIComponent(movieId)}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      })
    ).data,
  getRewatchPlan: async (movieId: string) =>
    (
      await request<ApiEnvelope<RewatchPlan>>(
        `/movies/${encodeURIComponent(movieId)}/rewatch-order`,
      )
    ).data,
  getCinemas: async () => (await request<ApiEnvelope<Cinema[]>>('/cinemas')).data,
  createCinema: async (input: CreateCinemaRequest) =>
    (
      await request<ApiEnvelope<Cinema>>('/cinemas', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    ).data,
  getBookingQuote: async (cinemaId: string, groupSize: number) =>
    (
      await request<ApiEnvelope<BookingQuote>>(
        `/cinemas/${encodeURIComponent(cinemaId)}/booking?groupSize=${groupSize}`,
      )
    ).data,
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'The service could not be reached. Check that the API is running and try again.';
}
