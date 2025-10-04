import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create test users
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
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

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
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
