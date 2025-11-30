import { test, expect, helpers } from './fixtures';

test.describe('Search Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console logs
    page.on('console', msg => console.log(`[Browser ${msg.type()}]`, msg.text()));

    // Capture network requests and responses
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log(`[Network Request] ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`[Network Response] ${response.status()} ${response.url()}`);
      }
    });

    page.on('requestfailed', request => {
      if (request.url().includes('/api/')) {
        console.log(
          `[Network FAILED] ${request.method()} ${request.url()} - ${request.failure()?.errorText}`
        );
      }
    });
  });

  test('should display search page after login', async ({ page }) => {
    // Create test user
    const { user, password } = await helpers.createUser({
      displayName: 'Alice Cooper',
    });

    // Login
    await page.goto('/auth/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Login' }).click();

    await page.waitForURL('/feed', { timeout: 10000 });

    // Navigate to search page
    await page.goto('/search');

    // Should see search input
    await expect(page.getByTestId('search-input')).toBeVisible();
    await expect(page.getByText('Search for posts')).toBeVisible();
  });

  test('should search posts with exact match', async ({ page }) => {
    // Create test user
    const { user, password } = await helpers.createUser({
      displayName: 'Alice Cooper',
    });

    // Create posts
    await helpers.createPost({
      userId: user.id,
      content: 'Just deployed my first Next.js app! 🚀',
    });

    await helpers.createPost({
      userId: user.id,
      content: 'Learning React is awesome!',
    });

    // Login
    await page.goto('/auth/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Login' }).click();

    await page.waitForURL('/feed', { timeout: 10000 });

    // Navigate to search
    await page.goto('/search');

    // Search for "Next.js"
    await page.getByTestId('search-input').fill('Next.js');
    await page.getByTestId('search-submit-button').click();

    // Wait for results
    await page.waitForLoadState('networkidle');

    // Should see the matching post
    await expect(page.getByText(/Just deployed my first Next.js app/)).toBeVisible();

    // Should not see the non-matching post
    await expect(page.getByText(/Learning React is awesome/)).not.toBeVisible();
  });

  test('should search posts with fuzzy match', async ({ page }) => {
    // Create test user
    const { user, password } = await helpers.createUser({
      displayName: 'Alice Cooper',
    });

    // Create post
    await helpers.createPost({
      userId: user.id,
      content: 'Just deployed my first Next.js app! 🚀',
    });

    // Login
    await page.goto('/auth/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Login' }).click();

    await page.waitForURL('/feed', { timeout: 10000 });

    // Navigate to search
    await page.goto('/search');

    // Search with typo "Nxt" should still find "Next.js"
    await page.getByTestId('search-input').fill('Nxt');
    await page.getByTestId('search-submit-button').click();

    // Wait for results
    await page.waitForLoadState('networkidle');

    // Should see the matching post (fuzzy match)
    await expect(page.getByText(/Just deployed my first Next.js app/)).toBeVisible();
  });

  test('should show empty state when no results', async ({ page }) => {
    // Create test user
    const { user, password } = await helpers.createUser({
      displayName: 'Alice Cooper',
    });

    // Create post
    await helpers.createPost({
      userId: user.id,
      content: 'Just deployed my first Next.js app! 🚀',
    });

    // Login
    await page.goto('/auth/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Login' }).click();

    await page.waitForURL('/feed', { timeout: 10000 });

    // Navigate to search
    await page.goto('/search');

    // Search for non-existent term
    await page.getByTestId('search-input').fill('Python');
    await page.getByTestId('search-submit-button').click();

    // Wait for results
    await page.waitForLoadState('networkidle');

    // Should see empty state
    await expect(page.getByText('No results found')).toBeVisible();
    await expect(page.getByText(/No posts match "Python"/)).toBeVisible();
  });

  test('should switch between Top and Recent tabs', async ({ page }) => {
    // Create test user
    const { user, password } = await helpers.createUser({
      displayName: 'Alice Cooper',
    });

    // Create posts
    await helpers.createPost({
      userId: user.id,
      content: 'React',
    });

    await helpers.createPost({
      userId: user.id,
      content: 'React development is awesome!',
    });

    // Login
    await page.goto('/auth/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Login' }).click();

    await page.waitForURL('/feed', { timeout: 10000 });

    // Navigate to search
    await page.goto('/search');

    // Search for "React"
    await page.getByTestId('search-input').fill('React');
    await page.getByTestId('search-submit-button').click();

    // Wait for results
    await page.waitForLoadState('networkidle');

    // Should see tabs
    await expect(page.getByTestId('search-tab-top')).toBeVisible();
    await expect(page.getByTestId('search-tab-recent')).toBeVisible();

    // Click Recent tab
    await page.getByTestId('search-tab-recent').click();

    // Wait for new results
    await page.waitForLoadState('networkidle');

    // Should still see results
    await expect(page.getByText(/React/)).toBeVisible();
  });

  test('should clear search input', async ({ page }) => {
    // Create test user
    const { user, password } = await helpers.createUser({
      displayName: 'Alice Cooper',
    });

    // Login
    await page.goto('/auth/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Login' }).click();

    await page.waitForURL('/feed', { timeout: 10000 });

    // Navigate to search
    await page.goto('/search');

    // Type in search input
    await page.getByTestId('search-input').fill('React');

    // Clear button should be visible
    await expect(page.getByTestId('search-clear-button')).toBeVisible();

    // Click clear button
    await page.getByTestId('search-clear-button').click();

    // Input should be empty
    await expect(page.getByTestId('search-input')).toHaveValue('');

    // Clear button should not be visible
    await expect(page.getByTestId('search-clear-button')).not.toBeVisible();
  });

  test('should search on pressing Enter key', async ({ page }) => {
    // Create test user
    const { user, password } = await helpers.createUser({
      displayName: 'Alice Cooper',
    });

    // Create post
    await helpers.createPost({
      userId: user.id,
      content: 'Just deployed my first Next.js app! 🚀',
    });

    // Login
    await page.goto('/auth/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Login' }).click();

    await page.waitForURL('/feed', { timeout: 10000 });

    // Navigate to search
    await page.goto('/search');

    // Type in search input and press Enter
    await page.getByTestId('search-input').fill('Next.js');
    await page.getByTestId('search-input').press('Enter');

    // Wait for results
    await page.waitForLoadState('networkidle');

    // Should see the matching post
    await expect(page.getByText(/Just deployed my first Next.js app/)).toBeVisible();
  });
});
