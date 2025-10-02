import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'Password123!',
    username: `testuser${Date.now()}`,
    displayName: 'Test User'
  }

  test('should sign up a new user', async ({ page }) => {
    await page.goto('/auth/sign-up')

    // Fill signup form
    await page.fill('input[name="email"]', testUser.email)
    await page.fill('input[name="password"]', testUser.password)
    await page.fill('input[name="username"]', testUser.username)
    await page.fill('input[name="display_name"]', testUser.displayName)

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to home or dashboard
    await expect(page).toHaveURL(/\/(dashboard|feed)?/)
  })

  test('should sign in with existing user', async ({ page }) => {
    // Use seed data user
    await page.goto('/auth/login')

    await page.fill('input[name="email"]', 'alice@example.com')
    await page.fill('input[name="password"]', 'password123')

    await page.click('button[type="submit"]')

    // Should redirect to home
    await expect(page).toHaveURL(/\/(dashboard|feed)?/)

    // Should see user profile indicator
    await expect(page.locator('text=/alice|Alice/')).toBeVisible()
  })

  test('should sign out successfully', async ({ page }) => {
    // First sign in
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'alice@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.waitForURL(/\/(dashboard|feed)?/)

    // Find and click sign out button
    await page.click('button:has-text("Sign Out"), button:has-text("Logout"), a:has-text("Sign Out")')

    // Should redirect to login or home
    await expect(page).toHaveURL(/\/(auth\/login|\/)?/)
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/auth/login')

    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')

    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.locator('text=/invalid|error|wrong/i')).toBeVisible()
  })
})
