import { test, expect } from '@playwright/test';

test.describe('Signup Flow', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    username: `testuser-${Date.now()}`,
    password: 'Password123!',
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('should display signup form', async ({ page }) => {
    await expect(page).toHaveTitle(/Threads/i);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.locator('button[type="submit"]').click();

    // Wait for validation messages
    await expect(page.locator('text=/email.*required/i')).toBeVisible();
    await expect(page.locator('text=/username.*required/i')).toBeVisible();
    await expect(page.locator('text=/password.*required/i')).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.locator('input[name="email"]').fill('invalid-email');
    await page.locator('input[name="username"]').fill(testUser.username);
    await page.locator('input[name="password"]').fill(testUser.password);
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('text=/valid email/i')).toBeVisible();
  });

  test('should successfully register a new user', async ({ page }) => {
    await page.locator('input[name="email"]').fill(testUser.email);
    await page.locator('input[name="username"]').fill(testUser.username);
    await page.locator('input[name="password"]').fill(testUser.password);

    await page.locator('button[type="submit"]').click();

    // Should redirect to home page or show success message
    await expect(page).toHaveURL(/\/(home|feed|dashboard)/i, { timeout: 10000 });

    // Or check for success message
    // await expect(page.locator('text=/success/i')).toBeVisible();
  });

  test('should show error when email already exists', async ({ page }) => {
    const existingUser = {
      email: 'existing@example.com',
      username: `newuser-${Date.now()}`,
      password: 'Password123!',
    };

    // First registration
    await page.locator('input[name="email"]').fill(existingUser.email);
    await page.locator('input[name="username"]').fill(existingUser.username);
    await page.locator('input[name="password"]').fill(existingUser.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);

    // Navigate back to signup
    await page.goto('/signup');

    // Try to register with same email
    await page.locator('input[name="email"]').fill(existingUser.email);
    await page.locator('input[name="username"]').fill(`another-${Date.now()}`);
    await page.locator('input[name="password"]').fill(existingUser.password);
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('text=/email.*already.*exists/i')).toBeVisible();
  });

  test('should show error when username already exists', async ({ page }) => {
    const existingUser = {
      email: `unique-${Date.now()}@example.com`,
      username: 'existingusername',
      password: 'Password123!',
    };

    // First registration
    await page.locator('input[name="email"]').fill(existingUser.email);
    await page.locator('input[name="username"]').fill(existingUser.username);
    await page.locator('input[name="password"]').fill(existingUser.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);

    // Navigate back to signup
    await page.goto('/signup');

    // Try to register with same username
    await page.locator('input[name="email"]').fill(`another-${Date.now()}@example.com`);
    await page.locator('input[name="username"]').fill(existingUser.username);
    await page.locator('input[name="password"]').fill(existingUser.password);
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('text=/username.*already.*exists/i')).toBeVisible();
  });

  test('should have a link to login page', async ({ page }) => {
    const loginLink = page.locator('a[href*="login"]');
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/i);
  });
});
