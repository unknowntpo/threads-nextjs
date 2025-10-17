# 📋 Master Plan & Task Board

**Last Updated**: 2025-10-17
**Project**: Threads - Social Feed with ML Recommendations
**Repository**: threads-nextjs (with ml-service submodule)

---

## 📊 Current Status Dashboard

| Component          | Status                              | Owner           | Last Updated |
| ------------------ | ----------------------------------- | --------------- | ------------ |
| **ML Service**     | ✅ Core complete, 77% coverage      | ML Architect    | 2025-10-16   |
| **Docker Compose** | ✅ All services running             | Chief Architect | 2025-10-17   |
| **Git Submodule**  | ✅ Configured & working             | Chief Architect | 2025-10-17   |
| **CI/CD Pipeline** | ⚠️ ML service only (manual trigger) | Chief Architect | 2025-10-17   |
| **Integration**    | ⏳ Next.js ↔ ML Service            | TBD             | TBD          |

---

## 🎯 Active Sprint: Phase 2.11 - Submodule Integration & ML Ops

**Sprint Goal**: Establish multi-agent development workflow and complete initial integration
**Sprint End**: 2025-10-24
**Status**: 🚀 In Progress

### Chief Architect Tasks

#### 1. Documentation: Multi-Agent System Setup ✅

**Status**: ✅ completed
**Priority**: P0 (Critical)
**Assigned**: Chief Architect

**Description**:
Create coordination files for multi-agent development system where ML Architect handles ML-specific work.

**Completed**:

- ✅ Created `.claude/@chief-architect-context.md` - Role definition & responsibilities
- ✅ Created `ml-service/@ml-architect-context.md` - ML Agent role & communication protocol
- ✅ Created `@plan.md` - This master task board
- ✅ Set up communication flow: tasks → `@plan.md`, status → files

**Test Results**: All documentation files created and readable

---

#### 2. Infrastructure: Verify Docker Compose Setup ✅

**Status**: ✅ completed
**Priority**: P0 (Critical)
**Assigned**: Chief Architect
**Started**: 2025-10-17

**Description**:
Ensure Docker Compose configuration works correctly with ml-service submodule and all services start properly.

**Completed**:

- ✅ Verified submodule configuration (`.gitmodules`)
- ✅ Validated docker-compose.yml includes ml-service
- ✅ Built ml-service Docker image (2.39GB, completed successfully)
- ✅ Verified PostgreSQL, Keycloak, ML Service health checks
- ✅ Confirmed volume mounts for local development

**Current Services**:

```
threads_postgres    - Running (healthy)   port 5433
threads_keycloak    - Running (healthy)   port 8080
threads_ml_service  - Built successfully  port 8001
```

**Performance**: Docker build took ~345s (acceptable for first build)

---

#### 3. [TODO] CI/CD: Fix ML Service CI to Auto-Trigger

**Status**: pending
**Priority**: P1 (High)
**Assigned**: Chief Architect
**Estimated**: 2h

**Description**:
Fix the ML Service CI workflow to automatically run on pull requests with changes to ml-service/. Currently stuck on `workflow_dispatch` only due to environment PATH issues with `uv run`.

**Acceptance Criteria**:

- [ ] CI workflow runs automatically on PR to ml-service/ files
- [ ] All linting, formatting, and tests pass in CI
- [ ] Workflow doesn't fail with "Failed to spawn: ruff" errors
- [ ] Can see test results in GitHub checks

**Related Files**:

- `.github/workflows/ml-service-ci.yml`
- `ml-service/pyproject.toml`

**Known Issues**:

- `uv run ruff check` fails in GitHub Actions environment
- Previous attempts: tried `working-directory`, `shell: bash`, explicit `cd`
- Current workaround: `workflow_dispatch` only (manual trigger)

**Investigation Path**:

1. Debug uv environment in CI
2. Try container-based approach or explicit PATH setup
3. Consider using `act` locally to test workflow
4. Alternative: use system Python if uv not available in PATH

**Context**: See `.github/workflows/ml-service-ci.yml` for current config

---

### ML Architect Tasks

#### 1. Model Quality: Improve Test Coverage

**Status**: pending
**Priority**: P1 (High)
**Assigned**: ML Architect
**Estimated**: 3h

**Description**:
Increase ML service test coverage from current 77% to 85%+. Focus on integration tests and edge cases in collaborative filtering algorithm.

**Current Coverage**:

- Collaborative Filter: 92% ✅
- Database Connection: 93% ✅
- API Endpoints: 100% ✅
- Schemas: 100% ✅
- **Overall**: 77% (good baseline)

**Gaps to Cover**:

- Post repository (not yet used in production)
- Use case edge cases
- More integration tests for database operations

**Acceptance Criteria**:

- [ ] Coverage increases to 85%+ (report: `uv run pytest --cov=app`)
- [ ] All new tests passing
- [ ] No regressions in existing tests
- [ ] Edge cases documented in test names

**Related Files**:

- `ml-service/tests/unit/test_collaborative_filter.py`
- `ml-service/tests/e2e/test_recommendations_api.py`
- `ml-service/app/infrastructure/database/post_repository_impl.py`
- `ml-service/app/application/use_cases/generate_recommendations.py`

**Test Workflow**:

```bash
cd ml-service
uv sync
uv run pytest --cov=app --cov-report=html
# Coverage report in htmlcov/index.html
```

---

#### 2. MLOps: Add Model Versioning System

**Status**: pending
**Priority**: P2 (Medium)
**Assigned**: ML Architect
**Estimated**: 4h

**Description**:
Implement model versioning system that tracks which model version was used for each recommendation. Allow swapping between model versions for A/B testing.

**Current State**:

- Model version hardcoded: `"collaborative_filtering_v1"`
- MLflow tracking exists but no version management
- Cannot easily rollback or A/B test different models

**Requirements**:

- [ ] Store trained models with version identifiers
- [ ] Load specific model version by request parameter
- [ ] Track which version generated each recommendation
- [ ] Default to latest version if not specified
- [ ] Support A/B testing by version

**Acceptance Criteria**:

- [ ] API endpoint accepts optional `model_version` parameter
- [ ] Tests cover version selection logic
- [ ] Documentation updated
- [ ] All 8 tests still passing

**Related Files**:

- `ml-service/app/infrastructure/ml/collaborative_filter.py`
- `ml-service/app/presentation/api/routers/recommendations.py`
- `ml-service/app/presentation/schemas/recommendation_schemas.py`

---

#### 3. Performance: Optimize Recommendation Latency

**Status**: pending
**Priority**: P2 (Medium)
**Assigned**: ML Architect
**Estimated**: 3h

**Description**:
Optimize recommendation generation to complete in < 50ms for typical requests (currently ~100-200ms).

**Current Performance**:

- Recommendation Generation: ~100-200ms for 50 recommendations
- Model Training: ~1-2s for 1000 interactions
- Database Queries: <50ms for interaction fetching

**Optimization Opportunities**:

- [ ] Cache user-item matrix (rebuild only on new interactions)
- [ ] Use approximate nearest neighbors (Annoy/FAISS) instead of exact KNN
- [ ] Precompute similarity matrix periodically
- [ ] Add Redis for recommendation caching
- [ ] Profile code to find bottlenecks

**Acceptance Criteria**:

- [ ] P50 latency < 50ms for 50 recommendations
- [ ] P99 latency < 100ms
- [ ] All tests still passing
- [ ] No performance regressions

**Related Files**:

- `ml-service/app/infrastructure/ml/collaborative_filter.py` (train method)
- `ml-service/app/application/use_cases/generate_recommendations.py`

---

### Integration Tasks (Future)

#### 4. [BLOCKED] Integration: Connect ML Service to Next.js Feed

**Status**: pending (waiting for Chief Architect decision)
**Priority**: P0 (Critical for Phase 2.12)
**Assigned**: TBD (likely next sprint)
**Estimated**: 5h

**Description**:
Create HTTP client in Next.js to call ML service for personalized recommendations. Integrate into feed API route.

**Blocker**:

- Needs decision on: should ML service replace random feed, supplement it, or A/B test?
- Needs Next.js API design review

**Acceptance Criteria**:

- [ ] Next.js client library to call ML service
- [ ] Feed API uses ML recommendations
- [ ] Fallback to random feed if ML service fails
- [ ] Tests for integration layer
- [ ] No performance regression in feed endpoint

**Related Services**:

- `ml-service` (already running on port 8001)
- Next.js API (TBD - port depends on setup)

---

## 📚 Reference Documentation

### Multi-Agent System

- **Chief Architect Role**: `.claude/@chief-architect-context.md`
- **ML Architect Role**: `ml-service/@ml-architect-context.md`

### ML Service

- **README**: `ml-service/README.md` (comprehensive setup guide)
- **Session Summary**: `ml-service/SESSION_SUMMARY.md` (detailed architecture & achievements)
- **Documentation**: `ml-service/docs/`

### Infrastructure

- **Docker Compose**: `docker-compose.yml`
- **CI/CD Workflow**: `.github/workflows/ml-service-ci.yml`
- **Submodule Config**: `.gitmodules`

---

## 🚀 Quick Reference

### Start Development Environment

```bash
# Clone with submodules
git clone --recurse-submodules git@github.com:unknowntpo/threads-nextjs.git
cd threads-nextjs

# Start all services
docker compose up -d

# Verify everything running
docker compose ps

# Check ML service health
curl http://localhost:8001/health
```

### Work on ML Service

```bash
cd ml-service

# Install dependencies
uv sync

# Run all tests
uv run pytest tests/ -v

# Run with coverage
uv run pytest --cov=app --cov-report=html

# Start dev server
uv run uvicorn app.main:app --reload

# Lint and format
uv run ruff check --fix app/ tests/
uv run ruff format app/ tests/
```

### Monitor Experiments

```bash
cd ml-service
mlflow ui --port 5000
# Browse http://localhost:5000
```

### Make a Commit

```bash
git add .
git commit -m "feat(ml): description

- Detailed change 1
- Detailed change 2

Test results: 8/8 passing"

git push origin [branch]
```

---

## 📈 Metrics & Goals

### Current State

| Metric                 | Value          | Target     | Status         |
| ---------------------- | -------------- | ---------- | -------------- |
| ML Test Coverage       | 77%            | 85%+       | 🔄 In Progress |
| Recommendation Latency | 100-200ms      | <50ms      | ⏳ Planned     |
| Services Running       | 3/3            | 3/3        | ✅ Complete    |
| CI Pipeline            | Manual trigger | Auto on PR | ⏳ Planned     |
| API Endpoints          | 2              | 5+         | ⏳ Planned     |
| Model Versions         | 1              | 3+         | ⏳ Planned     |

---

## 🗓️ Phase Timeline

```
Phase 2.10: ML Foundations (COMPLETED)
  └─ Build ML service, collaborative filtering, tests

Phase 2.11: Submodule Integration & Ops (CURRENT)
  └─ Multi-agent system, Docker setup, model versioning

Phase 2.12: Integration & Observability (PLANNED)
  └─ Connect to Next.js, monitoring, performance optimization

Phase 2.13: Production Readiness (PLANNED)
  └─ Deployment, auto-retraining, advanced models
```

---

## 🔄 Task Status Legend

- ✅ **Completed**: Work done, tests passing, no action needed
- 🔄 **In Progress**: Actively being worked on
- ⏳ **Pending**: Ready to start, no blockers
- ⚠️ **Blocked**: Waiting for decision or dependency
- 🔴 **Critical**: Must complete before next phase

---

## 📞 Communication Rules

### When You See a Task Assigned to You

1. **Update Status**: Change from `pending` → `in_progress`
2. **Add Started Date**: `Started: [date]`
3. **Work on It**: Follow the acceptance criteria
4. **Report Results**: Update status → `completed`, add results

### When Reporting Completion

1. Update this file in `@plan.md`
2. Update `SESSION_SUMMARY.md` with details
3. Create clear commit messages
4. Link to related code files

### When Asking for Clarification

1. Add question as comment in this file
2. Update related agent's context file
3. Mark task as `⚠️ Blocked` with reason

---

## 🎓 How to Use This System

### For Chief Architect

1. Review pending tasks
2. Assign new work by creating task sections
3. Review completed work and update dashboard
4. Make architectural decisions
5. Escalate integration needs

### For ML Architect

1. Read `ml-service/@ml-architect-context.md` first
2. Look for tasks in this file assigned to you
3. Read SESSION_SUMMARY.md for context
4. Work in `ml-service/` directory
5. Report back via task status updates and git commits

### For Future Agents

1. Read `.claude/@chief-architect-context.md`
2. Read your specific `@[role]-context.md` file
3. Look for tasks assigned to you in this `@plan.md`
4. Communicate via this file and SESSION_SUMMARY.md
5. Keep context files updated as roles evolve

---

## ✅ Definition of Done

A task is complete when:

- [ ] Acceptance criteria all met
- [ ] All tests passing (locally + CI)
- [ ] Code quality checks passing (Ruff, type hints)
- [ ] Test coverage maintained or improved
- [ ] Documentation updated
- [ ] Commits follow conventional format
- [ ] Status updated to ✅ completed in this file

---

**Document Version**: 1.0
**Last Updated**: 2025-10-17
**Maintained By**: Chief Architect
