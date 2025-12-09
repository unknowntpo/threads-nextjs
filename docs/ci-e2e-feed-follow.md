# CI Failure Notes: Feed/Follow/Post Specs

Reference run: GitHub Actions [`19429117537` job `55583540373`](https://github.com/unknowntpo/threads-nextjs/actions/runs/19429117537/job/55583540373)

`pnpm test:e2e` (Playwright) now boots locally, but 13 tests still fail. Every failure falls into one of four UX gaps documented below.

---

## 1. Feed smoke tests (4 failures)

Tests: `e2e/feeds.spec.ts` (`should display feed page after login`, `should show user own posts in feed`, `should refresh feed on refresh button click`, `should handle feed API errors gracefully`)

- **What the tests expect**
  - Visible heading `Feed` (`page.getByRole('heading', { name: 'Feed' })` at lines 42, 133, 179, 210).
  - A refresh button labeled “Refresh” (`page.getByRole('button', { name: /Refresh/i })`).
  - Inline create-post textarea (`textarea[name="content"]`) to submit posts without a modal.
  - Toast feedback when `/api/feeds` responds with an error (test clicks refresh to trigger the toast).
- **Reality**
  - `app/feed/page.tsx` renders `FeedTabs` + `CreatePostTrigger` inside `ViewTemplate`, but no `<h1>` anywhere in the tree, so accessibility queries for a “Feed” heading time out.
  - `components/feed.tsx` exposes `fetchPosts` and sets state, yet there is no button in the JSX to call `fetchPosts(true)`. The only way to refresh is a full page reload triggered deep inside `CreatePostTrigger` (`window.location.reload()`), so tests that look for a refresh button cannot find one.
  - `CreatePostTrigger` (components/create-post-trigger.tsx:12) only shows a CTA reading “What’s new?”; clicking it opens a dialog that contains `CreatePostForm`. Until the user opens the dialog there is no textarea in the DOM, so post-creation assertions never get past the “fill” step.
  - Because the refresh button is missing, the error-handling test never hits the mocked `/api/feeds` failure, so no Sonner toast renders.
- **Fix**
  1. Update `ViewTemplate`/`FeedTabs` (or wrap them) with an `<h1 id="feed-heading">Feed</h1>` so the role query passes everywhere that reuses the template.
  2. Add an explicit refresh button (e.g., in `FeedTabs` or alongside the “What’s new?” row) that calls `fetchPosts(true)` and shows a spinner state. Make sure the button has accessible text “Refresh”.
  3. Expose the `CreatePostForm` inline (always visible for desktop) or adjust the tests to click the CTA before interacting with the textarea. Inline rendering is preferable because it matches the spec the tests were written against and avoids modal timing issues.
  4. Once the refresh button exists, the error toast will appear automatically because `feed.tsx` already calls `toast({ title: 'Error', description: 'Failed to load posts', ... })`.

---

## 2. Follow feature tests (6 failures)

Directories: `test-results/follow-Follow-Functionalit-*` → `e2e/follow.spec.ts`

- **What the tests expect**
  - Clicking a username opens an action menu with `Follow` / `Visit Profile` buttons.
  - The action menu should also allow unfollowing, and it should be hidden/disabled on the user’s own posts.
  - Mutual follows should be persisted immediately (the test inspects Prisma after clicking the button).
- **Reality**
  - In `components/post-card.tsx:285` we wrap the username with `<Link href="/profile/[username]">`. That link is also used as the `trigger` prop for `UserActionMenu`, but the Radix HoverCard only opens on hover/focus. Clicking actually navigates to `/profile/:username`, so the action menu never appears and the tests can’t find `Follow`/`Visit Profile`.
  - Because the trigger is a simple link, even own posts keep the hover card enabled—there is no disabled state, so `expect(...).not.toBeVisible()` fails for the “own posts” test.
  - `UserActionMenu` controls its follow button entirely inside the hover card. Without the menu on click, there is no way to exercise follow/unfollow/mutual follow flows in CI.
- **Fix**
  1. Replace the hover-only trigger with an explicit button or icon that opens a menu/popover (`DropdownMenu`, `Popover`, or `Dialog`). Give it `aria-haspopup="dialog"` and visible label like “User actions”.
  2. Keep the username link for navigation, but ensure the menu trigger is what houses the follow/unfollow CTA. Tests can then `getByRole('button', { name: 'Follow' })`.
  3. Hide or disable the trigger entirely when `currentUserId === post.userId` so the “own posts” test passes.
  4. Add a “Visit Profile” button next to “Follow” within the menu, just like the spec describes.

---

## 3. Post creation tests (2 failures)

Directories: `test-results/posts-Post-Creation-and-Feed-*` → `e2e/posts.spec.ts`

- **What the tests expect**
  - Immediately-visible textarea for composing (`textarea[name="content"]` or placeholder matching “What”).
  - Optional image URL input (the spec tries to fill `input[name="image_url"]`).
  - Submit button labeled “Post”/“Share”.
- **Reality**
  - The feed page shows only the `CreatePostTrigger` teaser until the user clicks it. Because the tests never click the trigger, none of the required form fields exist and Playwright times out waiting for them.
  - Even after a user creates a post via dialog, the feed list takes a full reload (`window.location.reload()`) to reflect the new post, whereas the tests expect to see the new post without a reload.
- **Fix**
  1. Either render `CreatePostForm` inline (desktop) and keep the dialog as an enhancement on mobile, or update the tests to click the trigger. Inline rendering is closer to the Threads UX and unblocks the spec immediately.
  2. After calling `/api/posts`, append the returned post to `Feed` state instead of forcing `window.location.reload()`. This makes the “should show own posts” assertions deterministic and allows the refresh tests to pass as well.

---

## 4. Tracking spec (1 failure)

Test: `e2e/tracking.spec.ts:140` (`should track post views with Intersection Observer`)

- The failure log shows the test timing out on `await expect(page.getByRole('heading', { name: 'Feed' })).toBeVisible();`—identical to the feed smoke tests.
- Once the feed page exposes an actual heading, this spec will progress to the real tracking assertions.

> Note: The server logs spam “ML Service connection error” during these runs because `/api/feeds` attempts to call the external ML recommendation service. These warnings are unrelated to the e2e failures above; they occur even when tests pass because the ML service isn’t running in CI/local environments.

---

## Recommended implementation order

1. Add an accessible feed header + refresh control + inline create form on `app/feed/page.tsx`.
2. Refactor `UserActionMenu` in `components/post-card.tsx` to open via an explicit trigger and hide it on self.
3. Update `CreatePostTrigger`/`Feed` to re-render posts without a full-page reload.
4. Rerun `pnpm test:e2e` to confirm all feed/follow/post specs pass; the tracking spec should also clear once the heading exists.
