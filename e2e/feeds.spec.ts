import { test, expect, helpers } from './fixtures'

test.describe('Personalized Feed', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console logs
    page.on('console', msg => console.log(`[Browser ${msg.type()}]`, msg.text()))

    // Capture network requests and responses
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log(`[Network Request] ${request.method()} ${request.url()}`)
      }
    })

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`[Network Response] ${response.status()} ${response.url()}`)
      }
    })

    page.on('requestfailed', request => {
      if (request.url().includes('/api/')) {
        console.log(
          `[Network FAILED] ${request.method()} ${request.url()} - ${request.failure()?.errorText}`
        )
      }
    })
  })

  test('should display feed page after login', async ({ page }) => {
    // Create test user
    const { user, password } = await helpers.createUser({
      displayName: 'Alice Cooper',
    })

    await page.goto('/auth/login')

    await page.getByRole('textbox', { name: 'Email' }).fill(user.email)
    await page.getByRole('textbox', { name: 'Password' }).fill(password)
    await page.getByRole('button', { name: 'Login' }).click()

    // Should redirect to feed
    await expect(page).toHaveURL('/feed')

    // Should see feed heading
    await expect(page.getByRole('heading', { name: 'Feed' })).toBeVisible()

    // Should see refresh button
    await expect(page.getByRole('button', { name: /Refresh/i })).toBeVisible()
  })

  test('should display posts in feed', async ({ page }) => {
    // Create test user
    const { user, password } = await helpers.createUser({
      displayName: 'Alice Cooper',
    })

    // Create some posts for the feed
    await helpers.createPost({
      userId: user.id,
      content: 'Post 1: Just deployed my first Next.js app! 🚀',
    })

    await helpers.createPost({
      userId: user.id,
      content: 'Post 2: Learning Prisma is awesome!',
    })

    // Login
    await page.goto('/auth/login')
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email)
    await page.getByRole('textbox', { name: 'Password' }).fill(password)
    await page.getByRole('button', { name: 'Login' }).click()

    await page.waitForURL('/feed')
    await page.waitForLoadState('networkidle')

    // Wait for posts to load
    await page.waitForSelector('[data-testid="post-card"]', {
      state: 'visible',
      timeout: 15000,
    })

    // Should see posts
    const posts = page.locator('[data-testid="post-card"]')
    const postCount = await posts.count()

    expect(postCount).toBeGreaterThan(0)
  })

  test('should show user own posts in feed', async ({ page }) => {
    // Create test user
    const { user, password } = await helpers.createUser({
      displayName: 'Alice Cooper',
    })

    // Login as Alice
    await page.goto('/auth/login')
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email)
    await page.getByRole('textbox', { name: 'Password' }).fill(password)
    await page.getByRole('button', { name: 'Login' }).click()

    await page.waitForURL('/feed')

    // Create a post
    const newPostContent = `My own post ${Date.now()}`
    await page.getByPlaceholder(/Share your thoughts/i).fill(newPostContent)
    await page.getByRole('button', { name: 'Post' }).click()

    // Wait for post to be created
    await page.waitForTimeout(1000)

    // Refresh feed
    await page.getByRole('button', { name: /Refresh/i }).click()

    // Wait for refresh to complete
    await page.waitForTimeout(1000)

    // Should see own post in feed (it's included now)
    const postTexts = await page.locator('[data-testid="post-content"]').allTextContents()
    expect(postTexts).toContain(newPostContent)
  })

  test('should refresh feed on refresh button click', async ({ page }) => {
    // Create test user and posts
    const { user, password } = await helpers.createUser({
      displayName: 'Alice Cooper',
    })

    await helpers.createPost({
      userId: user.id,
      content: 'Test post for refresh',
    })

    // Login
    await page.goto('/auth/login')
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email)
    await page.getByRole('textbox', { name: 'Password' }).fill(password)
    await page.getByRole('button', { name: 'Login' }).click()

    await page.waitForURL('/feed')
    await page.waitForLoadState('networkidle')

    // Wait for posts to load
    await page.waitForSelector('[data-testid="post-card"]', {
      state: 'visible',
      timeout: 15000,
    })

    // Click refresh
    const refreshButton = page.getByRole('button', { name: /Refresh/i })
    await refreshButton.click()

    // Wait for refresh animation to complete
    await page.waitForTimeout(500)

    // Should still have posts (might be different order due to randomization)
    const refreshedPosts = await page.locator('[data-testid="post-card"]').count()
    expect(refreshedPosts).toBeGreaterThan(0)
  })

  test('should show empty state when no posts available', async ({ page }) => {
    // Create a new user with no posts
    const { user, password } = await helpers.createUser({
      displayName: 'Alice Cooper',
    })

    // Login (no posts created)
    await page.goto('/auth/login')
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email)
    await page.getByRole('textbox', { name: 'Password' }).fill(password)
    await page.getByRole('button', { name: 'Login' }).click()

    await page.waitForURL('/feed')

    // Should see empty state message
    await expect(page.getByText(/No posts yet|No posts available|Start following/i)).toBeVisible()
  })

  test('should handle feed API errors gracefully', async ({ page }) => {
    // Create test user
    const { user, password } = await helpers.createUser({
      displayName: 'Alice Cooper',
    })

    // Login
    await page.goto('/auth/login')
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email)
    await page.getByRole('textbox', { name: 'Password' }).fill(password)
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
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Failed to load posts/i).first()).toBeVisible()
  })

  test('should display posts with user information', async ({ page }) => {
    // Create test user and post
    const { user, password } = await helpers.createUser({
      displayName: 'Alice Cooper',
    })

    await helpers.createPost({
      userId: user.id,
      content: 'Test post with user info',
    })

    // Login
    await page.goto('/auth/login')
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email)
    await page.getByRole('textbox', { name: 'Password' }).fill(password)
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
