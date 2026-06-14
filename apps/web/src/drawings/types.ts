import type { UTCTimestamp } from 'lightweight-charts';

export type DrawingTool = 'line' | 'rectangle';

export type DrawingPoint = {
  time: UTCTimestamp;
  price: number;
}
