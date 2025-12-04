import { describe, it, expect, beforeEach } from 'vitest';
import { SearchRepository } from '@/lib/repositories/search.repository';
import { cleanupDatabase, createTestUser } from '@/tests/helpers/db';
import { prisma } from '@/lib/prisma';

/**
 * Integration tests for SearchRepository
 *
 * Tests PostgreSQL trigram similarity search:
 * - Exact search
 * - Fuzzy search (typo tolerance)
 * - Pagination
 * - Sorting (top vs recent)
 */

describe('SearchRepository', () => {
  let searchRepo: SearchRepository;

  beforeEach(async () => {
    await cleanupDatabase();
    searchRepo = new SearchRepository();
  });

  describe('searchPosts', () => {
    it('should find posts with exact match', async () => {
      const user = await createTestUser({
        email: 'alice@example.com',
        username: 'alice',
        password: 'password123',
      });

      // Create posts with different content
      await prisma.post.create({
        data: {
          userId: user.id,
          content: 'Just deployed my first Next.js app! 🚀',
        },
      });

      await prisma.post.create({
        data: {
          userId: user.id,
          content: 'Learning React is awesome!',
        },
      });

      const { posts, total } = await searchRepo.searchPosts('Next', 'top', 10, 0);

      expect(posts).toHaveLength(1);
      expect(total).toBe(1);
      expect(posts[0].content).toContain('Next.js');
    });

    it('should find posts with fuzzy match (typo tolerance)', async () => {
      const user = await createTestUser({
        email: 'alice@example.com',
        username: 'alice',
        password: 'password123',
      });

      await prisma.post.create({
        data: {
          userId: user.id,
          content: 'Just deployed my first Next.js app! 🚀',
        },
      });

      // Search with typo "Nxt" should still find "Next.js"
      const { posts, total } = await searchRepo.searchPosts('Nxt', 'top', 10, 0);

      expect(posts).toHaveLength(1);
      expect(total).toBe(1);
      expect(posts[0].content).toContain('Next.js');
    });

    it('should return empty results when no matches', async () => {
      const user = await createTestUser({
        email: 'alice@example.com',
        username: 'alice',
        password: 'password123',
      });

      await prisma.post.create({
        data: {
          userId: user.id,
          content: 'Just deployed my first Next.js app! 🚀',
        },
      });

      const { posts, total } = await searchRepo.searchPosts('Python', 'top', 10, 0);

      expect(posts).toHaveLength(0);
      expect(total).toBe(0);
    });

    it('should sort by relevance when filter is "top"', async () => {
      const user = await createTestUser({
        email: 'alice@example.com',
        username: 'alice',
        password: 'password123',
      });

      // Create posts with different relevance scores
      // Shorter match should have higher similarity
      await prisma.post.create({
        data: {
          userId: user.id,
          content: 'React',
        },
      });

      await prisma.post.create({
        data: {
          userId: user.id,
          content: 'React development is awesome with modern tooling',
        },
      });

      const { posts } = await searchRepo.searchPosts('React', 'top', 10, 0);

      expect(posts).toHaveLength(2);
      // Verify sorting by rank DESC - first post should have higher rank
      expect((posts[0] as (typeof posts)[0] & { rank: number }).rank).toBeGreaterThan(
        (posts[1] as (typeof posts)[1] & { rank: number }).rank
      );
      // Exact match should be first
      expect(posts[0].content).toBe('React');
    });

    it('should sort by time when filter is "recent"', async () => {
      const user = await createTestUser({
        email: 'alice@example.com',
        username: 'alice',
        password: 'password123',
      });

      // Create older post
      const olderPost = await prisma.post.create({
        data: {
          userId: user.id,
          content: 'React is great!',
          createdAt: new Date('2024-01-01'),
        },
      });

      // Create newer post (but less relevant)
      const newerPost = await prisma.post.create({
        data: {
          userId: user.id,
          content: 'Started learning React today',
          createdAt: new Date('2024-12-01'),
        },
      });

      const { posts } = await searchRepo.searchPosts('React', 'recent', 10, 0);

      expect(posts).toHaveLength(2);
      // Newer post should be first
      expect(posts[0].id).toBe(newerPost.id);
      expect(posts[1].id).toBe(olderPost.id);
    });

    it('should handle pagination correctly', async () => {
      const user = await createTestUser({
        email: 'alice@example.com',
        username: 'alice',
        password: 'password123',
      });

      // Create 5 posts
      for (let i = 0; i < 5; i++) {
        await prisma.post.create({
          data: {
            userId: user.id,
            content: `Post ${i} about React development`,
          },
        });
      }

      // Get first page (limit 2, offset 0)
      const page1 = await searchRepo.searchPosts('React', 'top', 2, 0);
      expect(page1.posts).toHaveLength(2);
      expect(page1.total).toBe(5);

      // Get second page (limit 2, offset 2)
      const page2 = await searchRepo.searchPosts('React', 'top', 2, 2);
      expect(page2.posts).toHaveLength(2);
      expect(page2.total).toBe(5);

      // Ensure different results
      expect(page1.posts[0].id).not.toBe(page2.posts[0].id);
    });

    it('should include user information in results', async () => {
      const user = await createTestUser({
        email: 'alice@example.com',
        username: 'alice',
        password: 'password123',
      });

      await prisma.post.create({
        data: {
          userId: user.id,
          content: 'Just deployed my first Next.js app! 🚀',
        },
      });

      const { posts } = await searchRepo.searchPosts('Next', 'top', 10, 0);

      expect(posts).toHaveLength(1);
      expect(posts[0].user).toBeDefined();
      expect(posts[0].user.id).toBe(user.id);
      expect(posts[0].user.username).toBe('alice');
    });

    it('should return createdAt and updatedAt as Date objects', async () => {
      const user = await createTestUser({
        email: 'alice@example.com',
        username: 'alice',
        password: 'password123',
      });

      await prisma.post.create({
        data: {
          userId: user.id,
          content: 'Test post for date type check',
        },
      });

      const { posts } = await searchRepo.searchPosts('Test', 'top', 10, 0);

      expect(posts).toHaveLength(1);
      expect(posts[0].createdAt).toBeInstanceOf(Date);
      expect(posts[0].updatedAt).toBeInstanceOf(Date);

      // Verify Date methods work
      expect(posts[0].createdAt.getTime()).toBeGreaterThan(0);
      expect(posts[0].updatedAt.getTime()).toBeGreaterThan(0);
    });
  });
});
