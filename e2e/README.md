# E2E Test Guide: Isolated Test Pattern

## Overview

Our E2E tests use an **isolated test pattern** where:

- ✅ Each test starts with a **clean database**
- ✅ Each test creates **only the data it needs**
- ✅ Tests are **fully independent** (no shared state)
- ✅ Tests run **serially** (one at a time) to avoid database conflicts

**Note:** Tests currently run with `workers: 1` to ensure database isolation. Parallel execution would require separate databases per worker.

## Why Isolation?

**Before (Global Seed):**

- ❌ All tests share the same seed data
- ❌ One test can affect another
- ❌ Hard to debug failures
- ❌ Tests depend on execution order

**After (Isolated):**

- ✅ Each test is independent
- ✅ Easy to understand test data
- ✅ Easy to debug failures
- ✅ Can run tests in parallel safely

## How It Works

### 1. Auto-cleanup Fixture

The `fixtures.ts` file provides automatic database cleanup before each test:

```typescript
import { test, expect, helpers } from './fixtures';

test('my test', async ({ page }) => {
  // Database is automatically cleaned before this test starts

  // Create test data
  const { user } = await helpers.createUser({
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User',
  });

  // Run test...
});
```

### 2. Helper Functions

Use the `helpers` object to create test data:

#### Create a User

```typescript
const { user, password } = await helpers.createUser({
  email: 'alice@example.com',
  username: 'alice',
  displayName: 'Alice Cooper',
  password: 'password123', // optional, defaults to 'password123'
});
```

#### Create a Post

```typescript
const post = await helpers.createPost({
  userId: user.id,
  content: 'My test post',
  mediaUrls: ['https://example.com/image.jpg'], // optional
});
```

#### Create a Like

```typescript
const like = await helpers.createLike({
  userId: user.id,
  postId: post.id,
});
```

#### Create a Comment

```typescript
const comment = await helpers.createComment({
  userId: user.id,
  postId: post.id,
  content: 'My comment',
});
```

#### Create a Follow Relationship

```typescript
const follow = await helpers.createFollow({
  followerId: user1.id,
  followingId: user2.id,
});
```

## Example Test

```typescript
import { test, expect, helpers } from './fixtures';

test.describe('User Feed', () => {
  test('should display posts from followed users', async ({ page }) => {
    // Create test users (database is clean at this point)
    const { user: alice, password: alicePassword } = await helpers.createUser({
      email: 'alice@example.com',
      username: 'alice',
      displayName: 'Alice',
    });

    const { user: bob } = await helpers.createUser({
      email: 'bob@example.com',
      username: 'bob',
      displayName: 'Bob',
    });

    // Alice follows Bob
    await helpers.createFollow({
      followerId: alice.id,
      followingId: bob.id,
    });

    // Bob creates a post
    await helpers.createPost({
      userId: bob.id,
      content: 'Hello from Bob!',
    });

    // Login as Alice
    await page.goto('/auth/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(alice.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(alicePassword);
    await page.getByRole('button', { name: 'Login' }).click();

    await page.waitForURL('/feed');

    // Verify Alice sees Bob's post
    await expect(page.locator('text=Hello from Bob!')).toBeVisible();
  });
});
```

## Best Practices

### 1. Create Only What You Need

Don't create extra data. Each test should create the minimal data it needs.

```typescript
// ✅ Good
test('should show empty feed', async ({ page }) => {
  const { user, password } = await helpers.createUser({
    email: 'alice@example.com',
    username: 'alice',
    displayName: 'Alice',
  });

  // Login and verify empty state
  // ...
});

// ❌ Bad - unnecessary users and posts
test('should show empty feed', async ({ page }) => {
  const alice = await helpers.createUser(/* ... */);
  const bob = await helpers.createUser(/* ... */);
  await helpers.createPost(/* ... */);

  // Why create bob and a post if testing empty state?
});
```

### 2. Use Descriptive Names

Make test data easy to identify in failures:

```typescript
// ✅ Good
const { user: adminUser } = await helpers.createUser({
  email: 'admin@example.com',
  username: 'admin',
  displayName: 'Admin User',
});

const { user: regularUser } = await helpers.createUser({
  email: 'user@example.com',
  username: 'user',
  displayName: 'Regular User',
});
```

### 3. Don't Rely on Test Order

Tests should work independently:

```typescript
// ✅ Good - each test creates its own data
test('test A', async () => {
  const user = await helpers.createUser({
    /* ... */
  });
  // Test A logic
});

test('test B', async () => {
  const user = await helpers.createUser({
    /* ... */
  });
  // Test B logic
});

// ❌ Bad - test B relies on test A
test('test A', async () => {
  const user = await helpers.createUser({
    /* ... */
  });
});

test('test B', async () => {
  // Expects user from test A to exist - WRONG!
});
```

### 4. Use Unique Identifiers for Dynamic Data

When creating multiple items in a test, use timestamps or counters:

```typescript
test('should create multiple posts', async ({ page }) => {
  const { user } = await helpers.createUser({
    /* ... */
  });

  const postContent = `Post at ${Date.now()}`;
  await helpers.createPost({
    userId: user.id,
    content: postContent,
  });

  // Later in test, search for unique content
  await expect(page.locator(`text=${postContent}`)).toBeVisible();
});
```

## Migration Guide

To migrate an existing test to the isolated pattern:

### Before (Global Seed)

```typescript
import { test, expect } from '@playwright/test';

test('my test', async ({ page }) => {
  // Relies on seeded alice user existing
  await page.goto('/auth/login');
  await page.fill('input[name="email"]', 'alice@example.com');
  // ...
});
```

### After (Isolated)

```typescript
import { test, expect, helpers } from './fixtures';

test('my test', async ({ page }) => {
  // Create user explicitly
  const { user, password } = await helpers.createUser({
    email: 'alice@example.com',
    username: 'alice',
    displayName: 'Alice',
  });

  await page.goto('/auth/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
  // ...
});
```

## Running Tests

```bash
# Run all tests
pnpm test:e2e

# Run specific test file
pnpm playwright test e2e/comments.spec.ts

# Run in debug mode
pnpm playwright test --debug

# Run with UI
pnpm playwright test --ui
```

## Troubleshooting

### Test fails with "user not found"

Make sure you're creating the user with `helpers.createUser()` before trying to log in.

### Tests interfere with each other locally

Make sure you're importing from `./fixtures` and not `@playwright/test`:

```typescript
// ✅ Correct
import { test, expect, helpers } from './fixtures';

// ❌ Wrong - won't have auto-cleanup
import { test, expect } from '@playwright/test';
```

### Database not clean between tests

Verify you're using the `test` from fixtures, not from Playwright directly.
