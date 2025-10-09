import { describe, it, expect, beforeEach } from 'vitest'
import { cleanupDatabase, createTestUser } from '@/tests/helpers/db'
import { prisma } from '@/lib/prisma'
import { FeedRepository } from '@/lib/repositories/feed.repository'

describe('Feeds API - Database Integration', () => {
  beforeEach(async () => {
    await cleanupDatabase()
  })

  describe('FeedRepository', () => {
    describe('fetchRandomPosts', () => {
      it('should fetch random posts excluding user own posts', async () => {
        // Create test users
        const user1 = await createTestUser({
          email: 'user1@example.com',
          password: 'password123',
          username: 'user1',
          display_name: 'User One',
        })

        const user2 = await createTestUser({
          email: 'user2@example.com',
          password: 'password123',
          username: 'user2',
          display_name: 'User Two',
        })

        // Create posts for both users
        await prisma.post.createMany({
          data: [
            { userId: user1.id, content: 'User 1 Post 1' },
            { userId: user1.id, content: 'User 1 Post 2' },
            { userId: user2.id, content: 'User 2 Post 1' },
            { userId: user2.id, content: 'User 2 Post 2' },
            { userId: user2.id, content: 'User 2 Post 3' },
          ],
        })

        const feedRepo = new FeedRepository()
        const feed = await feedRepo.fetchRandomPosts(user1.id, 10)

        // Should only get user2's posts (3 posts)
        expect(feed).toHaveLength(3)
        expect(feed.every(post => post.userId === user2.id)).toBe(true)
        expect(feed.every(post => post.user)).toBeDefined()
        expect(feed.every(post => post.user.username === 'user2')).toBe(true)
      })

      it('should respect limit parameter', async () => {
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

        // Create 10 posts for user2
        await prisma.post.createMany({
          data: Array.from({ length: 10 }, (_, i) => ({
            userId: user2.id,
            content: `Post ${i + 1}`,
          })),
        })

        const feedRepo = new FeedRepository()
        const feed = await feedRepo.fetchRandomPosts(user1.id, 5)

        expect(feed).toHaveLength(5)
      })

      it('should handle pagination with offset', async () => {
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

        // Create 20 posts for user2
        await prisma.post.createMany({
          data: Array.from({ length: 20 }, (_, i) => ({
            userId: user2.id,
            content: `Post ${i + 1}`,
          })),
        })

        const feedRepo = new FeedRepository()

        // Get first page
        const page1 = await feedRepo.fetchRandomPosts(user1.id, 10, 0)
        expect(page1).toHaveLength(10)

        // Get second page
        const page2 = await feedRepo.fetchRandomPosts(user1.id, 10, 10)
        expect(page2).toHaveLength(10)

        // Pages should have different posts (with high probability due to randomization)
        // Note: This test might occasionally fail due to random nature, but very unlikely
        const page1Ids = page1.map(p => p.id).sort()
        const page2Ids = page2.map(p => p.id).sort()
        expect(page1Ids).not.toEqual(page2Ids)
      })

      it('should validate limit parameter', async () => {
        const user = await createTestUser({
          email: 'user@example.com',
          password: 'password123',
          username: 'user',
        })

        const feedRepo = new FeedRepository()

        // Limit too small
        await expect(feedRepo.fetchRandomPosts(user.id, 0)).rejects.toThrow(
          'Limit must be between 1 and 100'
        )

        // Limit too large
        await expect(feedRepo.fetchRandomPosts(user.id, 101)).rejects.toThrow(
          'Limit must be between 1 and 100'
        )
      })

      it('should validate offset parameter', async () => {
        const user = await createTestUser({
          email: 'user@example.com',
          password: 'password123',
          username: 'user',
        })

        const feedRepo = new FeedRepository()

        // Negative offset
        await expect(feedRepo.fetchRandomPosts(user.id, 10, -1)).rejects.toThrow(
          'Offset must be non-negative'
        )
      })

      it('should return empty array when no posts available', async () => {
        const user = await createTestUser({
          email: 'user@example.com',
          password: 'password123',
          username: 'user',
        })

        const feedRepo = new FeedRepository()
        const feed = await feedRepo.fetchRandomPosts(user.id, 10)

        expect(feed).toHaveLength(0)
      })

      it('should randomize post order (statistical test)', async () => {
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

        // Create 10 posts in specific order
        await Promise.all(
          Array.from({ length: 10 }, (_, i) =>
            prisma.post.create({
              data: {
                userId: user2.id,
                content: `Post ${i + 1}`,
              },
            })
          )
        )

        const feedRepo = new FeedRepository()

        // Fetch multiple times and check if order varies
        const feed1 = await feedRepo.fetchRandomPosts(user1.id, 10)
        const feed2 = await feedRepo.fetchRandomPosts(user1.id, 10)

        const order1 = feed1.map(p => p.id)
        const order2 = feed2.map(p => p.id)

        // Orders should be different (with very high probability)
        // Note: This test might occasionally fail due to random nature (1/10! chance)
        expect(order1).not.toEqual(order2)
      })
    })

    describe('getFeedStats', () => {
      it('should return correct feed statistics', async () => {
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

        const user3 = await createTestUser({
          email: 'user3@example.com',
          password: 'password123',
          username: 'user3',
        })

        // Create posts
        await prisma.post.createMany({
          data: [
            { userId: user1.id, content: 'User 1 Post 1' },
            { userId: user2.id, content: 'User 2 Post 1' },
            { userId: user2.id, content: 'User 2 Post 2' },
            { userId: user3.id, content: 'User 3 Post 1' },
          ],
        })

        const feedRepo = new FeedRepository()
        const stats = await feedRepo.getFeedStats(user1.id)

        expect(stats.totalAvailablePosts).toBe(3) // Excludes user1's own post
        expect(stats.totalUsers).toBe(3)
      })
    })
  })
})
