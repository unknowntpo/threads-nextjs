import { test as base, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Clean the database before each test
 * Deletes all data from all tables in the correct order (respecting foreign keys)
 */
async function cleanDatabase() {
  await prisma.$transaction([
    // Delete in order: child tables first, then parent tables
    prisma.userRecommendation.deleteMany(),
    prisma.userInteraction.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.like.deleteMany(),
    prisma.post.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.user.deleteMany(),
    prisma.verificationToken.deleteMany(),
  ])
}

/**
 * Test helper functions for creating test data
 */
const helpers = {
  /**
   * Create a test user with credentials account
   * Note: Current auth doesn't verify passwords, just checks if user/account exists
   *
   * IMPORTANT: For parallel test execution, email and username must be unique across tests.
   * Consider adding timestamps or unique IDs to avoid conflicts.
   */
  async createUser(options: {
    email?: string
    username?: string
    displayName?: string
    password?: string
  }) {
    // Generate unique identifiers if not provided
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const uniqueId = `${timestamp}-${random}`

    const email = options.email || `user-${uniqueId}@test.example.com`
    const username = options.username || `user${uniqueId}`
    const displayName = options.displayName || `Test User ${uniqueId}`
    const password = options.password || 'password123'

    const user = await prisma.user.create({
      data: {
        email,
        username,
        displayName,
        name: displayName,
        accounts: {
          create: {
            type: 'credentials',
            provider: 'credentials',
            providerAccountId: `${username}-credentials`,
          },
        },
      },
    })

    return { user, password }
  },

  /**
   * Create a test post
   */
  async createPost(options: { userId: string; content: string; mediaUrls?: string[] }) {
    const { userId, content, mediaUrls = [] } = options

    const post = await prisma.post.create({
      data: {
        userId,
        content,
        mediaUrls,
      },
    })

    return post
  },

  /**
   * Create a like
   */
  async createLike(options: { userId: string; postId: string }) {
    const { userId, postId } = options

    const like = await prisma.like.create({
      data: {
        userId,
        postId,
      },
    })

    return like
  },

  /**
   * Create a comment
   */
  async createComment(options: { userId: string; postId: string; content: string }) {
    const { userId, postId, content } = options

    const comment = await prisma.comment.create({
      data: {
        userId,
        postId,
        content,
      },
    })

    return comment
  },

  /**
   * Create a follow relationship
   */
  async createFollow(options: { followerId: string; followingId: string }) {
    const { followerId, followingId } = options

    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    })

    return follow
  },
}

/**
 * Extended test with database cleanup and helpers
 */
export const test = base.extend<{ cleanDb: void }>({
  // Fixture that runs before each test
  cleanDb: [
    async ({}, use) => {
      // Clean database before test
      await cleanDatabase()

      // Run the test
      await use()

      // Optional: Clean database after test (not needed if beforeEach always cleans)
      // await cleanDatabase()
    },
    { auto: true }, // This fixture runs automatically for every test
  ],
})

export { expect, helpers }
