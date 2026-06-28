import { z } from 'zod';

export const alpacaStreamBarSchema = z.object({
  T: z.literal('b'),
  S: z.string(),
  o: z.number(),
  h: z.number(),
  l: z.number(),
  c: z.number(),
  v: z.number(),
  t: z.string(),
  n: z.number().optional(),
  vw: z.number().optional(),
});

export type AlpacaStreamBar = z.infer<typeof alpacaStreamBarSchema>;
