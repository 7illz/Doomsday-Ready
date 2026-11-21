import type { RequestHandler } from 'express';
import type { MovieService } from '../services/movie.service.js';
import {
  createMovieSchema,
  movieIdParamsSchema,
  updateMovieSchema,
} from '../validation/movie.schemas.js';

export function createMovieController(movieService: MovieService) {
  const create: RequestHandler = async (request, response) => {
    const input = createMovieSchema.parse(request.body);
    const movie = await movieService.create(input);
    response.status(201).json({ data: movie });
  };

  const list: RequestHandler = async (_request, response) => {
    const movies = await movieService.list();
    response.status(200).json({ data: movies });
  };

  const update: RequestHandler = async (request, response) => {
    const { id } = movieIdParamsSchema.parse(request.params);
    const input = updateMovieSchema.parse(request.body);
    const movie = await movieService.update(id, input);
    response.status(200).json({ data: movie });
  };

  const rewatchOrder: RequestHandler = async (request, response) => {
    const { id } = movieIdParamsSchema.parse(request.params);
    const plan = await movieService.getRewatchPlan(id);
    response.status(200).json({ data: plan });
  };

  return { create, list, update, rewatchOrder };
}
