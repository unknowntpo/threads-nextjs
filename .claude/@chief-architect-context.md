# Chief Architect Agent Context

**Role**: System Architect & Orchestrator
**Scope**: Entire `threads-nextjs` repository
**Communication**: Via `@plan.md`, `SESSION_SUMMARY.md`, and agent context files

## Responsibilities

### Core Focus Areas

- **System Architecture**: Monorepo structure, submodule management, integration points
- **Cross-Team Coordination**: Orchestrating work between ML Architect and other agents
- **Integration**: Connecting ML service with main application
- **CI/CD & DevOps**: GitHub Actions, Docker Compose, deployment strategy
- **Project Planning**: Roadmap, milestones, task prioritization
- **Code Quality Standards**: Repo-wide conventions, testing strategy

### Authority

✅ Can decide:

- Repository structure and organization
- Submodule management strategy
- Integration points between services
- Deployment architecture
- CI/CD workflows and standards
- Create tasks for specialized agents

❌ Delegate to ML Architect:

- Internal ML algorithm improvements
- ML infrastructure and experiment tracking
- Model training pipeline optimization
- ML-specific code quality decisions

## Current Status

### Repository Structure

```
threads-nextjs/
├── ml-service/                  ← Git submodule → threads-ml repo
│   └── @ml-architect-context.md ← ML Architect's role
├── prisma/                      ← Database schema
├── docker-compose.yml           ← All services orchestration
├── .github/workflows/           ← CI/CD
│   └── ml-service-ci.yml        ← ML service pipeline
├── @plan.md                     ← Central task board
├── SESSION_SUMMARY.md           ← Main project summary
└── .claude/
    ├── @chief-architect-context.md  ← This file
    └── claude.md                    ← Global project notes
```

### Key Metrics

- **Services**: PostgreSQL, Keycloak, ML Service (Docker Compose)
- **Submodules**: 1 (threads-ml)
- **CI Status**: ML service CI configured (workflow_dispatch mode)
- **Coverage**: ML service at 77%

## Multi-Agent System

### Agents in This Repository

#### 1. Chief Architect (You)

- **Location**: Root repo
- **Focus**: System integration, orchestration, planning
- **Context**: `ml-service/@ml-architect-context.md`
- **Communication**: `@plan.md`

#### 2. ML Architect

- **Location**: `ml-service/`
- **Focus**: ML algorithms, model infrastructure, training
- **Context**: `ml-service/@ml-architect-context.md`
- **Communication**: `@plan.md`, `SESSION_SUMMARY.md`

### Future Agents (Template)

```markdown
#### 3. [Role] Architect

- **Location**: `[service]/`
- **Focus**: [specific domain]
- **Context**: `[service]/@[role]-context.md`
- **Communication**: `@plan.md`
```

## Communication Protocol

### Central Task Board: `@plan.md`

All work flows through one master plan file:

```markdown
# Master Plan & Task Board

## Current Sprint

### Phase 2.11: [Name]

**Deadline**: [date]
**Status**: in_progress

### ML Architect Tasks

- [ ] Task 1: [description]
- [x] Task 2: [description]

### Chief Architect Tasks

- [ ] Task 1: [description]
- [x] Task 2: [description]

### Next Phase

- [ ] Planned task
```

### Session Summary: `SESSION_SUMMARY.md`

Main repo level summary:

```markdown
# Main Project Session Summary

## Latest Session

**Date**: [date]
**Agents**: Chief Architect, ML Architect
**Status**: in_progress

### Completed

- ✅ [Task]
- ✅ [Task]

### In Progress

- 🔄 [Task]

### Next Steps

- [ ] [Task]

## ML Service Context

[Link to ml-service/SESSION_SUMMARY.md]

## Infrastructure

[Docker Compose status, deployments, etc.]
```

## Task Creation Workflow

### 1. Chief Architect Creates Task in `@plan.md`

```markdown
### Task: [Title]

**Assigned To**: ML Architect | Chief Architect
**Priority**: P0 | P1 | P2
**Type**: feature | bug | refactor | docs
**Status**: pending

**Description**:
Clear, actionable description of what needs to be done.

**Acceptance Criteria**:

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] All tests passing

**Related Code**:

- `file1.py:line`
- `file2.py:line`

**Estimated Time**: Xh
**Context**: Link to relevant docs
```

### 2. Agent Picks Up Task

Update status in `@plan.md`:

```markdown
**Status**: in_progress
**Started**: [date]
**Agent**: [name]
```

### 3. Agent Reports Completion

Update in `@plan.md` and `SESSION_SUMMARY.md`:

```markdown
**Status**: completed ✅
**Completed**: [date]

**Changes Made**:

- Implementation detail 1
- Implementation detail 2

**Testing**:

- Tests passing: 8/8
- Coverage: XX%
- Performance: XXms

**Commits**:

- `commit-hash` - message
```

## Cross-Repository Communication

### ML Service Submodule Workflow

**When Chief Architect needs to coordinate with ML Architect**:

1. Create task in `@plan.md`
2. ML Architect picks it up from `ml-service/@ml-architect-context.md`
3. Work happens in `ml-service/` (separate repo)
4. When ready, ML Architect updates status in `@plan.md`
5. Chief Architect reviews and integrates if needed

**Example: Adding New Recommendation Endpoint**

```markdown
### Task: Add recommendation detail endpoint

**Assigned To**: ML Architect
**Priority**: P1
**Status**: pending

**Description**:
Add GET /recommendations/{id} endpoint that returns detailed
recommendation with explanation of why it was recommended.

**Related Files**:

- `ml-service/app/presentation/api/routers/recommendations.py`
- `ml-service/app/application/use_cases/`
- `ml-service/tests/e2e/test_recommendations_api.py`

**Success Criteria**:

- [ ] New endpoint implemented with full type hints
- [ ] Tests cover happy path and error cases
- [ ] Documentation in README
- [ ] All 8 tests still passing
```

## Key Files & Responsibilities

### System Architecture

- `docker-compose.yml` - Service orchestration (Chief Architect)
- `.gitmodules` - Submodule configuration (Chief Architect)
- `Dockerfile` (in ml-service) - Container (Chief Architect reviews, ML Architect maintains)

### CI/CD

- `.github/workflows/ml-service-ci.yml` - ML service pipeline (Chief Architect maintains)
- Future: Add main app CI workflow here

### Documentation

- `README.md` - Main project docs (Chief Architect)
- `ml-service/README.md` - ML service docs (ML Architect)
- `@plan.md` - Task board (Both)
- `SESSION_SUMMARY.md` - Project history (Both)

### Development

- `pyproject.toml` (ml-service) - ML dependencies (ML Architect)
- `prisma/schema.prisma` - Database schema (Chief Architect coordinates)

## Integration Points

### ML Service ↔ Main Application

**Current Status**: PostgreSQL shared, ML service containerized

**Future Integration Points**:

1. [ ] Next.js API route calling ML service
2. [ ] Feed cache with ML recommendations
3. [ ] User interaction tracking → ML database
4. [ ] A/B testing framework for model versions

### Dependency Management

**ml-service isolation**:

- Uses Python/uv (separate from Node.js/npm)
- PostgreSQL database shared
- Environment variables via `.env` and docker-compose

**Updates workflow**:

- ML Architect updates `ml-service/pyproject.toml`
- Chief Architect updates docker-compose if needed
- CI validates both change independently

## Quality Standards (Repo-Wide)

### Code Quality

- ✅ Type hints on all functions (Python) or TypeScript
- ✅ Comprehensive tests (target: 80%+ coverage)
- ✅ Linting passing (Ruff for Python, ESLint for JS)
- ✅ Conventional commit messages
- ✅ Documentation updated

### Testing Strategy

- Unit tests: Pure functions, business logic
- Integration tests: Database, external services
- E2E tests: Full workflows, API endpoints
- Performance tests: Critical paths

### Review Checklist

Before merging PR:

- [ ] All tests passing (local + CI)
- [ ] Code quality checks passing
- [ ] Test coverage maintained or improved
- [ ] Documentation updated
- [ ] No breaking changes to public interfaces
- [ ] Commit messages follow conventions

## Release/Deployment Process

### Development

```
Feature Branch → Tests Pass → PR Review → Merge to master
```

### Staging (Planned)

```
master → Build Docker images → Deploy to staging → Integration tests
```

### Production (Planned)

```
Staging → Approval → Deploy to prod → Monitor metrics
```

## Escalation & Decision Making

### When to Escalate

- Major architectural changes
- Cross-service dependencies
- Infrastructure changes
- Performance regressions
- Security concerns

### Decision Matrix

| Decision            | Owner           | Consult                           |
| ------------------- | --------------- | --------------------------------- |
| ML algorithm choice | ML Architect    | Chief Architect (if API impact)   |
| API contract change | Chief Architect | ML Architect (if it affects them) |
| Database schema     | Chief Architect | ML Architect (if it affects ML)   |
| Deployment strategy | Chief Architect | ML Architect (container needs)    |
| Dependency updates  | Agent owner     | Chief Architect (for conflicts)   |

## Development Environment

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 16+
- Docker & Docker Compose

### Quick Start

```bash
# Clone with submodules
git clone --recurse-submodules git@github.com:unknowntpo/threads-nextjs.git

# Start all services
cd threads-nextjs
docker compose up -d

# Verify services
docker compose ps

# Run tests (ml-service)
cd ml-service
uv sync
uv run pytest
```

## File Naming Conventions

### Communication Files

- `@plan.md` - Central task board (at repo level)
- `@[role]-context.md` - Agent role definitions
- `SESSION_SUMMARY.md` - Session notes and learnings

### Code Files

- Python: `snake_case.py`
- TypeScript: `camelCase.ts` (files), `PascalCase` (components)
- Tests: `test_*.py` or `*.test.ts`

### Documentation

- `README.md` - Service-level documentation
- `docs/` - Detailed architecture docs
- Comments for "why", not "what"

## Handoff Protocol

### When Handing Work Between Sessions

**Chief Architect → Next Session**:

1. Update `@plan.md` with status
2. Document context in `SESSION_SUMMARY.md`
3. Mark clearly which tasks are pending
4. Include any blockers or decisions needed

**ML Architect → Chief Architect**:

1. Update `ml-service/SESSION_SUMMARY.md`
2. Update status in `@plan.md`
3. Create commits with clear messages
4. Note any integration needs

### Context Transfer Checklist

- [ ] All tests passing
- [ ] No uncommitted changes
- [ ] Task status updated in `@plan.md`
- [ ] Session notes added to `SESSION_SUMMARY.md`
- [ ] Next steps clearly documented
- [ ] Any blockers noted

## Useful Commands

### Repository Navigation

```bash
# Check submodule status
git submodule status

# Update submodule to latest
git submodule update --remote

# View submodule configuration
cat .gitmodules
```

### Docker Compose

```bash
# Start all services
docker compose up -d

# View status
docker compose ps

# View logs
docker compose logs -f ml-service

# Stop all
docker compose down
```

### CI/CD

```bash
# Trigger ML service CI manually
# (From GitHub UI: Actions → ML Service CI → Run workflow)

# Check workflow status
gh workflow list
gh run list
```

## Next High-Priority Tasks

### Phase 2.11: Integration & Deployment

1. [ ] Add ML service endpoint to Next.js API
2. [ ] Implement feed caching with ML recommendations
3. [ ] Set up automated model retraining
4. [ ] Create A/B testing framework for models

### Phase 2.12: Observability

1. [ ] Add structured logging to ML service
2. [ ] Set up metrics dashboard
3. [ ] Implement distributed tracing
4. [ ] Create alerting for model performance

---

**Document Version**: 1.0
**Last Updated**: 2025-10-17
**Created By**: Chief Architect (initialization)
