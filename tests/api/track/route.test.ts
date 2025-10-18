import { describe, it, expect, beforeEach } from 'vitest'
import { cleanupDatabase, createTestUser } from '@/tests/helpers/db'
import { prisma } from '@/lib/prisma'

describe('Track API - Database Integration', () => {
  beforeEach(async () => {
    await cleanupDatabase()
  })

  describe('UserInteraction Model', () => {
    it('should create single interaction', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      })

      const post = await prisma.post.create({
        data: {
          userId: user.id,
          content: 'Test post',
        },
      })

      const interaction = await prisma.userInteraction.create({
        data: {
          userId: user.id,
          postId: post.id,
          interactionType: 'view',
          metadata: {
            duration: 5000,
            scroll_depth: 75,
          },
        },
      })

      expect(interaction).toBeDefined()
      expect(interaction.userId).toBe(user.id)
      expect(interaction.postId).toBe(post.id)
      expect(interaction.interactionType).toBe('view')
      expect(interaction.metadata).toEqual({
        duration: 5000,
        scroll_depth: 75,
      })
    })

    it('should create batch interactions', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      })

      await prisma.post.createMany({
        data: [
          { userId: user.id, content: 'Post 1' },
          { userId: user.id, content: 'Post 2' },
          { userId: user.id, content: 'Post 3' },
        ],
      })

      const postList = await prisma.post.findMany({
        where: { userId: user.id },
      })

      const result = await prisma.userInteraction.createMany({
        data: postList.map((post, index) => ({
          userId: user.id,
          postId: post.id,
          interactionType: 'view',
          metadata: {
            source: 'feed',
            position: index,
          },
        })),
      })

      expect(result.count).toBe(3)

      const interactions = await prisma.userInteraction.findMany({
        where: { userId: user.id },
      })

      expect(interactions).toHaveLength(3)
    })

    it('should support all interaction types', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      })

      const post = await prisma.post.create({
        data: {
          userId: user.id,
          content: 'Test post',
        },
      })

      const types = ['view', 'click', 'like', 'share']

      await prisma.userInteraction.createMany({
        data: types.map(type => ({
          userId: user.id,
          postId: post.id,
          interactionType: type,
        })),
      })

      const interactions = await prisma.userInteraction.findMany({
        where: { userId: user.id, postId: post.id },
        orderBy: { createdAt: 'asc' },
      })

      expect(interactions).toHaveLength(4)
      expect(interactions.map(i => i.interactionType)).toEqual(types)
    })

    it('should allow duplicate interactions', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      })

      const post = await prisma.post.create({
        data: {
          userId: user.id,
          content: 'Test post',
        },
      })

      // Create multiple view interactions
      await prisma.userInteraction.createMany({
        data: [
          {
            userId: user.id,
            postId: post.id,
            interactionType: 'view',
            metadata: { duration: 1000 },
          },
          {
            userId: user.id,
            postId: post.id,
            interactionType: 'view',
            metadata: { duration: 2000 },
          },
          {
            userId: user.id,
            postId: post.id,
            interactionType: 'view',
            metadata: { duration: 3000 },
          },
        ],
      })

      const interactions = await prisma.userInteraction.findMany({
        where: { userId: user.id, postId: post.id },
      })

      expect(interactions).toHaveLength(3)
    })

    it('should handle metadata with various types', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      })

      const post = await prisma.post.create({
        data: {
          userId: user.id,
          content: 'Test post',
        },
      })

      const metadataVariations = [
        { duration: 5000, scroll_depth: 75, source: 'feed' },
        { source: 'profile', timestamp: Date.now() },
        { custom_field: true, numbers: [1, 2, 3] },
        null, // No metadata
      ]

      await prisma.userInteraction.createMany({
        data: metadataVariations.map(metadata => ({
          userId: user.id,
          postId: post.id,
          interactionType: 'view',
          metadata: metadata ? (metadata as Record<string, unknown>) : undefined,
        })),
      })

      const interactions = await prisma.userInteraction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      })

      expect(interactions).toHaveLength(4)
      expect(interactions[0].metadata).toEqual(metadataVariations[0])
      expect(interactions[1].metadata).toEqual(metadataVariations[1])
      expect(interactions[2].metadata).toEqual(metadataVariations[2])
      expect(interactions[3].metadata).toBeNull()
    })

    it('should query interactions by user and time range', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      })

      await prisma.post.createMany({
        data: [
          { userId: user.id, content: 'Post 1' },
          { userId: user.id, content: 'Post 2' },
        ],
      })

      const postList = await prisma.post.findMany({
        where: { userId: user.id },
      })

      // Create interactions at different times
      for (const post of postList) {
        await prisma.userInteraction.create({
          data: {
            userId: user.id,
            postId: post.id,
            interactionType: 'view',
          },
        })
      }

      const oneMinuteAgo = new Date(Date.now() - 60 * 1000)

      const recentInteractions = await prisma.userInteraction.findMany({
        where: {
          userId: user.id,
          createdAt: {
            gte: oneMinuteAgo,
          },
        },
      })

      expect(recentInteractions.length).toBeGreaterThan(0)
    })

    it('should cascade delete when user is deleted', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      })

      const post = await prisma.post.create({
        data: {
          userId: user.id,
          content: 'Test post',
        },
      })

      await prisma.userInteraction.create({
        data: {
          userId: user.id,
          postId: post.id,
          interactionType: 'view',
        },
      })

      // Delete user (should cascade)
      await prisma.user.delete({
        where: { id: user.id },
      })

      // Verify interactions were deleted
      const interactions = await prisma.userInteraction.findMany({
        where: { userId: user.id },
      })

      expect(interactions).toHaveLength(0)
    })

    it('should cascade delete when post is deleted', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      })

      const post = await prisma.post.create({
        data: {
          userId: user.id,
          content: 'Test post',
        },
      })

      await prisma.userInteraction.create({
        data: {
          userId: user.id,
          postId: post.id,
          interactionType: 'view',
        },
      })

      // Delete post (should cascade)
      await prisma.post.delete({
        where: { id: post.id },
      })

      // Verify interactions were deleted
      const interactions = await prisma.userInteraction.findMany({
        where: { postId: post.id },
      })

      expect(interactions).toHaveLength(0)
    })

    it('should support aggregation queries for analytics', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      })

      const post = await prisma.post.create({
        data: {
          userId: user.id,
          content: 'Test post',
        },
      })

      await prisma.userInteraction.createMany({
        data: [
          { userId: user.id, postId: post.id, interactionType: 'view' },
          { userId: user.id, postId: post.id, interactionType: 'view' },
          { userId: user.id, postId: post.id, interactionType: 'click' },
          { userId: user.id, postId: post.id, interactionType: 'like' },
        ],
      })

      // Count by interaction type
      const interactionCounts = await prisma.userInteraction.groupBy({
        by: ['interactionType'],
        where: {
          postId: post.id,
        },
        _count: {
          id: true,
        },
      })

      expect(interactionCounts).toHaveLength(3)
      const viewCount = interactionCounts.find(i => i.interactionType === 'view')?._count.id
      expect(viewCount).toBe(2)
    })
  })
})
