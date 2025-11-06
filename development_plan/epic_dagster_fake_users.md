# Epic: Dagster + Ollama Fake User Simulation 🤖

**Status:** 📋 Planned
**Priority:** Medium - Enhances ML model training with realistic data
**Effort:** ~16-24 hours (estimated)

## Goal

Automate realistic user behavior simulation for ML training data generation using Dagster orchestration and Ollama LLM.

## Deliverable

Dagster-orchestrated fake users generating interest-based posts and interactions that match real user behavior patterns.

## Documentation

[DAGSTER_FAKE_USER_SIMULATION.md](../docs/DAGSTER_FAKE_USER_SIMULATION.md)

## Architecture

### Components

```
Docker Compose Services
├── Ollama (LLM Service)
│   ├── Model: Gemma 3 270M
│   ├── Port: 11434
│   └── Auto-pull on startup
├── Dagster Webserver (UI)
│   ├── Port: 3000
│   └── Asset orchestration
└── Dagster Daemon
    ├── Background execution
    ├── Schedules (1-min continuous)
    └── Manual triggers
```

### Data Flow

```
1. Dagster Asset: fake_users
   ↓ Ensure 5-10 bots exist with interests

2. Dagster Asset: generated_posts
   ↓ Create posts every 1 min (Ollama LLM)

3. Dagster Asset: simulated_interactions
   ↓ Generate likes, views, comments (interest-based matching)

4. Database: user_interactions
   ↓ ML training data

5. ML Model Training
   ↓ Better recommendations
```

## Features Planned

### LLM Service

**File:** `app/infrastructure/llm/ollama_service.py`

- [ ] **Content Generation**
  - Generate posts based on user interest (sports, tech, anime, cars, food)
  - Generate comments contextual to post content
  - Interest-based language patterns
  - Realistic post lengths (50-500 characters)

- [ ] **Interest Matching**
  - Calculate interest overlap between users
  - Determine interaction probability based on interests
  - Random exploration (10% chance) for diversity

### Fake User Factory

**File:** `app/domain/factories/fake_user_factory.py`

- [ ] **User Creation**
  - Create users with "FAKE_USER" bio marker
  - Assign interests from predefined categories
  - Generate realistic usernames (e.g., "sports_fan_123")
  - No schema changes (uses existing Prisma User table)

- [ ] **Interest Categories**
  - Sports (NBA, NFL, soccer, etc.)
  - Technology (AI, web dev, crypto, etc.)
  - Anime (popular shows, characters, etc.)
  - Cars (brands, models, racing, etc.)
  - Food (cuisines, recipes, restaurants, etc.)

### Dagster Assets

**File:** `dagster_project/assets/fake_user_simulation.py`

- [ ] **Asset: fake_users**
  - Check if 5-10 fake users exist
  - Create missing fake users with random interests
  - Runs once on startup, then checks periodically

- [ ] **Asset: generated_posts**
  - Each fake user creates 1-3 posts per run
  - Uses Ollama to generate interest-based content
  - Runs every 1 minute (configurable)
  - Includes post metadata (source: "fake_user")

- [ ] **Asset: simulated_interactions**
  - For each new post, determine potential interactors
  - Match interests between post author and other fake users
  - Generate interactions:
    - View (high probability)
    - Like (medium probability, interest-dependent)
    - Comment (low probability, LLM-generated)
  - Realistic timing (0-60 seconds after post creation)

### Docker Services

**File:** `docker-compose.yml`

- [ ] **Ollama Service**
  - Image: `ollama/ollama:latest`
  - Auto-pull Gemma 3 270M model on startup
  - Volume mount for model persistence
  - Health check endpoint

- [ ] **Dagster Webserver**
  - Port 3000 (UI dashboard)
  - Environment configuration
  - PostgreSQL connection

- [ ] **Dagster Daemon**
  - Background job execution
  - Schedule processing
  - Sensor evaluation

## Testing Strategy

### Unit Tests

- [ ] Test fake user creation logic
- [ ] Test interest matching algorithm
- [ ] Test Ollama service integration
- [ ] Test post generation quality

### Integration Tests

- [ ] Test full Dagster pipeline execution
- [ ] Test database writes (posts, interactions)
- [ ] Test LLM response handling
- [ ] Test error recovery

### E2E Tests

1. ✅ All services start via `docker-compose up`
2. ✅ Fake users created with bio marker
3. ✅ Posts generated every 1 min
4. ✅ Interactions match user interests
5. ✅ Manual trigger from Dagster UI works
6. ✅ ML model trains on synthetic data

## Configuration

### Environment Variables

```bash
# Ollama
OLLAMA_HOST=http://ollama:11434
OLLAMA_MODEL=gemma3:270m

# Dagster
DAGSTER_HOME=/opt/dagster/dagster_home
DAGSTER_POSTGRES_HOST=postgres
DAGSTER_POSTGRES_DB=dagster

# Fake Users
FAKE_USER_COUNT_MIN=5
FAKE_USER_COUNT_MAX=10
POST_GENERATION_INTERVAL=60  # seconds
INTERACTION_PROBABILITY=0.7  # 70% chance
```

### Dagster Schedules

```python
@schedule(
    cron_schedule="* * * * *",  # Every minute
    job=simulate_user_activity,
    execution_timezone="UTC"
)
def fake_user_schedule(context):
    return {}
```

## Technical Decisions

### Why Ollama?

- **Local LLM**: No API costs (unlike OpenAI)
- **Privacy**: Data stays local
- **Lightweight**: Gemma 3 270M fits in memory
- **Fast**: Sufficient for content generation

### Why Gemma 3 270M?

- **Size**: Small enough for local deployment
- **Quality**: Good enough for fake posts
- **Speed**: Fast inference for real-time generation
- **Free**: No licensing costs

### Why Dagster?

- **Orchestration**: Built for data pipelines
- **Scheduling**: Native cron support
- **UI**: Web dashboard for monitoring
- **Sensors**: Event-driven execution
- **Partitioning**: Time-based data management

### Why Interest-Based Matching?

- **Realism**: Mimics real social network behavior
- **ML Training**: Creates meaningful interaction patterns
- **Diversity**: Allows for unexpected interactions
- **Scalability**: Easy to add new interest categories

## Database Schema

### Fake User Marker

```sql
-- Uses existing User table
-- Identifies fake users by bio field
UPDATE users
SET bio = 'FAKE_USER|interests:sports,tech'
WHERE id IN (...)
```

### Interaction Metadata

```json
{
  "source": "fake_user",
  "interest_match_score": 0.75,
  "generated_by": "ollama",
  "model_version": "gemma3:270m"
}
```

## Deployment Strategy

### Local Development

1. Start services: `docker-compose up`
2. Access Dagster UI: http://localhost:3000
3. Trigger assets manually or wait for schedule
4. Monitor logs for post generation

### Production (GCP)

- [ ] Deploy Dagster to GCP k8s
- [ ] Deploy Ollama as sidecar container
- [ ] Configure persistent volume for Ollama models
- [ ] Set up monitoring and alerts

## Monitoring

### Metrics to Track

- Fake users created per day
- Posts generated per minute
- Interactions created per minute
- LLM response time
- Dagster job success rate
- Interest distribution balance

### Dashboards

- Dagster UI (built-in)
- Custom Grafana dashboard (future)
- Database queries for analytics

## Future Enhancements

- [ ] More interest categories
- [ ] Multi-interest users
- [ ] Friendship graphs (fake users follow each other)
- [ ] Trending topics simulation
- [ ] Time-of-day activity patterns
- [ ] Comment threads (fake users reply to each other)
- [ ] Media generation (images for posts)

## Related Documentation

- [Dagster Official Docs](https://docs.dagster.io)
- [Ollama Documentation](https://ollama.ai/docs)
- [Gemma Model Card](https://ai.google.dev/gemma)

## Dependencies

### Python Packages

```
dagster
dagster-webserver
dagster-postgres
ollama
prisma
pydantic
```

### Docker Images

- `ollama/ollama:latest`
- `dagster/dagster:latest`
- PostgreSQL (existing)

## Status

📋 **Planned**

- Pending GCP deployment stabilization
- Requires Dagster container deployment to k8s
- Specification complete, ready for implementation

**Blockers:**

- None (can start implementation anytime)

**Next Steps:**

1. Set up Docker Compose configuration
2. Implement fake user factory
3. Implement Ollama service wrapper
4. Create Dagster assets
5. Test locally with docker-compose
6. Deploy to GCP k8s
