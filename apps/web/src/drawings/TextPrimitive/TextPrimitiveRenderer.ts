import type { IPrimitivePaneRenderer } from 'lightweight-charts';
import type {
  BitmapCoordinateSpaceScope,
  BitmapRenderingTarget,
} from '../types';

export const TEXT_COLOR = '#f59e0b';
export const TEXT_FONT_SIZE = 14;
export const TEXT_FONT_FAMILY = 'sans-serif';

export class TextPrimitiveRenderer implements IPrimitivePaneRenderer {
  private readonly x: number;
  private readonly y: number;
  private readonly text: string;

  constructor(x: number, y: number, text: string) {
    this.x = x;
    this.y = y;
    this.text = text;
  }

  draw(target: BitmapRenderingTarget): void {
    if (this.text.length === 0) {
      return;
    }
    target.useBitmapCoordinateSpace(
      ({
        context,
        horizontalPixelRatio,
        verticalPixelRatio,
      }: BitmapCoordinateSpaceScope) => {
        const hpr = horizontalPixelRatio ?? 1;
        const vpr = verticalPixelRatio ?? 1;
        context.fillStyle = TEXT_COLOR;
        context.textBaseline = 'alphabetic';
        context.font = `${Math.round(TEXT_FONT_SIZE * vpr)}px ${TEXT_FONT_FAMILY}`;
        context.fillText(
          this.text,
          Math.round(this.x * hpr),
          Math.round(this.y * vpr),
        );
      },
    );
  }
}
