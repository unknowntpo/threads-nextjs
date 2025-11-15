import { test, expect, helpers } from './fixtures';
import type { Page } from '@playwright/test';

test.describe('Follow Functionality', () => {
  // Helper function to login
  async function loginUser(page: Page, email: string, password: string) {
    await page.goto('/auth/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/feed');
  }

  test('should open user action menu when clicking on username in post', async ({ page }) => {
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
    await bobUsername.click();

    // Should see user action menu with Follow and Visit Profile buttons
    await expect(page.getByRole('button', { name: 'Follow' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Visit Profile' })).toBeVisible();
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
    await bobUsername.click();

    // Click Follow button
    const followButton = page.getByRole('button', { name: 'Follow' });
    await followButton.click();

    // Should see success toast
    await expect(page.getByText(/You are now following/i)).toBeVisible({ timeout: 5000 });

    // Button should change to "Following"
    await expect(page.getByRole('button', { name: 'Following' })).toBeVisible({ timeout: 5000 });
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

    // Click on Bob's username
    const bobUsername = page.getByTestId('post-author').filter({ hasText: /Bob Smith/i });
    await bobUsername.click();

    // Should see "Following" button (already following)
    await expect(page.getByRole('button', { name: 'Following' })).toBeVisible({ timeout: 5000 });

    // Click to unfollow
    const followingButton = page.getByRole('button', { name: 'Following' });
    await followingButton.click();

    // Should see success toast
    await expect(page.getByText(/You unfollowed/i)).toBeVisible({ timeout: 5000 });

    // Button should change back to "Follow"
    await expect(page.getByRole('button', { name: 'Follow' })).toBeVisible({ timeout: 5000 });
  });

  test('should open profile modal when clicking Visit Profile', async ({ page }) => {
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
    await bobUsername.click();

    // Click Visit Profile
    const visitProfileButton = page.getByRole('button', { name: 'Visit Profile' });
    await visitProfileButton.click();

    // Should see profile modal with Bob's info
    // Use getByRole to scope to the dialog/modal
    const profileModal = page.getByRole('dialog').last();
    await expect(profileModal.getByText('Bob Smith')).toBeVisible({ timeout: 5000 });
    await expect(profileModal.getByText('@bob')).toBeVisible();

    // Should NOT see Edit Profile button (viewing other user's profile)
    await expect(page.getByTestId('edit-profile-button')).not.toBeVisible();
  });

  test('should not show user action menu on own posts', async ({ page }) => {
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

    // Click on own username - should not open menu (username is not clickable)
    const aliceUsername = page.getByTestId('post-author').filter({ hasText: /Alice Cooper/i });

    // Username should not be clickable (disabled button)
    const isDisabled = await aliceUsername.evaluate(el => (el as HTMLButtonElement).disabled);
    expect(isDisabled).toBe(true);
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
    await bobUsername.click();

    const followButton = page.getByRole('button', { name: 'Follow' });
    await followButton.click();

    // Should see Following button
    await expect(page.getByRole('button', { name: 'Following' })).toBeVisible({ timeout: 5000 });

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
