import type { UTCTimestamp } from 'lightweight-charts';

export type DrawingTool = 'line' | 'rectangle';

export type DrawingPoint = {
  time: UTCTimestamp;
  price: number;
};

export type BitmapCoordinateSpaceScope = {
  context: CanvasRenderingContext2D;
  horizontalPixelRatio: number;
  verticalPixelRatio: number;
};

export type BitmapRenderingTarget = {
  useBitmapCoordinateSpace(
    callback: (scope: BitmapCoordinateSpaceScope) => void,
  ): void;
};
