import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { auth } from '@/auth'
import { FeedRepository } from '@/lib/repositories/feed.repository'
import { mlServiceClient } from '@/lib/services/ml-service'

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

    // Phase 2: Try ML recommendations first, fallback to random
    let posts = []
    let source = 'random'
    let mlRecommendations = null

    // Try to get ML recommendations
    try {
      mlRecommendations = await mlServiceClient.generateRecommendations(
        session.user.id,
        limit,
        [] // exclude_post_ids - can be populated from query params in future
      )
    } catch (error) {
      logger.error('Failed to fetch ML recommendations', { error })
    }

    if (mlRecommendations && mlRecommendations.count > 0) {
      // ML recommendations available - fetch post details
      source = 'ml_recommendations'
      const postIds = mlRecommendations.recommendations.map(r => r.post_id)

      // Fetch posts with counts for recommended post IDs
      const allPosts = await feedRepo.fetchRandomPostsWithCounts(session.user.id, 500, 0)

      // Filter and order by ML recommendations
      const postMap = new Map(allPosts.map(p => [p.id, p]))
      posts = postIds
        .map(id => postMap.get(id))
        .filter(p => p !== undefined)
        .slice(offset, offset + limit)

      logger.info('Using ML recommendations', {
        userId: session.user.id,
        mlCount: mlRecommendations.count,
        postsFound: posts.length,
        modelVersion: mlRecommendations.model_version,
      })
    } else {
      // Fallback to random posts
      posts = await feedRepo.fetchRandomPostsWithCounts(session.user.id, limit, offset)
      logger.info('Using random fallback', {
        userId: session.user.id,
        reason: mlRecommendations ? 'no_recommendations' : 'ml_service_unavailable',
      })
    }

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
        source, // 'ml_recommendations' or 'random'
        modelVersion: mlRecommendations?.model_version,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    logger.apiError('GET', '/api/feeds', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
