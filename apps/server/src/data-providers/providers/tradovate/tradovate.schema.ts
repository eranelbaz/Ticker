import { z } from 'zod';

export const tradovateAccessTokenResponseSchema = z.object({
  accessToken: z.string().optional(),
  mdAccessToken: z.string().optional(),
  expirationTime: z.string().optional(),
  errorText: z.string().optional(),
  'p-ticket': z.string().optional(),
  'p-time': z.number().optional(),
  'p-captcha': z.boolean().optional(),
});

export const tradovateResponseItemSchema = z.object({
  i: z.number(),
  s: z.number(),
  d: z.unknown().optional(),
});

export const tradovateChartBarSchema = z.object({
  timestamp: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  upVolume: z.number().optional(),
  downVolume: z.number().optional(),
  upTicks: z.number().optional(),
  downTicks: z.number().optional(),
  bidVolume: z.number().optional(),
  offerVolume: z.number().optional(),
});

export const tradovateChartPacketSchema = z.object({
  id: z.number(),
  td: z.number().optional(),
  bars: z.array(tradovateChartBarSchema).optional(),
  eoh: z.boolean().optional(),
});

export const tradovateChartEventSchema = z.object({
  e: z.literal('chart'),
  d: z.object({
    charts: z.array(tradovateChartPacketSchema),
  }),
});

export const tradovateGetChartResultSchema = z.object({
  historicalId: z.number().optional(),
  realtimeId: z.number().optional(),
  subscriptionId: z.number().optional(),
});

export const tradovateThrottleSchema = z.object({
  'p-ticket': z.string().optional(),
  'p-time': z.number().optional(),
  'p-captcha': z.boolean().optional(),
});
