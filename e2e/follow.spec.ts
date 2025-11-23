import { test, expect, helpers } from './fixtures';
import type { Page } from '@playwright/test';

test.describe('Follow Functionality', () => {
  const timeout = 1000;
  // Helper function to login
  async function loginUser(page: Page, email: string, password: string) {
    await page.goto('/auth/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Login' }).click({ timeout });
    // Wait for redirect navigation (signIn uses redirect: true)
    await page.waitForURL('/feed', { timeout: 10000 });
  }

  test('should open user action menu when hovering on username in a post', async ({ page }) => {
    // Create two users
    const { user: alice, password: alicePassword } = await helpers.createUser({
      email: 'alice@example.com',
      username: 'alice',
      displayName: 'Alice Cooper',
    });

    const { user: bob } = await helpers.createUser({
      email: 'bob@example.com',
      username: 'bob',
      displayName: 'Bob Smith',
    });

    // Bob creates a post
    await helpers.createPost({
      userId: bob.id,
      content: "Bob's test post for follow feature",
    });

    // Login as Alice
    await loginUser(page, alice.email, alicePassword);
    await page.goto('/feed');
    await page.waitForLoadState('networkidle');

    // Click on Bob's username in the post
    const bobUsername = page.getByTestId('post-author').filter({ hasText: /Bob Smith/i });
    await bobUsername.click({ timeout: 3000 });

    // Should see user action menu with Follow and Visit Profile buttons
    await expect(page.getByRole('button', { name: 'Follow' })).toBeVisible({ timeout: 5000 });
  });

  test('should follow a user from user action menu', async ({ page }) => {
    // Create two users
    const { user: alice, password: alicePassword } = await helpers.createUser({
      email: 'alice@example.com',
      username: 'alice',
      displayName: 'Alice Cooper',
    });

    const { user: bob } = await helpers.createUser({
      email: 'bob@example.com',
      username: 'bob',
      displayName: 'Bob Smith',
    });

    // Bob creates a post
    await helpers.createPost({
      userId: bob.id,
      content: "Bob's test post",
    });

    // Login as Alice
    await loginUser(page, alice.email, alicePassword);
    await page.goto('/feed');
    await page.waitForLoadState('networkidle');

    // Click on Bob's username
    const bobUsername = page.getByTestId('post-author').filter({ hasText: /Bob Smith/i });
    await bobUsername.hover({ timeout });
    const followToggleButtonId = 'follow-toggle-button';
    await expect(page.getByTestId(followToggleButtonId)).toBeVisible({ timeout });

    // Click Follow button
    const followButton = page.getByTestId(followToggleButtonId);
    await followButton.click({ timeout });

    // Should see success toast
    await expect(page.getByText(/You are now following/i)).toBeVisible({ timeout: 3000 });

    // Button should change to "Following"
    await expect(followButton).toHaveText(/Following/);
  });

  test('should unfollow a user from user action menu', async ({ page }) => {
    // Create two users
    const { user: alice, password: alicePassword } = await helpers.createUser({
      email: 'alice@example.com',
      username: 'alice',
      displayName: 'Alice Cooper',
    });

    const { user: bob } = await helpers.createUser({
      email: 'bob@example.com',
      username: 'bob',
      displayName: 'Bob Smith',
    });

    // Bob creates a post
    await helpers.createPost({
      userId: bob.id,
      content: "Bob's test post",
    });

    // Alice follows Bob using helper
    await helpers.createFollow({
      followerId: alice.id,
      followingId: bob.id,
    });

    // Login as Alice
    await loginUser(page, alice.email, alicePassword);
    await page.goto('/feed');
    await page.waitForLoadState('networkidle');

    // Hover on Bob's username to show HoverCard
    const bobUsername = page.getByTestId('post-author').filter({ hasText: /Bob Smith/i });
    await bobUsername.hover({ timeout });

    // Should see "Following" button (already following)
    const followToggleButtonId = 'follow-toggle-button';
    const followingButton = page.getByTestId(followToggleButtonId);
    await expect(followingButton).toBeVisible({ timeout });
    await expect(followingButton).toHaveText(/Following/);

    // Click to unfollow
    await followingButton.click({ timeout });

    // Should see success toast
    await expect(page.getByText(/You unfollowed/i)).toBeVisible({ timeout: 3000 });

    // Button should change back to "Follow"
    await expect(followingButton).toHaveText(/Follow/);
  });

  test('should navigate to profile page when clicking username', async ({ page }) => {
    // Create two users
    const { user: alice, password: alicePassword } = await helpers.createUser({
      email: 'alice@example.com',
      username: 'alice',
      displayName: 'Alice Cooper',
    });

    const { user: bob } = await helpers.createUser({
      email: 'bob@example.com',
      username: 'bob',
      displayName: 'Bob Smith',
    });

    // Bob creates a post
    await helpers.createPost({
      userId: bob.id,
      content: "Bob's test post",
    });

    // Login as Alice
    await loginUser(page, alice.email, alicePassword);
    await page.goto('/feed');
    await page.waitForLoadState('networkidle');

    // Click on Bob's username in the post
    const bobUsername = page.getByTestId('post-author').filter({ hasText: /Bob Smith/i });
    await bobUsername.click({ timeout });

    // Should navigate to Bob's profile page
    await page.waitForURL(`/profile/bob`, { timeout: 5000 });

    // Should see Bob's profile info on the page
    await expect(page.getByRole('heading', { name: 'Bob Smith' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('@bob').first()).toBeVisible({ timeout: 5000 });
  });

  test('should not show follow button on user action menu on own posts', async ({ page }) => {
    // Create user
    const { user: alice, password: alicePassword } = await helpers.createUser({
      email: 'alice@example.com',
      username: 'alice',
      displayName: 'Alice Cooper',
    });

    // Alice creates a post
    await helpers.createPost({
      userId: alice.id,
      content: 'My own post',
    });

    // Login as Alice
    await loginUser(page, alice.email, alicePassword);
    await page.goto('/feed');
    await page.waitForLoadState('networkidle');

    // Hover on own username
    const aliceUsername = page.getByTestId('post-author').filter({ hasText: /Alice Cooper/i });
    await aliceUsername.hover({ timeout });

    // Wait a bit for HoverCard to potentially appear
    await page.waitForTimeout(500);

    // Follow button should NOT appear when viewing own posts
    const followButton = page.getByTestId('follow-toggle-button');
    await expect(followButton).not.toBeVisible();
  });

  test('should display follower and following counts in profile', async ({ page }) => {
    // Create three users
    const { user: alice, password: alicePassword } = await helpers.createUser({
      email: 'alice@example.com',
      username: 'alice',
      displayName: 'Alice Cooper',
    });

    const { user: bob } = await helpers.createUser({
      email: 'bob@example.com',
      username: 'bob',
      displayName: 'Bob Smith',
    });

    const { user: charlie } = await helpers.createUser({
      email: 'charlie@example.com',
      username: 'charlie',
      displayName: 'Charlie Brown',
    });

    // Bob and Charlie follow Alice
    await helpers.createFollow({ followerId: bob.id, followingId: alice.id });
    await helpers.createFollow({ followerId: charlie.id, followingId: alice.id });

    // Alice follows Bob
    await helpers.createFollow({ followerId: alice.id, followingId: bob.id });

    // Login as Alice
    await loginUser(page, alice.email, alicePassword);
    await page.goto('/feed');
    await page.waitForLoadState('networkidle');

    // Open own profile
    await page.click('button[aria-label="Profile"]');

    // Note: Follower/following counts might not be displayed yet in ProfileModal
    // This test documents the expected behavior for future implementation
    // When counts are added, update this test to verify them
  });

  test('should handle follow/unfollow with mutual follows correctly', async ({ page }) => {
    // Create two users
    const { user: alice, password: alicePassword } = await helpers.createUser({
      email: 'alice@example.com',
      username: 'alice',
      displayName: 'Alice Cooper',
    });

    const { user: bob } = await helpers.createUser({
      email: 'bob@example.com',
      username: 'bob',
      displayName: 'Bob Smith',
    });

    // Bob creates a post
    await helpers.createPost({
      userId: bob.id,
      content: "Bob's test post",
    });

    // Bob follows Alice first
    await helpers.createFollow({ followerId: bob.id, followingId: alice.id });

    // Login as Alice
    await loginUser(page, alice.email, alicePassword);
    await page.goto('/feed');
    await page.waitForLoadState('networkidle');

    // Alice follows Bob (creating mutual follow)
    const bobUsername = page.getByTestId('post-author').filter({ hasText: /Bob Smith/i });
    await bobUsername.hover({ timeout });

    const followToggleButtonId = 'follow-toggle-button';
    const followButton = page.getByTestId(followToggleButtonId);
    await expect(followButton).toBeVisible({ timeout });
    await expect(followButton).toHaveText(/Follow/);

    await followButton.click({ timeout });

    // Should see Following button
    await expect(followButton).toHaveText(/Following/);

    // Verify mutual follow exists in database
    const aliceFollowsBob = await helpers.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: alice.id,
          followingId: bob.id,
        },
      },
    });

    const bobFollowsAlice = await helpers.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: bob.id,
          followingId: alice.id,
        },
      },
    });

    expect(aliceFollowsBob).toBeTruthy();
    expect(bobFollowsAlice).toBeTruthy();
  });
});
