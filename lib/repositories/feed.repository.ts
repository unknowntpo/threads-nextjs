import { prisma } from '@/lib/prisma'
import type { PostWithUser } from './post.repository'

/**
 * FeedRepository handles personalized feed recommendations
 * Phase 1: Simple random selection with Fisher-Yates shuffle
 * Phase 2: Will integrate with pre-computed ML recommendations
 */
export class FeedRepository {
  /**
   * Fetch random posts for user's personalized feed
   * - Excludes user's own posts
   * - Random shuffle using Fisher-Yates algorithm
   * - Includes user information for display
   *
   * @param userId - Current user's ID
   * @param limit - Maximum number of posts to return (default: 50)
   * @param offset - Pagination offset (default: 0)
   * @returns Array of posts with user information
   */
  async fetchRandomPosts(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PostWithUser[]> {
    // Validate inputs
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100')
    }
    if (offset < 0) {
      throw new Error('Offset must be non-negative')
    }

    // Fetch posts excluding user's own posts
    // We fetch more than needed to ensure enough posts after shuffle
    const fetchSize = Math.min(limit * 3, 500) // Fetch 3x or 500 max

    const allPosts = await prisma.post.findMany({
      where: {
        userId: {
          not: userId, // Exclude own posts
        },
      },
      take: fetchSize,
      orderBy: { createdAt: 'desc' }, // Start with recent posts
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
    })

    // Apply Fisher-Yates shuffle for randomization
    const shuffled = this.shuffleArray(allPosts)

    // Apply pagination
    const paginated = shuffled.slice(offset, offset + limit)

    return paginated
  }

  /**
   * Fisher-Yates shuffle algorithm
   * Performs in-place random permutation of array elements
   *
   * Time Complexity: O(n)
   * Space Complexity: O(1)
   *
   * Algorithm:
   * For i from n−1 down to 1:
   *   j ← random integer in [0, i]
   *   swap array[i] and array[j]
   *
   * @param array - Array to shuffle
   * @returns Shuffled array (in-place mutation)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array] // Create copy to avoid mutating original

    for (let i = result.length - 1; i > 0; i--) {
      // Generate random index from 0 to i
      const j = Math.floor(Math.random() * (i + 1))

      // Swap elements at i and j
      ;[result[i], result[j]] = [result[j], result[i]]
    }

    return result
  }

  /**
   * Fetch feed statistics for debugging/monitoring
   *
   * @param userId - Current user's ID
   * @returns Feed statistics
   */
  async getFeedStats(userId: string): Promise<{
    totalAvailablePosts: number
    totalUsers: number
  }> {
    const [totalAvailablePosts, totalUsers] = await Promise.all([
      prisma.post.count({
        where: {
          userId: {
            not: userId,
          },
        },
      }),
      prisma.user.count(),
    ])

    return {
      totalAvailablePosts,
      totalUsers,
    }
  }
}
