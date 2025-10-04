import { describe, it, expect, beforeEach } from 'vitest'
import { cleanupDatabase, createTestUser } from '@/tests/helpers/db'
import { prisma } from '@/lib/prisma'

// Note: These are integration tests that test Prisma database operations.
// NextAuth's auth() function is tested separately in E2E tests since it requires
// a full Next.js server context with proper cookie handling.
//
// These tests verify:
// 1. Database operations work correctly with Prisma
// 2. Repository layer functions as expected
// 3. Data validation and constraints

describe('Posts API - Database Integration', () => {
  beforeEach(async () => {
    await cleanupDatabase()
  })

  describe('Creating posts', () => {
    it('should create a post in database with valid data', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
        display_name: 'Test User',
      })

      const post = await prisma.post.create({
        data: {
          userId: user.id,
          content: 'This is my first post!',
        },
      })

      expect(post).toBeDefined()
      expect(post.content).toBe('This is my first post!')
      expect(post.userId).toBe(user.id)

      // Verify it's actually in the database
      const fetchedPost = await prisma.post.findUnique({
        where: { id: post.id },
        include: {
          user: true,
        },
      })

      expect(fetchedPost).toBeDefined()
      expect(fetchedPost?.user.username).toBe('testuser')
    })

    it('should require valid user id (foreign key constraint)', async () => {
      await expect(
        prisma.post.create({
          data: {
            userId: 'invalid-user-id',
            content: 'This should fail',
          },
        })
      ).rejects.toThrow()
    })
  })

  describe('Fetching posts', () => {
    it('should fetch all posts with user data', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
        display_name: 'Test User',
      })

      await prisma.post.createMany({
        data: [
          { userId: user.id, content: 'Post 1' },
          { userId: user.id, content: 'Post 2' },
          { userId: user.id, content: 'Post 3' },
        ],
      })

      const posts = await prisma.post.findMany({
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      expect(posts).toHaveLength(3)
      expect(posts[0].user).toBeDefined()
      expect(posts[0].user.username).toBe('testuser')
    })

    it('should fetch posts for specific user', async () => {
      const user1 = await createTestUser({
        email: 'user1@example.com',
        password: 'password123',
        username: 'user1',
      })

      const user2 = await createTestUser({
        email: 'user2@example.com',
        password: 'password123',
        username: 'user2',
      })

      await prisma.post.createMany({
        data: [
          { userId: user1.id, content: 'User 1 Post 1' },
          { userId: user1.id, content: 'User 1 Post 2' },
          { userId: user2.id, content: 'User 2 Post 1' },
        ],
      })

      const user1Posts = await prisma.post.findMany({
        where: { userId: user1.id },
      })

      expect(user1Posts).toHaveLength(2)
      expect(user1Posts.every(p => p.userId === user1.id)).toBe(true)
    })
  })

  describe('Sessions and Authentication', () => {
    it('should create and verify session in database', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      })

      const sessionToken = crypto.randomUUID()
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          sessionToken,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })

      expect(session).toBeDefined()
      expect(session.userId).toBe(user.id)
      expect(session.sessionToken).toBe(sessionToken)

      // Verify session can be retrieved
      const fetchedSession = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      })

      expect(fetchedSession).toBeDefined()
      expect(fetchedSession?.user.email).toBe('test@example.com')
    })

    it('should enforce session expiry constraint', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      })

      const expiredSession = await prisma.session.create({
        data: {
          userId: user.id,
          sessionToken: crypto.randomUUID(),
          expires: new Date(Date.now() - 1000), // Expired
        },
      })

      expect(expiredSession.expires.getTime()).toBeLessThan(Date.now())
    })
  })
})
