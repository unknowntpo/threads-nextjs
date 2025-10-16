# ML Recommendation Service Development - Session Summary

**Date**: 2025-10-14
**Working Directory**: `/Users/unknowntpo/repo/unknowntpo/threads-nextjs/ml-service`
**Status**: ✅ All tests passing (7/7) - Production-ready for local development

---

## 🎯 Main Achievement

Built a complete **ML-powered feed recommendation service** using:

- **Clean Architecture** (4-layer pattern)
- **TDD** (Test-Driven Development)
- **Full Type Safety** (SQLAlchemy 2.0 `Mapped[]` annotations)

---

## 📦 What We Built

### ML Service Structure (Clean Architecture)

```
ml-service/
├── app/
│   ├── domain/              # Layer 1: Entities + Interfaces
│   │   ├── entities/        # Interaction, Recommendation, Post, User
│   │   ├── repositories/    # Repository ABC interfaces
│   │   └── services/        # Service ABC interfaces
│   ├── application/         # Layer 2: Use Cases
│   │   ├── use_cases/       # GenerateRecommendationsUseCase
│   │   └── dto/             # Data Transfer Objects
│   ├── infrastructure/      # Layer 3: Implementations
│   │   ├── database/        # SQLAlchemy models + repository impls
│   │   └── ml/              # Collaborative filtering model
│   └── presentation/        # Layer 4: API
│       ├── api/routers/     # FastAPI endpoints
│       └── schemas/         # Pydantic validation
├── tests/
│   ├── conftest.py          # Event loop cleanup fixture
│   ├── e2e/                 # API tests (4 tests)
│   └── unit/                # ML model tests (3 tests)
├── scripts/
│   └── generate_fake_interactions.py  # Type-safe data generation
├── README.md                # Comprehensive documentation
├── SESSION_SUMMARY.md       # This file
└── pyproject.toml           # uv package config
```

---

## 🔧 Tech Stack

| Component           | Technology                                                  |
| ------------------- | ----------------------------------------------------------- |
| Framework           | FastAPI 0.119+                                              |
| ML Algorithm        | User-based Collaborative Filtering (KNN, cosine similarity) |
| Database            | PostgreSQL + SQLAlchemy 2.0 async                           |
| Drivers             | asyncpg (async), psycopg2-binary (sync), greenlet           |
| Testing             | pytest 8.4+ + pytest-asyncio                                |
| Validation          | Pydantic 2.12+                                              |
| Code Quality        | Ruff 0.14+ (linter/formatter)                               |
| Package Manager     | uv                                                          |
| Experiment Tracking | MLFlow 3.4+                                                 |

---

## ✅ Features Implemented

### 1. API Endpoints

```bash
GET  /health                      # Health check
POST /recommendations/generate    # Generate personalized recommendations
```

**Example Request**:

```bash
curl -X POST http://localhost:8000/recommendations/generate \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "027baf23-101f-48d2-b7d1-4a23e6cf8e4a",
    "limit": 50,
    "exclude_post_ids": []
  }'
```

**Example Response**:

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

### 2. ML Model: Collaborative Filtering

**Algorithm**: User-based collaborative filtering with k-nearest neighbors

**Features**:

- Weighted interactions:
  - `view`: 0.1
  - `click`: 0.3
  - `like`: 0.7
  - `share`: 1.0
- KNN with cosine similarity
- Score normalization to [0, 1] range
- Cold start handling (returns empty for users with no interactions)
- Post exclusion (skip already-seen posts)

### 3. Type Safety

✅ **Full type coverage**:

- SQLAlchemy 2.0 `Mapped[]` annotations on all models
- All functions have type hints (parameters + return types)
- Pydantic validation on API boundaries
- Ruff linting passing

**Example**:

```python
# Type-safe entity
@dataclass
class Interaction:
    id: str
    user_id: str
    post_id: str
    interaction_type: str
    created_at: datetime
    metadata: dict[str, Any] | None = None

# Type-safe repository interface
class InteractionRepository(ABC):
    @abstractmethod
    async def get_all_interactions(
        self, limit: int | None = None
    ) -> list[Interaction]:
        pass

# Type-safe data generation
def weighted_choice(choices: list[tuple[str, float]]) -> str:
    total: float = sum(weight for _, weight in choices)
    r: float = random.uniform(0, total)
    ...
```

### 4. Data Generation

**Type-safe fake data script**:

```bash
uv run python scripts/generate_fake_interactions.py --count 5000 --days 30
```

**Current data**:

- 250 interactions generated
- Realistic distribution:
  - 121 views (48%)
  - 80 clicks (32%)
  - 42 likes (17%)
  - 7 shares (3%)
- JSON metadata for views (duration) and clicks (scroll_depth)
- 2 users, 2 posts in database

---

## 🧪 Test Results: **7/7 PASSING (100%)**

```bash
# Run all tests
uv run pytest tests/ -v

# Test breakdown
tests/e2e/test_health.py                              ✅ 1/1
tests/e2e/test_recommendations_api.py                 ✅ 3/3
  - test_generate_recommendations_endpoint
  - test_generate_recommendations_with_exclude
  - test_generate_recommendations_validates_limit
tests/unit/test_collaborative_filter.py               ✅ 3/3
  - test_generate_recommendations_returns_list
  - test_recommendations_sorted_by_score
  - test_exclude_post_ids

# Coverage: 77%
```

**Key Fix Applied**: Added `tests/conftest.py` with async engine cleanup fixture to prevent event loop reuse issues across tests.

```python
@pytest.fixture(scope="function", autouse=True)
async def cleanup_async_engine():
    """Cleanup async engine after each test to prevent event loop issues."""
    yield
    from app.infrastructure.database.connection import async_engine
    await async_engine.dispose()
```

---

## 🏗️ Architecture Deep Dive

### Clean Architecture: 4 Layers Explained

#### **The Standard Model (Uncle Bob)**

```
┌─────────────────────────────────────┐
│  1. Entities (Domain/Business)      │  ← Core business logic
├─────────────────────────────────────┤
│  2. Use Cases (Application)          │  ← Business workflows
├─────────────────────────────────────┤
│  3. Interface Adapters (Repository)  │  ← Data access, external APIs
├─────────────────────────────────────┤
│  4. Frameworks & Drivers (API)       │  ← Web, UI, DB implementation
└─────────────────────────────────────┘
```

#### **Our Implementation Mapping**

| Layer                       | Our Folder        | Purpose                                    | Example Files                                                             |
| --------------------------- | ----------------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| **1. Entities**             | `domain/`         | Business logic + interfaces (what we need) | `entities/interaction.py`, `repositories/interaction_repository.py` (ABC) |
| **2. Use Cases**            | `application/`    | Business workflows (orchestration)         | `use_cases/generate_recommendations.py`                                   |
| **3. Interface Adapters**   | `infrastructure/` | Implementations (how we do it)             | `database/interaction_repository_impl.py`, `ml/collaborative_filter.py`   |
| **4. Frameworks & Drivers** | `presentation/`   | API, HTTP (delivery mechanism)             | `api/routers/recommendations.py`                                          |

#### **Key Insight: Repository Pattern**

**❓ Common Question**: "Why are repositories in the domain directory?"

**✅ Answer**: We split **interface** from **implementation**:

```python
# LAYER 1: Domain (interface)
# domain/repositories/interaction_repository.py
class InteractionRepository(ABC):  # ← INTERFACE (what domain needs)
    @abstractmethod
    async def get_all_interactions(self) -> list[Interaction]:
        pass

# LAYER 3: Infrastructure (implementation)
# infrastructure/database/interaction_repository_impl.py
class SQLAlchemyInteractionRepository(InteractionRepository):  # ← IMPLEMENTATION
    async def get_all_interactions(self) -> list[Interaction]:
        stmt = select(UserInteraction)  # SQLAlchemy details
        result = await self.session.execute(stmt)
        return [Interaction(...) for row in result]
```

**Benefits**:

1. **Easy Testing**: Mock the interface
2. **Swap Implementations**: Change DB without touching use cases
3. **Domain Independence**: Business logic has zero dependencies on frameworks

#### **Dependency Rule**

```
API Layer (presentation/)
    ↓ depends on
Use Case Layer (application/)
    ↓ depends on
Entity Layer (domain/)
    ↑ implemented by
Repository Layer (infrastructure/)
```

**Key**: Infrastructure implements interfaces defined in Domain, but Domain never imports from Infrastructure.

---

## 📝 Key Files Created (30+ files)

### Domain Layer (13 files)

**Entities**:

- `domain/entities/interaction.py` - User interaction with weighted scoring
- `domain/entities/recommendation.py` - Recommendation with score validation
- `domain/entities/post.py` - Post entity
- `domain/entities/user.py` - User entity

**Repository Interfaces**:

- `domain/repositories/interaction_repository.py` - ABC interface
- `domain/repositories/post_repository.py` - ABC interface

**Service Interfaces**:

- `domain/services/recommender_interface.py` - ML model interface

### Application Layer (3 files)

- `application/use_cases/generate_recommendations.py` - Main business workflow
- `application/dto/recommendation_dto.py` - Data Transfer Objects

### Infrastructure Layer (6 files)

**Database**:

- `infrastructure/database/models.py` - SQLAlchemy models with `Mapped[]` typing
- `infrastructure/database/connection.py` - Async/sync engine management
- `infrastructure/database/interaction_repository_impl.py` - Concrete implementation
- `infrastructure/database/post_repository_impl.py` - Concrete implementation

**ML**:

- `infrastructure/ml/collaborative_filter.py` - User-based CF with KNN (TDD tested)

### Presentation Layer (4 files)

- `presentation/api/routers/recommendations.py` - FastAPI routes with DI
- `presentation/api/dependencies.py` - Dependency injection
- `presentation/schemas/recommendation_schemas.py` - Pydantic validation

### Tests (4 files)

- `tests/conftest.py` - Pytest fixtures (event loop cleanup)
- `tests/e2e/test_health.py` - Health endpoint test
- `tests/e2e/test_recommendations_api.py` - Recommendations API tests
- `tests/unit/test_collaborative_filter.py` - ML model unit tests

### Other Important Files

- `scripts/generate_fake_interactions.py` - Type-safe data generation with SQLAlchemy
- `README.md` - Comprehensive documentation (setup, API, architecture)
- `pyproject.toml` - uv package configuration with dependencies
- `ruff.toml` - Linting and formatting configuration
- `.env.example` - Environment variables template
- `.gitignore` - Python/ML-specific ignores
- `.python-version` - Python 3.11

---

## 🎨 Development Approach

### TDD (Test-Driven Development) - Strictly Followed

**RED-GREEN-REFACTOR Cycle**:

1. ✅ **RED**: Write test first
2. ✅ **Verify RED**: Watch it fail (confirms test works)
3. ✅ **GREEN**: Write minimal code to pass
4. ✅ **Verify GREEN**: Watch it pass (confirms implementation works)
5. ✅ **REFACTOR**: Clean up code (keep tests green)

**Examples from this session**:

#### Example 1: Health Check Endpoint

```python
# 1. RED - Write test first
def test_health_endpoint_returns_200():
    response = await client.get("/health")
    assert response.status_code == 200
    assert data["status"] == "healthy"

# 2. Verify RED - Failed with 404 (no endpoint exists)

# 3. GREEN - Write minimal code
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "threads-ml-service"}

# 4. Verify GREEN - Test passed! ✅
```

#### Example 2: Collaborative Filter

```python
# 1. RED - Write test first
def test_generate_recommendations_returns_list():
    recommender = CollaborativeFilterRecommender(interactions)
    recommendations = await recommender.generate_recommendations("user1")
    assert isinstance(recommendations, list)

# 2. Verify RED - ModuleNotFoundError (no module exists)

# 3. GREEN - Implement CF with KNN
class CollaborativeFilterRecommender:
    async def generate_recommendations(self, user_id, limit=50):
        # Build user-item matrix
        # Train KNN model
        # Find similar users
        # Aggregate scores
        return recommendations

# 4. Verify GREEN - All 3 tests passed! ✅
```

---

## 🚀 Commands Reference

### Testing

```bash
# Run all tests
uv run pytest

# Run specific test file
uv run pytest tests/e2e/test_recommendations_api.py -v

# Run with coverage
uv run pytest --cov=app --cov-report=html

# Run without coverage output
uv run pytest --no-cov

# Run single test
uv run pytest tests/e2e/test_health.py::test_health_endpoint_returns_200 -v
```

### Data Generation

```bash
# Generate 5000 interactions over 30 days
uv run python scripts/generate_fake_interactions.py --count 5000 --days 30

# Generate small dataset for testing
uv run python scripts/generate_fake_interactions.py --count 100 --days 7
```

### Development Server

```bash
# Start server with hot reload
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Access API docs
open http://localhost:8000/docs

# Access ReDoc
open http://localhost:8000/redoc

# Test health endpoint
curl http://localhost:8000/health
```

### Code Quality

```bash
# Lint and auto-fix
uv run ruff check --fix app/ tests/ scripts/

# Format code
uv run ruff format app/ tests/ scripts/

# Check without fixing
uv run ruff check app/ tests/ scripts/
```

### Package Management

```bash
# Install dependencies
uv sync

# Add new dependency
uv add package-name

# Add dev dependency
uv add --dev package-name

# Update all dependencies
uv lock --upgrade
```

---

## 📊 Current State

### ✅ Completed Tasks

1. ✅ Set up Python ML service directory structure (Clean Architecture)
2. ✅ Reference ML docs in plan.md
3. ✅ Create FastAPI application with health check endpoint
4. ✅ Generate fake user interaction data in database
5. ✅ Build simple collaborative filtering recommendation model
6. ✅ Create ML service recommendation endpoints
7. ✅ Write documentation and README

### ⏳ Pending Tasks

1. ⏳ Integrate ML service with Next.js feed API
2. ⏳ Set up Docker Compose for ML service
3. ⏳ Create model training pipeline script
4. ⏳ Add model evaluation and versioning
5. ⏳ Create ML service CI workflow
6. ⏳ Add monitoring and logging

### 📈 Test Coverage

| Module               | Coverage | Notes                     |
| -------------------- | -------- | ------------------------- |
| Collaborative Filter | 92%      | Core ML model well-tested |
| Database Connection  | 93%      | Async/sync engines        |
| API Endpoints        | 100%     | Full E2E coverage         |
| Pydantic Schemas     | 100%     | Validation logic          |
| Database Models      | 100%     | SQLAlchemy typing         |
| **Overall**          | **77%**  | Good baseline             |

**Areas needing more tests**:

- Post repository (not yet used in production)
- Some use case edge cases
- Integration tests for database operations

---

## 🐛 Issues Resolved

### Problem 1: Event Loop Reuse Across Tests

**Error**:

```
RuntimeError: Task <Task pending> got Future attached to a different loop
```

**Root Cause**:

- Async SQLAlchemy engine was being reused across pytest tests
- Each test creates a new event loop, but engine was bound to previous loop

**Solution**:
Created `tests/conftest.py` with cleanup fixture:

```python
@pytest.fixture(scope="function", autouse=True)
async def cleanup_async_engine():
    """Cleanup async engine after each test to prevent event loop issues."""
    yield
    from app.infrastructure.database.connection import async_engine
    await async_engine.dispose()
```

**Result**: All tests now pass ✅

### Problem 2: SQLAlchemy Reserved Name 'metadata'

**Error**:

```
InvalidRequestError: Attribute name 'metadata' is reserved when using the Declarative API
```

**Root Cause**:

- `metadata` is a reserved attribute in SQLAlchemy Base class
- UserInteraction model tried to use it as column name

**Solution**:

```python
# Use different Python attribute name but keep DB column name
interaction_metadata: Mapped[dict[str, Any] | None] = mapped_column(
    "metadata", JSON, nullable=True  # ← DB column still named 'metadata'
)
```

**Result**: Model works correctly with database schema ✅

### Problem 3: Ruff Configuration Error

**Error**:

```
unknown field `indent-width`
```

**Root Cause**: Outdated ruff.toml configuration

**Solution**: Removed unsupported `indent-width` option from `[format]` section

**Result**: Ruff linting works ✅

---

## 🎓 Key Learnings

### 1. Repository Pattern

**Key Insight**: Split interface (domain) from implementation (infrastructure)

```python
# Domain defines WHAT we need
class InteractionRepository(ABC):
    @abstractmethod
    async def get_all_interactions(self) -> list[Interaction]:
        pass

# Infrastructure defines HOW we do it
class SQLAlchemyInteractionRepository(InteractionRepository):
    async def get_all_interactions(self) -> list[Interaction]:
        # Implementation using SQLAlchemy
        pass
```

**Benefits**:

- Easy testing with mocks
- Swap implementations without changing business logic
- Domain remains independent of frameworks

### 2. Type Safety with SQLAlchemy 2.0

**New Style** (SQLAlchemy 2.0):

```python
class UserInteraction(Base):
    __tablename__ = "user_interaction"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    interaction_type: Mapped[str] = mapped_column(String, nullable=False)
```

**Benefits**:

- IDE autocomplete for all fields
- Type checker catches errors before runtime
- Self-documenting code

### 3. Async Testing Gotchas

**Issue**: Event loops don't survive between tests

**Solution**: Dispose async resources after each test

```python
@pytest.fixture(autouse=True)
async def cleanup():
    yield
    await async_engine.dispose()
```

### 4. TDD Discipline

**Key Principle**: If you didn't watch the test fail, you don't know if it works

**Process**:

1. Write test → Watch it fail → Implement → Watch it pass
2. Never skip the "watch it fail" step
3. Write minimal code to pass (no gold plating)

### 5. Clean Architecture Benefits

**Separation of Concerns**:

- Change database? Only touch infrastructure layer
- Change API framework? Only touch presentation layer
- Change ML algorithm? Only touch infrastructure/ml layer
- Business logic never changes ✅

---

## 🔗 References

### Documentation

- **Clean Architecture**: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- **Our ML docs**: `docs/ML_RECOMMENDATION_SYSTEM.md`
- **Project plan**: `plan.md` (Phase 2)
- **This session**: `ml-service/SESSION_SUMMARY.md`

### Technologies

- **FastAPI**: https://fastapi.tiangolo.com/
- **SQLAlchemy 2.0**: https://docs.sqlalchemy.org/en/20/
- **Ruff**: https://docs.astral.sh/ruff/
- **uv**: https://github.com/astral-sh/uv
- **pytest-asyncio**: https://pytest-asyncio.readthedocs.io/

---

## 💡 Next Steps (When You Resume)

### Immediate Actions

1. **Verify Environment**:

   ```bash
   cd /Users/unknowntpo/repo/unknowntpo/threads-nextjs/ml-service
   uv run pytest  # Should see 7 passing tests
   ```

2. **Review Completed Work**:
   - Read `README.md` for full documentation
   - Check `docs/ML_RECOMMENDATION_SYSTEM.md` for architecture
   - Review test files to understand coverage

3. **Choose Next Task**:
   - **Option A**: Integrate with Next.js feed API (high priority)
   - **Option B**: Set up Docker Compose (infrastructure)
   - **Option C**: Create training pipeline (ML operations)
   - **Option D**: Add CI/CD workflow (automation)

### Recommended Next Task: Next.js Integration

**Why**: Connects ML service to actual application

**Steps**:

1. Create HTTP client in Next.js (`lib/services/ml-service.ts`)
2. Update feed repository to call ML service
3. Add fallback to random feed if ML service fails
4. Update feed API route to use ML recommendations
5. Test end-to-end flow

**Estimated Time**: 2-3 hours

---

## 📍 Environment Details

**Project Root**: `/Users/unknowntpo/repo/unknowntpo/threads-nextjs/`
**ML Service**: `/Users/unknowntpo/repo/unknowntpo/threads-nextjs/ml-service/`
**Database**: `postgresql://postgres:postgres@localhost:5433/threads`
**Python**: 3.11.12
**Platform**: macOS (Darwin 25.0.0)

**Virtual Environment**: `.venv/` (managed by uv)

---

## 🎯 Success Metrics

### Current Achievements

✅ **Architecture**: Clean, testable, maintainable
✅ **Type Safety**: 100% typed with SQLAlchemy `Mapped[]`
✅ **Test Coverage**: 77% (7/7 tests passing)
✅ **Code Quality**: Ruff validated
✅ **Documentation**: Comprehensive README + session summary
✅ **TDD**: Strict RED-GREEN-REFACTOR followed

### Future Goals

🎯 **Test Coverage**: Increase to 85%+
🎯 **Performance**: <100ms recommendation generation
🎯 **Integration**: Connected to Next.js feed
🎯 **Deployment**: Docker Compose + CI/CD
🎯 **Monitoring**: Logging + metrics tracking

---

## 📝 Notes for Future Sessions

1. **Always run tests first**: `uv run pytest` to verify environment
2. **Check database**: Ensure PostgreSQL is running on port 5433
3. **Review pending tasks**: See todo list above
4. **Follow TDD**: Write test first, watch fail, implement, watch pass
5. **Document decisions**: Update this file with new learnings

---

## 🤝 Contributing Guidelines (If Sharing)

When working on this codebase:

1. **Follow Clean Architecture**: Keep layers separate
2. **Write tests first (TDD)**: No code without failing test
3. **Use type hints**: Everything must be typed
4. **Run Ruff**: `uv run ruff check --fix` before committing
5. **Update docs**: Keep README and session summary current
6. **Commit messages**: Use conventional commits format

---

**End of Session Summary**

_Last Updated: 2025-10-14_
_Status: Ready for Next.js integration or Docker Compose setup_
