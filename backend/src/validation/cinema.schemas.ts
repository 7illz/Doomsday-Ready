import { z } from 'zod';

const bundleSizeSchema = z
  .number()
  .int('Each bundle size must be an integer.')
  .min(1, 'Each bundle must contain at least 1 seat.')
  .max(500, 'Each bundle must contain at most 500 seats.');

export const createCinemaSchema = z
  .object({
    name: z.string().trim().min(1, 'Cinema name is required.').max(150),
    bundleSizes: z
      .array(bundleSizeSchema)
      .min(1, 'At least one bundle size is required.')
      .max(10, 'At most ten bundle sizes are allowed.')
      .superRefine((sizes, context) => {
        if (new Set(sizes).size !== sizes.length) {
          context.addIssue({
            code: 'custom',
            message: 'Bundle sizes must be distinct.',
          });
        }
      }),
  })
  .strict();

export const cinemaIdParamsSchema = z
  .object({ id: z.uuid('Cinema ID must be a valid UUID.') })
  .strict();

export const bookingQuerySchema = z
  .object({
    groupSize: z
      .string('Group size is required.')
      .regex(/^\d+$/, 'Group size must be an integer.')
      .transform(Number)
      .pipe(
        z
          .number()
          .int()
          .min(1, 'Group size must be at least 1.')
          .max(10_000, 'Group size must be at most 10000.'),
      ),
  })
  .strict();

export type CreateCinemaInput = z.infer<typeof createCinemaSchema>;
