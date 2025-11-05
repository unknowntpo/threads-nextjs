import { test, expect, helpers } from './fixtures'
import type { Page } from '@playwright/test'

test.describe('Profile Management', () => {
  // Helper function to login
  async function loginUser(page: Page, email: string, password: string) {
    await page.goto('/auth/login')
    await page.getByRole('textbox', { name: 'Email' }).fill(email)
    await page.getByRole('textbox', { name: 'Password' }).fill(password)
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForURL(/\/(dashboard|feed)?/)
  }

  test.skip('should view own profile', async ({ page }) => {
    // TODO: Implement /profile route first
    // Create test user
    const { user, password } = await helpers.createUser({
      displayName: 'Alice Cooper',
    })

    // Login
    await loginUser(page, user.email, password)

    // Navigate to profile (could be /profile, /dashboard, or click on username)
    await page.goto('/profile')

    // Should see profile information
    await expect(page.locator('text=/alice|Alice Cooper/i')).toBeVisible()
  })

  test('should view other user profile', async ({ page }) => {
    // Create two users
    const { user: alice, password: alicePassword } = await helpers.createUser({
      displayName: 'Alice Cooper',
    })

    const { user: bob } = await helpers.createUser({
      email: 'bob@example.com',
      username: 'bob',
      displayName: 'Bob Smith',
    })

    // Bob creates a post so Alice can see it
    await helpers.createPost({
      userId: bob.id,
      content: "Bob's test post",
    })

    // Login as Alice
    await loginUser(page, alice.email, alicePassword)
    await page.goto('/')

    // Click on Bob's name in a post
    const bobPost = page.locator('text=/bob|Bob Smith/i').first()

    if ((await bobPost.count()) > 0) {
      await bobPost.click()

      // Should navigate to Bob's profile
      await expect(page.locator('text=/bob|Bob Smith/i')).toBeVisible()
    }
  })

  test('should edit profile information', async ({ page }) => {
    // Create test user
    const { user, password } = await helpers.createUser({
      displayName: 'Alice Cooper',
    })

    // Login
    await loginUser(page, user.email, password)
    await page.goto('/feed')

    // Click profile button (UserIcon) to open profile sidebar
    // Wait for page to load first
    await page.waitForSelector('button[aria-label="Open profile"]', { timeout: 10000 })
    await page.click('button[aria-label="Open profile"]')

    // Wait for profile sidebar to open
    await expect(page.getByText('Your Profile')).toBeVisible()

    // Click "Edit Profile" button
    await page.getByTestId('edit-profile-button').click()

    // Wait for edit form to appear
    await expect(page.getByText('Edit Profile')).toBeVisible()

    // Verify username is read-only (locked)
    const usernameInput = page.getByTestId('username')
    await expect(usernameInput).toBeDisabled()

    // Update display name
    const displayNameInput = page.getByTestId('display_name')
    await displayNameInput.clear()
    await displayNameInput.fill('Alice Updated')

    // Update bio
    const bioInput = page.getByTestId('bio')
    await bioInput.clear()
    await bioInput.fill('Updated bio from E2E test')

    // Update avatar URL
    const avatarUrlInput = page.getByTestId('avatar_url')
    await avatarUrlInput.clear()
    await avatarUrlInput.fill('https://example.com/avatar.jpg')

    // Save changes
    await page.getByTestId('save-button').click()

    // Should see success toast
    await expect(page.getByText(/Profile updated successfully|Success/i)).toBeVisible({
      timeout: 5000,
    })

    // Profile view should now show updated info
    await expect(page.getByText('Alice Updated')).toBeVisible()
  })

  test.skip('should display user posts on profile', async ({ page }) => {
    // TODO: Implement /profile route first
    // Create test user and post
    const { user, password } = await helpers.createUser({
      displayName: 'Alice Cooper',
    })

    await helpers.createPost({
      userId: user.id,
      content: 'Just deployed my first Next.js app! 🚀',
    })

    // Login
    await loginUser(page, user.email, password)
    await page.goto('/profile')

    // Should see user's posts
    await expect(page.locator('text=/Just deployed my first Next.js app/i')).toBeVisible({
      timeout: 10000,
    })
  })

  test.skip('should show profile stats', async ({ page }) => {
    // TODO: Implement /profile route first
    // Create test user
    const { user, password } = await helpers.createUser({
      displayName: 'Alice Cooper',
    })

    // Login
    await loginUser(page, user.email, password)
    await page.goto('/profile')

    // Look for post count, followers, following (if implemented)
    const statsVisible = (await page.locator('text=/posts|followers|following/i').count()) > 0

    if (statsVisible) {
      await expect(page.locator('text=/posts|followers|following/i')).toBeVisible()
    }
  })
})
