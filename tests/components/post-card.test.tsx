// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PostCard } from '@/components/post-card';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 'current-user-id', email: 'current@test.com' } },
    status: 'authenticated',
  }),
}));

// Mock hooks
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-post-tracking', () => ({
  usePostViewTracking: () => null,
}));

// Mock tracking utils
vi.mock('@/lib/utils/tracking', () => ({
  trackClick: vi.fn(),
  trackLike: vi.fn(),
  trackShare: vi.fn(),
}));

describe('PostCard - Hover Behavior', () => {
  const mockPost = {
    id: 'post-1',
    content: 'Test post content',
    userId: 'user-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    mediaUrls: [],
    user: {
      id: 'user-1',
      username: 'testuser',
      displayName: 'Test User',
      avatarUrl: null,
    },
    _count: {
      likes: 0,
      comments: 0,
      reposts: 0,
    },
    isLikedByUser: false,
    isRepostedByUser: false,
  };

  beforeEach(() => {
    // Mock fetch for follow status
    global.fetch = vi.fn(url => {
      if (url.includes('/api/users/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ isFollowing: false }),
        } as Response);
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  it('should show UserActionMenu hover card on hover over username', async () => {
    const user = userEvent.setup();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<PostCard post={mockPost as any} currentUserId="current-user-id" />);

    // Find the display name button (trigger for hover card)
    const displayNameButton = screen.getByText('Test User');

    // Hover over the display name button
    await user.hover(displayNameButton);

    // Hover card should now be visible with Follow button
    await waitFor(
      () => {
        expect(screen.getByText('Follow')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    // Unhover to close
    await user.unhover(displayNameButton);

    // Hover card should be hidden after delay
    await waitFor(
      () => {
        expect(screen.queryByText('Follow')).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });
});
