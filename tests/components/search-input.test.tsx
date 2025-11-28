// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from '@/components/search-input';

describe('SearchInput', () => {
  it('should render input with placeholder', () => {
    render(
      <SearchInput value="" onChange={vi.fn()} onSubmit={vi.fn()} placeholder="Search posts..." />
    );

    expect(screen.getByPlaceholderText('Search posts...')).toBeInTheDocument();
  });

  it('should call onChange when typing', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<SearchInput value="" onChange={handleChange} onSubmit={vi.fn()} />);

    const input = screen.getByTestId('search-input');
    await user.type(input, 'React');

    expect(handleChange).toHaveBeenCalledTimes(5); // Each character
  });

  it('should call onSubmit when pressing Enter', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<SearchInput value="React" onChange={vi.fn()} onSubmit={handleSubmit} />);

    const input = screen.getByTestId('search-input');
    await user.type(input, '{Enter}');

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it('should call onSubmit when clicking Search button', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<SearchInput value="React" onChange={vi.fn()} onSubmit={handleSubmit} />);

    const button = screen.getByTestId('search-submit-button');
    await user.click(button);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it('should disable Search button when value is empty', () => {
    render(<SearchInput value="" onChange={vi.fn()} onSubmit={vi.fn()} />);

    const button = screen.getByTestId('search-submit-button');
    expect(button).toBeDisabled();
  });

  it('should enable Search button when value is not empty', () => {
    render(<SearchInput value="React" onChange={vi.fn()} onSubmit={vi.fn()} />);

    const button = screen.getByTestId('search-submit-button');
    expect(button).not.toBeDisabled();
  });

  it('should show clear button when value is not empty', () => {
    render(<SearchInput value="React" onChange={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByTestId('search-clear-button')).toBeInTheDocument();
  });

  it('should not show clear button when value is empty', () => {
    render(<SearchInput value="" onChange={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.queryByTestId('search-clear-button')).not.toBeInTheDocument();
  });

  it('should clear value when clicking clear button', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<SearchInput value="React" onChange={handleChange} onSubmit={vi.fn()} />);

    const clearButton = screen.getByTestId('search-clear-button');
    await user.click(clearButton);

    expect(handleChange).toHaveBeenCalledWith('');
  });
});
