// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptySearchState } from '@/components/empty-search-state';

describe('EmptySearchState', () => {
  it('should show initial state when no query', () => {
    render(<EmptySearchState />);

    expect(screen.getByText('Search for posts')).toBeInTheDocument();
    expect(screen.getByText('Enter a keyword to find relevant posts')).toBeInTheDocument();
  });

  it('should show no results state when query provided', () => {
    render(<EmptySearchState query="React" />);

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText(/No posts match "React"/)).toBeInTheDocument();
  });

  it('should display search query in no results message', () => {
    render(<EmptySearchState query="TypeScript" />);

    expect(screen.getByText(/No posts match "TypeScript"/)).toBeInTheDocument();
  });

  it('should render search icon', () => {
    const { container } = render(<EmptySearchState />);

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});
