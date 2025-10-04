import { execSync } from 'child_process'

async function globalSetup() {
  console.log('🔧 Running E2E test setup...')

  // Run migrations
  console.log('📦 Running Prisma migrations...')
  execSync('pnpm prisma migrate deploy', { stdio: 'inherit' })

  // Seed database
  console.log('🌱 Seeding database...')
  execSync('pnpm seed', { stdio: 'inherit' })

  console.log('✅ E2E test setup complete!')
}

export default globalSetup
