import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { SearchService } from '@/lib/services/search.service';
import { logger } from '@/lib/logger';

const searchService = new SearchService();

/**
 * GET /api/search
 *
 * Search for posts, comments, and profiles
 *
 * Query Parameters:
 * - q: string (required) - Search query
 * - filter: 'top' | 'recent' | 'profiles' (default: 'top')
 * - limit: number (default: 20, max: 100)
 * - offset: number (default: 0)
 *
 * Returns:
 * - 200: { results: SearchResult[], metadata: {...} }
 * - 400: { error: string } - Invalid parameters
 * - 401: { error: string } - Unauthorized
 * - 500: { error: string } - Internal server error
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    logger.apiRequest('GET', '/api/search');

    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      logger.apiError('GET', '/api/search', 'Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const filter = searchParams.get('filter') || 'top';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Validate parameters
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    if (!['top', 'recent', 'profiles'].includes(filter)) {
      return NextResponse.json(
        { error: 'Filter must be one of: top, recent, profiles' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Limit must be between 1 and 100' }, { status: 400 });
    }

    if (offset < 0) {
      return NextResponse.json({ error: 'Offset must be non-negative' }, { status: 400 });
    }

    // Call service layer
    const results = await searchService.search({
      query: query.trim(),
      filter: filter as 'top' | 'recent' | 'profiles',
      limit,
      offset,
      userId: session.user.id,
    });

    const duration = Date.now() - startTime;
    logger.apiSuccess('GET', '/api/search', duration, session.user.id);

    return NextResponse.json(results);
  } catch (error) {
    logger.apiError('GET', '/api/search', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
