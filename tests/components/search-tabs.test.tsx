// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchTabs } from '@/components/search-tabs';

describe('SearchTabs', () => {
  it('should render Top and Recent tabs', () => {
    render(<SearchTabs activeTab="top" onTabChange={vi.fn()} />);

    expect(screen.getByTestId('search-tab-top')).toBeInTheDocument();
    expect(screen.getByTestId('search-tab-recent')).toBeInTheDocument();
  });

  it('should highlight active tab', () => {
    render(<SearchTabs activeTab="top" onTabChange={vi.fn()} />);

    const topTab = screen.getByTestId('search-tab-top');
    expect(topTab).toHaveClass('text-foreground');
  });

  it('should call onTabChange when clicking on a tab', async () => {
    const user = userEvent.setup();
    const handleTabChange = vi.fn();

    render(<SearchTabs activeTab="top" onTabChange={handleTabChange} />);

    const recentTab = screen.getByTestId('search-tab-recent');
    await user.click(recentTab);

    expect(handleTabChange).toHaveBeenCalledWith('recent');
  });

  it('should show indicator under active tab', () => {
    render(<SearchTabs activeTab="top" onTabChange={vi.fn()} />);

    const topTab = screen.getByTestId('search-tab-top');
    const indicator = topTab.querySelector('.bg-foreground');

    expect(indicator).toBeInTheDocument();
  });

  it('should not show indicator under inactive tab', () => {
    render(<SearchTabs activeTab="top" onTabChange={vi.fn()} />);

    const recentTab = screen.getByTestId('search-tab-recent');
    const indicator = recentTab.querySelector('.bg-foreground');

    expect(indicator).not.toBeInTheDocument();
  });

  it('should switch active tab', async () => {
    const user = userEvent.setup();
    const handleTabChange = vi.fn();

    const { rerender } = render(<SearchTabs activeTab="top" onTabChange={handleTabChange} />);

    const recentTab = screen.getByTestId('search-tab-recent');
    await user.click(recentTab);

    expect(handleTabChange).toHaveBeenCalledWith('recent');

    // Simulate parent component updating activeTab
    rerender(<SearchTabs activeTab="recent" onTabChange={handleTabChange} />);

    expect(screen.getByTestId('search-tab-recent')).toHaveClass('text-foreground');
  });
});
