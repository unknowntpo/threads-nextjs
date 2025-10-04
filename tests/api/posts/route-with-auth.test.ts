import { describe, it, expect, beforeEach } from 'vitest'
import { cleanupDatabase, createTestUser } from '@/tests/helpers/db'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

/**
 * Integration tests for Posts API authentication flow
 *
 * These tests verify authentication and authorization by:
 * 1. Creating users and accounts in the database
 * 2. Creating JWT tokens (simulating NextAuth session tokens)
 * 3. Verifying session data can be retrieved and validated
 *
 * Note: Full E2E auth testing with cookie handling is done in Playwright tests.
 * These tests focus on the database layer of the authentication system.
 */

describe('Posts API - Authentication Flow', () => {
  beforeEach(async () => {
    await cleanupDatabase()
  })

  describe('User and Account Creation', () => {
    it('should create user with credentials account', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
        display_name: 'Test User',
      })

      // Verify user was created
      expect(user).toBeDefined()
      expect(user.email).toBe('test@example.com')
      expect(user.username).toBe('testuser')

      // Verify credentials account was created (by createTestUser helper)
      const foundAccount = await prisma.account.findFirst({
        where: {
          userId: user.id,
          provider: 'credentials',
        },
      })

      expect(foundAccount).toBeDefined()
      expect(foundAccount?.userId).toBe(user.id)
      expect(foundAccount?.type).toBe('credentials')
      expect(foundAccount?.provider).toBe('credentials')
    })

    it('should support OAuth accounts', async () => {
      const user = await createTestUser({
        email: 'oauth@example.com',
        password: 'password123',
        username: 'oauthuser',
      })

      // Create OAuth account (Google)
      const googleAccount = await prisma.account.create({
        data: {
          userId: user.id,
          type: 'oauth',
          provider: 'google',
          providerAccountId: 'google-123',
          access_token: 'mock-access-token',
          token_type: 'Bearer',
          scope: 'openid profile email',
        },
      })

      expect(googleAccount).toBeDefined()
      expect(googleAccount.provider).toBe('google')

      // Verify OAuth account can be retrieved
      const foundAccount = await prisma.account.findFirst({
        where: {
          userId: user.id,
          provider: 'google',
        },
      })

      expect(foundAccount).toBeDefined()
      expect(foundAccount?.access_token).toBe('mock-access-token')
    })
  })

  describe('Session Management', () => {
    it('should create and validate JWT session token', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      })

      // Create JWT token (what NextAuth does)
      const secret = process.env.NEXTAUTH_SECRET || 'test-secret'
      const token = jwt.sign(
        {
          sub: user.id,
          email: user.email,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
        },
        secret
      )

      expect(token).toBeDefined()

      // Verify token can be decoded
      const decoded = jwt.verify(token, secret) as jwt.JwtPayload

      expect(decoded.sub).toBe(user.id)
      expect(decoded.email).toBe(user.email)

      // Verify user data can be retrieved from token
      const foundUser = await prisma.user.findUnique({
        where: { id: decoded.sub },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
        },
      })

      expect(foundUser).toBeDefined()
      expect(foundUser?.email).toBe('test@example.com')
      expect(foundUser?.username).toBe('testuser')
    })

    it('should handle expired tokens', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      })

      // Create expired token
      const secret = process.env.NEXTAUTH_SECRET || 'test-secret'
      const expiredToken = jwt.sign(
        {
          sub: user.id,
          email: user.email,
          iat: Math.floor(Date.now() / 1000) - 48 * 60 * 60, // 48 hours ago
          exp: Math.floor(Date.now() / 1000) - 24 * 60 * 60, // Expired 24 hours ago
        },
        secret
      )

      // Verify token is rejected
      expect(() => {
        jwt.verify(expiredToken, secret)
      }).toThrow('jwt expired')
    })

    it('should create database session for non-JWT strategy', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      })

      // Create database session (alternative to JWT)
      const sessionToken = crypto.randomUUID()
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          sessionToken,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      })

      expect(session).toBeDefined()
      expect(session.sessionToken).toBe(sessionToken)
      expect(session.userId).toBe(user.id)

      // Verify session can be retrieved
      const foundSession = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      })

      expect(foundSession).toBeDefined()
      expect(foundSession?.user.email).toBe('test@example.com')
    })

    it('should clean up expired sessions', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      })

      // Create expired session
      const expiredSession = await prisma.session.create({
        data: {
          userId: user.id,
          sessionToken: crypto.randomUUID(),
          expires: new Date(Date.now() - 1000), // Expired
        },
      })

      expect(expiredSession.expires.getTime()).toBeLessThan(Date.now())

      // Delete expired sessions
      const deleteResult = await prisma.session.deleteMany({
        where: {
          expires: {
            lt: new Date(),
          },
        },
      })

      expect(deleteResult.count).toBeGreaterThan(0)

      // Verify session was deleted
      const foundSession = await prisma.session.findUnique({
        where: { sessionToken: expiredSession.sessionToken },
      })

      expect(foundSession).toBeNull()
    })
  })

  describe('Authorization Checks', () => {
    it('should verify user owns post before modification', async () => {
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

      // User 1 creates a post
      const post = await prisma.post.create({
        data: {
          userId: user1.id,
          content: 'User 1 post',
        },
      })

      // Verify ownership check (what API routes should do)
      expect(post.userId).toBe(user1.id)
      expect(post.userId).not.toBe(user2.id)

      // Simulate authorization check
      const canUser2ModifyPost = post.userId === user2.id
      expect(canUser2ModifyPost).toBe(false)

      const canUser1ModifyPost = post.userId === user1.id
      expect(canUser1ModifyPost).toBe(true)
    })

    it('should verify user data retrieval with proper scoping', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
        display_name: 'Test User',
      })

      // Create posts
      await prisma.post.createMany({
        data: [
          { userId: user.id, content: 'Post 1' },
          { userId: user.id, content: 'Post 2' },
        ],
      })

      // Fetch posts with user data (what API should return)
      const posts = await prisma.post.findMany({
        where: { userId: user.id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              // Should NOT include sensitive data like email by default
            },
          },
        },
      })

      expect(posts).toHaveLength(2)
      expect(posts[0].user.username).toBe('testuser')

      // Verify email is not exposed
      expect('email' in posts[0].user).toBe(false)
    })
  })
})
