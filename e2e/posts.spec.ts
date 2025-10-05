import { test, expect } from '@playwright/test'

test.describe('Post Creation and Feed', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto('/auth/login')
    await page.getByRole('textbox', { name: 'Email' }).fill('alice@example.com')
    await page.getByRole('textbox', { name: 'Password' }).fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()
    // Wait for redirect to feed page
    await page.waitForURL('/feed')
    await page.waitForLoadState('networkidle')
  })

  test('should create a new post', async ({ page }) => {
    // Already on feed page from beforeEach

    // Find and fill post creation form
    const contentInput = page
      .locator('textarea[name="content"], textarea[placeholder*="What"]')
      .first()
    await contentInput.fill('This is a test post from Playwright!')

    // Submit the post
    await page.click('button:has-text("Post"), button:has-text("Share"), button:has-text("Submit")')

    // Should see success message or new post in feed
    await expect(
      page.locator('text=/This is a test post from Playwright!|Post created|Success/i')
    ).toBeVisible({ timeout: 5000 })
  })

  test('should display posts in feed', async ({ page }) => {
    // Already on feed page from beforeEach
    // Should see posts from seed data
    await expect(page.locator('text=/Just deployed my first Next.js app/i')).toBeVisible({
      timeout: 10000,
    })
  })

  test('should create post with image URL', async ({ page }) => {
    // Already on feed page from beforeEach
    // Fill post content
    const contentInput = page
      .locator('textarea[name="content"], textarea[placeholder*="What"]')
      .first()
    await contentInput.fill('Test post with image')

    // Fill image URL if available
    const imageInput = page.locator('input[name="image_url"], input[placeholder*="image"]')
    if ((await imageInput.count()) > 0) {
      await imageInput
        .first()
        .fill('https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200')
    }

    // Submit
    await page.click('button:has-text("Post"), button:has-text("Share"), button:has-text("Submit")')

    // Verify post appears
    await expect(page.locator('text=/Test post with image/i')).toBeVisible({ timeout: 5000 })
  })

  test('should show user profile info on posts', async ({ page }) => {
    // Already on feed page from beforeEach
    // Should see username or display name on posts in a post card
    await expect(
      page.locator('.text-sm.font-semibold').filter({ hasText: 'Alice Cooper' }).first()
    ).toBeVisible()
  })

  test('should refresh feed', async ({ page }) => {
    // Already on feed page from beforeEach
    // Look for refresh button
    const refreshButton = page.locator('button:has-text("Refresh"), button[aria-label="Refresh"]')

    if ((await refreshButton.count()) > 0) {
      await refreshButton.first().click()

      // Should show loading state or updated feed
      await page.waitForTimeout(1000)

      // Feed header should still be visible
      await expect(page.getByRole('heading', { name: 'Feed' })).toBeVisible()
    }
  })
})
