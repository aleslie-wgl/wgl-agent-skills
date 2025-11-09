---
name: agent-dispatch-patterns
type: knowledge
description: "[KNOWLEDGE] Agent dispatching patterns: parallel, sequential, dependency-aware batching, and token-managed orchestration"
when_to_use: When orchestrating multiple subagents - deciding parallel vs sequential dispatch, managing dependencies, or batching large operations
version: 1.0.0
---

**Input**: Tasks to dispatch, dependencies, token budget considerations
**Output**: Dispatch patterns and orchestration strategies

---

## Pattern 1: Parallel Agent Dispatch (Fan-Out/Fan-In)

**When to Use**: Tasks have no shared dependencies

**Performance Benefit**: N tasks complete in max(T1, T2, ..., TN) vs. sum(T1+T2+...+TN)

### Implementation

```markdown
# ✅ CORRECT: Single message, multiple Task calls
Task 1: implementer
  - Task ID: T001
  - Task: "Build PricingCard UI component"
  - Context: [spec excerpt + plan excerpt + task acceptance criteria]

Task 2: tdd-executor
  - Task ID: T002
  - Task: "Implement pricing calculation with TDD"
  - Context: [spec excerpt + plan excerpt + task acceptance criteria]

Task 3: implementer
  - Task ID: T004
  - Task: "Update Convex schema for pricing"
  - Context: [spec excerpt + plan excerpt + task acceptance criteria]

# Wait for ALL to complete (fan-in)
# Parse each result
# Update tasks.md with completed checkboxes
# Handle errors (retry or STOP)
```

### Anti-Pattern (Sequential Dispatch)

```markdown
# ❌ WRONG: Sequential dispatch wastes time
Task 1: implementer → T001
Wait for completion
Task 2: tdd-executor → T002
Wait for completion
Task 3: implementer → T004

# Problem: Takes sum(T1+T2+T3) instead of max(T1,T2,T3)
# Impact: 5× slower for 5 independent tasks
```

### Orchestrator Code Pattern

When orchestrating parallel dispatch:

```markdown
# 1. Identify independent tasks (no shared dependencies)
independent_tasks = [T001, T004, T007]  # Can run in parallel

# 2. Classify each task (TDD vs. direct)
for task in independent_tasks:
  if task requires TDD:
    agent = "tdd-executor"
    model = "sonnet"
  else:
    agent = "implementer"
    model = "haiku"

# 3. Dispatch ALL in single message
# (Don't wait for T001 to complete before dispatching T004)

# 4. Wait for ALL to complete (fan-in)

# 5. Parse results and handle errors
for result in results:
  if result.status == "completed":
    updateTaskCheckbox(result.taskId, "completed")
  elif result.status == "failed":
    handleError(result)
```

---

## Pattern 2: Batch Execution with Dependencies

### Dependency Graph Analysis

Before executing tasks, analyze dependencies to create parallel batches:

```markdown
# Input: tasks.md with dependencies

T001: Dependencies: None
T002: Dependencies: T001
T003: Dependencies: None
T004: Dependencies: None
T005: Dependencies: T002, T004
T006: Dependencies: T001, T003
T007: Dependencies: None

# Build dependency graph
graph = {
  T001: [],
  T002: [T001],
  T003: [],
  T004: [],
  T005: [T002, T004],
  T006: [T001, T003],
  T007: []
}

# Generate batches (tasks with no incomplete dependencies)
Batch 1: [T001, T003, T004, T007]  # No dependencies
Batch 2: [T002, T006]               # Depend on Batch 1
Batch 3: [T005]                     # Depends on T002 from Batch 2

# Critical path (longest dependency chain)
T001 → T002 → T005  # 3 tasks serial
```

### Batch Execution Flow

```markdown
For each batch:
  1. **Classify tasks**:
     - TDD tasks → tdd-executor (Sonnet)
     - UI/config tasks → implementer (Haiku)

  2. **Load expert skills** (based on task context):
     - Convex tasks → @convex-operations
     - Next.js tasks → @typescript-standards
     - Test tasks → @test-driven-development

  3. **Dispatch in parallel** (single message):
     Task 1: tdd-executor → T001 (with context)
     Task 2: implementer → T003 (with context)
     Task 3: implementer → T004 (with context)
     Task 4: implementer → T007 (with context)

  4. **Wait for ALL to complete** (fan-in)

  5. **Parse results**:
     - Extract status, files created, errors
     - Update tasks.md checkboxes
     - Log completion times

  6. **Handle errors**:
     - If any FAILED → STOP, report to user
     - If retryable error → Retry once
     - If blocked → Ask user for guidance

  7. **Check for checkpoint**:
     - If batch is checkpoint (INT-XX) → Run smoke test
     - If checkpoint FAILS → STOP, do NOT proceed
     - If checkpoint PASS → Continue to next batch
```

---

## Pattern 3: Context-Aware Batching (Token Management)

**When to Use**: Bulk operations (30+ similar tasks) where subagents might hit context limits

**Problem**: Subagents inherit system prompt + claude.md + skills = significant base context. A single agent trying to process 40 files may hit the 22.5% autocompact threshold.

**Solution**: Batch intelligently by logical grouping, dispatch multiple agents in parallel.

### Implementation Pattern

#### Step 1: Classify Tasks by Type

```markdown
# Example: 40 skills need `type:` field added
# Classify into logical groups:

Workflow skills (18): spec-implement, frontend-validation, git-workflow, ...
Knowledge skills (13): typescript-standards, convex-operations, claude-sdk, ...
Meta skills (9): simplification, scale-thinking, collision-zones, ...
```

#### Step 2: Batch by Classification

```markdown
# Each batch gets ~13-18 tasks (manageable for subagent context)
Batch 1 (Workflow): 18 skills → implementer (haiku)
Batch 2 (Knowledge): 13 skills → implementer (haiku)
Batch 3 (Meta): 9 skills → implementer (haiku)
```

#### Step 3: Dispatch Parallel Agents with Proof Requirements

```markdown
Task 1: implementer
  Batch: 18 workflow skills
  Instructions:
    - Add `type: workflow` to each
    - Update description with `[WORKFLOW]` prefix
    - Verify EACH file with:
      ```bash
      git status .claude/skills/[name]/SKILL.md  # Must show "modified"
      grep "^type: workflow" .claude/skills/[name]/SKILL.md  # Must match
      ```
  Required Proof:
    - Git status output showing count of modified files
    - Sample head output from 2-3 files
    - Count: X/18 modified

Task 2: implementer
  Batch: 13 knowledge skills
  [Same pattern, type: knowledge]

Task 3: implementer
  Batch: 9 meta skills
  [Same pattern, type: meta]

# Dispatch all 3 in single message (parallel execution)
```

#### Step 4: Orchestrator Verifies Proof

```bash
# After all agents complete, verify:
git status --short .claude/skills/ | wc -l
# Expected: 40 (18+13+9)

find .claude/skills -name "SKILL.md" -exec grep -L "^type:" {} \; | wc -l
# Expected: 0 (none missing)

grep -h "^type:" .claude/skills/*/SKILL.md | sort | uniq -c
# Expected:
#   18 type: workflow
#   13 type: knowledge
#    9 type: meta
```

### Context Budget Considerations

**Subagent base context** (~40K tokens):
- System prompt: 15K
- Claude.md: 10K
- Auto-loaded skills: 10K
- Hooks: 2K
- Remaining: ~160K (with 200K limit)

**Per-file cost** (skill files):
- Small skill (200 lines): ~2K tokens
- Large skill (900 lines): ~15K tokens

**Batching calculation**:
- 10 small skills: 20K tokens (safe)
- 15 medium skills: 45K tokens (safe)
- 20 skills mixed: 60-80K tokens (safe, but monitor)
- 40 skills: 120-200K tokens (risky - may hit autocompact)

**Rule of thumb**: Keep batch size where `(base_context + batch_processing) < 140K tokens` (70% of 200K)

### Benefits

**vs. Single Agent Processing All 40**:
- Context risk: High → Low (3 agents with ~50K processing each)
- Parallelization: 3× faster
- Failure isolation: One batch fails doesn't block others
- Verification: Easier to verify 13 files than 40

**vs. 40 Separate Agents**:
- Overhead: 40 agent spawns → 3 agent spawns
- Orchestrator complexity: Lower (3 results vs 40 results)
- Time: Similar (parallel anyway), but cleaner

### Anti-Patterns

❌ **Single agent for large bulk operation**:
```markdown
Task: implementer
  Update all 40 skills with type field
  # Problem: Hits context limit, agent stops at file 15, claims "concerned about context"
```

❌ **One agent per file** (too granular):
```markdown
Task 1: implementer → skill 1
Task 2: implementer → skill 2
...
Task 40: implementer → skill 40
# Problem: 40× agent overhead, complex result parsing
```

✅ **Correct: Batch by logical grouping**:
```markdown
# 3 agents, each handling semantically related tasks
# Each batch fits comfortably in context
# Parallel execution, clear proof verification
```

### When to Batch

**Batch if**:
- 15+ similar tasks
- Each task is similar complexity
- Tasks can be grouped logically
- Subagent needs to process multiple files

**Don't batch if**:
- < 10 tasks (overhead not worth it)
- Tasks are heterogeneous (require different skills/approaches)
- Sequential dependencies (can't parallelize anyway)

### Verification Requirements (Critical)

Each subagent MUST provide:
1. **Count**: X/N files successfully modified
2. **Git proof**: `git status` output showing modified files
3. **Content proof**: Sample `head` or `grep` output
4. **Failures**: Any files that failed with reason

Orchestrator MUST verify:
1. Sum of counts matches expected total
2. Git status confirms modifications persisted
3. Grep confirms expected changes present
4. No files silently failed (Edit tool persistence bug)

---

**Real Example**: This pattern was used successfully to add `type:` field to 40 skills:
- Batch 1 (18 workflow) + Batch 2 (13 knowledge) + Batch 3 (9 meta) = 40 total
- All 3 agents completed in parallel
- 42 files modified (40 + 2 from earlier)
- 0 files missing type field (verified)
- Total time: ~5 minutes (vs. ~20 minutes sequential or context failure with single agent)

---

**Related Skills**:
- For what to provide to agents: @context-provision-patterns
- For validation and error handling: @validation-patterns
