# 🤖 ML Architect Agent Files

This directory contains the agent configuration files for the ML Architect role.

## Files

### 1. `ml-architect-agent-prompt.md`

**The Main File You Need** 📋

Complete system prompt ready to use with Claude agents.

**Use it by**:

1. Copy the system prompt section (between triple backticks)
2. Paste into agent initialization
3. Agent starts working on tasks from `@plan.md`

**What's in it**:

- Complete role definition
- Responsibilities and authority
- Workflow procedures
- Quality standards
- Development commands
- Communication protocol

### 2. Related Documentation

**In parent directories**:

- `../AGENT_SETUP.md` - How to set up the agent (start here!)
- `../@ml-architect-context.md` - Detailed context and guidelines
- `../SESSION_SUMMARY.md` - Work history and achievements
- `../../@plan.md` - Central task board
- `../../MULTI_AGENT_SYSTEM.md` - Multi-agent system overview

## Quick Start

### Copy-Paste Method

```bash
# View the prompt
cat ml-architect-agent-prompt.md

# Find the system prompt (between triple backticks)
# Copy it

# Paste into your agent setup
```

### Command Extraction

````bash
# Extract just the system prompt
sed -n '/^```$/,/^```$/p' ml-architect-agent-prompt.md | sed '1d;$d'
````

### View in Editor

```bash
# Open in your editor
code ml-architect-agent-prompt.md
# or
nano ml-architect-agent-prompt.md
# or
vim ml-architect-agent-prompt.md
```

## Using with /agents

If your Claude Code setup supports `/agents` command:

```
/agents register ml-architect --file ml-architect-agent-prompt.md
```

Or manually:

```
/agents create ml-architect
# Paste system prompt from ml-architect-agent-prompt.md
# Agent starts working
```

## What Agent Will Do

1. **Read Tasks**: From `@plan.md` in root directory
2. **Check Context**: From `@ml-architect-context.md`
3. **Review History**: From `SESSION_SUMMARY.md`
4. **Work**: Implement, test, commit changes
5. **Report**: Update `@plan.md` status and `SESSION_SUMMARY.md`
6. **Push**: Git commit with clear messages

## Agent Authority

**Can independently decide**:

- Algorithm improvements
- ML library upgrades
- Model training changes
- Experiment tracking
- Feature engineering

**Must escalate to Chief Architect**:

- API contract changes
- Database schema changes
- Deployment strategy
- Major refactoring

## Quality Standards

Agent will enforce:

- ✅ Type hints on all functions
- ✅ Unit tests (90%+ coverage target)
- ✅ Ruff linting passing
- ✅ Conventional commit messages
- ✅ Clean git status before handoff

## Key Commands Agent Uses

```bash
# Setup
cd ml-service
uv sync

# Testing
uv run pytest tests/ -v --tb=short
uv run pytest --cov=app --cov-report=html

# Quality
uv run ruff check --fix app/ tests/
uv run ruff format app/ tests/

# Experiments
mlflow ui --port 5000

# Git
git add .
git commit -m "type(ml): description"
git push origin master
```

## Task Status Flow

Agent will update `@plan.md` following this pattern:

```markdown
### Task: Description

**Status**: pending → in_progress → completed ✅

**When pending**:

- Ready to start
- All acceptance criteria clear

**When in_progress**:

- Started: [date]
- Agent working on it
- Check SESSION_SUMMARY.md for updates

**When completed**:

- Changes made: [list]
- Tests: X/X passing
- Coverage: XX%
- Commits: [links]
```

## Communication

Agent will communicate through:

1. **@plan.md** - Task updates
2. **SESSION_SUMMARY.md** - Detailed work report
3. **Git commits** - Code changes and context
4. **Branch pushes** - To github.com/unknowntpo/threads-ml

## Session Workflow

Each session follows this pattern:

```
1. Agent starts
2. Reads ml-architect-agent-prompt.md (this role)
3. Checks @plan.md for tasks
4. Reviews SESSION_SUMMARY.md for context
5. Picks pending task
6. Updates status: in_progress
7. Implements, tests, commits
8. Updates status: completed ✅
9. Pushes to master
10. Session ends
```

## Troubleshooting

**Agent doesn't know about tasks**
→ Check `../../@plan.md` exists and has "ML Architect Tasks" section

**Agent doesn't commit**
→ Prompt includes git workflow, agent should follow it

**Tests failing**
→ Agent runs `uv run pytest -v --tb=short` locally first

**Need new task**
→ Add to `../../@plan.md` with "ML Architect Tasks" section

## Version Info

- **Prompt Version**: 1.0
- **Last Updated**: 2025-10-17
- **File**: `ml-architect-agent-prompt.md`
- **Repository**: https://github.com/unknowntpo/threads-ml

## Related Resources

- **Agent Setup Guide**: `../AGENT_SETUP.md`
- **Detailed Context**: `../@ml-architect-context.md`
- **Task Board**: `../../@plan.md`
- **System Guide**: `../../MULTI_AGENT_SYSTEM.md`

---

**Ready to initialize? Copy `ml-architect-agent-prompt.md` and start working!**
