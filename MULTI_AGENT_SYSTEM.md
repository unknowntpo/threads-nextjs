# 🤖 Multi-Agent Development System

**Established**: 2025-10-17
**Status**: ✅ Live and Operational
**Repository**: threads-nextjs with threads-ml submodule

---

## Overview

This project now uses a **multi-agent development system** where specialized agents coordinate work through well-defined communication protocols and context files.

### Why This System?

- **Specialization**: Each agent has deep expertise in their domain
- **Clear Responsibility**: No overlap, no confusion about who owns what
- **Scalability**: Easy to add new agents (Frontend Architect, DevOps, etc.)
- **Coordination**: Central task board ensures alignment
- **Context Preservation**: Role definitions help new sessions understand the system

---

## The Agents

### 1. Chief Architect 👨‍💼

**Role**: System orchestrator & integration expert

**Scope**: Entire `threads-nextjs` repository

- Docker Compose orchestration
- Git submodule management
- CI/CD workflows
- System architecture
- Cross-service integration

**Files**:

- Context: `.claude/@chief-architect-context.md`
- Tasks: `@plan.md`
- Reports: Main `SESSION_SUMMARY.md` (to be created)

**Responsibilities**:

- Plan sprints and create tasks
- Coordinate with other agents
- Review integration points
- Manage infrastructure
- Make architectural decisions

---

### 2. ML Architect 🧠

**Role**: ML infrastructure & algorithm expert

**Scope**: `ml-service/` submodule (threads-ml repo)

- ML algorithms and models
- Experiment tracking (MLflow)
- Model versioning & deployment
- Performance optimization
- Test coverage for ML components

**Files**:

- Context: `ml-service/@ml-architect-context.md`
- Tasks: `@plan.md` (assigned to ML Architect)
- Reports: `ml-service/SESSION_SUMMARY.md`

**Responsibilities**:

- Implement ML tasks from task board
- Maintain algorithm quality
- Track experiments with MLflow
- Optimize model performance
- Update ML service documentation

---

### 3. Future Agents (Template)

When adding new agents (Frontend Architect, DevOps, etc.):

1. Create context file: `.claude/@[role]-context.md`
2. Add role definition to `.claude/@chief-architect-context.md`
3. Create tasks in `@plan.md` for that role
4. Agent maintains their own `SESSION_SUMMARY.md` in their domain

---

## Communication Protocol

### Central Task Board: `@plan.md`

**Location**: `/threads-nextjs/@plan.md`
**Purpose**: Single source of truth for all work
**Updated**: Every session by working agent

**Structure**:

```markdown
## [Sprint Name] - [Phase #.##]

### Chief Architect Tasks

- [x] Task 1: description
- [ ] Task 2: description

### ML Architect Tasks

- [x] Task A: description
- [ ] Task B: description

### [Next Agent] Tasks

- [ ] Task X: description
```

**Task Format**:

```markdown
#### Task Name

**Status**: pending | in_progress | completed
**Priority**: P0 | P1 | P2
**Assigned**: [Agent]
**Estimated**: Xh

**Description**: What needs to be done

**Acceptance Criteria**:

- [ ] Criterion 1
- [ ] Criterion 2

**Related Files**:

- `path/to/file.py`

**Completed**:

- ✅ What was done
```

### Session Summaries

**Main Repository**: `SESSION_SUMMARY.md` (at root)

- High-level project status
- Cross-agent achievements
- Integration updates
- Infrastructure changes

**ML Service**: `ml-service/SESSION_SUMMARY.md`

- ML-specific achievements
- Algorithm improvements
- Experiment tracking updates
- Performance metrics

**Format**:

```markdown
## Session [N] - [Date]

### Agents

- Chief Architect
- ML Architect

### Completed

- ✅ Task 1
- ✅ Task 2

### In Progress

- 🔄 Task 3

### Next Steps

- [ ] Task 4
```

---

## How to Use (For Each Agent)

### Morning Standup (Start of Session)

1. **Read your context file**

   ```bash
   # For ML Architect
   cat ml-service/@ml-architect-context.md
   ```

2. **Check task board for assigned work**

   ```bash
   # Find tasks assigned to you in @plan.md
   grep -A 10 "ML Architect Tasks" @plan.md
   ```

3. **Review previous session summary**
   ```bash
   # Check what was accomplished last session
   cat ml-service/SESSION_SUMMARY.md | head -50
   ```

### During Session (Working on Task)

1. **Pick a task**
   - Update status: `pending` → `in_progress`
   - Add date started

2. **Work on it**
   - Follow acceptance criteria
   - Write tests first (TDD)
   - Run tests locally: `uv run pytest`

3. **Quality checks**
   - Lint: `uv run ruff check --fix`
   - Format: `uv run ruff format`
   - Type hints: On all functions

4. **Commit with clear message**

   ```bash
   git commit -m "feat(domain): description

   - Change 1
   - Change 2
   - Tests: 8/8 passing"
   ```

### End of Session (Handoff)

1. **Update task status** in `@plan.md`
   - Mark as `completed` ✅ if done
   - Keep as `in_progress` if continuing
   - Document any blockers

2. **Update session summary** in your domain's `SESSION_SUMMARY.md`

   ```markdown
   ### Session [N] - [Date]

   **Completed**:

   - ✅ Task: description

   **In Progress**:

   - 🔄 Task: description
   ```

3. **Push changes**

   ```bash
   git push origin master
   ```

4. **No uncommitted changes**
   - Verify: `git status` shows clean working directory
   - Save all work to commits

---

## Task Workflow Example

### Chief Architect Creates Task

**In `@plan.md`**:

```markdown
### ML Architect Tasks

#### 1. Model Quality: Improve Test Coverage

**Status**: pending
**Priority**: P1 (High)
**Assigned**: ML Architect
**Estimated**: 3h

**Description**:
Increase ML service test coverage from 77% to 85%+.
Focus on integration tests and edge cases.

**Acceptance Criteria**:

- [ ] Coverage increases to 85%+
- [ ] All 8 tests passing
- [ ] No regressions
- [ ] Edge cases documented

**Related Files**:

- `ml-service/tests/unit/test_collaborative_filter.py`
- `ml-service/app/infrastructure/ml/collaborative_filter.py`
```

### ML Architect Picks It Up

1. Reads task in `@plan.md`
2. Updates status: `pending` → `in_progress`
3. Adds date: `Started: 2025-10-17`
4. Works on implementation

### ML Architect Reports Completion

**Updates in `@plan.md`**:

```markdown
**Status**: completed ✅
**Completed**: 2025-10-17

**Changes Made**:

- Added 5 new integration tests for database operations
- Added 3 edge case tests for CF algorithm
- Coverage: 77% → 86% ✅

**Test Results**: 13/13 passing (was 8/8)

**Commits**:

- `abc1234` - test(ml): add integration tests for post repository
- `def5678` - test(ml): add edge case coverage for CF algorithm
```

**Updates in `ml-service/SESSION_SUMMARY.md`**:

```markdown
### Session 3 - 2025-10-17

**Completed**:

- ✅ Improved test coverage from 77% → 86%
  - Added integration tests
  - Added edge case tests
  - All 13 tests passing

**Metrics**:

- Test Coverage: 86% (was 77%)
- All tests: 13/13 passing
- Performance: No regressions
```

### Chief Architect Reviews & Approves

- Sees update in `@plan.md` and `SESSION_SUMMARY.md`
- Verifies in GitHub: tests passing in CI
- Ready for next task

---

## Files in This System

### Communication Files (Root)

| File                                  | Owner | Purpose              |
| ------------------------------------- | ----- | -------------------- |
| `@plan.md`                            | Both  | Central task board   |
| `.claude/@chief-architect-context.md` | Chief | Role definition      |
| `SESSION_SUMMARY.md`                  | Both  | Main project summary |

### ML Service Context (Submodule)

| File                                  | Owner        | Purpose         |
| ------------------------------------- | ------------ | --------------- |
| `ml-service/@ml-architect-context.md` | ML Architect | Role definition |
| `ml-service/SESSION_SUMMARY.md`       | ML Architect | ML work summary |

### Development Files

| File                                  | Owner        | Purpose               |
| ------------------------------------- | ------------ | --------------------- |
| `docker-compose.yml`                  | Chief        | Service orchestration |
| `.gitmodules`                         | Chief        | Submodule config      |
| `.github/workflows/ml-service-ci.yml` | Chief        | ML CI/CD              |
| `ml-service/README.md`                | ML Architect | ML service docs       |
| `ml-service/pyproject.toml`           | ML Architect | ML dependencies       |

---

## Quick Reference

### Check Your Tasks

```bash
# For ML Architect
grep -A 20 "### ML Architect Tasks" @plan.md

# For Chief Architect
grep -A 20 "### Chief Architect Tasks" @plan.md
```

### Update Task Status

```bash
# Edit @plan.md directly
# Change: **Status**: pending
# To: **Status**: in_progress
# Then: **Status**: completed ✅

nano @plan.md
# or use your preferred editor
```

### View System Architecture

```bash
# ML Service location
ls -la ml-service/

# Check submodule config
cat .gitmodules

# See Docker services
docker compose ps

# Check available tasks
cat @plan.md | grep -E "^####|Status:|Assigned"
```

### Make a Commit

```bash
# Work on something
# Commit with clear message
git add .
git commit -m "type(domain): description

- Change 1
- Change 2

Tests: 8/8 passing"

# Push when done
git push origin master
```

---

## Success Metrics

### System Health

- ✅ All agents have clear context files
- ✅ Central task board active
- ✅ Communication protocol established
- ✅ Both repos synchronized

### Next Checkpoints

- [ ] ML Architect completes first assigned task
- [ ] Chief Architect creates integration task
- [ ] Session summaries kept up-to-date
- [ ] All tests passing in both repos

---

## Troubleshooting

### "I don't know what to work on"

→ Check `@plan.md` for tasks assigned to you with status `pending`

### "I finished my task, what now?"

→ Update `@plan.md` status to `completed`, then check for next `pending` task assigned to you

### "Should I ask the other agent something?"

→ Add note in `@plan.md` under their task or update `.claude/@chief-architect-context.md` under "Escalation" section

### "How do I report progress?"

→ Update `@plan.md` status to `in_progress`, then write session notes in your domain's `SESSION_SUMMARY.md`

### "What if I need to commit in the submodule?"

```bash
# You're already in ml-service/ if working on ML tasks
cd ml-service
git add .
git commit -m "message"
git push origin master

# Then update main repo reference
cd ..
git add ml-service
git commit -m "chore: update ml-service submodule"
git push origin master
```

---

## Next Steps

### Immediate (This Week)

1. ✅ Multi-agent system established
2. ⏳ ML Architect picks first task from `@plan.md`
3. ⏳ Chief Architect creates CI/CD fix task
4. ⏳ Both agents keep SESSION_SUMMARY.md updated

### Medium Term (This Sprint)

1. [ ] Complete first round of assigned tasks
2. [ ] Refine communication protocol based on experience
3. [ ] Add new agent for Next.js frontend work
4. [ ] Document decision log for architecture choices

### Long Term

1. [ ] Scale to 3+ specialized agents
2. [ ] Add formal code review process via PRs
3. [ ] Implement automatic task assignment
4. [ ] Create agent performance dashboard

---

## Document Version

**Version**: 1.0
**Created**: 2025-10-17
**Last Updated**: 2025-10-17
**Maintained By**: Chief Architect

---

**🎯 System Status**: ✅ READY FOR OPERATIONS

All agents are configured and ready to work. Tasks are assigned in `@plan.md`. Start with your assigned tasks and keep communicating through the established protocols.
