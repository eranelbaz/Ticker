import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextEditor } from './TextEditor';

function renderEditor(overrides: Partial<React.ComponentProps<typeof TextEditor>> = {}) {
  const props = {
    x: 100,
    y: 50,
    value: '',
    onChange: jest.fn(),
    onCommit: jest.fn(),
    onCancel: jest.fn(),
    ...overrides,
  };
  render(<TextEditor {...props} />);
  return props;
}

describe('TextEditor', () => {
  it('renders a focused text input', () => {
    renderEditor();
    const input = screen.getByRole('textbox', { name: 'Text input' });
    expect(input).toHaveFocus();
  });

  it('calls onChange when the user types', async () => {
    const props = renderEditor();
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Text input' }),
      'a',
    );
    expect(props.onChange).toHaveBeenCalledWith('a');
  });

  it('calls onCommit when Enter is pressed', async () => {
    const props = renderEditor({ value: 'hi' });
    screen.getByRole('textbox', { name: 'Text input' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(props.onCommit).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Escape is pressed', async () => {
    const props = renderEditor({ value: 'hi' });
    screen.getByRole('textbox', { name: 'Text input' }).focus();
    await userEvent.keyboard('{Escape}');
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCommit on blur', async () => {
    const props = renderEditor({ value: 'hi' });
    const input = screen.getByRole('textbox', { name: 'Text input' });
    input.focus();
    input.blur();
    expect(props.onCommit).toHaveBeenCalledTimes(1);
  });
});
