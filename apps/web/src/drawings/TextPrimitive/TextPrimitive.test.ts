import type {
  Coordinate,
  IChartApiBase,
  ISeriesApi,
  Time,
} from 'lightweight-charts';
import type { DrawingPoint } from '../types';
import { TextPrimitive } from './TextPrimitive';

function makeMockSeries(
  priceToCoordinate: jest.Mock<Coordinate | null> = jest.fn(
    () => 100 as Coordinate,
  ),
) {
  return { priceToCoordinate } as unknown as ISeriesApi<'Candlestick'>;
}

function makeMockChart(
  timeToCoordinate: jest.Mock<Coordinate | null> = jest.fn(
    () => 200 as Coordinate,
  ),
) {
  return {
    timeScale: () => ({ timeToCoordinate }),
  } as unknown as IChartApiBase<Time>;
}

const anchor: DrawingPoint = {
  time: 1700000000 as DrawingPoint['time'],
  price: 50,
};

describe('TextPrimitive', () => {
  it('paneViews returns one view', () => {
    const prim = new TextPrimitive(makeMockSeries(), anchor, 'hello');
    expect(prim.paneViews()).toHaveLength(1);
  });

  it('view renderer returns null before updateAllViews is called', () => {
    const prim = new TextPrimitive(makeMockSeries(), anchor, 'hello');
    const [view] = prim.paneViews();
    expect(view.renderer()).toBeNull();
  });

  it('view renderer is non-null after attached + updateAllViews with valid coords', () => {
    const prim = new TextPrimitive(makeMockSeries(), anchor, 'hello');
    prim.attached({ chart: makeMockChart(), requestUpdate: jest.fn() });
    prim.updateAllViews();
    const [view] = prim.paneViews();
    expect(view.renderer()).not.toBeNull();
  });

  it('view renderer is null when a coordinate returns null (out of range)', () => {
    const prim = new TextPrimitive(
      makeMockSeries(jest.fn(() => null)),
      anchor,
      'hello',
    );
    prim.attached({ chart: makeMockChart(), requestUpdate: jest.fn() });
    prim.updateAllViews();
    const [view] = prim.paneViews();
    expect(view.renderer()).toBeNull();
  });

  it('setText calls requestUpdate and getText returns the new value', () => {
    const prim = new TextPrimitive(makeMockSeries(), anchor, 'old');
    const requestUpdate = jest.fn();
    prim.attached({ chart: makeMockChart(), requestUpdate });
    prim.setText('new');
    expect(requestUpdate).toHaveBeenCalledTimes(1);
    expect(prim.getText()).toBe('new');
  });

  it('setText does not throw before attached', () => {
    const prim = new TextPrimitive(makeMockSeries(), anchor, 'old');
    expect(() => prim.setText('new')).not.toThrow();
  });

  it('getAnchor returns the anchor point', () => {
    const prim = new TextPrimitive(makeMockSeries(), anchor, 'hello');
    expect(prim.getAnchor()).toEqual(anchor);
  });

  it('containsPoint is false before updateAllViews resolves coordinates', () => {
    const prim = new TextPrimitive(makeMockSeries(), anchor, 'hello');
    expect(prim.containsPoint(200, 100)).toBe(false);
  });

  it('containsPoint is true for a point inside the rendered text box', () => {
    // anchor resolves to x=200 (time) , y=100 (price); baseline at y, text
    // grows right and up. A point just above/right of the anchor is inside.
    const prim = new TextPrimitive(makeMockSeries(), anchor, 'hello');
    prim.attached({ chart: makeMockChart(), requestUpdate: jest.fn() });
    prim.updateAllViews();
    expect(prim.containsPoint(205, 95)).toBe(true);
  });

  it('containsPoint is false for a point far from the text', () => {
    const prim = new TextPrimitive(makeMockSeries(), anchor, 'hello');
    prim.attached({ chart: makeMockChart(), requestUpdate: jest.fn() });
    prim.updateAllViews();
    expect(prim.containsPoint(1000, 1000)).toBe(false);
  });

  it('setVisible(false) hides the view renderer', () => {
    const prim = new TextPrimitive(makeMockSeries(), anchor, 'hello');
    prim.attached({ chart: makeMockChart(), requestUpdate: jest.fn() });
    prim.updateAllViews();
    expect(prim.paneViews()[0].renderer()).not.toBeNull();
    prim.setVisible(false);
    prim.updateAllViews();
    expect(prim.paneViews()[0].renderer()).toBeNull();
  });

  it('setVisible(true) restores the view renderer', () => {
    const prim = new TextPrimitive(makeMockSeries(), anchor, 'hello');
    prim.attached({ chart: makeMockChart(), requestUpdate: jest.fn() });
    prim.updateAllViews();
    prim.setVisible(false);
    prim.updateAllViews();
    expect(prim.paneViews()[0].renderer()).toBeNull();
    prim.setVisible(true);
    prim.updateAllViews();
    expect(prim.paneViews()[0].renderer()).not.toBeNull();
  });
});
