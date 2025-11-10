---
name: spec-implement
description: "[WORKFLOW] Implement straightforward tasks (UI, config, simple integrations) without comprehensive testing - use integration points and data transformation guidance"
when_to_use: When implementer agent dispatched for non-TDD tasks (UI components, config, simple integrations)
version: 1.0.0
type: workflow
---

**Input**: Task context from orchestrator (task details, acceptance criteria, integration points, data transformation, expert skills)
**Output**: Implementation + completion report with verification evidence

---

## Purpose

Implement straightforward tasks efficiently by:
- Using existing patterns (from Integration Points)
- Following data contracts (from Data Transformation)
- Verifying completion before claiming success

**Not for**: Complex business logic requiring TDD (use spec-tdd instead)

---

## Process

### Step 0: Read Source Documents

**CRITICAL**: Verify orchestrator context against actual documents

``` bash
# Read full context
Read: docs/features/[FEAT-XXX]-spec.md
Read: docs/features/[FEAT-XXX]-plan.md
Read: docs/features/[FEAT-XXX]-tasks.md

# Locate your task
Grep: "T[task-id]:" docs/features/[FEAT-XXX]-tasks.md -A 30
```

**Extract from task**:
- Acceptance criteria (what to implement)
- Files to Create/Modify (where + function signatures)
- **Integration Points** (patterns to copy)
- **Data Transformation** (input → output contract)
- Knowledge Prerequisites (skills to load)
- Expert Skills (domain patterns)

---

### Step 0.5: Extract Integration Points and Data Transformation

**NEW**: Tasks now include specific guidance for implementation

#### Integration Points

Format:
```markdown
**Integration Points**:
- Follow [pattern type] from: \`[file]:[line-range]\` ([description])
- Example: "Follow mutation auth pattern from: \`convex/mutations/updateModel.ts:23-30\` (admin role check)"
```

**Action**:
1. Read the referenced file:line
2. Locate the exact pattern (lines X-Y)
3. Copy the pattern to your implementation
4. Adapt variable names to match your task

**Example**:
Integration Point: Follow mutation auth from \`convex/mutations/updateModel.ts:23-30\`
→ Read updateModel.ts
→ Copy lines 23-30 (auth check code)
→ Paste into your mutation
→ Change "model" to "pricing" (or whatever your domain is)

#### Data Transformation

Format:
```markdown
**Data Transformation**:
- **Input**: \`{ field1: type, field2: type }\` - [source]
- **Transform**: \`functionName(input) → output\` - [what happens]
- **Output**: \`{ result1: type, result2: type }\` - [destination]
- **Validation**: [rules]
```

**Action**:
1. Use Input spec for function parameters/props
2. Use Transform for business logic
3. Use Output for return types
4. Use Validation for error handling

---

### Step 1: Reality Check (E2E Tests Only)

**If task is writing E2E tests**, inspect actual implementation BEFORE writing test.

**Skip this step** for non-E2E tasks.

---

### Step 2: Implement

**Follow existing patterns**:
1. If Integration Points provided → Read and copy those patterns
2. Use Data Transformation for types and validation
3. Use expert skills for domain-specific patterns

**Use file paths from Plan §TD1**.

**Keep it simple** (YAGNI): No over-engineering.

**Load TypeScript standards**: Never use \`any\`, use \`unknown\` or specific types.

---

### Step 3: Verify Before Claiming Complete

**CRITICAL**: Run verification commands and capture output

``` bash
# TypeScript compilation (always required)
npx tsc --noEmit
# Must show: "0 errors"

# For E2E tests:
SKIP_WEBSERVER=1 npx playwright test [test-file] --reporter=list
# Must show: "X passed" with actual count
```

**✅ Verification**: Bash command executed + Output captured + Exit code 0

---

### Step 4: Generate Completion Report

Return to orchestrator with status, files created, integration points used, verification evidence, and notes.

---

**Version**: 1.0.0
**Last Updated**: 2025-01-09
**Status**: Active - Used by implementer agent
