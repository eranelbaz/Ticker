import type { IPrimitivePaneRenderer } from 'lightweight-charts';
import type {
  BitmapCoordinateSpaceScope,
  BitmapRenderingTarget,
} from '../types';

const RECT_STROKE = '#f59e0b';
const RECT_FILL = 'rgba(245, 158, 11, 0.08)';

export class RectanglePrimitiveRenderer implements IPrimitivePaneRenderer {
  private _x1: number;
  private _y1: number;
  private _x2: number;
  private _y2: number;

  constructor(x1: number, y1: number, x2: number, y2: number) {
    this._x1 = x1;
    this._y1 = y1;
    this._x2 = x2;
    this._y2 = y2;
  }

  draw(target: BitmapRenderingTarget): void {
    target.useBitmapCoordinateSpace(
      ({
        context,
        horizontalPixelRatio,
        verticalPixelRatio,
      }: BitmapCoordinateSpaceScope) => {
        const left = Math.round(
          Math.min(this._x1, this._x2) * horizontalPixelRatio,
        );
        const top = Math.round(
          Math.min(this._y1, this._y2) * verticalPixelRatio,
        );
        const width = Math.round(
          Math.abs(this._x2 - this._x1) * horizontalPixelRatio,
        );
        const height = Math.round(
          Math.abs(this._y2 - this._y1) * verticalPixelRatio,
        );

        context.fillStyle = RECT_FILL;
        context.fillRect(left, top, width, height);

        context.strokeStyle = RECT_STROKE;
        context.lineWidth = Math.round(1 * horizontalPixelRatio);
        context.strokeRect(left, top, width, height);
      },
    );
  }
}
