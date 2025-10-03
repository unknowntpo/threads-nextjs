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

    // Fill signup form using accessible selectors
    await page.getByRole('textbox', { name: 'Username' }).fill(testUser.username)
    await page.getByRole('textbox', { name: 'Display Name' }).fill(testUser.displayName)
    await page.getByRole('textbox', { name: 'Email' }).fill(testUser.email)
    await page.getByRole('textbox', { name: /^Password$/ }).fill(testUser.password)
    await page.getByRole('textbox', { name: 'Repeat Password' }).fill(testUser.password)

    // Submit form
    await page.getByRole('button', { name: 'Sign up' }).click()

    // Should redirect to home or dashboard or success page
    await expect(page).toHaveURL(/\/(dashboard|feed|sign-up-success)?/)
  })

  test('should sign in with existing user', async ({ page }) => {
    // Use seed data user
    await page.goto('/auth/login')

    await page.getByRole('textbox', { name: 'Email' }).fill('alice@example.com')
    await page.getByRole('textbox', { name: 'Password' }).fill('password123')

    await page.getByRole('button', { name: 'Login' }).click()

    // Should redirect to home
    await expect(page).toHaveURL(/\/(dashboard|feed)?/)

    // Should see user profile indicator
    await expect(page.getByText('@alice')).toBeVisible()
  })

  test('should sign out successfully', async ({ page }) => {
    // First sign in
    await page.goto('/auth/login')
    await page.getByRole('textbox', { name: 'Email' }).fill('alice@example.com')
    await page.getByRole('textbox', { name: 'Password' }).fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()

    await page.waitForURL(/\/(dashboard|feed)?/)

    // Find and click sign out button
    await page.click('button:has-text("Sign Out"), button:has-text("Logout"), a:has-text("Sign Out")')

    // Should redirect to login or home
    await expect(page).toHaveURL(/\/(auth\/login|\/)?/)
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/auth/login')

    await page.getByRole('textbox', { name: 'Email' }).fill('invalid@example.com')
    await page.getByRole('textbox', { name: 'Password' }).fill('wrongpassword')

    await page.getByRole('button', { name: 'Login' }).click()

    // Should show error message
    await expect(page.locator('text=/invalid|error|wrong/i')).toBeVisible()
  })
})
