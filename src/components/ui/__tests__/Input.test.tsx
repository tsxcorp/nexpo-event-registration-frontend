import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from '../Input';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Test Label" />);
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
  });

  it('renders with error message', () => {
    render(<Input error="Error message" />);
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('renders with helper text', () => {
    render(<Input helperText="Helper text" />);
    expect(screen.getByText('Helper text')).toBeInTheDocument();
  });

  it('handles user input', async () => {
    render(<Input label="Test Input" />);
    const input = screen.getByLabelText('Test Input');
    await userEvent.type(input, 'test value');
    expect(input).toHaveValue('test value');
  });

  it('applies error styles when error is present', () => {
    render(<Input error="Error message" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-300');
  });
}); 