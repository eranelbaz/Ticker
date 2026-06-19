import type {
  IChartApiBase,
  IPanePrimitive,
  IPanePrimitivePaneView,
  IPrimitivePaneRenderer,
  ISeriesApi,
  PaneAttachedParameter,
  Time,
} from 'lightweight-charts';
import type {
  BitmapCoordinateSpaceScope,
  BitmapRenderingTarget,
  DrawingPoint,
} from './types';

const LINE_COLOR = '#f59e0b';

class LinePrimitiveRenderer implements IPrimitivePaneRenderer {
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

class LinePrimitiveView implements IPanePrimitivePaneView {
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

export class LinePrimitive implements IPanePrimitive<Time> {
  private _chart: IChartApiBase<Time> | null = null;
  private _requestUpdate: (() => void) | null = null;
  private readonly _view = new LinePrimitiveView();

  private _series: ISeriesApi<'Candlestick'>;
  private _p1: DrawingPoint;
  private _p2: DrawingPoint;

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
