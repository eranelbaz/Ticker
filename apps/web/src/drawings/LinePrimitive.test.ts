import type { ISeriesApi } from 'lightweight-charts';
import type { DrawingPoint } from './types';
import { LinePrimitive } from './LinePrimitive';

function makeMockSeries(priceToCoordinate = jest.fn(() => 100 as any)) {
  return { priceToCoordinate } as unknown as ISeriesApi<'Candlestick'>;
}

function makeMockChart(timeToCoordinate = jest.fn(() => 200 as any)) {
  return {
    timeScale: () => ({ timeToCoordinate }),
  } as any;
}

const p1: DrawingPoint = { time: 1700000000 as any, price: 50 };
const p2: DrawingPoint = { time: 1700003600 as any, price: 60 };

describe('LinePrimitive', () => {
  it('paneViews returns one view', () => {
    const prim = new LinePrimitive(makeMockSeries(), p1, p2);
    expect(prim.paneViews()).toHaveLength(1);
  });

  it('view renderer returns null before updateAllViews is called', () => {
    const prim = new LinePrimitive(makeMockSeries(), p1, p2);
    const [view] = prim.paneViews();
    expect(view.renderer()).toBeNull();
  });

  it('view renderer is non-null after attached + updateAllViews with valid coords', () => {
    const prim = new LinePrimitive(makeMockSeries(), p1, p2);
    const requestUpdate = jest.fn();
    prim.attached({ chart: makeMockChart(), requestUpdate });
    prim.updateAllViews();
    const [view] = prim.paneViews();
    expect(view.renderer()).not.toBeNull();
  });

  it('setPoints calls requestUpdate', () => {
    const prim = new LinePrimitive(makeMockSeries(), p1, p2);
    const requestUpdate = jest.fn();
    prim.attached({ chart: makeMockChart(), requestUpdate });
    prim.setPoints(p1, p2);
    expect(requestUpdate).toHaveBeenCalledTimes(1);
  });

  it('setPoints does not throw before attached', () => {
    const prim = new LinePrimitive(makeMockSeries(), p1, p2);
    expect(() => prim.setPoints(p1, p2)).not.toThrow();
  });

  it('updateAllViews calls coordinate conversion on chart and series', () => {
    const timeToCoordinate = jest.fn(() => 150 as any);
    const priceToCoordinate = jest.fn(() => 200 as any);
    const prim = new LinePrimitive(makeMockSeries(priceToCoordinate), p1, p2);
    prim.attached({ chart: makeMockChart(timeToCoordinate), requestUpdate: jest.fn() });
    prim.updateAllViews();
    expect(timeToCoordinate).toHaveBeenCalledWith(p1.time);
    expect(timeToCoordinate).toHaveBeenCalledWith(p2.time);
    expect(priceToCoordinate).toHaveBeenCalledWith(p1.price);
    expect(priceToCoordinate).toHaveBeenCalledWith(p2.price);
  });

  it('view renderer is null when a coordinate returns null (out of visible range)', () => {
    const prim = new LinePrimitive(
      makeMockSeries(jest.fn(() => null)),
      p1,
      p2,
    );
    prim.attached({ chart: makeMockChart(), requestUpdate: jest.fn() });
    prim.updateAllViews();
    const [view] = prim.paneViews();
    expect(view.renderer()).toBeNull();
  });
});
