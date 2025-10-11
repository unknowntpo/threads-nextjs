import { expect, test } from '@playwright/test'

test.describe('Comments', () => {
  test('should allow a user to add a comment to a post', async ({ page }) => {
    // Navigate to the login page and sign in
    await page.goto('/auth/login')
    await page.getByRole('textbox', { name: 'Email' }).fill('alice@example.com')
    await page.getByRole('textbox', { name: 'Password' }).fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForURL('/feed')

    // Create a new post
    const postContent = `My new post content ${new Date().getTime()}`
    await page.getByTestId('create-post-textarea').fill(postContent)
    await page.getByTestId('create-post-submit-button').click()

    // Wait for the post to appear in the feed
    await expect(page.locator(`text=${postContent}`)).toBeVisible()

    // Find the post card
    const postCard = page.locator("[data-testid='post-card']", { hasText: postContent })

    // Click the comment button to open the comment form
    await postCard.getByTestId('comment-button').click()

    // Fill in the comment form and submit
    const commentContent = `My new comment ${new Date().getTime()}`
    await postCard.getByTestId('comment-textarea').fill(commentContent)
    await postCard.getByTestId('comment-submit-button').click()

    // Expect the comment to be visible
    await expect(postCard.locator(`text=${commentContent}`)).toBeVisible()
  })
})
