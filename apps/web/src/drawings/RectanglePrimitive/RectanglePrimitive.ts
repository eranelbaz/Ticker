import type {
  IChartApiBase,
  IPanePrimitive,
  IPanePrimitivePaneView,
  ISeriesApi,
  PaneAttachedParameter,
  Time,
} from 'lightweight-charts';
import type { DrawingPoint } from '../types';
import { RectanglePrimitiveView } from './RectanglePrimitiveView';

export class RectanglePrimitive implements IPanePrimitive<Time> {
  private _chart: IChartApiBase<Time> | null = null;
  private _requestUpdate: (() => void) | null = null;
  private _series: ISeriesApi<'Candlestick'>;
  private _p1: DrawingPoint;
  private _p2: DrawingPoint;
  private readonly _view = new RectanglePrimitiveView();

  constructor(
    series: ISeriesApi<'Candlestick'>,
    p1: DrawingPoint,
    p2: DrawingPoint,
  ) {
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
