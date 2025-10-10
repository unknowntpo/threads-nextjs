import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { auth } from '@/auth'
import { FeedRepository } from '@/lib/repositories/feed.repository'

const feedRepo = new FeedRepository()

/**
 * GET /api/feeds
 *
 * Fetch personalized feed for authenticated user
 * Phase 1: Random post selection
 * Phase 2: Will integrate ML-powered recommendations
 *
 * Query Parameters:
 * - limit: number (default: 50, max: 100) - Number of posts to return
 * - offset: number (default: 0) - Pagination offset
 *
 * Returns:
 * - 200: { posts: PostWithUser[], metadata: {...} }
 * - 400: { error: string } - Invalid query parameters
 * - 401: { error: string } - Unauthorized (no session)
 * - 500: { error: string } - Internal server error
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    logger.apiRequest('GET', '/api/feeds')

    // Authenticate user
    const session = await auth()

    if (!session?.user?.id) {
      logger.apiError('GET', '/api/feeds', 'Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')

    let limit = 50 // default
    let offset = 0 // default

    if (limitParam) {
      limit = parseInt(limitParam, 10)
      if (isNaN(limit) || limit < 1 || limit > 100) {
        logger.apiError('GET', '/api/feeds', 'Invalid limit parameter')
        return NextResponse.json({ error: 'Limit must be between 1 and 100' }, { status: 400 })
      }
    }

    if (offsetParam) {
      offset = parseInt(offsetParam, 10)
      if (isNaN(offset) || offset < 0) {
        logger.apiError('GET', '/api/feeds', 'Invalid offset parameter')
        return NextResponse.json({ error: 'Offset must be non-negative' }, { status: 400 })
      }
    }

    // Fetch random posts with interaction counts (Phase 1 implementation)
    const posts = await feedRepo.fetchRandomPostsWithCounts(session.user.id, limit, offset)

    // Calculate duration for logging
    const duration = Date.now() - startTime
    logger.apiSuccess('GET', '/api/feeds', duration, session.user.id)

    // Return response with metadata
    return NextResponse.json({
      posts,
      metadata: {
        total: posts.length,
        offset,
        limit,
        source: 'random', // Phase 1: always random
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    logger.apiError('GET', '/api/feeds', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
