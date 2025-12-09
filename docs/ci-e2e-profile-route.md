# CI Failure Notes: Profile E2E

## Failure summary

- **Workflow**: `test:e2e` Playwright suite (GitHub Actions run `19402696221`, job `55512553116`)
- **Test**: `Profile Management › should display user posts on profile` (`e2e/profile.spec.ts:119`)
- **Symptom**: Playwright DOM snapshot captured the default Next.js `404` page (`playwright-report/data/e27d0baa0fbe3bd61e610a00474dd825f44dce52.md`), so the test never found the expected post content.

## Reproducing locally

1. Ensure the `.env.test` secrets are configured.
2. Run the single spec (this also cleans the Prisma DB through the shared helper):
   ```bash
   pnpm test:e2e -- --grep "should display user posts on profile"
   ```
3. The test navigates to `/profile` after logging in and immediately receives a `404`, matching the CI artifact.

> **Note:** On this machine the Playwright dev server could not bind to `0.0.0.0:3000` because of sandbox restrictions (`listen EPERM`). Re-run without the sandbox (or in CI) to reproduce the exact failure after addressing the port-blocking policy.

## Root cause

- The spec deliberately hits `/profile` (see `page.goto('/profile')` in `e2e/profile.spec.ts:138`), expecting an own-profile page with posts.
- The application only defines `app/profile/[username]/page.tsx`, which serves `/profile/:username`. There is no index route at `app/profile/page.tsx`, so `/profile` renders Next.js' fallback 404 page.
- Because no redirect exists, any attempt to view the signed-in user's profile without supplying the username fails, which also represents a genuine UX gap outside of the test suite.

## Recommended fix

1. Add `app/profile/page.tsx` that reads the current session via `auth()`. If the user is unauthenticated, redirect to `/auth/login`. Otherwise, redirect to `/profile/${session.user.username}` (fall back to `/feed` if the username is missing).
2. After the redirect lands on `app/profile/[username]/page.tsx`, confirm that the initial posts list contains only the signed-in user's posts (already implemented via the `ProfileView` props).
3. Optionally tidy the Playwright test to assert both seeded posts (the second assertion currently duplicates the first string), but this is not required to fix the failing run.

## Validation plan

1. `pnpm test:e2e -- --grep "Profile Management"` (or the single test) should now load the redirected profile page instead of 404 and pass once the DOM contains the seeded posts.
2. Run `pnpm test:e2e` for the entire suite before merging to keep CI green.
