import type { RequestHandler } from 'express';
import type { CinemaService } from '../services/cinema.service.js';
import {
  bookingQuerySchema,
  cinemaIdParamsSchema,
  createCinemaSchema,
} from '../validation/cinema.schemas.js';

export function createCinemaController(cinemaService: CinemaService) {
  const create: RequestHandler = async (request, response) => {
    const input = createCinemaSchema.parse(request.body);
    const cinema = await cinemaService.create(input);
    response.status(201).json({ data: cinema });
  };

  const list: RequestHandler = async (_request, response) => {
    const cinemas = await cinemaService.list();
    response.status(200).json({ data: cinemas });
  };

  const booking: RequestHandler = async (request, response) => {
    const { id } = cinemaIdParamsSchema.parse(request.params);
    const { groupSize } = bookingQuerySchema.parse(request.query);
    const quote = await cinemaService.getBookingQuote(id, groupSize);
    response.status(200).json({ data: quote });
  };

  return { create, list, booking };
}
