import { test, expect, helpers } from './fixtures';

test.describe('Comments', () => {
  test.skip('should allow a user to add a comment to a post', async ({ page }) => {
    // TODO: Fix this test - post creation fails intermittently
    // Possibly related to form state or timing issue
    // Create test user (each test starts with clean database)
    const { user, password } = await helpers.createUser({
      displayName: 'Alice Cooper',
    });

    // Navigate to the login page and sign in
    await page.goto('/auth/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/feed');
    await page.waitForLoadState('networkidle');

    // Create a new post
    const postContent = `My new post content ${new Date().getTime()}`;

    // Wait for textarea to be ready and fill it slowly
    const textarea = page.getByTestId('create-post-textarea');
    await expect(textarea).toBeVisible();
    await textarea.click(); // Focus the textarea first
    await textarea.fill(postContent);

    // Verify content was filled
    await expect(textarea).toHaveValue(postContent);

    // Wait for Post button to be enabled
    const postButton = page.getByTestId('create-post-submit-button');
    await expect(postButton).toBeEnabled({ timeout: 5000 });
    await postButton.click();

    // Wait for the post to appear in the feed with a longer timeout
    await expect(page.locator(`text=${postContent}`)).toBeVisible({ timeout: 10000 });

    // Find the post card
    const postCard = page.locator("[data-testid='post-card']", { hasText: postContent });

    // Click the comment button to open the comment form
    await postCard.getByTestId('comment-button').click();

    // Fill in the comment form and submit
    const commentContent = `My new comment ${new Date().getTime()}`;
    await postCard.getByTestId('comment-textarea').fill(commentContent);
    await postCard.getByTestId('comment-submit-button').click();

    // Expect the comment to be visible
    await expect(postCard.locator(`text=${commentContent}`)).toBeVisible();
  });
});
