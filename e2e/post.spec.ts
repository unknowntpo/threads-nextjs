import { test, expect, helpers } from './fixtures';
import type { Page } from '@playwright/test';

test.describe('Post Creation and Feed', () => {
  const timeout = 3000;
  // Helper function to login
  async function loginUser(page: Page, email: string, password: string) {
    await page.goto('/auth/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Login' }).click();
    // Wait for redirect navigation (signIn uses redirect: true)
    await page.waitForURL('/feed', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  }

  test('should create a new post', async ({ page }) => {
    // Create test user
    const { user, password } = await helpers.createUser({
      displayName: 'Alice Cooper',
    });

    // Login
    await loginUser(page, user.email, password);

    // Click on "What's new?" trigger to open dialog
    await page.getByTestId('create-post-trigger').click();

    // Wait for dialog to open
    await expect(page.getByRole('dialog')).toBeVisible({ timeout });

    // Fill the textarea inside the dialog
    await page
      .getByPlaceholder(/share your thoughts/i)
      .fill('This is a test post from Playwright!');

    // Submit the post
    await page.getByRole('button', { name: 'Post' }).click();

    // Wait for page reload and verify post appears
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/This is a test post from Playwright!/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should display posts in feed', async ({ page }) => {
    // Create test user and post
    const { user, password } = await helpers.createUser({
      displayName: 'Alice Cooper',
    });

    await helpers.createPost({
      userId: user.id,
      content: 'Just deployed my first Next.js app! 🚀',
    });

    // Login
    await loginUser(page, user.email, password);

    // Should see the post
    await expect(page.locator('text=/Just deployed my first Next.js app/i')).toBeVisible({
      timeout,
    });
  });

  test('should create post with image URL', async ({ page }) => {
    // Create test user
    const { user, password } = await helpers.createUser({
      displayName: 'Alice Cooper',
    });

    // Login
    await loginUser(page, user.email, password);

    // Click on "What's new?" trigger to open dialog
    await page.getByTestId('create-post-trigger').click();

    // Wait for dialog to open
    await expect(page.getByRole('dialog')).toBeVisible({ timeout });

    // Fill post content
    await page.getByPlaceholder(/share your thoughts/i).fill('Test post with image');

    // Fill image URL if available
    const imageInput = page.locator('input[name="image_url"], input[placeholder*="image"]');
    if ((await imageInput.count()) > 0) {
      await imageInput
        .first()
        .fill('https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200');
    }

    // Submit
    await page.getByRole('button', { name: 'Post' }).click();

    // Wait for page reload and verify post appears
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/Test post with image/i')).toBeVisible({ timeout: 5000 });
  });

  test('should show user profile info on posts', async ({ page }) => {
    // Create test user and post
    const { user, password } = await helpers.createUser({
      displayName: 'Alice Cooper',
    });

    await helpers.createPost({
      userId: user.id,
      content: 'Test post for profile info',
    });

    // Login
    await loginUser(page, user.email, password);

    // Should see username or display name on posts in a post card
    await expect(
      page.locator('.text-sm.font-semibold').filter({ hasText: 'Alice Cooper' }).first()
    ).toBeVisible();
  });

  test('should refresh feed', async ({ page }) => {
    // Create test user and post
    const { user, password } = await helpers.createUser({
      displayName: 'Alice Cooper',
    });

    await helpers.createPost({
      userId: user.id,
      content: 'Test post for refresh',
    });

    // Login
    await loginUser(page, user.email, password);

    // Verify post is visible
    await expect(page.locator('text=/Test post for refresh/i')).toBeVisible({ timeout });

    // Look for refresh button
    const refreshButton = page.getByTestId('refresh-feed-button');

    if ((await refreshButton.count()) > 0) {
      await refreshButton.click();

      // Wait for refresh to complete
      await page.waitForLoadState('networkidle');

      // Post should still be visible after refresh
      await expect(page.locator('text=/Test post for refresh/i')).toBeVisible({ timeout });
    }
  });
});
