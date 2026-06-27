import { z } from 'zod';

export const HISTORY_COUNT_MIN = 1;
export const HISTORY_COUNT_MAX = 1000;

export const historyCountSchema = z
  .number()
  .int()
  .min(HISTORY_COUNT_MIN)
  .max(HISTORY_COUNT_MAX);
