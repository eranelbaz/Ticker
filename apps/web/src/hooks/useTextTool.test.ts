import { act, renderHook } from '@testing-library/react';
import { createRef } from 'react';
import type { IChartApi, ISeriesApi, MouseEventParams } from 'lightweight-charts';
import { useTextTool } from './useTextTool';
import { TextPrimitive } from '../drawings/TextPrimitive';

function setup(activeTool: 'text' | 'line' | null = 'text') {
  const attachPrimitive = jest.fn();
  const detachPrimitive = jest.fn();
  let clickHandler: ((p: MouseEventParams) => void) | undefined;
  let dblClickHandler: ((p: MouseEventParams) => void) | undefined;

  const chart = {
    subscribeClick: (h: (p: MouseEventParams) => void) => {
      clickHandler = h;
    },
    unsubscribeClick: jest.fn(),
    subscribeDblClick: (h: (p: MouseEventParams) => void) => {
      dblClickHandler = h;
    },
    unsubscribeDblClick: jest.fn(),
    panes: () => [
      {
        attachPrimitive: (prim: TextPrimitive) => {
          attachPrimitive(prim);
          prim.attached({ chart, requestUpdate: jest.fn() });
        },
        detachPrimitive,
      },
    ],
    timeScale: () => ({ timeToCoordinate: jest.fn(() => 200) }),
  } as unknown as IChartApi;

  const series = {
    coordinateToPrice: jest.fn(() => 100),
    priceToCoordinate: jest.fn(() => 80),
  } as unknown as ISeriesApi<'Candlestick'>;

  const textPrimitivesRef = createRef<TextPrimitive[]>() as React.MutableRefObject<
    TextPrimitive[]
  >;
  textPrimitivesRef.current = [];
  const onToolDeselect = jest.fn();

  const hook = renderHook(() =>
    useTextTool({ chart, series, activeTool, textPrimitivesRef, onToolDeselect }),
  );

  return {
    hook,
    attachPrimitive,
    detachPrimitive,
    textPrimitivesRef,
    onToolDeselect,
    click: (p: MouseEventParams) => act(() => clickHandler?.(p)),
    dblClick: (p: MouseEventParams) => act(() => dblClickHandler?.(p)),
  };
}

const clickParam = {
  point: { x: 200, y: 80 },
  time: 1700000000,
} as unknown as MouseEventParams;

describe('useTextTool', () => {
  it('starts with no editor open', () => {
    const { hook } = setup();
    expect(hook.result.current.editor).toBeNull();
  });

  it('placing click creates, attaches, registers a primitive and opens editor', () => {
    const t = setup('text');
    t.click(clickParam);
    expect(t.attachPrimitive).toHaveBeenCalledTimes(1);
    expect(t.textPrimitivesRef.current).toHaveLength(1);
    expect(t.onToolDeselect).toHaveBeenCalledTimes(1);
    const editor = t.hook.result.current.editor;
    expect(editor).not.toBeNull();
    expect(editor?.isNew).toBe(true);
    expect(editor?.x).toBe(200);
    expect(editor?.y).toBe(80);
  });

  it('does not place when active tool is not text', () => {
    const t = setup('line');
    t.click(clickParam);
    expect(t.attachPrimitive).not.toHaveBeenCalled();
    expect(t.hook.result.current.editor).toBeNull();
  });

  it('updateText updates the editor value and the primitive text', () => {
    const t = setup('text');
    t.click(clickParam);
    act(() => t.hook.result.current.updateText('hello'));
    expect(t.hook.result.current.editor?.value).toBe('hello');
    expect(t.textPrimitivesRef.current[0].getText()).toBe('hello');
  });

  it('committing an empty text removes the primitive', () => {
    const t = setup('text');
    t.click(clickParam);
    act(() => t.hook.result.current.commit());
    expect(t.detachPrimitive).toHaveBeenCalledTimes(1);
    expect(t.textPrimitivesRef.current).toHaveLength(0);
    expect(t.hook.result.current.editor).toBeNull();
  });

  it('committing non-empty text keeps the primitive and closes the editor', () => {
    const t = setup('text');
    t.click(clickParam);
    act(() => t.hook.result.current.updateText('keep me'));
    act(() => t.hook.result.current.commit());
    expect(t.detachPrimitive).not.toHaveBeenCalled();
    expect(t.textPrimitivesRef.current).toHaveLength(1);
    expect(t.hook.result.current.editor).toBeNull();
  });

  it('double-clicking an existing text opens the editor on it', () => {
    const t = setup('text');
    t.click(clickParam);
    act(() => t.hook.result.current.updateText('existing'));
    act(() => t.hook.result.current.commit());
    // double-click at the same spot hits the placed primitive
    t.dblClick(clickParam);
    const editor = t.hook.result.current.editor;
    expect(editor).not.toBeNull();
    expect(editor?.isNew).toBe(false);
    expect(editor?.value).toBe('existing');
  });

  it('cancel restores original text when editing an existing primitive', () => {
    const t = setup('text');
    t.click(clickParam);
    act(() => t.hook.result.current.updateText('original'));
    act(() => t.hook.result.current.commit());
    t.dblClick(clickParam);
    act(() => t.hook.result.current.updateText('changed'));
    act(() => t.hook.result.current.cancel());
    expect(t.textPrimitivesRef.current[0].getText()).toBe('original');
    expect(t.hook.result.current.editor).toBeNull();
  });
});
