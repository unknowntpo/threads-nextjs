import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Strong passwords for production seed users from environment variables
// In non-production environments, use default passwords for simplicity
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const DEFAULT_ALICE_PASSWORD = 'alice123'
const DEFAULT_BOB_PASSWORD = 'bob123'

const ALICE_PASSWORD =
  process.env.ALICE_PASSWORD || (!IS_PRODUCTION ? DEFAULT_ALICE_PASSWORD : undefined)
const BOB_PASSWORD = process.env.BOB_PASSWORD || (!IS_PRODUCTION ? DEFAULT_BOB_PASSWORD : undefined)

if (!ALICE_PASSWORD || !BOB_PASSWORD) {
  console.error(
    '❌ ALICE_PASSWORD and BOB_PASSWORD must be set in environment variables for production'
  )
  process.exit(1)
}

async function main() {
  console.log('🌱 Seeding database...')

  // TypeScript assertion: passwords are guaranteed to be strings after the check above
  const alicePassword = ALICE_PASSWORD as string
  const bobPassword = BOB_PASSWORD as string

  // Hash passwords
  const alicePasswordHash = await bcrypt.hash(alicePassword, 10)
  const bobPasswordHash = await bcrypt.hash(bobPassword, 10)

  // Only log passwords in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚠️  Seed user passwords (development only):')
    console.log(`   alice@example.com: ${alicePassword}`)
    console.log(`   bob@example.com: ${bobPassword}`)
  }

  // Create test users with fixed IDs
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {
      username: 'alice',
      displayName: 'Alice Cooper',
      name: 'Alice Cooper',
    },
    create: {
      id: 'test-user-alice-00000000-0000-0000-0000-000000000001',
      email: 'alice@example.com',
      username: 'alice',
      displayName: 'Alice Cooper',
      name: 'Alice Cooper',
      accounts: {
        create: {
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: 'alice-credentials',
          refresh_token: alicePasswordHash,
        },
      },
    },
  })

  // Ensure alice has credentials account with password
  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: 'credentials',
        providerAccountId: 'alice-credentials',
      },
    },
    update: {
      refresh_token: alicePasswordHash,
    },
    create: {
      userId: alice.id,
      type: 'credentials',
      provider: 'credentials',
      providerAccountId: 'alice-credentials',
      refresh_token: alicePasswordHash,
    },
  })

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {
      username: 'bob',
      displayName: 'Bob Builder',
      name: 'Bob Builder',
    },
    create: {
      id: 'test-user-bob-000000000-0000-0000-0000-000000000002',
      email: 'bob@example.com',
      username: 'bob',
      displayName: 'Bob Builder',
      name: 'Bob Builder',
      accounts: {
        create: {
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: 'bob-credentials',
          refresh_token: bobPasswordHash,
        },
      },
    },
  })

  // Ensure bob has credentials account with password
  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: 'credentials',
        providerAccountId: 'bob-credentials',
      },
    },
    update: {
      refresh_token: bobPasswordHash,
    },
    create: {
      userId: bob.id,
      type: 'credentials',
      provider: 'credentials',
      providerAccountId: 'bob-credentials',
      refresh_token: bobPasswordHash,
    },
  })

  // Create test posts
  await prisma.post.upsert({
    where: { id: 'test-post-1' },
    update: {},
    create: {
      id: 'test-post-1',
      content: 'Just deployed my first Next.js app! 🚀',
      userId: alice.id,
      mediaUrls: [],
    },
  })

  await prisma.post.upsert({
    where: { id: 'test-post-2' },
    update: {},
    create: {
      id: 'test-post-2',
      content: 'Learning Prisma is awesome!',
      userId: bob.id,
      mediaUrls: [],
    },
  })

  console.log('✅ Seeding completed!')
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
