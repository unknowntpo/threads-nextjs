# Dagster + Ollama Fake User Simulation

## Overview

Orchestrate realistic fake user behavior using Dagster workflows and Ollama LLM (Gemma 3 270M). Fake users generate posts, likes, comments, and interactions based on their interests.

---

## Architecture

### Services (Docker Compose)

**Existing**:

- `postgres` (5433) - Shared database
- `keycloak` (8080) - Auth
- `ml-service` (8001) - FastAPI ML API

**New**:

- `ollama` (11434) - LLM server with Gemma 3 270M (auto-pulled on startup)
- `dagster` (3000) - Orchestration UI + daemon

### Data Flow

```
Dagster Schedule (1 min)
  ↓
fake_users → generated_posts → simulated_interactions
  ↓
PostgreSQL
  ↓
ML collaborative filtering
```

---

## Fake User Design

**No schema changes** - Uses existing `user` table

**Marker**: `bio` field = `"FAKE_USER: {interest} enthusiast"`

**Interests**: sports, tech, anime, cars, food (5-10 users total)

**Example**:

```
username: "sports_bot_a3f2"
bio: "FAKE_USER: Sports enthusiast"
```

---

## Docker Compose Changes

**File**: `docker-compose.yml`

### Add Services

```yaml
ollama:
  image: ollama/ollama:latest
  ports: ['11434:11434']
  volumes: [ollama_data:/root/.ollama]
  # Auto-pull Gemma model on startup
  entrypoint: >
    sh -c "ollama serve & sleep 5 && ollama pull gemma3:270m && wait"

dagster:
  build:
    context: ./ml-service
    dockerfile: Dockerfile.dagster
  ports: ['3000:3000']
  environment:
    DATABASE_URL: postgresql://postgres:postgres@postgres:5432/threads
    OLLAMA_BASE_URL: http://ollama:11434
  volumes:
    - ./ml-service:/app
    - dagster_data:/app/dagster_home
  command: dagster dev -h 0.0.0.0 -p 3000 -f dagster/repository.py
```

### Add Volumes

```yaml
volumes:
  ollama_data:
  dagster_data:
```

---

## Implementation Files

### 1. New Dockerfile

**File**: `ml-service/Dockerfile.dagster`

- Based on python:3.11-slim
- Installs uv + dependencies
- Runs `dagster dev` on port 3000

### 2. Dependencies

**File**: `ml-service/pyproject.toml`

Add:

```toml
dagster = "^1.9.0"
dagster-webserver = "^1.9.0"
ollama = "^0.4.0"
```

### 3. LLM Service Layer

**Interface**: `app/domain/services/llm_interface.py`

- `LLMInterface` (abstract class)
  - `generate_post(interest: str) -> str`
  - `generate_comment(post_content: str, interest: str) -> str`
  - `should_interact(post_content: str, interest: str) -> bool`
  - `generate_display_name(interest: str) -> str`

**Implementation**: `app/infrastructure/llm/ollama_service.py`

- `OllamaService(LLMInterface)`
  - Uses Ollama Python client
  - Connects to `http://ollama:11434`
  - Uses `gemma3:270m` model

### 4. Fake User Factory

**File**: `app/domain/factories/fake_user_factory.py`

- `FakeUserFactory`
  - `INTERESTS = ["sports", "tech", "anime", "cars", "food"]`
  - `create_fake_user(interest, llm_service) -> User`
    - Generates username: `{interest}_bot_{uuid}`
    - Sets bio: `"FAKE_USER: {interest} enthusiast"`
    - Uses LLM for display name

### 5. Database Helpers

**File**: `app/infrastructure/database/queries.py`

- `get_fake_users(session) -> list[User]` - Query users with `bio LIKE 'FAKE_USER%'`
- `extract_interest_from_bio(bio: str) -> str` - Parse interest from bio
- `get_recent_posts(session, hours=24) -> list[Post]` - Recent posts
- `count_fake_users(session) -> int` - Count fake users

### 6. Dagster Assets

**Directory**: `dagster/assets/`

**File**: `fake_users.py`

- `@asset fake_users(db, ollama)`
  - Ensures 5-10 fake users exist
  - Creates missing users with different interests

**File**: `posts.py`

- `@asset generated_posts(db, ollama)` (depends on fake_users)
  - Generates 1-3 posts per run
  - Uses Ollama to create content based on user interest

**File**: `interactions.py`

- `@asset simulated_interactions(db, ollama)` (depends on fake_users, generated_posts)
  - Simulates views, likes, comments
  - Uses Ollama to check interest match
  - Weighted actions: view 50%, like 30%, comment 20%

### 7. Dagster Jobs

**Directory**: `dagster/jobs/`

**File**: `continuous.py`

- `@job continuous_simulation()` - Runs posts + interactions
- `continuous_schedule` - Cron: `*/1 * * * *` (every 1 minute)

**File**: `manual.py`

- `@job manual_simulation()` - Full pipeline (users + posts + interactions)
- Triggered manually from Dagster UI

### 8. Dagster Resources

**Directory**: `dagster/resources/`

**File**: `db.py`

- `DBResource(ConfigurableResource)`
  - `get_session()` - Returns SQLAlchemy session

**File**: `ollama.py`

- `OllamaResource(ConfigurableResource)`
  - `base_url: str`
  - `model: str`
  - `get_service() -> OllamaService`

### 9. Dagster Repository

**File**: `dagster/repository.py`

- `Definitions`
  - Assets: fake_users, posts, interactions
  - Jobs: continuous_simulation, manual_simulation
  - Schedules: continuous_schedule
  - Resources: db, ollama

---

## Directory Structure

```
ml-service/
├── Dockerfile.dagster (NEW)
├── dagster/ (NEW)
│   ├── __init__.py
│   ├── repository.py
│   ├── assets/
│   │   ├── fake_users.py
│   │   ├── posts.py
│   │   └── interactions.py
│   ├── jobs/
│   │   ├── continuous.py
│   │   └── manual.py
│   └── resources/
│       ├── db.py
│       └── ollama.py
└── app/
    ├── domain/
    │   ├── services/
    │   │   └── llm_interface.py (NEW)
    │   └── factories/
    │       └── fake_user_factory.py (NEW)
    └── infrastructure/
        ├── llm/
        │   └── ollama_service.py (NEW)
        └── database/
            └── queries.py (NEW)
```

---

## Usage

### Start Everything

```bash
docker-compose up -d --build
```

Services:

- Dagster UI: http://localhost:3000
- ML Service: http://localhost:8001
- Ollama: http://localhost:11434

### Enable Continuous Simulation

1. Open http://localhost:3000
2. Jobs → continuous_simulation → Schedules
3. Toggle ON

### Manual Trigger

1. Jobs → manual_simulation
2. Launch Run

### Verify

```sql
-- Check fake users
SELECT username, bio FROM "user" WHERE bio LIKE 'FAKE_USER%';

-- Check posts from bots
SELECT p.content, u.username
FROM post p
JOIN "user" u ON p.user_id = u.id
WHERE u.bio LIKE 'FAKE_USER%'
ORDER BY p.created_at DESC LIMIT 10;
```

---

## File Summary

**New Files** (17):

1. `ml-service/Dockerfile.dagster`
2. `ml-service/dagster/repository.py`
3. `ml-service/dagster/assets/fake_users.py`
4. `ml-service/dagster/assets/posts.py`
5. `ml-service/dagster/assets/interactions.py`
6. `ml-service/dagster/jobs/continuous.py`
7. `ml-service/dagster/jobs/manual.py`
8. `ml-service/dagster/resources/db.py`
9. `ml-service/dagster/resources/ollama.py`
10. `ml-service/app/domain/services/llm_interface.py`
11. `ml-service/app/infrastructure/llm/ollama_service.py`
12. `ml-service/app/domain/factories/fake_user_factory.py`
13. `ml-service/app/infrastructure/database/queries.py`
14. Plus `__init__.py` files

**Modified Files** (2):

1. `docker-compose.yml` - Add ollama + dagster services
2. `ml-service/pyproject.toml` - Add dependencies

---

## Success Criteria

✅ All services start with `docker-compose up`
✅ Ollama auto-pulls gemma3:270m (no manual script)
✅ Dagster UI accessible at http://localhost:3000
✅ 5-10 fake users with `"FAKE_USER"` in bio
✅ Posts generated every 1 min
✅ Interactions based on interest matching
✅ Manual trigger works
✅ No Prisma schema changes
