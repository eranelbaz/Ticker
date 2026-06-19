import type {
  IPanePrimitivePaneView,
  IPrimitivePaneRenderer,
} from 'lightweight-charts';
import { LinePrimitiveRenderer } from './LinePrimitiveRenderer';

export class LinePrimitiveView implements IPanePrimitivePaneView {
  private _renderer: LinePrimitiveRenderer | null = null;

  update(x1: number, y1: number, x2: number, y2: number): void {
    this._renderer = new LinePrimitiveRenderer(x1, y1, x2, y2);
  }

  invalidate(): void {
    this._renderer = null;
  }

  renderer(): IPrimitivePaneRenderer | null {
    return this._renderer;
  }
}
