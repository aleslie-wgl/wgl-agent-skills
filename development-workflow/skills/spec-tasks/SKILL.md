---
name: spec-tasks
description: "[WORKFLOW] Generate dependency-ordered, TDD-aware task lists from implementation plans with estimates, priorities, and acceptance criteria"
when_to_use: When breaking down implementation plan into actionable tasks with dependency tracking
version: 1.0.0
type: workflow
---

**Input**: Approved plan from spec-plan (`docs/features/[FEAT-XXX]-plan.md`)
**Output**: `docs/features/[FEAT-XXX]-tasks.md`

---

## Process

### Step 1: Read Implementation Plan

```bash
Read: docs/features/[FEAT-XXX]-plan.md
```

Extract:
- **Plan §TD1 (File Organization)**: Directory structure decisions
- Phases (Backend, Frontend, Integration)
- High-level tasks per phase
- API contracts (queries, mutations, actions)
- Schema changes
- Testing strategy

---

### Step 2: Generate TDD-Aware Tasks

**CRITICAL**: All file paths MUST come from Plan §TD1 and include reference "(per Plan §TD1)".

**Classification rules:**

```typescript
function classifyTask(task: TaskDescription): TaskType {
  // Backend business logic → TDD
  const tddKeywords = ["calculate", "validate", "transform", "process",
                       "algorithm", "mutation", "query", "business logic"];

  if (task.type === "backend" || hasAny(task.description, tddKeywords)) {
    return {
      agent: "tdd-executor",
      model: "sonnet",
      pattern: "TDD cycle (RED→GREEN→REFACTOR)",
      estimate: "3-4 hours"
    };
  }

  // UI components, config → No TDD
  const uiKeywords = ["component", "page", "layout", "styling", "display"];

  if (task.type === "frontend" || hasAny(task.description, uiKeywords)) {
    return {
      agent: "implementer",
      model: "haiku",
      pattern: "Direct implementation",
      estimate: "1-2 hours"
    };
  }

  // Integration tasks → Direct
  if (task.description.includes("wire") || task.description.includes("integrate")) {
    return {
      agent: "implementer",
      model: "haiku",
      pattern: "Integration",
      estimate: "2-3 hours"
    };
  }

  // Default to TDD for safety
  return {
    agent: "tdd-executor",
    model: "sonnet",
    pattern: "TDD cycle",
    estimate: "3-4 hours"
  };
}
```

**Task format (TDD):**
```markdown
### T001: Implement pricing calculation with TDD

**Type**: Backend | Mutation | TDD Required
**Agent**: tdd-executor (Sonnet)
**Estimate**: 3-4 hours
**Dependencies**: None
**Priority**: High

**Acceptance Criteria**:
- [ ] Write failing test for basic pricing (RED)
- [ ] Implement minimal calculation (GREEN)
- [ ] Refactor for edge cases: negative, zero margin (REFACTOR)
- [ ] All tests passing, TypeScript compiles (0 errors)

**Files to Create/Modify** (per Plan §TD1):
- convex/__tests__/pricing.test.ts
- convex/mutations/calculatePricing.ts

**Expert Skills**: convex-expert
```

**Task format (No TDD):**
```markdown
### T010: Build PricingCard UI component

**Type**: Frontend | Component
**Agent**: implementer (Haiku)
**Estimate**: 2 hours
**Dependencies**: T001 (needs data structure)
**Priority**: Medium

**Acceptance Criteria**:
- [ ] Component renders without errors
- [ ] Displays model name, input/output prices
- [ ] Responsive (mobile, tablet, desktop)

**Files to Create/Modify** (per Plan §TD1):
- components/marketing/PricingCard.tsx

**Expert Skills**: nextjs-expert
```

---

---

### Step 2.5: Enforce Phase Sizing

**CRITICAL**: Keep phases small for frequent validation

**Rules**:
- Max 15 tasks per phase
- Max 3 days duration at normal velocity (3-4h avg per task)
- If phase exceeds limits → split into sub-phases

**Example** (Good - small phases):
```markdown
## Phase 1: Schema & Core Backend (12 tasks, 2 days)
## Phase 2: Business Logic & Queries (14 tasks, 2.5 days)
## Phase 3: Frontend Components (13 tasks, 2 days)
## Phase 4: Integration & Testing (10 tasks, 2 days)
```

**Example** (Bad - needs splitting):
```markdown
## Phase 1: Everything Backend (28 tasks, 6 days) ❌
  → Split into:
     - Phase 1a: Foundation (12 tasks, 2 days)
     - Phase 1b: Business Logic (16 tasks, 3 days)
```

**Enforcement**:
- When generating tasks, count tasks per phase
- If phase > 15 tasks → warning in output
- Suggest split points based on dependencies

---

### Step 3: Add Cross-References

For each task, add:

```markdown
**Implements**: US-[N] (§AC[X], §AC[Y])
**Plan References**: §[Section].[Subsection]
**Knowledge Prerequisites**: [@skill §section], [Research topic]
**Related Tasks**: T[XXX] (relationship), T[YYY] (relationship)
```

Example:
```markdown
**Implements**: US-2 (§AC2, §AC3), US-4 (§AC1)
**Plan References**: §API.endpoints.pricing, §DM.gpu_types, §TD1.file-organization
**Knowledge Prerequisites**: @convex-operations §schema-design, Research HuggingFace quantization
**Related Tasks**: T002 (same schema), T015 (same API endpoint)
```

---

### Step 4: Optimize for Parallelism

**Minimize dependencies:**
- Only add dependencies when truly required
- Don't force sequential when tasks can run parallel

**Example (Good - Minimal Dependencies):**
```markdown
T001: Schema update → Dependencies: None
T002: Pricing calculation → Dependencies: T001 (needs schema)
T003: UI component → Dependencies: None (can run parallel with T001)
T004: Form validation → Dependencies: None
```

**Example (Bad - Over-constrained):**
```markdown
T001: Schema update → Dependencies: None
T002: Pricing calculation → Dependencies: T001
T003: UI component → Dependencies: T002 ❌ (doesn't actually need T002!)
T004: Form validation → Dependencies: T003 ❌ (doesn't need T003!)
```

**Dependency analysis:**
```typescript
// For each task, ask:
// 1. Does this task USE data/code from another task?
// 2. Will this task FAIL if other task not complete?

// If NO to both → No dependency (can run in parallel)
// If YES to either → Add dependency
```

---

### Step 5: Calculate Totals

```markdown
## Summary

**Total Tasks**: 85
**TDD Tasks**: 32 (38%)
**Estimated Duration**:
  - Serial: 340 hours (85 tasks × 4 hours avg)
  - Parallel (2 devs): 11 days (batches of 5-10 tasks)
  - Critical path: 8 days (longest dependency chain)
```

---

### Step 6: Group into Parallel Batches

```markdown
## Parallelism Opportunities

**Batch 1** (4 tasks, no dependencies):
- T001: Schema update
- T004: Environment variables
- T007: UI component scaffolding
- T011: Form validation setup

**Batch 2** (5 tasks, depend on Batch 1):
- T002: Pricing calculation (depends on T001)
- T005: Pricing query (depends on T001)
- T008: Pricing form (depends on T007)
- T012: Validation component (depends on T011)

**Critical Path**: T001 → T002 → T006 → T012 → T021 (8 days)
```

---

### Step 6.5: Detect Emergent Phases

**CRITICAL**: Phases emerge FROM dependency patterns, not from pre-planning.

**Pattern detection rules:**
1. **Natural boundaries** - Where dependency chains pause/restart
2. **Component clustering** - Tasks operating on same subsystem
3. **Integration points** - Tasks that wire multiple components together

**Example phase detection:**
```markdown
## Phases (Emergent from Dependencies)

**Phase 1: Foundation** (Batches 1-3, Tasks T001-T010)
- Pattern: No dependencies, sets up base infrastructure
- Components: Schema changes, env setup, core backend functions
- Duration: 2 days
- Completion criteria: TypeScript compiles, schema deployed

**Phase 2: Business Logic** (Batches 4-7, Tasks T011-T025)
- Pattern: Depends on Phase 1 schema, no frontend dependencies
- Components: Queries, mutations, calculations, validations
- Duration: 3 days
- Completion criteria: All backend tests pass, API contracts verified

**Phase 3: UI Components** (Batches 8-10, Tasks T026-T035)
- Pattern: Depends on Phase 2 APIs, UI-focused tasks
- Components: Pages, components, forms, styling
- Duration: 2 days
- Completion criteria: Components render, no console errors

**Phase 4: Integration** (Batches 11-12, Tasks T036-T042)
- Pattern: Wires frontend to backend, end-to-end tests
- Components: API integration, error handling, E2E tests
- Duration: 2 days
- Completion criteria: Full user workflows work, all tests pass
```

**Key principle**: If dependencies don't suggest a natural boundary, don't force a phase split.

---

### Step 7: Write Tasks File

```bash
# Read template
Read: templates/feature-tasks.md

# Fill sections:
# - Summary (totals, duration, critical path)
# - Batches (execution order from Step 6)
# - Phases (emergent from dependencies, Step 6.5)
# - Task details (T001-T085 with acceptance criteria)
# - Integration checkpoints (INT-01, INT-02, etc.)
# - Progress tracking section (empty initially)

# Write file
Write: docs/features/[FEAT-XXX]-tasks.md
```

---

### Step 8: Present to User

```markdown
I've generated tasks for **FEAT-XXX**:

**Total**: 85 tasks

**Phases (Emergent from Dependencies)**:
- Phase 1 (Foundation): 15 tasks (2 days)
- Phase 2 (Business Logic): 25 tasks (3 days)
- Phase 3 (UI Components): 30 tasks (3 days)
- Phase 4 (Integration): 15 tasks (2 days)

**TDD Coverage**: 32 / 85 tasks (38%)

**Parallelism**:
- Up to 5 tasks can run concurrently
- With 2 developers: 11 days (vs 42 days serial)

**Critical Path**: 8 days (T001→T002→T006→T012→T021)


**File created**: docs/features/FEAT-XXX-tasks.md

Ready for /execute-feature FEAT-XXX?
```

---

## Quality Checks

- ✅ Total tasks 30-100 (not too high-level, not too granular)
- ✅ Each task has: estimate, dependencies, acceptance criteria, agent
- ✅ Phases ≤15 tasks each (enables frequent validation)
- ✅ Tasks enriched with cross-references (Implements, Plan References, Knowledge Prerequisites, Related Tasks)
- ✅ TDD tasks are single-cycle (not split "code" + "test")
- ✅ Test tasks are 30-40% of total (TDD compliance)
- ✅ No circular dependencies (A→B→A)
- ✅ Parallelism opportunities maximized

---

**Usage**: Load this skill when running `/spec` command (Step 3: Task generation)
