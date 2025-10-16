# Threads ML Service

ML-powered feed recommendation service using collaborative filtering.

## Architecture

Clean Architecture with 4 layers:

- **Domain**: Business entities and interfaces
- **Application**: Use cases and DTOs
- **Infrastructure**: Database, ML models, external services
- **Presentation**: FastAPI routes and schemas

## Tech Stack

- **Framework**: FastAPI 0.119+
- **ML**: scikit-learn 1.7+ (collaborative filtering with KNN)
- **Database**: PostgreSQL with SQLAlchemy 2.0 async
- **Testing**: pytest 8.4+ with pytest-asyncio
- **Code Quality**: Ruff (linter/formatter)
- **Package Manager**: uv
- **Experiment Tracking**: MLFlow 3.4+

## Setup

### Prerequisites

- Python 3.11+
- PostgreSQL running on localhost:5433
- uv installed (`brew install uv` or `pip install uv`)

### Installation

```bash
# Install dependencies
uv sync

# Copy environment variables
cp .env.example .env

# Edit .env with your database credentials
```

### Generate Fake Data

```bash
# Generate 5000 interactions over 30 days
uv run python scripts/generate_fake_interactions.py --count 5000 --days 30
```

## Development

### Run Tests

```bash
# All tests
uv run pytest

# Specific test file
uv run pytest tests/e2e/test_recommendations_api.py -v

# With coverage
uv run pytest --cov=app --cov-report=html
```

### Run Server

```bash
# Development server with hot reload
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Access docs
open http://localhost:8000/docs
```

### Code Quality

```bash
# Lint and format
uv run ruff check --fix app/ tests/ scripts/
uv run ruff format app/ tests/ scripts/
```

## API Endpoints

### Health Check

```bash
GET /health
```

Response:

```json
{
  "status": "healthy",
  "service": "threads-ml-service"
}
```

### Generate Recommendations

```bash
POST /recommendations/generate
```

Request:

```json
{
  "user_id": "027baf23-101f-48d2-b7d1-4a23e6cf8e4a",
  "limit": 50,
  "exclude_post_ids": ["post-id-1", "post-id-2"]
}
```

Response:

```json
{
  "user_id": "027baf23-101f-48d2-b7d1-4a23e6cf8e4a",
  "recommendations": [
    {
      "post_id": "post-id-3",
      "score": 0.85,
      "reason": "collaborative_filtering"
    }
  ],
  "count": 1,
  "model_version": "collaborative_filtering_v1"
}
```

## ML Model

### Collaborative Filtering

**Algorithm**: User-based collaborative filtering with k-nearest neighbors

**Features**:

- Weighted interactions (view: 0.1, click: 0.3, like: 0.7, share: 1.0)
- Cosine similarity for finding similar users
- Score normalization to [0, 1] range
- Cold start handling (returns empty for users with no interactions)

**Training**:

```python
# Model trains on-demand when first request is made
# Loads all interactions and builds user-item matrix
# KNN model with cosine similarity
```

### Future Enhancements

- Content-based filtering (post text embeddings)
- Hybrid model combining CF + content
- Online learning for real-time updates
- A/B testing framework
- Popular posts fallback for cold start

## Project Structure

```
ml-service/
├── app/
│   ├── domain/              # Business logic
│   │   ├── entities/        # User, Post, Interaction, Recommendation
│   │   ├── repositories/    # Repository interfaces
│   │   └── services/        # Service interfaces
│   ├── application/         # Use cases
│   │   ├── use_cases/       # GenerateRecommendations
│   │   └── dto/             # Data transfer objects
│   ├── infrastructure/      # Implementations
│   │   ├── database/        # SQLAlchemy models & repos
│   │   └── ml/              # ML model implementations
│   └── presentation/        # API layer
│       ├── api/
│       │   ├── dependencies.py
│       │   └── routers/
│       └── schemas/
├── tests/
│   ├── unit/               # Domain & application tests
│   ├── integration/        # Infrastructure tests
│   └── e2e/                # API endpoint tests
├── scripts/
│   └── generate_fake_interactions.py
├── data/                   # Generated datasets
├── models/                 # Trained model artifacts
└── training/               # Training scripts

```

## Database Schema

### UserInteraction

Tracks user engagement with posts:

```sql
CREATE TABLE user_interaction (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    post_id UUID NOT NULL,
    interaction_type VARCHAR NOT NULL,  -- 'view', 'click', 'like', 'share'
    metadata JSONB,                     -- Additional data
    created_at TIMESTAMP DEFAULT NOW()
);
```

### UserRecommendation

Stores precomputed recommendations:

```sql
CREATE TABLE user_recommendation (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    post_id UUID NOT NULL,
    score FLOAT NOT NULL,
    generated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    UNIQUE(user_id, post_id)
);
```

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/threads

# Application
APP_NAME=threads-ml-service
APP_VERSION=0.1.0
DEBUG=true
LOG_LEVEL=info

# API
API_HOST=0.0.0.0
API_PORT=8000

# Model
MODEL_PATH=./models
MODEL_VERSION=v1

# Recommendations
RECOMMENDATION_BATCH_SIZE=50
RECOMMENDATION_MIN_SCORE=0.1
RECOMMENDATION_MAX_AGE_HOURS=24

# Cold Start
COLD_START_STRATEGY=popular
COLD_START_MIN_INTERACTIONS=5
```

## Testing Strategy

### Unit Tests

- Domain entities validation
- ML model logic (CF algorithm)
- Use case business logic

### Integration Tests

- Database repositories
- Model training pipeline

### E2E Tests

- API endpoints
- Request/response validation
- Error handling

### Coverage Target

- Minimum: 80%
- Current: 69% (needs more integration tests)

## Performance

### Metrics

- **Recommendation Generation**: ~100-200ms for 50 recommendations
- **Model Training**: ~1-2s for 1000 interactions
- **Database Queries**: <50ms for interaction fetching

### Optimization Opportunities

1. Cache recommendations (Redis)
2. Precompute recommendations offline
3. Use approximate nearest neighbors (Annoy, FAISS)
4. Batch processing for bulk recommendations
5. Model versioning and A/B testing

## MLFlow Integration

Track experiments:

```bash
# Start MLFlow UI
mlflow ui --port 5000

# Access at http://localhost:5000
```

Features:

- Track hyperparameters (n_neighbors, similarity metric)
- Log metrics (precision@K, recall@K, NDCG)
- Store model artifacts
- Compare experiment runs

## Deployment

### Docker

```bash
# Build image
docker build -t threads-ml-service .

# Run container
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://... \
  threads-ml-service
```

### Docker Compose (Recommended for Local Development)

Run all services at once:

```bash
# From project root
docker compose up -d

# Check service status
docker compose ps

# View logs
docker compose logs -f ml-service
docker compose logs -f postgres
docker compose logs -f keycloak

# Stop all services
docker compose down -v
```

**Services Started**:

- **PostgreSQL** (port 5433) - Database for interactions & recommendations
- **Keycloak** (port 8080) - Authentication service
- **ML Service** (port 8001) - Recommendation engine

**Health Checks**:
All services have health checks configured. Check status:

```bash
# View health status
docker compose ps

# Test ML Service directly
curl http://localhost:8001/health

# Test with recommendations
curl -X POST http://localhost:8001/recommendations/generate \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user", "limit": 10}'
```

**Environment Variables** (set in docker-compose.yml):

```yaml
DATABASE_URL: postgresql://postgres:postgres@postgres:5432/threads
PYTHONUNBUFFERED: '1' # Real-time logs
```

**Development Notes**:

- ML Service volume mounted for live code changes
- Depends on PostgreSQL health check before starting
- 30s startup period for dependency initialization

## Contributing

1. Follow Clean Architecture principles
2. Write tests first (TDD)
3. Use type hints everywhere
4. Run `ruff check --fix` before committing
5. Ensure all tests pass (`uv run pytest`)

## License

MIT
