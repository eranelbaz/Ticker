import type {
  IChartApiBase,
  IPanePrimitive,
  IPanePrimitivePaneView,
  ISeriesApi,
  PaneAttachedParameter,
  Time,
} from 'lightweight-charts';
import type { DrawingPoint } from '../types';
import { TextPrimitiveView } from './TextPrimitiveView';
import { TEXT_FONT_SIZE } from './TextPrimitiveRenderer';

// Approximate average glyph width as a fraction of font size, used only for
// double-click hit-testing (not for rendering, where the canvas measures text).
const CHAR_WIDTH_RATIO = 0.6;
const MIN_HIT_WIDTH = 16;

export class TextPrimitive implements IPanePrimitive<Time> {
  private _chart: IChartApiBase<Time> | null = null;
  private _requestUpdate: (() => void) | null = null;
  private readonly _view = new TextPrimitiveView();

  private _series: ISeriesApi<'Candlestick'>;
  private _anchor: DrawingPoint;
  private _text: string;
  private _x: number | null = null;
  private _y: number | null = null;

  constructor(
    series: ISeriesApi<'Candlestick'>,
    anchor: DrawingPoint,
    text: string,
  ) {
    this._series = series;
    this._anchor = anchor;
    this._text = text;
  }

  attached(param: PaneAttachedParameter): void {
    this._chart = param.chart;
    this._requestUpdate = param.requestUpdate;
  }

  detached(): void {
    this._chart = null;
    this._requestUpdate = null;
  }

  setText(text: string): void {
    this._text = text;
    this._requestUpdate?.();
  }

  getText(): string {
    return this._text;
  }

  getAnchor(): DrawingPoint {
    return this._anchor;
  }

  setAnchor(anchor: DrawingPoint): void {
    this._anchor = anchor;
    this._requestUpdate?.();
  }

  updateAllViews(): void {
    if (!this._chart) {
      return;
    }

    const x = this._chart.timeScale().timeToCoordinate(this._anchor.time);
    const y = this._series.priceToCoordinate(this._anchor.price);

    if (x === null || y === null) {
      this._x = null;
      this._y = null;
      this._view.invalidate();
      return;
    }

    this._x = x;
    this._y = y;
    this._view.update(x, y, this._text);
  }

  paneViews(): IPanePrimitivePaneView[] {
    return [this._view];
  }

  containsPoint(x: number, y: number): boolean {
    if (this._x === null || this._y === null) {
      return false;
    }
    const width = Math.max(
      this._text.length * TEXT_FONT_SIZE * CHAR_WIDTH_RATIO,
      MIN_HIT_WIDTH,
    );
    // Text is drawn with an alphabetic baseline at (_x, _y): it extends right
    // from _x and up by TEXT_FONT_SIZE from the baseline.
    return (
      x >= this._x &&
      x <= this._x + width &&
      y <= this._y &&
      y >= this._y - TEXT_FONT_SIZE
    );
  }
}
