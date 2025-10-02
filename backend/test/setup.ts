import { execSync } from 'child_process';

/**
 * Setup test database by running Prisma migrations
 * Requires DATABASE_URL to be set in environment
 */
export function setupTestDatabase(): void {
  try {
    console.log('Setting up test database...');

    // Run Prisma migrations to set up test database schema
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env },
    });

    console.log('Test database setup complete');
  } catch (error: unknown) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}

/**
 * Clean up test database by resetting it
 */
export function cleanupTestDatabase(): void {
  try {
    execSync('npx prisma migrate reset --force --skip-seed', {
      stdio: 'inherit',
      env: { ...process.env },
    });
  } catch (error: unknown) {
    console.error('Failed to cleanup test database:', error);
  }
}

/**
 * Teardown test database resources
 */
export function teardownTestDatabase(): void {
  console.log('Test database teardown complete');
}
