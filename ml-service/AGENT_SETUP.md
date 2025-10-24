# 🤖 ML Architect Agent Setup Guide

**How to Initialize the ML Architect Agent for ml-service Work**

---

## Quick Start (3 Steps)

### Step 1: Copy the System Prompt

Located at: `.claude/ml-architect-agent-prompt.md`

```bash
cat ml-service/.claude/ml-architect-agent-prompt.md
```

Copy the "System Prompt" section (between the triple backticks).

### Step 2: Initialize Your Agent

Paste the system prompt when setting up the agent in Claude Code or Claude Web.

### Step 3: Agent Reads Context

The agent will automatically:

1. Read `@plan.md` for assigned tasks
2. Review `ml-service/@ml-architect-context.md` for guidelines
3. Check `ml-service/SESSION_SUMMARY.md` for history
4. Start working on pending tasks

---

## What's in the Prompt

The agent initialization prompt includes:

✅ **Role Definition**

- Title: ML Infrastructure & Algorithm Expert
- Scope: ml-service/ directory
- Authority: What you can decide independently

✅ **Responsibilities**

- ML algorithms and model improvements
- ML infrastructure (MLflow, versioning, tracking)
- Performance optimization
- Quality and test coverage

✅ **Workflow**

- How to pick tasks from @plan.md
- Development procedure (implement, test, commit)
- How to report completion
- Quality standards (non-negotiable)

✅ **Key Files**

- Which files you'll work with
- Where to find tests
- ML algorithm locations
- API integration points

✅ **Tools & Commands**

- How to run tests
- How to check coverage
- Linting and formatting commands
- Git workflow

✅ **Success Checklist**

- Before/after task checklist
- Sign-off procedure
- No uncommitted changes policy

✅ **Communication Protocol**

- Where to read tasks from
- Where to report results
- How to handle blockers
- When to escalate

---

## For Claude Code Users

### Initialization Flow

1. **Open Claude Code**

   ```
   File → Open → ml-service directory
   ```

2. **Set Agent Context**
   - Agent name: ML Architect
   - Location: ml-service/
   - Paste system prompt from `.claude/ml-architect-agent-prompt.md`

3. **Agent Starts Session**
   - Reads @plan.md
   - Checks task assignments
   - Reviews context files
   - Begins work

### During Session

Agent will:

- Check @plan.md for tasks
- Update task status as work progresses
- Run tests: `uv run pytest tests/ -v`
- Lint code: `uv run ruff check --fix`
- Commit changes with clear messages
- Report completion in @plan.md

---

## For Claude API/Custom Integration

### Step 1: Load the Prompt

````python
with open('ml-service/.claude/ml-architect-agent-prompt.md', 'r') as f:
    prompt = f.read()

# Extract the system prompt section
system_prompt = prompt.split('```')[1]  # Get content between triple backticks
````

### Step 2: Use in API Call

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-4-1-20250805",
    max_tokens=4096,
    system=system_prompt,
    messages=[
        {
            "role": "user",
            "content": """You are now starting a work session on the ml-service.

1. Check what tasks are assigned to you in @plan.md
2. Pick a pending task
3. Work on it following the workflow described
4. Report completion when done

What tasks do you see assigned to ML Architect?"""
        }
    ]
)

print(response.content[0].text)
```

### Step 3: Handoff Instructions

Include in the next message:

```markdown
You have finished this session. Please:

1. Update @plan.md with your completed work
2. Update ml-service/SESSION_SUMMARY.md with what you accomplished
3. Create clear git commits
4. Report any blockers

Start the next session by:

1. Reading @plan.md for new tasks
2. Checking SESSION_SUMMARY.md for context
3. Continuing with pending tasks
```

---

## What the Agent Will Do

### When Starting

1. ✅ Read `@plan.md`
2. ✅ Find tasks assigned to "ML Architect"
3. ✅ Review `ml-service/@ml-architect-context.md`
4. ✅ Check `ml-service/SESSION_SUMMARY.md` for history

### During Work

1. ✅ Update task status: `pending` → `in_progress`
2. ✅ Implement changes in ml-service/
3. ✅ Run tests: `uv run pytest tests/ -v --tb=short`
4. ✅ Check coverage: `uv run pytest --cov=app`
5. ✅ Lint: `uv run ruff check --fix`
6. ✅ Format: `uv run ruff format`
7. ✅ Create commits with clear messages

### When Completing

1. ✅ Update `@plan.md` status: `in_progress` → `completed ✅`
2. ✅ Document changes made
3. ✅ Report test results
4. ✅ Update `ml-service/SESSION_SUMMARY.md`
5. ✅ Push commits to master
6. ✅ Verify clean `git status`

---

## Example: Using the Prompt

### Copy-Paste into Claude Web

```
[Paste the entire system prompt from .claude/ml-architect-agent-prompt.md]

User: I'm starting work on the ml-service. What's my first task?
```

### Expected Response

Agent will:

1. Read @plan.md
2. Find pending ML Architect tasks
3. Report back with prioritized task list:

   ```
   I found the following tasks assigned to ML Architect:

   1. **Model Quality: Improve Test Coverage** (P1 - High Priority)
      - Current: 77%
      - Target: 85%+
      - Estimated: 3 hours
      - Status: pending

   2. **MLOps: Add Model Versioning System** (P2 - Medium Priority)
      - Current: Hardcoded v1
      - Target: Support multiple versions
      - Estimated: 4 hours
      - Status: pending
   ```

---

## Context Files Available

When agent starts, it will have access to:

| File                                   | Purpose                  | Content                            |
| -------------------------------------- | ------------------------ | ---------------------------------- |
| `@plan.md`                             | Central task board       | All assigned tasks                 |
| `ml-service/@ml-architect-context.md`  | Detailed role definition | Full context and guidelines        |
| `ml-service/SESSION_SUMMARY.md`        | Work history             | Previous sessions and achievements |
| `ml-service/README.md`                 | Service documentation    | API, setup, architecture           |
| `MULTI_AGENT_SYSTEM.md`                | System guide             | How multi-agent system works       |
| `.claude/ml-architect-agent-prompt.md` | This prompt              | Reusable initialization            |

---

## Prompt Customization

### To Modify the Prompt

Edit `.claude/ml-architect-agent-prompt.md` and update:

- Responsibilities
- Authority limits
- Quality standards
- Key files list
- Commands reference

### Common Modifications

**Add New Tool**:

```markdown
## Tools Available

- (existing tools)
- New tool: description
```

**Change Quality Standard**:

```markdown
## Quality Standards

- Updated requirement
```

**Add New Task Category**:

```markdown
## Tasks You Might See

- Category 1: description
- Category 2: description
```

---

## Multi-Session Workflow

### Session 1 (Initial)

```
1. Agent reads prompt
2. Reviews @plan.md
3. Picks pending task: "Improve Test Coverage"
4. Works on it: 3 hours
5. Updates @plan.md status: completed
6. Pushes commits
```

### Session 2 (Continuation)

```
1. Agent reads prompt
2. Checks @plan.md (sees previous completed task)
3. Picks next pending task: "Add Model Versioning"
4. Reads SESSION_SUMMARY.md for context
5. Continues development
```

### Pattern

Each session:

1. Read prompt + context files
2. Check @plan.md for work
3. Do focused work on one task
4. Report completion
5. Commit and push

---

## Troubleshooting Agent Setup

### Issue: Agent doesn't know about tasks

**Solution**:

- Ensure @plan.md exists in root directory
- Ensure tasks are under "### ML Architect Tasks" section
- Agent reads @plan.md first

### Issue: Agent changes API without permission

**Solution**:

- Prompt includes: "Escalate to Chief Architect: API contract changes"
- If this happens, remind agent they cannot change APIs

### Issue: Tests failing in CI

**Solution**:

- Agent should run `uv run pytest tests/ -v --tb=short` locally first
- If still failing in CI, document the issue and escalate

### Issue: Agent creates uncommitted changes

**Solution**:

- Prompt includes checklist before handoff
- Agent should verify `git status` is clean

---

## Version Control

**Prompt Version**: 1.0
**Last Updated**: 2025-10-17
**Location**: `ml-service/.claude/ml-architect-agent-prompt.md`

To update agent behavior, edit the prompt file and commit the changes.

---

## Quick Reference

### Prompt Location

```bash
ml-service/.claude/ml-architect-agent-prompt.md
```

### How to Use

1. Copy system prompt section
2. Paste into agent setup
3. Agent starts working
4. Check @plan.md for status
5. Review SESSION_SUMMARY.md for results

### Key Commands Agent Uses

```bash
uv run pytest tests/ -v
uv run pytest --cov=app --cov-report=html
uv run ruff check --fix app/ tests/
git add . && git commit -m "..." && git push
```

### Critical Files

- @plan.md (read/write tasks)
- ml-service/SESSION_SUMMARY.md (report work)
- ml-service/.claude/ml-architect-agent-prompt.md (this prompt)

---

**Ready to initialize the ML Architect agent? Copy `.claude/ml-architect-agent-prompt.md` and get started!**
