import { execSync } from 'child_process'

async function globalSetup() {
  console.log('🔧 Running E2E test setup...')

  // Run migrations
  console.log('📦 Running Prisma migrations...')
  execSync('pnpm prisma migrate deploy', { stdio: 'inherit' })

  // No seeding - each test creates its own data for isolation
  console.log('✅ E2E test setup complete! (Database is clean, tests will create their own data)')
}

export default globalSetup
