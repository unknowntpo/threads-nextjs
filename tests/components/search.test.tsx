// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Search } from '@/components/search';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds = [];
  takeRecords() {
    return [];
  }
};

// Mock hooks
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock next-auth
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock post tracking
vi.mock('@/hooks/use-post-tracking', () => ({
  usePostViewTracking: () => null,
}));

// Mock tracking utils
vi.mock('@/lib/utils/tracking', () => ({
  trackClick: vi.fn(),
  trackLike: vi.fn(),
  trackShare: vi.fn(),
}));

describe('Search', () => {
  const mockSearchResponse = {
    results: [
      {
        type: 'post',
        score: 0.8,
        data: {
          id: 'post-1',
          content: 'Learning React is awesome!',
          userId: 'user-1',
          createdAt: new Date('2024-01-01').toISOString(),
          updatedAt: new Date('2024-01-01').toISOString(),
          mediaUrls: [],
          user: {
            id: 'user-1',
            username: 'alice',
            displayName: 'Alice',
            avatarUrl: null,
          },
          _count: {
            likes: 5,
            comments: 2,
            reposts: 1,
          },
          isLikedByUser: false,
          isRepostedByUser: false,
        },
      },
    ],
    metadata: {
      total: 1,
      count: 1,
      offset: 0,
      limit: 20,
      hasMore: false,
      query: 'React',
      filter: 'top',
    },
  };

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('should render search input and empty state', () => {
    render(<Search currentUserId="current-user-id" />);

    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByText('Search for posts')).toBeInTheDocument();
  });

  it('should search when clicking Search button', async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSearchResponse,
    });

    render(<Search currentUserId="current-user-id" />);

    const input = screen.getByTestId('search-input');
    await user.type(input, 'React');

    const searchButton = screen.getByTestId('search-submit-button');
    await user.click(searchButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/search?q=React'));
    });

    await waitFor(() => {
      expect(screen.getByText('Learning React is awesome!')).toBeInTheDocument();
    });
  });

  it('should search when pressing Enter', async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSearchResponse,
    });

    render(<Search currentUserId="current-user-id" />);

    const input = screen.getByTestId('search-input');
    await user.type(input, 'React{Enter}');

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/search?q=React'));
    });

    await waitFor(() => {
      expect(screen.getByText('Learning React is awesome!')).toBeInTheDocument();
    });
  });

  it('should show tabs after search', async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSearchResponse,
    });

    render(<Search currentUserId="current-user-id" />);

    const input = screen.getByTestId('search-input');
    await user.type(input, 'React{Enter}');

    await waitFor(() => {
      expect(screen.getByTestId('search-tab-top')).toBeInTheDocument();
      expect(screen.getByTestId('search-tab-recent')).toBeInTheDocument();
    });
  });

  it('should change filter when clicking tab', async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSearchResponse,
    });

    render(<Search currentUserId="current-user-id" />);

    const input = screen.getByTestId('search-input');
    await user.type(input, 'React{Enter}');

    await waitFor(() => {
      expect(screen.getByTestId('search-tab-recent')).toBeInTheDocument();
    });

    const recentTab = screen.getByTestId('search-tab-recent');
    await user.click(recentTab);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('filter=recent'));
    });
  });

  it('should show loading state while searching', async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => mockSearchResponse,
              }),
            100
          )
        )
    );

    render(<Search currentUserId="current-user-id" />);

    const input = screen.getByTestId('search-input');
    await user.type(input, 'React{Enter}');

    expect(screen.getByText('Searching...')).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.queryByText('Searching...')).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('should show empty state when no results', async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [],
        metadata: {
          total: 0,
          count: 0,
          offset: 0,
          limit: 20,
          hasMore: false,
          query: 'Python',
          filter: 'top',
        },
      }),
    });

    render(<Search currentUserId="current-user-id" />);

    const input = screen.getByTestId('search-input');
    await user.type(input, 'Python{Enter}');

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText(/No posts match "Python"/)).toBeInTheDocument();
    });
  });

  it('should not search with empty query', async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn();

    render(<Search currentUserId="current-user-id" />);

    const searchButton = screen.getByTestId('search-submit-button');
    expect(searchButton).toBeDisabled();

    await user.click(searchButton);

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
