import { z } from 'zod';

const titleSchema = z.string().trim().min(1, 'Title is required.').max(200);
const releaseYearSchema = z
  .number()
  .int('Release year must be an integer.')
  .min(1888, 'Release year must be at least 1888.')
  .max(2100, 'Release year must be at most 2100.');
const runtimeSchema = z
  .number()
  .int('Runtime must be an integer.')
  .min(1, 'Runtime must be at least 1 minute.')
  .max(300, 'Runtime must be at most 300 minutes.');
const prerequisiteIdsSchema = z
  .array(z.uuid('Each prerequisite ID must be a valid UUID.'))
  .superRefine((ids, context) => {
    const duplicateId = ids.find((id, index) => ids.indexOf(id) !== index);
    if (duplicateId) {
      context.addIssue({
        code: 'custom',
        message: 'Prerequisite IDs must be unique.',
      });
    }
  });

export const createMovieSchema = z
  .object({
    title: titleSchema,
    releaseYear: releaseYearSchema,
    runtimeMinutes: runtimeSchema,
    watched: z.boolean().optional().default(false),
    prerequisiteIds: prerequisiteIdsSchema.optional().default([]),
  })
  .strict();

export const updateMovieSchema = z
  .object({
    title: titleSchema.optional(),
    releaseYear: releaseYearSchema.optional(),
    runtimeMinutes: runtimeSchema.optional(),
    watched: z.boolean().optional(),
    prerequisiteIds: prerequisiteIdsSchema.optional(),
  })
  .strict()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one movie field must be provided.',
  });

export const movieIdParamsSchema = z
  .object({
    id: z.uuid('Movie ID must be a valid UUID.'),
  })
  .strict();

export type CreateMovieInput = z.infer<typeof createMovieSchema>;
export type UpdateMovieInput = z.infer<typeof updateMovieSchema>;
