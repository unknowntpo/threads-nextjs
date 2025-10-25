# Repository Guidelines

## Project Structure & Module Organization

- `app/` holds the Next.js route tree, including route handlers and shared layouts; use the `@/` alias for imports.
- UI primitives live in `components/` and supporting hooks, utilities, and types reside in `hooks/`, `lib/`, and `types/`.
- Backend integrations (Prisma client, auth helpers) live under `prisma/` and `auth.ts`; seed data is in `seed_*.json`.
- Automated tests are split between `tests/` (unit/integration with Vitest) and `e2e/` (Playwright specs). Visual artifacts land in `playwright-report/`.
- Infrastructure and tooling assets live in `scripts/`, `k8s/`, `terraform/`, and `docs/`; `ml-service/` houses the auxiliary ML worker.

## Build, Test, and Development Commands

- `pnpm dev` launches the Turbopack dev server with `.env.local` secrets.
- `pnpm build` compiles the Next.js app; `pnpm start` serves the production build using `.env.production`.
- `pnpm lint`, `pnpm format:check`, and `pnpm circular` cover linting, Prettier verification, and dependency cycle scans.
- `pnpm prisma:migrate` + `pnpm prisma:deploy` manage schema changes; `pnpm seed` hydrates a local database.
- `pnpm test`, `pnpm test:watch`, and `pnpm test:e2e` run Vitest and Playwright suites (headed/DEBUG variants available for troubleshooting).

## Coding Style & Naming Conventions

- TypeScript is mandatory; follow module-aliased imports (`@/components/...`) and prefer React Server Components when possible.
- Prettier (3.x) and Next ESLint (9) enforce 2-space indentation, single quotes, and Tailwind class ordering—run `pnpm format` before large diffs.
- Use PascalCase for React components, camelCase for functions/variables, SCREAMING_SNAKE_CASE for constants, and hyphenated filenames for routes.
- Tailwind utility-first styling is standard; compose complex styles with `clsx` or `class-variance-authority`.

## Testing Guidelines

- Place Vitest specs alongside code in `tests/` using the `<name>.test.ts` pattern; prefer descriptive `describe` blocks for feature scopes.
- Ensure new features ship with Vitest coverage or Playwright journeys when user flows change. Snapshot tests belong in Vitest, not Playwright.
- For database-dependent tests, load fixtures through Prisma seed helpers and reset state in `beforeEach` via the provided utilities.

## Commit & Pull Request Guidelines

- Follow Conventional Commits (`feat(scope): summary`, `fix:`, `refactor(k8s):`, etc.); keep subject ≤72 characters.
- Squash noisy work-in-progress commits locally; retain meaningful history for review.
- Pull requests must describe the change, link tracking issues, include test evidence (`pnpm test`/`pnpm test:e2e` output), and attach UI screenshots when altering the `app/` surfaces.
- Tag owners of affected areas (`app/`, `ml-service/`, `k8s/`) and highlight any migration or seed steps in the checklist.
