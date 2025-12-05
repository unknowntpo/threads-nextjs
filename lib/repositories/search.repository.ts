import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import type { PostWithUser } from './post.repository';

/**
 * SearchRepository handles database queries for search
 * - PostgreSQL trigram similarity search
 * - Returns posts with user information
 */
export class SearchRepository {
  /**
   * Search posts using PostgreSQL trigram similarity
   *
   * @param query - Search query string
   * @param filter - 'top' (by relevance) or 'recent' (by time)
   * @param limit - Maximum number of results
   * @param offset - Pagination offset
   * @returns Posts matching query with total count
   */
  async searchPosts(
    query: string,
    filter: 'top' | 'recent',
    limit: number,
    offset: number
  ): Promise<{ posts: PostWithUser[]; total: number }> {
    // Lower threshold (0.05) for better typo tolerance
    const threshold = 0.05;

    // Build ORDER BY clause based on filter
    const orderByClause = filter === 'top' ? Prisma.sql`rank DESC` : Prisma.sql`p.created_at DESC`;

    const [posts, totalResult] = await Promise.all([
      prisma.$queryRaw<PostWithUser[]>`
        SELECT
          p.*,
          json_build_object(
            'id', u.id,
            'username', u.username,
            'displayName', u.display_name,
            'avatarUrl', u.avatar_url
          ) as user,
          similarity(p.content, ${query}) as rank
        FROM post p
        INNER JOIN "user" u ON p.user_id = u.id
        WHERE similarity(p.content, ${query}) > ${threshold}
        ORDER BY ${orderByClause}
        LIMIT ${limit}
        OFFSET ${offset}
      `,

      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM post p
        WHERE similarity(p.content, ${query}) > ${threshold}
      `,
    ]);

    // Convert snake_case timestamp fields to camelCase Date objects
    // $queryRaw returns PostgreSQL columns as-is (created_at, updated_at as strings)
    type RawPost = PostWithUser & { created_at: string; updated_at: string };

    return {
      posts: posts.map((post: RawPost) => ({
        ...post,
        createdAt: new Date(post.created_at),
        updatedAt: new Date(post.updated_at),
      })),
      total: Number(totalResult[0].count),
    };
  }
}
