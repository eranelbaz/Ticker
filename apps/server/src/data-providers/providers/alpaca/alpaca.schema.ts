import { z } from 'zod';

export const alpacaBarSchema = z.object({
  t: z.string(),
  o: z.number(),
  h: z.number(),
  l: z.number(),
  c: z.number(),
  v: z.number(),
  n: z.number().optional(),
  vw: z.number().optional(),
});

export const alpacaStreamBarSchema = alpacaBarSchema.extend({
  T: z.literal('b'),
  S: z.string(),
});

export const alpacaAuthenticatedSchema = z.object({
  T: z.literal('status'),
  status: z.literal('authenticated'),
});
