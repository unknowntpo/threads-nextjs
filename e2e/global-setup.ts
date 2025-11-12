import { execSync } from 'child_process';

async function globalSetup() {
  console.log('🔧 Running E2E test setup...');

  // Create test database if it doesn't exist
  console.log('📊 Creating test database...');
  try {
    execSync(
      'docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE threads_test;"',
      {
        stdio: 'pipe',
      }
    );
    console.log('✅ Created test database');
  } catch {
    // Database already exists, that's fine
    console.log('ℹ️  Test database already exists');
  }

  // Run migrations on test database using .env.test
  console.log('📦 Running Prisma migrations on test database...');
  execSync('dotenv -e .env.test -- pnpm prisma migrate deploy', { stdio: 'inherit' });

  // No seeding - each test creates its own data for isolation
  console.log('✅ E2E test setup complete! (Database is clean, tests will create their own data)');
}

export default globalSetup;
