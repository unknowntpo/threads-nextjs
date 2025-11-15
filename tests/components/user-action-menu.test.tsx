// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

  describe('Follow button visibility', () => {
    it('should show Follow button when viewing another user', async () => {
      render(
        <UserActionMenu
          userId="other-user-id"
          username="otheruser"
          displayName="Other User"
          currentUserId="current-user-id"
          trigger={<button>Hover me</button>}
        />
      );

      // Hover over trigger to open hover card
      const trigger = screen.getByText('Hover me');
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
          trigger={<button>Hover me</button>}
        />
      );

      // Hover over trigger to open hover card
      const trigger = screen.getByText('Hover me');
      await userEvent.hover(trigger);

      // Wait for hover card to open and check user info appears
      await waitFor(
        () => {
          expect(screen.getByText('Current User')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      // Should NOT show Follow button when viewing yourself
      expect(screen.queryByText('Follow')).not.toBeInTheDocument();
    });

    it('should show user info for both self and others', async () => {
      const { rerender } = render(
        <UserActionMenu
          userId="other-user-id"
          username="otheruser"
          displayName="Other User"
          currentUserId="current-user-id"
          trigger={<button>Hover me</button>}
        />
      );

      // Hover to open hover card
      const trigger = screen.getByText('Hover me');
      await userEvent.hover(trigger);

      await waitFor(
        () => {
          expect(screen.getByText('Other User')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      // Unhover to close
      await userEvent.unhover(trigger);
      await waitFor(
        () => {
          expect(screen.queryByText('Other User')).not.toBeInTheDocument();
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
          trigger={<button>Hover me</button>}
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
          trigger={<button>Hover me</button>}
        />
      );

      // Hover to open hover card
      const trigger = screen.getByText('Hover me');
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
