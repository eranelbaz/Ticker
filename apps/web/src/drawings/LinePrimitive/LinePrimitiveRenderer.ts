import type { IPrimitivePaneRenderer } from 'lightweight-charts';
import type {
  BitmapCoordinateSpaceScope,
  BitmapRenderingTarget,
} from '../types';

const LINE_COLOR = '#f59e0b';

export class LinePrimitiveRenderer implements IPrimitivePaneRenderer {
  private readonly x1: number;
  private readonly y1: number;
  private readonly x2: number;
  private readonly y2: number;

  constructor(x1: number, y1: number, x2: number, y2: number) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }

  draw(target: BitmapRenderingTarget): void {
    target.useBitmapCoordinateSpace(
      ({
        context,
        horizontalPixelRatio,
        verticalPixelRatio,
      }: BitmapCoordinateSpaceScope) => {
        context.beginPath();
        context.moveTo(
          Math.round(this.x1 * (horizontalPixelRatio ?? 1)),
          Math.round(this.y1 * (verticalPixelRatio ?? 1)),
        );
        context.lineTo(
          Math.round(this.x2 * (horizontalPixelRatio ?? 1)),
          Math.round(this.y2 * (verticalPixelRatio ?? 1)),
        );
        context.strokeStyle = LINE_COLOR;
        const lineWidth = Math.round(1 * (horizontalPixelRatio ?? 1));
        context.lineWidth = lineWidth;
        context.stroke();
      },
    );
  }
}
