import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DrawingToolbar } from './DrawingToolbar';

describe('DrawingToolbar', () => {
  it('renders a Line button and a Rectangle button', () => {
    render(<DrawingToolbar activeTool={null} onToolSelect={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Line' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rectangle' })).toBeInTheDocument();
  });

  it('calls onToolSelect with the tool when a button is clicked', async () => {
    const onToolSelect = jest.fn();
    render(<DrawingToolbar activeTool={null} onToolSelect={onToolSelect} />);
    await userEvent.click(screen.getByRole('button', { name: 'Line' }));
    expect(onToolSelect).toHaveBeenCalledWith('line');
  });

  it('calls onToolSelect with null when the active tool button is clicked again', async () => {
    const onToolSelect = jest.fn();
    render(<DrawingToolbar activeTool="line" onToolSelect={onToolSelect} />);
    await userEvent.click(screen.getByRole('button', { name: 'Line' }));
    expect(onToolSelect).toHaveBeenCalledWith(null);
  });

  it('marks the active tool button with aria-pressed', () => {
    render(<DrawingToolbar activeTool="rectangle" onToolSelect={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Rectangle' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Line' })).toHaveAttribute('aria-pressed', 'false');
  });
});
