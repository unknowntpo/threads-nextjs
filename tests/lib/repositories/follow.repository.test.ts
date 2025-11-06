import { describe, it, expect, beforeEach } from 'vitest'
import { FollowRepository } from '@/lib/repositories/follow.repository'
import { cleanupDatabase, createTestUser } from '@/tests/helpers/db'

/**
 * Integration tests for FollowRepository
 *
 * Tests CRUD operations for follow relationships:
 * - Creating follow relationships
 * - Deleting follow relationships
 * - Checking follow status
 * - Getting follower/following counts
 */

describe('FollowRepository', () => {
  let followRepo: FollowRepository

  beforeEach(async () => {
    await cleanupDatabase()
    followRepo = new FollowRepository()
  })

  describe('create', () => {
    it('should create a follow relationship', async () => {
      const alice = await createTestUser({ email: 'alice@example.com', username: 'alice' })
      const bob = await createTestUser({ email: 'bob@example.com', username: 'bob' })

      const follow = await followRepo.create(alice.id, bob.id)

      expect(follow).toBeDefined()
      expect(follow.followerId).toBe(alice.id)
      expect(follow.followingId).toBe(bob.id)
    })

    it('should fail when following the same user twice', async () => {
      const alice = await createTestUser({ email: 'alice@example.com', username: 'alice' })
      const bob = await createTestUser({ email: 'bob@example.com', username: 'bob' })

      await followRepo.create(alice.id, bob.id)

      // Prisma should throw a unique constraint error
      await expect(followRepo.create(alice.id, bob.id)).rejects.toThrow()
    })
  })

  describe('delete', () => {
    it('should delete a follow relationship', async () => {
      const alice = await createTestUser({ email: 'alice@example.com', username: 'alice' })
      const bob = await createTestUser({ email: 'bob@example.com', username: 'bob' })

      await followRepo.create(alice.id, bob.id)
      await followRepo.delete(alice.id, bob.id)

      const isFollowing = await followRepo.isFollowing(alice.id, bob.id)
      expect(isFollowing).toBe(false)
    })

    it('should fail when deleting non-existent follow', async () => {
      const alice = await createTestUser({ email: 'alice@example.com', username: 'alice' })
      const bob = await createTestUser({ email: 'bob@example.com', username: 'bob' })

      // Prisma should throw not found error
      await expect(followRepo.delete(alice.id, bob.id)).rejects.toThrow()
    })
  })

  describe('isFollowing', () => {
    it('should return true when user is following another', async () => {
      const alice = await createTestUser({ email: 'alice@example.com', username: 'alice' })
      const bob = await createTestUser({ email: 'bob@example.com', username: 'bob' })

      await followRepo.create(alice.id, bob.id)

      const isFollowing = await followRepo.isFollowing(alice.id, bob.id)
      expect(isFollowing).toBe(true)
    })

    it('should return false when user is not following another', async () => {
      const alice = await createTestUser({ email: 'alice@example.com', username: 'alice' })
      const bob = await createTestUser({ email: 'bob@example.com', username: 'bob' })

      const isFollowing = await followRepo.isFollowing(alice.id, bob.id)
      expect(isFollowing).toBe(false)
    })

    it('should be directional (A follows B does not mean B follows A)', async () => {
      const alice = await createTestUser({ email: 'alice@example.com', username: 'alice' })
      const bob = await createTestUser({ email: 'bob@example.com', username: 'bob' })

      await followRepo.create(alice.id, bob.id)

      const aliceFollowsBob = await followRepo.isFollowing(alice.id, bob.id)
      const bobFollowsAlice = await followRepo.isFollowing(bob.id, alice.id)

      expect(aliceFollowsBob).toBe(true)
      expect(bobFollowsAlice).toBe(false)
    })
  })

  describe('getFollowerCount', () => {
    it('should return correct follower count', async () => {
      const alice = await createTestUser({ email: 'alice@example.com', username: 'alice' })
      const bob = await createTestUser({ email: 'bob@example.com', username: 'bob' })
      const charlie = await createTestUser({ email: 'charlie@example.com', username: 'charlie' })

      // Bob and Charlie follow Alice
      await followRepo.create(bob.id, alice.id)
      await followRepo.create(charlie.id, alice.id)

      const followerCount = await followRepo.getFollowerCount(alice.id)
      expect(followerCount).toBe(2)
    })

    it('should return 0 when user has no followers', async () => {
      const alice = await createTestUser({ email: 'alice@example.com', username: 'alice' })

      const followerCount = await followRepo.getFollowerCount(alice.id)
      expect(followerCount).toBe(0)
    })
  })

  describe('getFollowingCount', () => {
    it('should return correct following count', async () => {
      const alice = await createTestUser({ email: 'alice@example.com', username: 'alice' })
      const bob = await createTestUser({ email: 'bob@example.com', username: 'bob' })
      const charlie = await createTestUser({ email: 'charlie@example.com', username: 'charlie' })

      // Alice follows Bob and Charlie
      await followRepo.create(alice.id, bob.id)
      await followRepo.create(alice.id, charlie.id)

      const followingCount = await followRepo.getFollowingCount(alice.id)
      expect(followingCount).toBe(2)
    })

    it('should return 0 when user is not following anyone', async () => {
      const alice = await createTestUser({ email: 'alice@example.com', username: 'alice' })

      const followingCount = await followRepo.getFollowingCount(alice.id)
      expect(followingCount).toBe(0)
    })
  })

  describe('Complex scenarios', () => {
    it('should handle mutual follows correctly', async () => {
      const alice = await createTestUser({ email: 'alice@example.com', username: 'alice' })
      const bob = await createTestUser({ email: 'bob@example.com', username: 'bob' })

      // Mutual follow
      await followRepo.create(alice.id, bob.id)
      await followRepo.create(bob.id, alice.id)

      expect(await followRepo.isFollowing(alice.id, bob.id)).toBe(true)
      expect(await followRepo.isFollowing(bob.id, alice.id)).toBe(true)
      expect(await followRepo.getFollowerCount(alice.id)).toBe(1) // Bob follows Alice
      expect(await followRepo.getFollowingCount(alice.id)).toBe(1) // Alice follows Bob
    })

    it('should update counts correctly when unfollowing', async () => {
      const alice = await createTestUser({ email: 'alice@example.com', username: 'alice' })
      const bob = await createTestUser({ email: 'bob@example.com', username: 'bob' })

      await followRepo.create(alice.id, bob.id)
      expect(await followRepo.getFollowingCount(alice.id)).toBe(1)

      await followRepo.delete(alice.id, bob.id)
      expect(await followRepo.getFollowingCount(alice.id)).toBe(0)
      expect(await followRepo.isFollowing(alice.id, bob.id)).toBe(false)
    })
  })
})
