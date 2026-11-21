import { Router } from 'express';
import { createCinemaController } from '../controllers/cinema.controller.js';
import type { CinemaService } from '../services/cinema.service.js';

export function createCinemaRouter(cinemaService: CinemaService) {
  const router = Router();
  const controller = createCinemaController(cinemaService);

  router.post('/', controller.create);
  router.get('/', controller.list);
  router.get('/:id/booking', controller.booking);

  return router;
}
