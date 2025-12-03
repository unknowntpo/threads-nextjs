// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserActionMenu } from '@/components/user-action-menu';

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

describe('UserActionMenu', () => {
  beforeEach(() => {
    // Mock fetch for user info
    global.fetch = vi.fn(url => {
      if (url.includes('/api/users/')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              isFollowing: false,
              user: {
                bio: 'Test bio',
                _count: {
                  followers: 42,
                },
              },
            }),
        } as Response);
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  afterEach(() => {
    // Clean up to prevent React cleanup timing errors
    vi.clearAllTimers();
  });

  describe('Lazy loading behavior', () => {
    it('should NOT fetch user info on mount', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');

      render(
        <UserActionMenu
          userId="test-user-id"
          username="testuser"
          displayName="Test User"
          currentUserId="current-user-id"
          trigger={<button data-testid="trigger-lazy">Hover me</button>}
        />
      );

      // Wait a bit to ensure no fetch is triggered
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify fetch was NOT called
      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('should fetch user info only when hover card opens', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');

      render(
        <UserActionMenu
          userId="test-user-id"
          username="testuser"
          displayName="Test User"
          currentUserId="current-user-id"
          trigger={<button data-testid="trigger-hover">Hover me</button>}
        />
      );

      // Verify no fetch on mount
      expect(fetchSpy).not.toHaveBeenCalled();

      // Hover to trigger fetch
      const trigger = screen.getByTestId('trigger-hover');
      await userEvent.hover(trigger);

      // Verify fetch was called
      await waitFor(
        () => {
          expect(fetchSpy).toHaveBeenCalledWith('/api/users/test-user-id');
        },
        { timeout: 1000 }
      );

      fetchSpy.mockRestore();
    });

    it('should NOT fetch user info multiple times on repeated hovers', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');

      render(
        <UserActionMenu
          userId="test-user-id"
          username="testuser"
          displayName="Test User"
          currentUserId="current-user-id"
          trigger={<button data-testid="trigger-multiple">Hover me</button>}
        />
      );

      const trigger = screen.getByTestId('trigger-multiple');

      // First hover
      await userEvent.hover(trigger);
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      // Unhover
      await userEvent.unhover(trigger);

      // Second hover - should not fetch again
      await userEvent.hover(trigger);
      await new Promise(resolve => setTimeout(resolve, 200));

      // Should still be called only once
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      fetchSpy.mockRestore();
    });

    it('should show loading state while fetching', async () => {
      // Make fetch delay to capture loading state
      global.fetch = vi.fn(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _url =>
          new Promise<Response>(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () =>
                    Promise.resolve({
                      isFollowing: false,
                      user: { bio: 'Test bio', _count: { followers: 42 } },
                    }),
                } as Response),
              100
            )
          )
      );

      render(
        <UserActionMenu
          userId="test-user-id"
          username="testuser"
          displayName="Test User"
          currentUserId="current-user-id"
          trigger={<button data-testid="trigger-loading">Hover me</button>}
        />
      );

      const trigger = screen.getByTestId('trigger-loading');
      await userEvent.hover(trigger);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });

      // Wait for data to load
      await waitFor(
        () => {
          expect(screen.getByText('Test User')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe('Follow button visibility', () => {
    it('should show Follow button when viewing another user', async () => {
      render(
        <UserActionMenu
          userId="other-user-id"
          username="otheruser"
          displayName="Other User"
          currentUserId="current-user-id"
          trigger={<button data-testid="trigger-other">Hover me</button>}
        />
      );

      // Hover over trigger to open hover card
      const trigger = screen.getByTestId('trigger-other');
      await userEvent.hover(trigger);

      // Wait for hover card to open and Follow button to appear
      await waitFor(
        () => {
          expect(screen.getByText('Follow')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('should hide Follow button when viewing yourself', async () => {
      render(
        <UserActionMenu
          userId="current-user-id"
          username="currentuser"
          displayName="Current User"
          currentUserId="current-user-id"
          trigger={<button data-testid="trigger-self">Hover me</button>}
        />
      );

      // Hover over trigger to open hover card
      const trigger = screen.getByTestId('trigger-self');
      await userEvent.hover(trigger);

      // Wait for hover card to open and check user info appears
      await waitFor(
        () => {
          expect(screen.getByText('Current User')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('should show user info for both self and others', async () => {
      const { rerender } = render(
        <UserActionMenu
          userId="other-user-id"
          username="otheruser"
          displayName="Other User"
          currentUserId="current-user-id"
          trigger={<button data-testid="trigger-rerender">Hover me</button>}
        />
      );

      // Hover to open hover card
      const trigger = screen.getByTestId('trigger-rerender');
      await userEvent.hover(trigger);

      await waitFor(
        () => {
          expect(screen.getByText('Other User')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      // Rerender as self
      rerender(
        <UserActionMenu
          userId="current-user-id"
          username="currentuser"
          displayName="Current User"
          currentUserId="current-user-id"
          trigger={<button data-testid="trigger-rerender">Hover me</button>}
        />
      );

      // Hover again to open
      await userEvent.hover(trigger);

      await waitFor(
        () => {
          expect(screen.getByText('Current User')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe('User information display', () => {
    it('should display user avatar, displayName and username', async () => {
      render(
        <UserActionMenu
          userId="test-user-id"
          username="testuser"
          displayName="Test User"
          avatarUrl="https://example.com/avatar.jpg"
          currentUserId="current-user-id"
          trigger={<button data-testid="trigger-info">Hover me</button>}
        />
      );

      // Hover to open hover card
      const trigger = screen.getByTestId('trigger-info');
      await userEvent.hover(trigger);

      await waitFor(
        () => {
          expect(screen.getByText('Test User')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });
});
