import { beforeAll, afterAll, afterEach } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { setupKeycloak } from './tests/setup-keycloak';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const execAsync = promisify(exec);

// Set test database URL immediately
process.env.DATABASE_URL =
  'postgresql://postgres:postgres@localhost:5433/threads_test?schema=public';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Cleanup React components after each test
afterEach(() => {
  cleanup();
});

// Setup test database and Keycloak
beforeAll(async () => {
  // Create test database if it doesn't exist
  try {
    await execAsync(
      'docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE threads_test;"'
    );
    console.log('Created test database');
  } catch {
    // Database might already exist, that's okay
    console.log('Test database already exists');
  }

  // Run Prisma migrations on test database
  try {
    await execAsync(
      'DATABASE_URL="postgresql://postgres:postgres@localhost:5433/threads_test?schema=public" pnpm prisma migrate deploy'
    );
    console.log('Applied Prisma migrations to test database');
  } catch (error) {
    console.error('Failed to apply migrations:', error);
    throw error;
  }

  // Enable pg_trgm extension for fuzzy search
  try {
    await execAsync(
      'docker compose exec -T postgres psql -U postgres -d threads_test -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"'
    );
    console.log('Enabled pg_trgm extension in test database');
  } catch (error) {
    console.error('Failed to enable pg_trgm extension:', error);
    throw error;
  }

  // Setup Keycloak realm, client, and test users (idempotent)
  try {
    await setupKeycloak();
    console.log('Keycloak setup complete');
  } catch (error) {
    console.error('Failed to setup Keycloak:', error);
    throw error;
  }
}, 60000);

afterAll(() => {
  // Cleanup code if needed
});
