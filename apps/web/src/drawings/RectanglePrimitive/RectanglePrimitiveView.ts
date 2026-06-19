import type {
  IPanePrimitivePaneView,
  IPrimitivePaneRenderer,
} from 'lightweight-charts';
import { RectanglePrimitiveRenderer } from './RectanglePrimitiveRenderer';

export class RectanglePrimitiveView implements IPanePrimitivePaneView {
  private _renderer: RectanglePrimitiveRenderer | null = null;

  update(x1: number, y1: number, x2: number, y2: number): void {
    this._renderer = new RectanglePrimitiveRenderer(x1, y1, x2, y2);
  }

  invalidate(): void {
    this._renderer = null;
  }

  renderer(): IPrimitivePaneRenderer | null {
    return this._renderer;
  }
}
