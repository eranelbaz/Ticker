import type { DrawingTool } from '../drawings/types';

interface ToolButtonProps {
  label: string;
  tool: DrawingTool;
  active: boolean;
  onToggle: (tool: DrawingTool) => void;
}

function ToolButton({ label, tool, active, onToggle }: ToolButtonProps) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      onClick={() => onToggle(tool)}
      className={[
        'flex h-9 w-9 items-center justify-center rounded',
        'text-chart-text transition-colors',
        active
          ? 'bg-blue-600'
          : 'hover:bg-chart-grid',
      ].join(' ')}
    >
      {tool === 'line' ? <LineIcon /> : <RectangleIcon />}
    </button>
  );
}

function LineIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="2" y1="14" x2="14" y2="2" />
    </svg>
  );
}

function RectangleIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="4" width="12" height="8" rx="0.5" />
    </svg>
  );
}

interface Props {
  activeTool: DrawingTool | null;
  onToolSelect: (tool: DrawingTool | null) => void;
}

export function DrawingToolbar({ activeTool, onToolSelect }: Props) {
  const toggle = (tool: DrawingTool) =>
    onToolSelect(activeTool === tool ? null : tool);

  return (
    <aside
      className="flex flex-col gap-1 p-2 bg-chart-toolbar border-r border-chart-grid"
      aria-label="Drawing tools"
    >
      <ToolButton label="Line" tool="line" active={activeTool === 'line'} onToggle={toggle} />
      <ToolButton label="Rectangle" tool="rectangle" active={activeTool === 'rectangle'} onToggle={toggle} />
    </aside>
  );
}
