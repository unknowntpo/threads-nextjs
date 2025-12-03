import { SearchRepository } from '@/lib/repositories/search.repository';
import type { PostWithUser } from '@/lib/repositories/post.repository';

export interface SearchParams {
  query: string;
  filter: 'top' | 'recent' | 'profiles';
  limit: number;
  offset: number;
  userId: string;
}

export interface SearchResult {
  type: 'post' | 'comment' | 'profile';
  score: number;
  data: PostWithUser; // or CommentWithUser | ProfileWithStats in Phase 2
}

export interface SearchResponse {
  results: SearchResult[];
  metadata: {
    total: number;
    count: number;
    offset: number;
    limit: number;
    hasMore: boolean;
    query: string;
    filter: string;
    generatedAt: string;
  };
}

/**
 * SearchService handles search business logic
 * - Validates search parameters
 * - Coordinates repository calls
 * - Transforms data for API response
 */
export class SearchService {
  private searchRepository: SearchRepository;

  constructor() {
    this.searchRepository = new SearchRepository();
  }

  async search(params: SearchParams): Promise<SearchResponse> {
    const { query, filter, limit, offset } = params;

    // Phase 1: Only search posts
    // Phase 2: Add comments and profiles based on filter
    const { posts, total } = await this.searchRepository.searchPosts(
      query,
      filter === 'recent' ? 'recent' : 'top',
      limit,
      offset
    );

    // Transform to SearchResult format
    const results: SearchResult[] = posts.map(post => ({
      type: 'post' as const,
      score: (post as PostWithUser & { rank?: number }).rank || 0, // rank from similarity()
      data: post,
    }));

    return {
      results,
      metadata: {
        total,
        count: results.length,
        offset,
        limit,
        hasMore: offset + results.length < total,
        query,
        filter,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}
