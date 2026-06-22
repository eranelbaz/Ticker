import type {
  IPanePrimitivePaneView,
  IPrimitivePaneRenderer,
} from 'lightweight-charts';
import { TextPrimitiveRenderer } from './TextPrimitiveRenderer';

export class TextPrimitiveView implements IPanePrimitivePaneView {
  private _renderer: TextPrimitiveRenderer | null = null;

  update(x: number, y: number, text: string): void {
    this._renderer = new TextPrimitiveRenderer(x, y, text);
  }

  invalidate(): void {
    this._renderer = null;
  }

  renderer(): IPrimitivePaneRenderer | null {
    return this._renderer;
  }
}
