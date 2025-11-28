# Epic: Post, Comments and Profiles search

**Status:** 📋 Planned
**Priority:** High - Prerequisite of recommendation system.
**Effort:** TBD

## Goal

Search for interested post and comments with full-text search.

## Deliverable

User can search interested posts and comments.

## Implementation Plan

### Phase 1: Posts Search (MVP)

#### 1. Database Setup

- [ ] Enable `pg_trgm` extension in PostgreSQL
  - [ ] Run: `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
- [ ] Create trigram index on `Post.content` column (non-blocking)
  - [ ] Run migration: `CREATE INDEX CONCURRENTLY post_content_trgm_idx ON "Post" USING GIN(content gin_trgm_ops);`
  - [ ] Note: Use `CONCURRENTLY` to avoid blocking reads/writes (takes longer but safe for production)
  - [ ] Monitor index creation progress: `SELECT * FROM pg_stat_progress_create_index;`
- [ ] Verify index creation
  - [ ] Check index exists: `\d "Post"` or `SELECT indexname FROM pg_indexes WHERE tablename = 'Post';`
- [ ] Test fuzzy search queries manually in psql

#### 2. Backend Implementation (Clean Architecture)

- [ ] **Layer 3: Repository**
  - [ ] Create `lib/repositories/search.repository.ts`
  - [ ] Implement `SearchRepository` class
  - [ ] Implement `searchPosts()` method with trigram similarity
  - [ ] Add unit tests for repository
    - [ ] Test exact search
    - [ ] Test fuzzy search (typo tolerance)
    - [ ] Test pagination
    - [ ] Test threshold boundary cases
- [ ] **Layer 2: Service**
  - [ ] Create `lib/services/search.service.ts`
  - [ ] Implement `SearchService` class
  - [ ] Define interfaces: `SearchParams`, `SearchResult`, `SearchResponse`
  - [ ] Implement `search()` method
  - [ ] Add unit tests for service
    - [ ] Test parameter validation
    - [ ] Test data transformation
    - [ ] Test filter logic (top vs recent)
- [ ] **Layer 1: API Route**
  - [ ] Create `app/api/search/route.ts`
  - [ ] Implement `GET /api/search` handler
  - [ ] Add authentication check
  - [ ] Add parameter validation
  - [ ] Add error handling with proper HTTP status codes
  - [ ] Add logger integration
  - [ ] Add API integration tests
    - [ ] Test valid requests
    - [ ] Test missing query parameter
    - [ ] Test invalid filter values
    - [ ] Test pagination edge cases
    - [ ] Test unauthorized access

#### 3. Testing

- [ ] **Unit Tests**
  - [ ] SearchRepository tests (coverage > 80%)
  - [ ] SearchService tests (coverage > 80%)
  - [ ] API route tests
- [ ] **Integration Tests**
  - [ ] Search with results
  - [ ] Search with no results
  - [ ] Search with typos ("coscto" → "costco")
  - [ ] Multi-word search ("costco deals")
  - [ ] Pagination (limit/offset)
  - [ ] Sort by relevance (top)
  - [ ] Sort by time (recent)
- [ ] **E2E Tests**
  - [ ] User clicks search icon in sidebar
  - [ ] User types query and presses Enter
  - [ ] Results display correctly
  - [ ] Tab switching (Top/Recent)
  - [ ] Infinite scroll loads more results
  - [ ] Empty state when no results

#### 4. Frontend Implementation

- [ ] Create search UI components
  - [ ] Search input component
  - [ ] Search results list (reuse feed components)
  - [ ] Tab switcher (Top/Recent/Profiles)
  - [ ] Empty state component
- [ ] Implement search page/route
- [ ] Add infinite scroll
- [ ] Add loading states
- [ ] Add error handling

#### 5. Documentation

- [ ] Update API documentation
- [ ] Add code comments
- [ ] Update README with search feature

### Phase 2: Comments & Profiles Search

- [ ] Add `Comment` table trigram index
- [ ] Add `User` table trigram index (username, displayName, bio)
- [ ] Extend `SearchRepository` with:
  - [ ] `searchComments()` method
  - [ ] `searchProfiles()` method
- [ ] Update `SearchService` to handle multiple types
- [ ] Update API response to support union types
- [ ] Add tests for comments search
- [ ] Add tests for profiles search
- [ ] Update frontend to display different result types

### Phase 3: Elasticsearch Migration (Future)

- [ ] Set up Elasticsearch instance
- [ ] Create single index: `threads_search`
- [ ] Implement data sync (PostgreSQL → Elasticsearch)
  - [ ] Bulk initial sync
  - [ ] Real-time updates on create/update/delete
- [ ] Migrate search queries to Elasticsearch
- [ ] A/B test performance vs PostgreSQL
- [ ] Monitor and optimize

## Documentation

## Architecture

```bash
# Phase 1: PostgreSQL Full-Text Search
fe -> be -> pg
        (FTS)

# Future (Phase 3): Elasticsearch (if needed)
fe -> be -> es -> pg
           ↓
      (search index)
```

### Components

- **Frontend**: Search UI with tabs (Top/Recent/Profiles)
- **Backend**: Next.js API routes (`/api/search`)
- **PostgreSQL**: Source of truth + full-text search (using `tsvector`)
- **Elasticsearch** (Future): Optional upgrade for advanced search features

### Data Flow

**Phase 1 (Current):**

- Frontend → Backend → PostgreSQL FTS → Return results

**Phase 3 (Future):**

- Write Path: PostgreSQL → Elasticsearch (index sync)
- Search Path: Frontend → Backend → Elasticsearch → Return results

## Workflow

Context: user want to search posts and comments based on 'Costco'

### User Flow

1. User clicks 🔍 Search icon in left sidebar
2. Middle feed view switches to Search view
3. User types "Costco" in search input
4. Backend performs full-text search on posts/comments
5. Results displayed in feed format

### ASCII Diagram

**STATE 1: Before Search (Initial Click)**

```
┌─────────────────────────────────────────────────────────────────┐
│  Threads App Layout                                             │
├──────────┬────────────────────────────────────┬─────────────────┤
│          │                                    │                 │
│ SIDEBAR  │         MAIN FEED AREA             │  RIGHT PANEL    │
│          │                                    │   (Optional)    │
│          │                                    │                 │
│ [🏠 Home]│  ┌──────────────────────────────┐  │                 │
│          │  │  ← Back                      │  │                 │
│ [🔍Search]◄─►│                              │  │                 │
│    ↑     │  │  ┌────────────────────────┐  │  │                 │
│  CLICKED │  │  │ 🔍 Search...          │  │  │                 │
│          │  │  └────────────────────────┘  │  │                 │
│ [✏️ Post]│  │                              │  │                 │
│          │  │                              │  │                 │
│ [👤Profile]│ │  (Empty - No search yet)    │  │                 │
│          │  │                              │  │                 │
│          │  │                              │  │                 │
│          │  └──────────────────────────────┘  │                 │
│          │                                    │                 │
└──────────┴────────────────────────────────────┴─────────────────┘
```

**STATE 2: After Search (User types "Costco" + Enter)**

```
┌─────────────────────────────────────────────────────────────────┐
│  Threads App Layout                                             │
├──────────┬────────────────────────────────────┬─────────────────┤
│          │                                    │                 │
│ SIDEBAR  │         MAIN FEED AREA             │  RIGHT PANEL    │
│          │                                    │   (Optional)    │
│          │                                    │                 │
│ [🏠 Home]│  ┌──────────────────────────────┐  │                 │
│          │  │  ← Costco              ⋮    │  │                 │
│ [🔍Search]│  ├──────────────────────────────┤  │                 │
│ (active) │  │  Top  │ Recent │ Profiles  │  │                 │
│          │  ├───────┴────────┴────────────┤  │                 │
│ [✏️ Post]│  └──────────────────────────────┘  │                 │
│          │                                    │                 │
│ [👤Profile]│ ┌──────────────────────────────┐  │                 │
│          │  │ 👤 cocowine0205    6d    ⋮  │  │                 │
│          │  │ 💙好市多本週特價商品11/17~11/23  │  │                 │
│          │  │ ...黑五前哨戰！趁人潮湧進前看...│  │                 │
│          │  │ #costco #好市多特價          │  │                 │
│          │  │ [Image: Costco products]    │  │                 │
│          │  │ ❤️ 315  💬 1  🔁  ✈️ 818    │  │                 │
│          │  └──────────────────────────────┘  │                 │
│          │                                    │                 │
│          │  ┌──────────────────────────────┐  │                 │
│          │  │ 👤 bonnie001014 > 好市多黑五 │  │                 │
│          │  │ 好市多黑色購物節              │  │                 │
│          │  │ 買場隱藏優惠來嘍...            │  │                 │
│          │  │ #好市多黑五 #好市多 #costco   │  │                 │
│          │  │ [Image: Black Friday deals] │  │                 │
│          │  └──────────────────────────────┘  │                 │
│          │                                    │                 │
│          │         (scroll for more...)       │                 │
│          │                                    │                 │
└──────────┴────────────────────────────────────┴─────────────────┘
```

**FLOW:**

1. User clicks [🔍Search] in sidebar → Empty search view appears
2. User types "Costco" in search input
3. User presses Enter
4. Top bar displays: `← Costco` with tabs (Top/Recent/Profiles)
5. Frontend sends: `GET /api/search?q=Costco&filter=top`
6. Backend queries: PostgreSQL full-text search on posts table
7. Results rendered as post cards (reusing feed components)
8. User can toggle between Top/Recent/Profiles tabs
9. When user scroll down, results should be loaded automatically (infinite scroll)

## Backend API Specification

### Clean Architecture Pattern

Following the pattern from `@/lib/repositories/feed.repository.ts`:

```
API Route → Service → Repository → Database
```

### Endpoint

```
GET /api/search?q={query}&filter={filter}&limit={limit}&offset={offset}
```

### Query Parameters

| Parameter | Type   | Default  | Description                           |
| --------- | ------ | -------- | ------------------------------------- |
| `q`       | string | required | Search query keyword                  |
| `filter`  | string | `top`    | One of: `top`, `recent`, `profiles`   |
| `limit`   | number | `20`     | Results per page (max: 100)           |
| `offset`  | number | `0`      | Pagination offset for infinite scroll |

### Response Format

```typescript
{
  "results": [
    {
      "type": "post",           // post | comment | profile
      "score": 0.95,            // similarity score (0-1)
      "data": {
        ...PostWithUser         // from @/lib/repositories/post.repository
      }
    },
    {
      "type": "comment",        // Phase 2
      "score": 0.87,
      "data": {
        ...CommentWithUserAndPost
      }
    },
    {
      "type": "profile",        // Phase 2
      "score": 0.72,
      "data": {
        ...ProfileWithStats
      }
    }
  ],
  "metadata": {
    "total": 156,               // total matching results
    "count": 20,                // results in this response
    "offset": 0,
    "limit": 20,
    "hasMore": true,            // for infinite scroll
    "query": "costco",
    "filter": "top",
    "generatedAt": "2025-11-27T..."
  }
}
```

### Feature Phases

- **Phase 1**: Posts only with PostgreSQL Trigram Search (`filter=top|recent`)
- **Phase 2**: Add comments and profiles
- **Phase 3** (Future): Migrate to Elasticsearch if needed (better relevance, advanced features)

---

## Backend Implementation (Clean Architecture)

### Layer 1: API Route

**File**: `app/api/search/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { SearchService } from '@/lib/services/search.service';
import { logger } from '@/lib/logger';

const searchService = new SearchService();

/**
 * GET /api/search
 * Search for posts, comments, and profiles
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
```

### Layer 2: Service Layer

**File**: `lib/services/search.service.ts`

```typescript
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
      score: (post as any).rank || 0, // rank from similarity()
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
```

### Layer 3: Repository Layer

**File**: `lib/repositories/search.repository.ts`

```typescript
import { prisma } from '@/lib/prisma';
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

    const [posts, total] = await Promise.all([
      prisma.$queryRaw<PostWithUser[]>`
        SELECT
          p.*,
          u.id as "user.id",
          u.username as "user.username",
          u."displayName" as "user.displayName",
          u."avatarUrl" as "user.avatarUrl",
          similarity(p.content, ${query}) as rank
        FROM "Post" p
        INNER JOIN "User" u ON p."userId" = u.id
        WHERE similarity(p.content, ${query}) > ${threshold}
        ORDER BY ${filter === 'top' ? 'rank DESC' : 'p."createdAt" DESC'}
        LIMIT ${limit}
        OFFSET ${offset}
      `,

      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM "Post" p
        WHERE similarity(p.content, ${query}) > ${threshold}
      `,
    ]);

    return {
      posts,
      total: Number(total[0].count),
    };
  }
}
```

---

## PostgreSQL Fuzzy Search Design

### Database Schema Changes

Add `tsvector` column to `Post` table for full-text search:

```sql
-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram index on content column
-- Use CONCURRENTLY to avoid blocking reads/writes (production-safe)
CREATE INDEX CONCURRENTLY post_content_trgm_idx ON "Post" USING GIN(content gin_trgm_ops);

-- For development/local (faster, but blocks table):
-- CREATE INDEX post_content_trgm_idx ON "Post" USING GIN(content gin_trgm_ops);
```

### Index Creation: Production vs Development

**Production (use CONCURRENTLY):**

```sql
CREATE INDEX CONCURRENTLY post_content_trgm_idx ON "Post" USING GIN(content gin_trgm_ops);
```

**Pros:**

- ✅ No blocking - reads/writes continue during index creation
- ✅ Safe for production
- ✅ Zero downtime

**Cons:**

- ⏱️ Takes 2-3x longer to complete
- 💾 Requires more disk space temporarily (2x index size)
- ⚠️ If it fails mid-way, creates an INVALID index (must drop and retry)

**Development/Local (without CONCURRENTLY):**

```sql
CREATE INDEX post_content_trgm_idx ON "Post" USING GIN(content gin_trgm_ops);
```

**Pros:**

- ✅ Faster (1-2 minutes for 100K rows)
- ✅ Can run in transaction
- ✅ Atomic (all or nothing)

**Cons:**

- ❌ Blocks all reads/writes to `Post` table during creation
- ❌ NOT safe for production

### Monitoring Index Creation Progress

```sql
-- Check progress (PostgreSQL 12+)
SELECT
  phase,
  round(100.0 * blocks_done / nullif(blocks_total, 0), 1) AS "% complete",
  blocks_done,
  blocks_total
FROM pg_stat_progress_create_index;

-- Verify index is valid after creation
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename = 'Post' AND indexname = 'post_content_trgm_idx';

-- Check for INVALID indexes (from failed CONCURRENT creation)
SELECT indexrelid::regclass AS index_name, indisvalid
FROM pg_index
WHERE indrelid = '"Post"'::regclass AND NOT indisvalid;
```

### If CONCURRENT Index Creation Fails

```sql
-- Drop invalid index
DROP INDEX CONCURRENTLY IF EXISTS post_content_trgm_idx;

-- Retry creation
CREATE INDEX CONCURRENTLY post_content_trgm_idx ON "Post" USING GIN(content gin_trgm_ops);
```

**Note**: The repository implementation is shown above in Layer 3: Repository Layer section.

### Query Examples

**1. Search posts (Top by relevance)**

```sql
SELECT
  p.*,
  similarity(p.content, 'costco') as score
FROM "Post" p
WHERE similarity(p.content, 'costco') > 0.05
ORDER BY score DESC
LIMIT 20 OFFSET 0;
```

**2. Search posts (Recent)**

```sql
SELECT p.*
FROM "Post" p
WHERE similarity(p.content, 'costco') > 0.05
ORDER BY p."createdAt" DESC
LIMIT 20 OFFSET 0;
```

**3. Multi-word search**

```sql
-- Searches for posts containing both words
SELECT
  p.*,
  similarity(p.content, 'costco deals') as score
FROM "Post" p
WHERE similarity(p.content, 'costco deals') > 0.05
ORDER BY score DESC;
```

**4. Fuzzy search for typos (e.g., "coscto" → "costco")**

```sql
-- This will still find "costco" posts even with typo!
SELECT
  p.*,
  similarity(p.content, 'coscto') as score
FROM "Post" p
WHERE similarity(p.content, 'coscto') > 0.05
ORDER BY score DESC;
```

### Why PostgreSQL FTS First?

**Pros:**

- ✅ No additional infrastructure
- ✅ ACID guarantees (no sync issues)
- ✅ Simple to implement
- ✅ Good enough for 10K-100K posts
- ✅ Free (included in PostgreSQL)

**Cons (migrate to ES when you hit these):**

- ⚠️ No word stemming ("running" won't match "run")
- ⚠️ No stop word removal (searches "the", "a", etc.)
- ❌ Limited language analyzers
- ❌ Slower at scale (100K+ posts)

### Testing PostgreSQL Fuzzy Search (Manual Demo)

#### Step 1: Create Test Table

Connect to your PostgreSQL database and run:

```sql
-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create test posts table
CREATE TABLE test_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  username VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create trigram index for fuzzy search
CREATE INDEX test_posts_content_trgm_idx ON test_posts USING GIN(content gin_trgm_ops);
```

#### Step 2: Insert Sample Data

```sql
-- Insert test posts
INSERT INTO test_posts (user_id, username, content) VALUES
(1, 'cocowine0205', '💙好市多本週特價商品11/17~11/23 黑五前哨戰！趁人潮湧進前看看有哪些好康！ #costco #好市多特價'),
(2, 'bonnie001014', '好市多黑色購物節 買場隱藏優惠來嘍 #好市多黑五 #好市多 #costco'),
(3, 'john_doe', 'Just got back from Costco! The rotisserie chicken is always amazing.'),
(4, 'jane_smith', 'Does anyone know if Costco has good deals on laptops?'),
(5, 'mike_wilson', 'I love shopping at Target, they have better prices than Walmart.'),
(6, 'sarah_lee', 'Costco membership totally worth it! Saved $500 this year.'),
(7, 'alex_brown', 'The Costco pizza is the best deal ever. $9.99 for a huge pizza!'),
(8, 'emily_davis', 'Anyone going to Costco this weekend? Need to stock up on groceries.'),
(9, 'chris_martin', 'Just bought a new TV from Best Buy, great Black Friday deal!'),
(10, 'lisa_taylor', 'Costco has the best return policy. No questions asked!');

-- Verify data inserted
SELECT id, username, LEFT(content, 50) as content_preview
FROM test_posts;
```

#### Step 3: Run Search Queries

**Search for "costco" (Top by relevance):**

```sql
SELECT
  id,
  username,
  content,
  similarity(content, 'costco') as score
FROM test_posts
WHERE similarity(content, 'costco') > 0.05
ORDER BY score DESC;
```

**Expected results (ordered by relevance):**

```
 id |   username   |                                           content                                           |    score
----+--------------+---------------------------------------------------------------------------------------------+-------------
  2 | bonnie001014 | 好市多黑色購物節 買場隱藏優惠來嘍 #好市多黑五 #好市多 #costco                               |           1
  1 | cocowine0205 | 💙好市多本週特價商品11/17~11/23 黑五前哨戰！趁人潮湧進前看看有哪些好康！ #costco #好市多特價 |  0.46666667
 11 | test_user    | Costco has amazing prices on electronics!                                                   |  0.17073171
  7 | alex_brown   | The Costco pizza is the best deal ever. $9.99 for a huge pizza!                             |        0.14
  4 | jane_smith   | Does anyone know if Costco has good deals on laptops?                                       |  0.13461539
 10 | lisa_taylor  | Costco has the best return policy. No questions asked!                                      |  0.13461539
  6 | sarah_lee    | Costco membership totally worth it! Saved $500 this year.                                   |  0.12962963
  8 | emily_davis  | Anyone going to Costco this weekend? Need to stock up on groceries.                         | 0.114754096
  3 | john_doe     | Just got back from Costco! The rotisserie chicken is always amazing.                        |  0.10769231
```

**Search for "costco" (Recent):**

```sql
SELECT
  id,
  username,
  content,
  created_at
FROM test_posts
WHERE similarity(content, 'costco') > 0.05
ORDER BY created_at DESC
LIMIT 5;
```

**Multi-word search ("costco deals"):**

```sql
SELECT
  id,
  username,
  content,
  similarity(content, 'costco deals') as score
FROM test_posts
WHERE similarity(content, 'costco deals') > 0.05
ORDER BY score DESC;
```

**Fuzzy search for typos (e.g., "coscto" instead of "costco"):**

```sql
-- This will still find "costco" posts even with typo!
SELECT
  id,
  username,
  content,
  similarity(content, 'coscto') as fuzzy_score
FROM test_posts
WHERE similarity(content, 'coscto') > 0.05
ORDER BY fuzzy_score DESC;
```

**Expected results (finds posts with "costco" despite typo):**

```
 id |   username   |                         content                          | fuzzy_score
----+--------------+----------------------------------------------------------+-------------
  2 | bonnie001014 | 好市多黑色購物節 買場隱藏優惠來嘍 #好市多黑五 #好市多 #costco | 0.27272728
  1 | cocowine0205 | 💙好市多本週特價商品11/17~11/23... #costco #好市多特價    | 0.15789473
 11 | test_user    | Costco has amazing prices on electronics!                | 0.06666667
  8 | emily_davis  | Anyone going to Costco this weekend? Need to stock up...  | 0.0625
  7 | alex_brown   | The Costco pizza is the best deal ever. $9.99 for a...  | 0.055555556
```

**Expected results:**

```
 id |  username  |                      content                       |  score
----+------------+----------------------------------------------------+--------
  4 | jane_smith | Does anyone know if Costco has good deals...       | 0.25
```

**Search with pagination:**

```sql
-- Get total count
SELECT COUNT(*) as total
FROM test_posts
WHERE similarity(content, 'costco') > 0.05;

-- Get page 1 (limit 3, offset 0)
SELECT
  id,
  username,
  LEFT(content, 40) as content,
  similarity(content, 'costco') as score
FROM test_posts
WHERE similarity(content, 'costco') > 0.05
ORDER BY score DESC
LIMIT 3 OFFSET 0;

-- Get page 2 (limit 3, offset 3)
SELECT
  id,
  username,
  LEFT(content, 40) as content,
  similarity(content, 'costco') as score
FROM test_posts
WHERE similarity(content, 'costco') > 0.05
ORDER BY score DESC
LIMIT 3 OFFSET 3;
```

#### Step 4: Test Insert & Update

```sql
-- Insert new post
INSERT INTO test_posts (user_id, username, content)
VALUES (11, 'test_user', 'Costco has amazing prices on electronics!');

-- Search should find the new post
SELECT id, username, content, similarity(content, 'costco') as score
FROM test_posts
WHERE similarity(content, 'costco') > 0.05
ORDER BY created_at DESC
LIMIT 1;

-- Test fuzzy search on new post (with typo)
SELECT id, username, content, similarity(content, 'coscto') as score
FROM test_posts
WHERE similarity(content, 'coscto') > 0.05
ORDER BY created_at DESC
LIMIT 1;
```

```sql
-- Update a post
UPDATE test_posts
SET content = 'I love Costco! Best wholesale store ever!'
WHERE id = 1;

-- Verify search works with updated content
SELECT id, username, content, similarity(content, 'wholesale') as score
FROM test_posts
WHERE similarity(content, 'wholesale') > 0.05
ORDER BY score DESC;

-- Verify fuzzy search works on updated content (typo: "whosale")
SELECT id, username, content, similarity(content, 'whosale') as score
FROM test_posts
WHERE similarity(content, 'whosale') > 0.05
ORDER BY score DESC;
```

#### Step 5: Cleanup

```sql
-- Drop test table when done
DROP TABLE IF EXISTS test_posts CASCADE;
```

#### Connection Command

```bash
# Connect to your local PostgreSQL database
psql -U threads_user -d threads_db -h localhost -p 5432

# Or using DATABASE_URL from .env.local
psql "postgresql://threads_user:threads_password@localhost:5432/threads_db"
```

## Testing Strategy

### Unit Tests

- **Frontend**:
  - Search input component
  - Tab switching (Top/Recent/Profiles)
  - Result rendering (reuse feed components)

- **Backend**:
  - API param validation
    - Valid params: `q`, `filter`, `limit`, `offset`
    - Invalid params: missing `q`, invalid `filter`
  - ES query builder logic
  - Response formatting

### Integration Tests

- **Backend → PostgreSQL Trigram Search**:
  - Search with results
  - Fuzzy search (typo tolerance: "coscto" → "costco")
  - Search with no results
  - Pagination (offset/limit)
  - Multi-word queries ("costco deals")
  - Sort by relevance (top) vs. time (recent)

- **Database**:
  - GIN index on content (trigram)
  - `similarity()` scoring
  - pg_trgm extension for fuzzy matching
  - Threshold tuning (0.05 default for typo tolerance)
    - Lower (0.03) = more results, more false positives
    - Higher (0.1) = fewer results, better precision

### E2E Tests

Full workflow

- search
  - clicking Top/Recent/Profiles
  - Infinite scrolling behavior.

### Future plans
