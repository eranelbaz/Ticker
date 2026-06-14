import type {
  IChartApiBase,
  IPanePrimitive,
  IPanePrimitivePaneView,
  IPrimitivePaneRenderer,
  ISeriesApi,
  PaneAttachedParameter,
  Time,
} from 'lightweight-charts';
import type { DrawingPoint } from './types';

const RECT_STROKE = '#f59e0b';
const RECT_FILL = 'rgba(245, 158, 11, 0.08)';

class RectanglePrimitiveRenderer implements IPrimitivePaneRenderer {
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

  draw(target: any): void {
    const self = this;
    target.useBitmapCoordinateSpace(function({ context, horizontalPixelRatio, verticalPixelRatio }: any) {
      const left = Math.round(Math.min(self._x1, self._x2) * horizontalPixelRatio);
      const top = Math.round(Math.min(self._y1, self._y2) * verticalPixelRatio);
      const width = Math.round(Math.abs(self._x2 - self._x1) * horizontalPixelRatio);
      const height = Math.round(Math.abs(self._y2 - self._y1) * verticalPixelRatio);

      context.fillStyle = RECT_FILL;
      context.fillRect(left, top, width, height);

      context.strokeStyle = RECT_STROKE;
      context.lineWidth = Math.round(1 * horizontalPixelRatio);
      context.strokeRect(left, top, width, height);
    });
  }
}

class RectanglePrimitiveView implements IPanePrimitivePaneView {
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

export class RectanglePrimitive implements IPanePrimitive<Time> {
  private _chart: IChartApiBase<Time> | null = null;
  private _requestUpdate: (() => void) | null = null;
  private _series: ISeriesApi<'Candlestick'>;
  private _p1: DrawingPoint;
  private _p2: DrawingPoint;
  private readonly _view = new RectanglePrimitiveView();

  constructor(series: ISeriesApi<'Candlestick'>, p1: DrawingPoint, p2: DrawingPoint) {
    this._series = series;
    this._p1 = p1;
    this._p2 = p2;
  }

  attached(param: PaneAttachedParameter): void {
    this._chart = param.chart;
    this._requestUpdate = param.requestUpdate;
  }

  detached(): void {
    this._chart = null;
    this._requestUpdate = null;
  }

  setPoints(p1: DrawingPoint, p2: DrawingPoint): void {
    this._p1 = p1;
    this._p2 = p2;
    this._requestUpdate?.();
  }

  updateAllViews(): void {
    if (!this._chart) {
      return;
    }

    const x1 = this._chart.timeScale().timeToCoordinate(this._p1.time);
    const y1 = this._series.priceToCoordinate(this._p1.price);
    const x2 = this._chart.timeScale().timeToCoordinate(this._p2.time);
    const y2 = this._series.priceToCoordinate(this._p2.price);

    if (x1 === null || y1 === null || x2 === null || y2 === null) {
      this._view.invalidate();
      return;
    }

    this._view.update(x1, y1, x2, y2);
  }

  paneViews(): IPanePrimitivePaneView[] {
    return [this._view];
  }
}
