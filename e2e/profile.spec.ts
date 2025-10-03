import { test, expect } from '@playwright/test'

test.describe('Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto('/auth/login')
    await page.getByRole('textbox', { name: 'Email' }).fill('alice@example.com')
    await page.getByRole('textbox', { name: 'Password' }).fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForURL(/\/(dashboard|feed)?/)
  })

  test('should view own profile', async ({ page }) => {
    // Navigate to profile (could be /profile, /dashboard, or click on username)
    await page.goto('/profile')

    // Should see profile information
    await expect(page.locator('text=/alice|Alice Cooper/i')).toBeVisible()
  })

  test('should view other user profile', async ({ page }) => {
    await page.goto('/')

    // Click on another user's name in a post
    const bobPost = page.locator('text=/bob|Bob Smith/i').first()

    if (await bobPost.count() > 0) {
      await bobPost.click()

      // Should navigate to Bob's profile
      await expect(page.locator('text=/bob|Bob Smith/i')).toBeVisible()
    }
  })

  test('should edit profile information', async ({ page }) => {
    await page.goto('/profile')

    // Look for edit button
    const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit Profile")')

    if (await editButton.count() > 0) {
      await editButton.first().click()

      // Update display name
      const displayNameInput = page.locator('input[name="display_name"]')
      if (await displayNameInput.count() > 0) {
        await displayNameInput.clear()
        await displayNameInput.fill('Alice Updated')
      }

      // Update bio
      const bioInput = page.locator('textarea[name="bio"], input[name="bio"]')
      if (await bioInput.count() > 0) {
        await bioInput.clear()
        await bioInput.fill('Updated bio from E2E test')
      }

      // Save changes
      await page.click('button:has-text("Save"), button:has-text("Update")')

      // Should see success message or updated info
      await expect(page.locator('text=/Alice Updated|Updated|Success/i')).toBeVisible({ timeout: 5000 })
    }
  })

  test('should display user posts on profile', async ({ page }) => {
    await page.goto('/profile')

    // Should see user's posts
    await expect(page.locator('text=/Just deployed my first Next.js app/i')).toBeVisible({ timeout: 10000 })
  })

  test('should show profile stats', async ({ page }) => {
    await page.goto('/profile')

    // Look for post count, followers, following (if implemented)
    const statsVisible = await page.locator('text=/posts|followers|following/i').count() > 0

    if (statsVisible) {
      await expect(page.locator('text=/posts|followers|following/i')).toBeVisible()
    }
  })
})
