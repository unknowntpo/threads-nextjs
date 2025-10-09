import { test, expect } from '@playwright/test'

test.describe('Personalized Feed', () => {
  test('should display feed page after login', async ({ page }) => {
    await page.goto('/auth/login')

    // Login with seed user
    await page.getByRole('textbox', { name: 'Email' }).fill('alice@example.com')
    await page.getByRole('textbox', { name: 'Password' }).fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()

    // Should redirect to feed
    await expect(page).toHaveURL('/feed')

    // Should see feed heading
    await expect(page.getByRole('heading', { name: 'Feed' })).toBeVisible()

    // Should see refresh button
    await expect(page.getByRole('button', { name: /Refresh/i })).toBeVisible()
  })

  test('should display posts in feed', async ({ page }) => {
    // Login
    await page.goto('/auth/login')
    await page.getByRole('textbox', { name: 'Email' }).fill('alice@example.com')
    await page.getByRole('textbox', { name: 'Password' }).fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()

    await page.waitForURL('/feed')

    // Wait for posts to load
    await page.waitForSelector('[data-testid="post-card"], .space-y-4', {
      state: 'visible',
      timeout: 10000,
    })

    // Should see posts (from seed data)
    const posts = page.locator('[data-testid="post-card"]')
    const postCount = await posts.count()

    expect(postCount).toBeGreaterThan(0)
  })

  test('should not show user own posts in feed', async ({ page }) => {
    // Login as Alice
    await page.goto('/auth/login')
    await page.getByRole('textbox', { name: 'Email' }).fill('alice@example.com')
    await page.getByRole('textbox', { name: 'Password' }).fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()

    await page.waitForURL('/feed')

    // Create a post
    const newPostContent = `My own post ${Date.now()}`
    await page.getByPlaceholder(/What's on your mind/i).fill(newPostContent)
    await page.getByRole('button', { name: 'Post' }).click()

    // Wait for post to be created
    await page.waitForTimeout(1000)

    // Refresh feed
    await page.getByRole('button', { name: /Refresh/i }).click()

    // Wait for refresh to complete
    await page.waitForTimeout(1000)

    // Should NOT see own post in feed (it should be excluded)
    const postTexts = await page.locator('[data-testid="post-content"]').allTextContents()
    expect(postTexts).not.toContain(newPostContent)
  })

  test('should refresh feed on refresh button click', async ({ page }) => {
    // Login
    await page.goto('/auth/login')
    await page.getByRole('textbox', { name: 'Email' }).fill('alice@example.com')
    await page.getByRole('textbox', { name: 'Password' }).fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()

    await page.waitForURL('/feed')

    // Get initial posts
    await page.waitForSelector('[data-testid="post-card"], .space-y-4')

    // Click refresh
    const refreshButton = page.getByRole('button', { name: /Refresh/i })
    await refreshButton.click()

    // Wait for refresh animation to complete
    await page.waitForTimeout(500)

    // Should still have posts (might be different order due to randomization)
    const refreshedPosts = await page.locator('[data-testid="post-card"]').count()
    expect(refreshedPosts).toBeGreaterThan(0)
  })

  test.skip('should show empty state when no posts available', async () => {
    // Create a new user with no posts in the system (hypothetical test)
    // Note: This test assumes a fresh database or specific test setup
    // For now, we'll skip this test as it requires special setup
  })

  test('should handle feed API errors gracefully', async ({ page }) => {
    // Login
    await page.goto('/auth/login')
    await page.getByRole('textbox', { name: 'Email' }).fill('alice@example.com')
    await page.getByRole('textbox', { name: 'Password' }).fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()

    await page.waitForURL('/feed')

    // Intercept API call and simulate error
    await page.route('**/api/feeds*', route =>
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      })
    )

    // Refresh feed to trigger error
    await page.getByRole('button', { name: /Refresh/i }).click()

    // Should show error toast (Sonner toast)
    await expect(page.locator('[data-sonner-toast]')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Failed to load posts/i)).toBeVisible()
  })

  test('should display posts with user information', async ({ page }) => {
    // Login
    await page.goto('/auth/login')
    await page.getByRole('textbox', { name: 'Email' }).fill('alice@example.com')
    await page.getByRole('textbox', { name: 'Password' }).fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()

    await page.waitForURL('/feed')

    // Wait for posts
    await page.waitForSelector('[data-testid="post-card"]')

    // First post should have user info
    const firstPost = page.locator('[data-testid="post-card"]').first()
    await expect(firstPost.locator('[data-testid="post-author"]')).toBeVisible()
    await expect(firstPost.locator('[data-testid="post-content"]')).toBeVisible()
  })
})
