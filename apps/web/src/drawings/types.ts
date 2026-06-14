import type { UTCTimestamp } from 'lightweight-charts';

export type DrawingTool = 'line' | 'rectangle';

export interface DrawingPoint {
  time: UTCTimestamp;
  price: number;
}
