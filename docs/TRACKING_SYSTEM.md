# User Interaction Tracking System

## Overview

The tracking system captures user interactions with posts to power the ML recommendation engine. It supports tracking views, clicks, likes, and shares with rich metadata.

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌─────────────┐
│   User      │─────▶│   Client     │─────▶│  Tracking   │─────▶│  ML Service │
│ Interaction │      │   Batching   │      │     API     │      │   (Python)  │
└─────────────┘      └──────────────┘      └─────────────┘      └─────────────┘
                            │                      │
                            │                      ▼
                            │              ┌─────────────┐
                            └─────────────▶│ PostgreSQL  │
                                           │ (Prisma)    │
                                           └─────────────┘
```

## Features

### 1. Interaction Types

- **view** - Post viewed (tracked via Intersection Observer)
- **click** - Post content clicked
- **like** - Post liked
- **share** - Post shared (copied to clipboard)

### 2. Automatic Batching

- Batches interactions every 5 seconds
- Max 20 interactions per batch
- Auto-flush before page unload
- Reduces API calls by ~95%

### 3. Rich Metadata

Each interaction can include:

- `duration` - Time spent viewing (ms)
- `scroll_depth` - Percentage of post scrolled (0-100)
- `source` - Where interaction occurred ('feed', 'profile', etc.)
- Custom fields for analytics

## Usage

### Client-Side Tracking

#### Track Views (Automatic)

```tsx
import { usePostViewTracking } from '@/hooks/use-post-tracking'

function PostCard({ post }) {
  const postRef = usePostViewTracking({
    postId: post.id,
    threshold: 0.5, // 50% visible
    minDuration: 1000, // 1 second minimum
    source: 'feed',
  })

  return <div ref={postRef}>...</div>
}
```

#### Track Manual Interactions

```tsx
import { trackClick, trackLike, trackShare } from '@/lib/utils/tracking'

function handlePostClick() {
  trackClick(post.id, { source: 'feed' })
}

function handleLike() {
  trackLike(post.id, { source: 'feed' })
}

function handleShare() {
  trackShare(post.id, {
    source: 'feed',
    method: 'clipboard',
  })
}
```

### API Usage

#### Single Interaction

```typescript
POST /api/track
Content-Type: application/json

{
  "post_id": "550e8400-e29b-41d4-a716-446655440000",
  "interaction_type": "view",
  "metadata": {
    "duration": 5000,
    "scroll_depth": 75,
    "source": "feed"
  }
}
```

#### Batch Interactions

```typescript
POST /api/track
Content-Type: application/json

{
  "interactions": [
    {
      "post_id": "550e8400-e29b-41d4-a716-446655440000",
      "interaction_type": "click",
      "metadata": { "source": "feed" }
    },
    {
      "post_id": "550e8400-e29b-41d4-a716-446655440001",
      "interaction_type": "view",
      "metadata": { "duration": 3000, "source": "feed" }
    }
  ]
}
```

#### Response

```json
{
  "success": true,
  "tracked": 2,
  "errors": []
}
```

## Database Schema

```prisma
model UserInteraction {
  id              String    @id @default(uuid())
  userId          String    @map("user_id")
  postId          String    @map("post_id")
  interactionType String    @map("interaction_type")
  metadata        Json?
  createdAt       DateTime  @default(now()) @map("created_at")

  user            User      @relation(...)
  post            Post      @relation(...)

  @@index([userId, createdAt])
  @@index([postId, createdAt])
  @@map("user_interaction")
}
```

## Analytics Queries

### Top Engaged Posts

```typescript
const topPosts = await prisma.userInteraction.groupBy({
  by: ['postId'],
  where: {
    interactionType: { in: ['view', 'click', 'like'] },
    createdAt: { gte: last7Days },
  },
  _count: { id: true },
  orderBy: { _count: { id: 'desc' } },
  take: 10,
})
```

### User Engagement Rate

```typescript
const engagement = await prisma.userInteraction.groupBy({
  by: ['userId', 'interactionType'],
  where: { createdAt: { gte: last30Days } },
  _count: { id: true },
})
```

### Average View Duration

```typescript
const interactions = await prisma.$queryRaw`
  SELECT
    post_id,
    AVG((metadata->>'duration')::int) as avg_duration
  FROM user_interaction
  WHERE interaction_type = 'view'
    AND metadata->>'duration' IS NOT NULL
  GROUP BY post_id
  ORDER BY avg_duration DESC
  LIMIT 10
`
```

## Performance

### Batching Impact

- **Without batching:** 100 interactions = 100 API calls
- **With batching:** 100 interactions = ~5 API calls (95% reduction)

### View Tracking

- Uses native Intersection Observer API
- Minimal performance overhead (<1ms per post)
- Configurable thresholds for optimal UX

### Database

- Indexed on userId, postId, createdAt
- Async writes (non-blocking)
- PostgreSQL JSONB for flexible metadata

## Privacy & Compliance

### Data Collected

- User ID (authenticated users only)
- Post ID
- Interaction type
- Timestamp
- Optional metadata (duration, scroll depth, source)

### Not Collected

- IP addresses
- Device fingerprints
- Location data
- Personal browsing history

### User Controls

- Users can opt out via account settings (TODO)
- Data retention: 90 days (TODO: implement cleanup job)
- GDPR-compliant data export (TODO)

## Testing

### Unit Tests

```bash
npm test -- tests/api/track/route.test.ts
```

### E2E Tests

```bash
npm run test:e2e -- e2e/tracking.spec.ts
```

## Configuration

### Environment Variables

None required - uses existing database connection

### Batching Configuration

Edit `/lib/utils/tracking.ts`:

```typescript
private batchInterval = 5000    // 5 seconds
private maxBatchSize = 20       // 20 interactions
```

### View Tracking Configuration

```typescript
usePostViewTracking({
  threshold: 0.5, // 50% visible to trigger
  minDuration: 1000, // 1s minimum view time
  source: 'feed', // Context for analytics
})
```

## Troubleshooting

### Interactions Not Being Tracked

1. Check browser console for errors
2. Verify user is authenticated
3. Check network tab for `/api/track` requests
4. Verify database connection

### Slow Performance

1. Reduce batch interval if too aggressive
2. Check database indexes
3. Monitor API response times in logs

### Missing Metadata

1. Ensure metadata is valid JSON
2. Check TypeScript types match schema
3. Verify Prisma can serialize to JSONB

## Future Enhancements

- [ ] Real-time analytics dashboard
- [ ] Anomaly detection (bot filtering)
- [ ] A/B test tracking integration
- [ ] Session replay for debugging
- [ ] Heatmap generation
- [ ] Retention cohort analysis

## References

- [Prisma JSONB Documentation](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-json)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [ML Service Integration](../ml-service/README.md)
