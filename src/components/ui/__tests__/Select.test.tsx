import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Select from '../Select';

const options = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
];

describe('Select', () => {
  it('renders with label', () => {
    render(<Select label="Test Label" options={options} />);
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<Select options={options} />);
    options.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  it('renders with error message', () => {
    render(<Select error="Error message" options={options} />);
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('renders with helper text', () => {
    render(<Select helperText="Helper text" options={options} />);
    expect(screen.getByText('Helper text')).toBeInTheDocument();
  });

  it('handles selection change', async () => {
    render(<Select label="Test Select" options={options} />);
    const select = screen.getByLabelText('Test Select');
    await userEvent.selectOptions(select, '2');
    expect(select).toHaveValue('2');
  });

  it('applies error styles when error is present', () => {
    render(<Select error="Error message" options={options} />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('border-red-300');
  });
}); 