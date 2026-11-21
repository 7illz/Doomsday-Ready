import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { healthRouter } from './routes/health.routes.js';
import { createMovieRouter } from './routes/movie.routes.js';
import { PrismaMovieRepository } from './repositories/movie.repository.js';
import {
  detectCircularDependency,
  type CircularDependencyDetector,
} from './services/circular-dependency-detector.js';
import { MovieService } from './services/movie.service.js';
import { createCinemaRouter } from './routes/cinema.routes.js';
import { PrismaCinemaRepository } from './repositories/cinema.repository.js';
import { CinemaService } from './services/cinema.service.js';
import {
  findMinimumBundleCombination,
  type MinimumBundleOptimizer,
} from './services/minimum-bundle-optimizer.js';

export interface AppDependencies {
  movieService?: MovieService;
  cycleDetector?: CircularDependencyDetector;
  cinemaService?: CinemaService;
  bundleOptimizer?: MinimumBundleOptimizer;
}

export function createApp(
  frontendUrl = 'http://localhost:5173',
  dependencies: AppDependencies = {},
) {
  const app = express();
  const movieService =
    dependencies.movieService ??
    new MovieService(
      new PrismaMovieRepository(),
      dependencies.cycleDetector ?? detectCircularDependency,
    );
  const cinemaService =
    dependencies.cinemaService ??
    new CinemaService(
      new PrismaCinemaRepository(),
      dependencies.bundleOptimizer ?? findMinimumBundleCombination,
    );

  app.disable('x-powered-by');
  app.use(
    cors({
      origin: frontendUrl,
      methods: ['GET', 'POST', 'PATCH'],
      allowedHeaders: ['Content-Type'],
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  app.use('/api/health', healthRouter);
  app.use('/api/movies', createMovieRouter(movieService));
  app.use('/api/cinemas', createCinemaRouter(cinemaService));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
