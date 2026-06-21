import { useEffect, useRef } from 'react';
import {
  TEXT_FONT_SIZE,
  TEXT_FONT_FAMILY,
  TEXT_COLOR,
} from '../drawings/TextPrimitive/TextPrimitiveRenderer';

type TextEditorProps = {
  x: number;
  y: number;
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
};

export function TextEditor({
  x,
  y,
  value,
  onChange,
  onCommit,
  onCancel,
}: TextEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <textarea
      ref={ref}
      aria-label="Text input"
      value={value}
      rows={1}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onCommit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      }}
      onBlur={onCommit}
      style={{
        position: 'absolute',
        left: x,
        top: y - TEXT_FONT_SIZE,
        margin: 0,
        padding: 0,
        border: 'none',
        outline: 'none',
        background: 'transparent',
        color: TEXT_COLOR,
        font: `${TEXT_FONT_SIZE}px ${TEXT_FONT_FAMILY}`,
        lineHeight: `${TEXT_FONT_SIZE}px`,
        resize: 'none',
        overflow: 'hidden',
        whiteSpace: 'pre',
        zIndex: 10,
      }}
    />
  );
}
