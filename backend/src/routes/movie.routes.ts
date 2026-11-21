import { Router } from 'express';
import { createMovieController } from '../controllers/movie.controller.js';
import type { MovieService } from '../services/movie.service.js';

export function createMovieRouter(movieService: MovieService) {
  const router = Router();
  const controller = createMovieController(movieService);

  router.post('/', controller.create);
  router.get('/', controller.list);
  router.patch('/:id', controller.update);

  return router;
}
