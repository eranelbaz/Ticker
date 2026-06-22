import { classNameMerge } from '../utils/classNameMerge';
import type { DrawingTool } from '../drawings/types';
import { LineIcon } from './icons/LineIcon';
import { RectangleIcon } from './icons/RectangleIcon';
import { TextIcon } from './icons/TextIcon';

const TOOL_ICONS: Record<DrawingTool, React.ReactNode> = {
  line: <LineIcon />,
  rectangle: <RectangleIcon />,
  text: <TextIcon />,
};

type ToolButtonProps = {
  label: string;
  tool: DrawingTool;
  active: boolean;
  onToggle: (tool: DrawingTool) => void;
};

function ToolButton({ label, tool, active, onToggle }: ToolButtonProps) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      onClick={() => onToggle(tool)}
      className={classNameMerge(
        'flex h-9 w-9 items-center justify-center rounded',
        'text-chart-text transition-colors',
        active ? 'bg-blue-600' : 'hover:bg-chart-grid',
      )}
    >
      {TOOL_ICONS[tool]}
    </button>
  );
}

type Props = {
  activeTool: DrawingTool | null;
  onToolSelect: (tool: DrawingTool | null) => void;
};

export function DrawingToolbar({ activeTool, onToolSelect }: Props) {
  const toggle = (tool: DrawingTool) =>
    onToolSelect(activeTool === tool ? null : tool);

  return (
    <aside
      className="flex flex-col gap-1 p-2 bg-chart-toolbar border-r border-chart-grid"
      aria-label="Drawing tools"
    >
      <ToolButton
        label="Line"
        tool="line"
        active={activeTool === 'line'}
        onToggle={toggle}
      />
      <ToolButton
        label="Rectangle"
        tool="rectangle"
        active={activeTool === 'rectangle'}
        onToggle={toggle}
      />
      <ToolButton
        label="Text"
        tool="text"
        active={activeTool === 'text'}
        onToggle={toggle}
      />
    </aside>
  );
}
