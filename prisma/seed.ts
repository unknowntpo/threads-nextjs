import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

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
        },
      },
    },
  })

  // Ensure alice has credentials account
  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: 'credentials',
        providerAccountId: 'alice-credentials',
      },
    },
    update: {},
    create: {
      userId: alice.id,
      type: 'credentials',
      provider: 'credentials',
      providerAccountId: 'alice-credentials',
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
        },
      },
    },
  })

  // Ensure bob has credentials account
  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: 'credentials',
        providerAccountId: 'bob-credentials',
      },
    },
    update: {},
    create: {
      userId: bob.id,
      type: 'credentials',
      provider: 'credentials',
      providerAccountId: 'bob-credentials',
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
