# Epic: ML-Powered Personalized Feed 🤖

**Status:** ✅ Core Complete
**Priority:** Medium - Enhances user engagement
**Effort:** ~132 hours (estimated) / ~20 hours (actual core work)

## Goal

Build complete MLOps cycle for ML-based recommendation system using collaborative filtering.

## Deliverable

FastAPI ML service with user-based collaborative filtering integrated into Next.js feed with intelligent interaction tracking.

## Documentation

- Architecture: [ML_RECOMMENDATION_SYSTEM.md](../docs/ML_RECOMMENDATION_SYSTEM.md)
- Implementation Phases: [ML_IMPLEMENTATION_PHASES.md](../docs/ML_IMPLEMENTATION_PHASES.md)
- Tracking System: [TRACKING_SYSTEM.md](../docs/TRACKING_SYSTEM.md)

## What's Complete ✅

### Backend

✅ **Interaction Tracking API** (`app/api/track/route.ts`)

- POST endpoint for tracking user interactions
- Supports single and batch tracking
- Interaction types: view, click, like, share
- Optimistic validation and error handling

✅ **Feed API with ML Integration** (`app/api/feeds/route.ts`)

- GET endpoint with ML recommendations
- Fallback to random posts when ML unavailable
- Pagination support (offset-based)
- Current user filtering (excludes own posts)

✅ **Database Migrations**

- `user_interactions` table
  - Tracks all user-post interactions
  - Indexed on (user_id, post_id, interaction_type, created_at)
- `user_recommendations` table
  - Stores ML-generated recommendations
  - Includes relevance scores and metadata

### Frontend

✅ **Post View Tracking Hook** (`hooks/use-post-tracking.ts`)

- IntersectionObserver-based view tracking
- Configurable threshold (50% visible) and duration (1s)
- Automatic cleanup on unmount
- Source tracking (feed, profile, etc.)

✅ **Tracking Service** (`lib/utils/tracking.ts`)

- Auto-batching (5s interval, max 20 items)
- 95% API call reduction
- Retry logic for failed requests
- Type-safe interaction tracking functions:
  - `trackView(postId, metadata)`
  - `trackClick(postId, metadata)`
  - `trackLike(postId, metadata)`
  - `trackShare(postId, metadata)`

✅ **Component Integration**

- PostCard uses `usePostViewTracking()`
- Click tracking on post content
- Like tracking on like button
- Share tracking on share button

### ML Service

✅ **Collaborative Filtering Model**

- User-based collaborative filtering
- K-Nearest Neighbors (KNN) with cosine similarity
- Handles cold start problem
- Returns top-N recommendations

✅ **FastAPI Service** (`ml-service/`)

- `/api/recommendations/{user_id}` endpoint
- MLflow experiment tracking
- Health check endpoint
- CORS configuration for Next.js

✅ **Model Training**

- Trains on user_interactions data
- Creates user-item interaction matrix
- Computes user similarities
- Stores recommendations in database

## Testing

### Unit Tests (9/9 passing)

✅ **Tracking Service Tests**

1. Batching behavior (5s interval, max 20 items)
2. Flush on max batch size
3. Retry logic on failure
4. Type-specific tracking functions

✅ **ML Model Tests**

1. Collaborative filtering algorithm
2. Cold start handling
3. Recommendation ranking
4. User similarity computation

### E2E Tests (2/3 passing, 1 skipped)

✅ **Feed Tests**

1. User interactions tracked (view, click, like, share)
2. Tracking batched efficiently

⏸️ **Flaky Tests** (skipped)

1. ML recommendations test (intermittent failures)

## Performance Metrics

**Before Batching:**

- ~100 API calls per feed page load
- High server load

**After Batching:**

- ~5 API calls per feed page load
- 95% reduction in API calls
- Improved user experience (no lag)

## What's Pending ⏳

### Deployment

- [ ] Docker Compose setup for ML service
- [ ] Production deployment (GCP/K8s)
- [ ] Environment configuration
- [ ] Health monitoring

### Model Training

- [ ] Automated retraining pipeline
- [ ] Dagster integration (or cron job)
- [ ] Model versioning
- [ ] A/B testing framework

### Optimization

- [ ] Caching layer (Redis)
- [ ] Batch processing for recommendations
- [ ] Database query optimization
- [ ] pgBouncer for connection pooling
- [ ] Read replicas for scaling

### Monitoring

- [ ] Tracking metrics dashboard
- [ ] ML model performance metrics
- [ ] Recommendation quality scores
- [ ] User engagement analytics

## Technical Decisions

### Why Collaborative Filtering?

- **Simplicity**: Easy to implement and understand
- **Effective**: Proven approach for recommendation systems
- **No content needed**: Works with interaction data only
- **Cold start handling**: Graceful degradation to random recommendations

### Why Batching?

- **Performance**: 95% reduction in API calls
- **User experience**: No visible lag from tracking
- **Server efficiency**: Reduced database writes
- **Network optimization**: Fewer HTTP requests

### Why IntersectionObserver?

- **Native API**: No additional libraries needed
- **Performance**: Efficient viewport detection
- **Configurable**: Threshold and duration controls
- **Automatic**: Works without user intervention

### Why FastAPI?

- **Modern**: Async support, type hints
- **Fast**: High performance Python framework
- **Documentation**: Auto-generated API docs
- **Integration**: Easy to integrate with Next.js

## Database Schema

### user_interactions

```sql
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  post_id UUID NOT NULL REFERENCES posts(id),
  interaction_type VARCHAR(20) NOT NULL, -- 'view', 'click', 'like', 'share'
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_user_post (user_id, post_id),
  INDEX idx_type_created (interaction_type, created_at)
);
```

### user_recommendations

```sql
CREATE TABLE user_recommendations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  post_id UUID NOT NULL REFERENCES posts(id),
  score FLOAT NOT NULL,
  model_version VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_user_score (user_id, score DESC),
  INDEX idx_created (created_at)
);
```

## API Endpoints

### POST /api/track

**Request:**

```json
{
  "interactions": [
    {
      "postId": "123",
      "interactionType": "view",
      "metadata": {
        "source": "feed",
        "duration": 2500
      }
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "count": 1
}
```

### GET /api/feeds

**Request:**

```
GET /api/feeds?limit=20&offset=0
```

**Response:**

```json
{
  "posts": [...],
  "hasMore": true,
  "total": 100
}
```

### GET /api/recommendations/{user_id}

**Response:**

```json
{
  "recommendations": [
    {
      "post_id": "123",
      "score": 0.95,
      "reason": "similar_users_liked"
    }
  ],
  "model_version": "v1.0.0"
}
```

## Future Enhancements

- [ ] Content-based filtering (combine with collaborative)
- [ ] Deep learning models (neural collaborative filtering)
- [ ] Real-time recommendations (streaming)
- [ ] Personalized ranking
- [ ] Diversity and serendipity factors
- [ ] Explainable recommendations
- [ ] Multi-armed bandit exploration

## Related Documentation

- [Tracking Service](../lib/utils/tracking.ts)
- [Post Tracking Hook](../hooks/use-post-tracking.ts)
- [Track API](../app/api/track/route.ts)
- [Feed API](../app/api/feeds/route.ts)
- [ML Service](../ml-service/)

## Status Summary

✅ **Core MVP Complete**

- Interaction tracking system operational
- ML service returns recommendations
- Feed integrates ML with fallback
- Batching reduces API calls by 95%
- Test coverage: 9/9 unit tests, 2/3 E2E tests

⏳ **Production Deployment Pending**

- Docker Compose setup needed
- K8s deployment configuration needed
- Automated retraining pipeline needed
- Monitoring dashboard needed
