# ML-Powered Feed Recommendation System

**Status:** 🚧 In Development (Local Only, No Deployment)

**Goal:** Build a complete MLOps cycle for personalized feed post recommendations using modern Python tooling and fake data for demonstration.

---

## Architecture Overview

```mermaid
graph TB
    subgraph "Next.js Application"
        FeedAPI["Feed API Route<br/>/api/feeds"]
        MLClient["ML Service HTTP Client<br/>(with fallback)"]
        FeedRepo["FeedRepository<br/>(Random Shuffle)"]

        FeedAPI --> MLClient
        FeedAPI -.Fallback.-> FeedRepo
    end

    subgraph "FastAPI ML Service<br/>http://ml-service:8000"
        RecoEndpoint["POST /recommendations/generate"]
        TrackEndpoint["POST /interactions/track<br/>(Future)"]
        HealthEndpoint["GET /health"]

        subgraph "ML Pipeline"
            DataLoader["Data Loader<br/>(PostgreSQL)"]
            Recommender["Recommender<br/>(Collab CF)"]
            Scorer["Score & Rank"]

            DataLoader --> Recommender
            Recommender --> Scorer
        end

        RecoEndpoint --> DataLoader
    end

    subgraph "PostgreSQL Database"
        PostsTable[("Posts")]
        UsersTable[("Users")]
        InteractionTable[("UserInteraction")]
        RecommendationTable[("UserRecommendation")]
    end

    MLClient -->|Primary| RecoEndpoint
    FeedRepo -.->|Random Fallback| PostsTable

    DataLoader --> PostsTable
    DataLoader --> UsersTable
    DataLoader --> InteractionTable
    Scorer --> RecommendationTable

    TrackEndpoint -.Future.-> InteractionTable

    style FeedAPI fill:#e1f5ff
    style MLClient fill:#fff4e1
    style RecoEndpoint fill:#e8f5e9
    style Recommender fill:#f3e5f5
    style PostsTable fill:#fce4ec
    style InteractionTable fill:#fce4ec
```

---

## Technology Stack

### Python ML Service

**Package Management & Build:**

- **[uv](https://github.com/astral-sh/uv)** - Fast Python package manager (Rust-based, pip/venv replacement)
  - Faster than pip/poetry (10-100x)
  - Built-in virtual environment management
  - Compatible with pyproject.toml

**Code Quality:**

- **[Ruff](https://github.com/astral-sh/ruff)** - Fast Python linter & formatter (Rust-based)
  - Replaces: Flake8, Black, isort, pyupgrade
  - 10-100x faster than existing tools
  - Auto-fix support

**Web Framework:**

- **FastAPI** - Modern async API framework with automatic OpenAPI docs

**ML Libraries:**

- **scikit-learn** - Collaborative filtering models
- **pandas** - Data manipulation
- **numpy** - Numerical computing
- **faker** - Synthetic data generation

**Database:**

- **psycopg2-binary** - PostgreSQL adapter
- **sqlalchemy** - ORM for database operations

**Testing:**

- **pytest** - Testing framework
- **httpx** - Async HTTP client for API testing

**Deployment:**

- **Docker** - Containerization
- **uvicorn** - ASGI server for FastAPI

---

## Project Structure (Clean Architecture)

Following **Clean Architecture** principles with clear separation of concerns:

```
ml-service/
├── pyproject.toml              # uv/PEP 621 project configuration
├── uv.lock                     # Dependency lock file
├── .python-version             # Python version (3.11+)
├── Dockerfile                  # Multi-stage Docker build
├── .dockerignore
├── ruff.toml                   # Ruff configuration
├── .env.example                # Environment variables template
├── README.md
│
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   │
│   ├── domain/                 # DOMAIN LAYER (Business Logic)
│   │   ├── __init__.py
│   │   ├── entities/           # Core business entities
│   │   │   ├── __init__.py
│   │   │   ├── user.py         # User entity
│   │   │   ├── post.py         # Post entity
│   │   │   └── recommendation.py  # Recommendation entity
│   │   │
│   │   ├── repositories/       # Repository interfaces (Ports)
│   │   │   ├── __init__.py
│   │   │   ├── interaction_repository.py   # Abstract interaction repo
│   │   │   ├── post_repository.py          # Abstract post repo
│   │   │   └── recommendation_repository.py # Abstract reco repo
│   │   │
│   │   └── services/           # Domain services (ML model interfaces)
│   │       ├── __init__.py
│   │       ├── recommender_interface.py    # ML model contract
│   │       └── scorer_interface.py         # Scoring contract
│   │
│   ├── application/            # APPLICATION LAYER (Use Cases)
│   │   ├── __init__.py
│   │   ├── use_cases/
│   │   │   ├── __init__.py
│   │   │   ├── generate_recommendations.py  # Generate reco use case
│   │   │   ├── track_interaction.py         # Track interaction use case
│   │   │   └── get_health_status.py         # Health check use case
│   │   │
│   │   └── dto/                # Data Transfer Objects
│   │       ├── __init__.py
│   │       ├── recommendation_request.py
│   │       └── recommendation_response.py
│   │
│   ├── infrastructure/         # INFRASTRUCTURE LAYER (External Dependencies)
│   │   ├── __init__.py
│   │   ├── database/           # Database implementations
│   │   │   ├── __init__.py
│   │   │   ├── connection.py   # Database connection/session
│   │   │   ├── interaction_repository_impl.py  # Concrete repo
│   │   │   ├── post_repository_impl.py         # Concrete repo
│   │   │   └── recommendation_repository_impl.py # Concrete repo
│   │   │
│   │   ├── ml/                 # ML model implementations
│   │   │   ├── __init__.py
│   │   │   ├── collaborative_filter.py   # Concrete ML model
│   │   │   ├── content_scorer.py         # Concrete scorer
│   │   │   └── model_loader.py           # Model serialization
│   │   │
│   │   └── config/             # Configuration
│   │       ├── __init__.py
│   │       └── settings.py     # Environment variables, DB config
│   │
│   ├── presentation/           # PRESENTATION LAYER (API)
│   │   ├── __init__.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── dependencies.py # FastAPI dependencies (DI)
│   │   │   └── routers/
│   │   │       ├── __init__.py
│   │   │       ├── health.py           # GET /health
│   │   │       ├── recommendations.py  # POST /recommendations/generate
│   │   │       └── interactions.py     # POST /interactions/track
│   │   │
│   │   └── schemas/            # Pydantic schemas (API contracts)
│   │       ├── __init__.py
│   │       ├── health_schema.py
│   │       ├── recommendation_schema.py
│   │       └── interaction_schema.py
│   │
│   └── shared/                 # Shared utilities
│       ├── __init__.py
│       ├── exceptions.py       # Custom exceptions
│       ├── logging.py          # Logging configuration
│       └── monitoring.py       # Prometheus metrics
│
├── data/                       # DATA GENERATION (Standalone scripts)
│   ├── __init__.py
│   ├── generate_fake_data.py   # Synthetic data generation
│   ├── seed_database.py        # Load fake data into PostgreSQL
│   └── schemas.py              # Data validation schemas
│
├── training/                   # ML TRAINING PIPELINE (Standalone)
│   ├── __init__.py
│   ├── train.py                # Model training pipeline
│   ├── evaluate.py             # Model evaluation (Precision@K, NDCG)
│   ├── preprocess.py           # Feature engineering
│   └── export_model.py         # Model serialization
│
├── models/                     # Trained model artifacts (gitignored)
│   ├── model_v1.pkl
│   ├── model_20250113_120000.pkl
│   └── registry.json           # Model metadata
│
├── notebooks/                  # Jupyter notebooks for experimentation
│   └── exploration.ipynb
│
├── tests/                      # TESTS (Mirror app structure)
│   ├── __init__.py
│   ├── conftest.py             # Pytest fixtures
│   │
│   ├── unit/                   # Unit tests (domain, application)
│   │   ├── __init__.py
│   │   ├── test_domain/
│   │   │   ├── test_entities.py
│   │   │   └── test_services.py
│   │   └── test_application/
│   │       └── test_use_cases.py
│   │
│   ├── integration/            # Integration tests (infrastructure)
│   │   ├── __init__.py
│   │   ├── test_database/
│   │   │   └── test_repositories.py
│   │   └── test_ml/
│   │       └── test_recommender.py
│   │
│   └── e2e/                    # End-to-end tests (API)
│       ├── __init__.py
│       └── test_api/
│           ├── test_health.py
│           └── test_recommendations.py
│
└── scripts/                    # Utility scripts
    ├── run_dev.sh              # Start dev server with hot reload
    ├── run_tests.sh            # Run test suite
    └── train_model.sh          # Train model locally
```

### Clean Architecture Benefits

**1. Domain Layer** (Innermost, Pure Business Logic)

- No framework dependencies
- Contains core ML recommendation logic
- Defines interfaces (ports) for external systems
- Highly testable with mocks

**2. Application Layer** (Use Cases)

- Orchestrates domain objects
- Implements business workflows
- Framework-independent
- Easy to test

**3. Infrastructure Layer** (External Dependencies)

- Implements domain interfaces
- Handles PostgreSQL, ML models, external services
- Can be swapped without affecting domain

**4. Presentation Layer** (API)

- FastAPI routers and schemas
- Thin layer, delegates to use cases
- Easy to replace with different API framework

**Dependency Rule:**

- Dependencies point **inward only**
- Domain depends on nothing
- Application depends on domain
- Infrastructure depends on domain interfaces
- Presentation depends on application

**Testing Strategy:**

- Unit tests: Domain + Application (fast, no I/O)
- Integration tests: Infrastructure (with real DB/models)
- E2E tests: Presentation (full API tests)

---

## Database Schema (Already Exists)

```sql
-- User interactions (tracking for ML)
CREATE TABLE user_interaction (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL, -- 'view', 'click', 'like', 'share'
  metadata JSONB,                        -- Additional context
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  INDEX idx_user_interaction_user (user_id, created_at),
  INDEX idx_user_interaction_post (post_id, created_at),
  INDEX idx_user_interaction_time (created_at)
);

-- Pre-computed recommendations
CREATE TABLE user_recommendation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  score FLOAT NOT NULL,                  -- ML recommendation score
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,         -- TTL for recommendations

  UNIQUE(user_id, post_id),
  INDEX idx_user_reco_user_score (user_id, score DESC),
  INDEX idx_user_reco_expires (user_id, expires_at),
  INDEX idx_user_reco_cleanup (expires_at)
);
```

---

## ML Model Approach

### Phase 1: Collaborative Filtering (Simple)

**Algorithm:** User-based Collaborative Filtering with Content Boosting

**Features:**

1. **User Interaction Matrix:**
   - Rows: Users
   - Columns: Posts
   - Values: Interaction weights (view=1, like=5, share=10)

2. **Content Features:**
   - Post recency (decay factor)
   - Author popularity (follower count)
   - Engagement metrics (like count, comment count)

**Scoring Formula:**

```python
final_score = (
    0.7 * collaborative_filtering_score +
    0.2 * content_similarity_score +
    0.1 * recency_boost
)
```

**Cold Start Handling:**

- New users: Fall back to trending posts (high engagement)
- New posts: Boost score for recent posts from popular authors

**Model:** Scikit-learn `NearestNeighbors` with cosine similarity

---

## API Endpoints

### Health Check

```http
GET /health
Response: 200 OK
{
  "status": "healthy",
  "timestamp": "2025-01-13T12:00:00Z",
  "model_version": "v1",
  "model_loaded": true
}
```

### Generate Recommendations

```http
POST /recommendations/generate
Content-Type: application/json

Request:
{
  "user_id": "uuid",
  "limit": 50,
  "offset": 0,
  "context": {
    "exclude_seen": true
  }
}

Response: 200 OK
{
  "user_id": "uuid",
  "recommendations": [
    {
      "post_id": "uuid",
      "score": 0.87,
      "reason": "collaborative_filtering"
    }
  ],
  "metadata": {
    "total": 50,
    "model_version": "v1",
    "generated_at": "2025-01-13T12:00:00Z"
  }
}
```

### Track Interaction (Future)

```http
POST /interactions/track
Content-Type: application/json

Request:
{
  "user_id": "uuid",
  "post_id": "uuid",
  "interaction_type": "view",
  "metadata": {
    "dwell_time_ms": 3500
  }
}

Response: 202 Accepted
{
  "status": "tracked"
}
```

---

## Development Setup

### Prerequisites

- Python 3.11+
- PostgreSQL (via Docker Compose)
- uv package manager

### Installation

```bash
# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Navigate to ml-service directory
cd ml-service

# Create virtual environment and install dependencies
uv venv
uv pip install -e ".[dev]"

# Activate virtual environment
source .venv/bin/activate  # Linux/Mac
# or
.venv\Scripts\activate  # Windows

# Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL connection string
```

### Run Development Server

```bash
# Start ML service with hot reload
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or use the helper script
./scripts/run_dev.sh
```

### Generate Fake Data

```bash
# Generate synthetic user interactions
uv run python -m data.generate_fake_data --users 50 --posts 200 --interactions 2000

# Load data into PostgreSQL
uv run python -m data.seed_database
```

### Train Model

```bash
# Train collaborative filtering model
uv run python -m training.train

# Evaluate model
uv run python -m training.evaluate

# Model will be saved to models/model_v1.pkl
```

---

## MLOps Pipeline

### 1. Data Generation

```bash
# Generate realistic fake data
uv run python -m data.generate_fake_data \
  --users 100 \
  --posts 500 \
  --interactions 5000 \
  --output data/fake_interactions.json
```

**Features:**

- Power law distribution (few users, many interactions)
- Realistic timestamps (last 30 days)
- Diverse interaction types (view, like, comment, share)

### 2. Data Validation

```python
# data/schemas.py
from pydantic import BaseModel, Field

class UserInteraction(BaseModel):
    user_id: str
    post_id: str
    interaction_type: Literal['view', 'click', 'like', 'share']
    created_at: datetime

    @validator('interaction_type')
    def validate_type(cls, v):
        allowed = ['view', 'click', 'like', 'share']
        if v not in allowed:
            raise ValueError(f'Must be one of {allowed}')
        return v
```

### 3. Feature Engineering

```python
# training/preprocess.py
def build_interaction_matrix(interactions_df):
    """
    Build user-item interaction matrix with weighted scores

    Weights:
    - view: 1
    - click: 2
    - like: 5
    - share: 10
    """
    weights = {'view': 1, 'click': 2, 'like': 5, 'share': 10}
    interactions_df['weight'] = interactions_df['interaction_type'].map(weights)

    matrix = interactions_df.pivot_table(
        index='user_id',
        columns='post_id',
        values='weight',
        aggfunc='sum',
        fill_value=0
    )
    return matrix
```

### 4. Model Training

```python
# training/train.py
from sklearn.neighbors import NearestNeighbors

def train_collaborative_filter(interaction_matrix):
    """Train KNN-based collaborative filtering model"""
    model = NearestNeighbors(
        n_neighbors=10,
        metric='cosine',
        algorithm='brute'
    )
    model.fit(interaction_matrix)
    return model
```

### 5. Model Evaluation

```python
# training/evaluate.py
def evaluate_model(model, test_data):
    """
    Evaluate recommendation quality

    Metrics:
    - Precision@K: How many recommendations were relevant
    - Recall@K: How many relevant items were recommended
    - NDCG@K: Ranking quality
    """
    precision_at_5 = calculate_precision_at_k(predictions, actuals, k=5)
    recall_at_5 = calculate_recall_at_k(predictions, actuals, k=5)
    ndcg_at_5 = calculate_ndcg_at_k(predictions, actuals, k=5)

    return {
        'precision@5': precision_at_5,
        'recall@5': recall_at_5,
        'ndcg@5': ndcg_at_5
    }
```

### 6. Model Registry

```json
// models/registry.json
{
  "models": [
    {
      "version": "v1",
      "filename": "model_20250113_120000.pkl",
      "created_at": "2025-01-13T12:00:00Z",
      "metrics": {
        "precision@5": 0.68,
        "recall@5": 0.45,
        "ndcg@5": 0.72
      },
      "config": {
        "algorithm": "collaborative_filtering",
        "n_neighbors": 10
      },
      "status": "active"
    }
  ]
}
```

### 7. Model Deployment (Local)

```python
# app/models/recommender.py
class RecommenderModel:
    def __init__(self, model_path: str):
        self.model = self._load_model(model_path)

    def predict(self, user_id: str, limit: int = 50):
        """Generate recommendations for user"""
        user_interactions = self._get_user_interactions(user_id)
        similar_users = self.model.kneighbors([user_interactions])
        recommendations = self._aggregate_recommendations(similar_users)
        return recommendations[:limit]
```

---

## Docker Setup

### Dockerfile (Multi-stage)

```dockerfile
# Stage 1: Build stage
FROM python:3.11-slim as builder

# Install uv
RUN pip install uv

WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv pip install --system --no-cache .

# Stage 2: Runtime stage
FROM python:3.11-slim

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY app/ ./app/
COPY models/ ./models/

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker-compose.dev.yml

```yaml
services:
  ml-service:
    build:
      context: ./ml-service
      dockerfile: Dockerfile
    ports:
      - '8000:8000'
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/threads
      - MODEL_PATH=/app/models/model_v1.pkl
      - LOG_LEVEL=info
    volumes:
      - ./ml-service/app:/app/app # Hot reload
      - ./ml-service/models:/app/models
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - threads-network
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8000/health']
      interval: 10s
      timeout: 3s
      retries: 3
```

---

## Next.js Integration

### ML Service Client

```typescript
// lib/services/ml-service.ts
import { logger } from '@/lib/logger';

interface RecommendationRequest {
  user_id: string;
  limit: number;
  offset: number;
}

interface Recommendation {
  post_id: string;
  score: number;
  reason: string;
}

export class MLServiceClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = process.env.ML_SERVICE_URL || 'http://ml-service:8000';
    this.timeout = 3000; // 3 second timeout
  }

  async getRecommendations(userId: string, limit: number = 50): Promise<Recommendation[] | null> {
    try {
      const response = await fetch(`${this.baseUrl}/recommendations/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, limit }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        logger.warn('ML service returned non-200', { status: response.status });
        return null;
      }

      const data = await response.json();
      return data.recommendations;
    } catch (error) {
      logger.error('Failed to fetch ML recommendations', { error });
      return null; // Fallback to random
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(1000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

### Updated Feed Repository

```typescript
// lib/repositories/feed.repository.ts
import { MLServiceClient } from '@/lib/services/ml-service';

export class FeedRepository {
  private mlClient: MLServiceClient;

  constructor() {
    this.mlClient = new MLServiceClient();
  }

  async fetchPersonalizedFeed(
    userId: string,
    limit: number = 50
  ): Promise<{ posts: PostWithUser[]; source: string }> {
    // Try ML recommendations first
    const recommendations = await this.mlClient.getRecommendations(userId, limit);

    if (recommendations && recommendations.length > 0) {
      // Fetch posts by recommended IDs
      const postIds = recommendations.map(r => r.post_id);
      const posts = await this.fetchPostsByIds(postIds);

      return {
        posts,
        source: 'ml_recommendations',
      };
    }

    // Fallback to random shuffle
    const posts = await this.fetchRandomPostsWithCounts(userId, limit);
    return {
      posts,
      source: 'random_fallback',
    };
  }
}
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ml-service-ci.yml
name: ML Service CI

on:
  push:
    paths:
      - 'ml-service/**'
  pull_request:
    paths:
      - 'ml-service/**'

jobs:
  lint-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        run: curl -LsSf https://astral.sh/uv/install.sh | sh

      - name: Set up Python
        run: uv python install 3.11

      - name: Install dependencies
        run: |
          cd ml-service
          uv pip install -e ".[dev]"

      - name: Lint with Ruff
        run: |
          cd ml-service
          uv run ruff check .

      - name: Format check with Ruff
        run: |
          cd ml-service
          uv run ruff format --check .

      - name: Type check with mypy
        run: |
          cd ml-service
          uv run mypy app/

      - name: Run tests
        run: |
          cd ml-service
          uv run pytest tests/ --cov=app --cov-report=xml

      - name: Model validation
        run: |
          cd ml-service
          uv run python -m training.validate_model

  docker-build:
    runs-on: ubuntu-latest
    needs: lint-and-test

    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: |
          cd ml-service
          docker build -t ml-service:test .

      - name: Test Docker image
        run: |
          docker run -d --name ml-test -p 8000:8000 ml-service:test
          sleep 5
          curl -f http://localhost:8000/health || exit 1
```

---

## Monitoring & Logging

### Application Metrics

```python
# app/main.py
from prometheus_client import Counter, Histogram, generate_latest

# Metrics
recommendation_requests = Counter(
    'ml_recommendation_requests_total',
    'Total recommendation requests'
)
recommendation_latency = Histogram(
    'ml_recommendation_latency_seconds',
    'Recommendation generation latency'
)

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

### Logging

```python
# app/config.py
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger("ml-service")
```

---

## Testing Strategy

### Unit Tests

```python
# tests/test_recommender.py
def test_recommend_returns_top_k_posts():
    recommender = RecommenderModel(model_path="models/model_v1.pkl")
    recommendations = recommender.predict(user_id="test-user", limit=10)

    assert len(recommendations) == 10
    assert all(r.score >= 0 and r.score <= 1 for r in recommendations)
    assert recommendations[0].score >= recommendations[-1].score  # Sorted
```

### Integration Tests

```python
# tests/test_api.py
from fastapi.testclient import TestClient

def test_recommendations_endpoint(client: TestClient):
    response = client.post(
        "/recommendations/generate",
        json={"user_id": "test-user", "limit": 5}
    )

    assert response.status_code == 200
    data = response.json()
    assert "recommendations" in data
    assert len(data["recommendations"]) == 5
```

---

## NPM Scripts Integration

```json
// package.json
{
  "scripts": {
    "ml:dev": "cd ml-service && uv run uvicorn app.main:app --reload",
    "ml:generate-data": "cd ml-service && uv run python -m data.generate_fake_data",
    "ml:seed": "cd ml-service && uv run python -m data.seed_database",
    "ml:train": "cd ml-service && uv run python -m training.train",
    "ml:evaluate": "cd ml-service && uv run python -m training.evaluate",
    "ml:test": "cd ml-service && uv run pytest",
    "ml:lint": "cd ml-service && uv run ruff check .",
    "ml:format": "cd ml-service && uv run ruff format .",
    "dev:full": "docker compose -f docker-compose.dev.yml up"
  }
}
```

---

## Success Criteria

- ✅ ML service responds to health checks
- ✅ Fake data generation creates realistic interactions
- ✅ Model training pipeline runs end-to-end
- ✅ Recommendations API returns scored posts
- ✅ Next.js feed shows "source: ml_recommendations" metadata
- ✅ Fallback to random works when ML service unavailable
- ✅ All tests pass in CI
- ✅ Docker Compose runs complete stack locally

---

## Out of Scope (Not Implemented Yet)

❌ Production deployment to Zeabur
❌ Real user interaction tracking
❌ Deep learning models (embeddings, neural networks)
❌ Real-time model updates
❌ A/B testing framework
❌ Redis caching layer

---

## Next Steps (After MVP)

1. **Phase 2:** Add real user interaction tracking
2. **Phase 3:** Implement online learning (incremental model updates)
3. **Phase 4:** Upgrade to deep learning (embeddings + neural collaborative filtering)
4. **Phase 5:** Deploy to production with monitoring
5. **Phase 6:** A/B testing framework for model comparison

---

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [uv Documentation](https://github.com/astral-sh/uv)
- [Ruff Documentation](https://github.com/astral-sh/ruff)
- [Collaborative Filtering Tutorial](https://realpython.com/build-recommendation-engine-collaborative-filtering/)
- [Scikit-learn NearestNeighbors](https://scikit-learn.org/stable/modules/generated/sklearn.neighbors.NearestNeighbors.html)
