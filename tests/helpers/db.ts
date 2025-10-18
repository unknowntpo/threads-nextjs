import { prisma } from '@/lib/prisma'

/**
 * Clean up all test data from the database
 */
export async function cleanupDatabase() {
  // Delete in reverse order of dependencies
  await prisma.userRecommendation.deleteMany()
  await prisma.userInteraction.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.like.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.post.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()
  await prisma.verificationToken.deleteMany()
}

/**
 * Create a test user
 * Note: password parameter is kept for API compatibility but not used
 * since NextAuth handles password hashing internally
 */
export async function createTestUser(data: {
  email: string
  password: string
  username: string
  display_name?: string
}) {
  const user = await prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      displayName: data.display_name || data.username,
      name: data.display_name || data.username,
      emailVerified: new Date(), // Auto-verify for tests
    },
  })

  // Create credentials account
  await prisma.account.create({
    data: {
      userId: user.id,
      type: 'credentials',
      provider: 'credentials',
      providerAccountId: user.id,
    },
  })

  return user
}
