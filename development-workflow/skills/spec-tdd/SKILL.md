---
name: spec-tdd
description: "[WORKFLOW] Complete TDD cycle (RED→GREEN→REFACTOR) for implementing complex business logic with comprehensive test coverage"
when_to_use: When implementing complex tasks requiring comprehensive testing (business logic, algorithms, critical functionality, backend mutations/queries)
version: 1.0.0
type: workflow
---

**Input**: Task context from orchestrator (task ID, acceptance criteria, spec/plan excerpts, expert knowledge)
**Output**: Test file + implementation + completion report with TDD evidence

---

## Overview

This skill defines the complete Test-Driven Development (TDD) workflow for implementing complex tasks that require comprehensive test coverage. Emphasis on writing tests first, minimal implementation, and evidence-based completion.

**Key Principle**: RED → GREEN → REFACTOR with verification evidence at each phase.

---

## Process: TDD Cycle

### Step 0: Read Source Documents (Before Writing Tests)

**CRITICAL**: Do NOT trust orchestrator context alone. Verify by reading source documents.

```bash
# Read the actual feature documents
Read: docs/features/FEAT-XXX-spec.md      # Full acceptance criteria, user stories
Read: docs/features/FEAT-XXX-plan.md      # Architecture, data models, API contracts, testing strategy
Read: docs/features/FEAT-XXX-tasks.md     # Task list, dependencies, acceptance criteria
```

**Extract from documents**:
- **From spec**: Acceptance criteria for THIS task, expected behavior
- **From plan**: Data models, API contracts, testing strategy, edge cases
- **From tasks**: Task dependencies, integration requirements

**Parse orchestrator context**:
- Task ID + description
- Acceptance criteria
- Spec/plan excerpts
- Expert skills (framework-specific patterns)

**Cross-check**: Verify orchestrator context matches document content. If mismatch, trust the documents.

**LOAD SKILLS FOR THE JOB**:
- Load skills based on the task at hand (Next.js patterns, shadcn/ui, Convex-operations etc...)
- examine the task and compare to your list of skills and select the best skills for the task:
  - Select up to 3 skills with [KNOWLEDGE] tags in the description field
  - Select up to 3 skills with the [META] tag in the description field
- Keep it simple (no over-engineering)
- Follow existing patterns in codebase
- YAGNI (You Aren't Gonna Need It)

---

### Step 1: RED Phase - Write Failing Test

**Write test FIRST** - before any implementation code exists.

#### Example: Convex Mutation Test

```typescript
// convex/__tests__/pricing.test.ts
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";

test("calculatePricing returns positive price", async () => {
  const t = convexTest(schema);

  const result = await t.mutation(api.mutations.calculatePricing, {
    base_cost: 10,
    margin: 0.6
  });

  expect(result.input_price).toBeGreaterThan(0);
  expect(result.output_price).toBeGreaterThan(0);
});
```

**Run test → Verify it FAILS** (implementation doesn't exist yet):

```bash
Bash: npm test [test-file]
# Must show: "1 failed" or similar error
# Exit code: non-zero (failure expected)
```

**Capture RED phase output**:
```bash
$ npm test pricing.test.ts
FAIL convex/__tests__/pricing.test.ts
  ✗ calculatePricing returns positive price
    Cannot find module 'convex/mutations/calculatePricing'

Tests: 1 failed, 1 total
```

**RED phase complete when**:
- Test written
- Test run and FAILS
- Failure reason matches expectation (module not found, function undefined)

---

### Step 2: GREEN Phase - Write Minimal Code

**Write just enough code to pass the test** - no gold-plating, no extras.

```typescript
// convex/mutations/calculatePricing.ts
export const calculatePricing = mutation({
  args: {
    base_cost: v.number(),
    margin: v.number()
  },
  handler: async (ctx, args) => {
    const input_price = args.base_cost * (1 + args.margin);
    const output_price = input_price * 2;

    return { input_price, output_price };
  }
});
```

**Run test → Verify it PASSES**:

```bash
Bash: npm test [test-file]
# Must show: "X passed" with actual count
# Exit code: 0 (success)
```

**Capture GREEN phase output**:
```bash
$ npm test pricing.test.ts
PASS convex/__tests__/pricing.test.ts
  ✓ calculatePricing returns positive price (45ms)

Tests: 1 passed, 1 total
```

**GREEN phase complete when**:
- Minimal implementation written
- Test run and PASSES
- Exit code is 0

---

### Step 3: REFACTOR Phase - Improve Quality

**Add edge case handling, validation, error messages** while keeping tests passing.

#### Add Validation

```typescript
export const calculatePricing = mutation({
  args: {
    base_cost: v.number(),
    margin: v.number()
  },
  handler: async (ctx, args) => {
    // Validation
    if (args.base_cost <= 0) {
      throw new Error("Base cost must be positive");
    }
    if (args.margin < 0) {
      throw new Error("Margin cannot be negative");
    }

    // Calculation
    const input_price = args.base_cost * (1 + args.margin);
    const output_price = input_price * 2;

    return { input_price, output_price };
  }
});
```

#### Add Tests for Edge Cases

```typescript
test("calculatePricing validates positive base cost", async () => {
  const t = convexTest(schema);

  await expect(
    t.mutation(api.mutations.calculatePricing, {
      base_cost: -10,
      margin: 0.6
    })
  ).rejects.toThrow("Base cost must be positive");
});

test("calculatePricing validates non-negative margin", async () => {
  const t = convexTest(schema);

  await expect(
    t.mutation(api.mutations.calculatePricing, {
      base_cost: 10,
      margin: -0.5
    })
  ).rejects.toThrow("Margin cannot be negative");
});
```

**Run tests → Verify still PASSES**:

```bash
Bash: npm test [test-file]
# Must show: "3 passed" (original + edge cases)
# Exit code: 0
```

**Capture REFACTOR phase output**:
```bash
$ npm test pricing.test.ts
PASS convex/__tests__/pricing.test.ts
  ✓ calculatePricing returns positive price (42ms)
  ✓ calculatePricing validates positive base cost (38ms)
  ✓ calculatePricing validates non-negative margin (35ms)

Tests: 3 passed, 3 total
```

**REFACTOR phase complete when**:
- Edge cases handled
- All tests passing
- Code quality improved (validation, error messages)

---

### Step 4: VERIFY - Run Full Test Suite

**Always run complete test suite and TypeScript compilation**:

```bash
# Run all tests (not just this file)
Bash: npm test
# Must show: "X passed, 0 failed"

# Check TypeScript
Bash: npx tsc --noEmit
# Must show: no output (0 errors)
```

**Verification must pass**:
- ✅ All tests passing (including existing tests)
- ✅ TypeScript compiles with 0 errors
- ✅ Exit codes are 0

---

### Step 5: REPORT - Return Completion Report WITH TDD EVIDENCE

Return comprehensive report with RED → GREEN → REFACTOR evidence.

```markdown
## Task T002: Completed ✅

**Status**: completed

**Files Created**:
- convex/__tests__/pricing.test.ts
- convex/mutations/calculatePricing.ts

**TDD Evidence**:

### RED Phase (Test Fails)
```bash
$ npm test pricing.test.ts
FAIL convex/__tests__/pricing.test.ts
  ✗ calculatePricing returns positive price
    Cannot find module 'convex/mutations/calculatePricing'

Tests: 1 failed, 1 total
```

### GREEN Phase (Test Passes)
```bash
$ npm test pricing.test.ts
PASS convex/__tests__/pricing.test.ts
  ✓ calculatePricing returns positive price (45ms)

Tests: 1 passed, 1 total
```

### REFACTOR Phase (All Tests Pass)
```bash
$ npm test pricing.test.ts
PASS convex/__tests__/pricing.test.ts
  ✓ calculatePricing returns positive price (42ms)
  ✓ calculatePricing validates positive base cost (38ms)
  ✓ calculatePricing validates non-negative margin (35ms)

Tests: 3 passed, 3 total
```

### TypeScript Compilation
```bash
$ npx tsc --noEmit
[no output = 0 errors]

$ echo %errorlevel%
0
```

**Notes**: Implemented pricing calculation with edge case handling for negative inputs and zero margin
```

---

## Tools Used

- **Read**: Read source documents (spec, plan, tasks), existing code patterns
- **Write**: Create test files, implementation files
- **Edit**: Modify existing files during refactor
- **Bash**: Run tests (npm test), check TypeScript (npx tsc)
- **IDE Diagnostics**: Check TypeScript errors across project

---

## Quality Standards

### Must Do ✅
- Read source documents to verify orchestrator context
- Write tests BEFORE implementation (RED phase first)
- Run test and capture FAILING output (RED evidence)
- Write minimal implementation (GREEN phase)
- Run test and capture PASSING output (GREEN evidence)
- Add edge cases and refactor (REFACTOR phase)
- Run full test suite and TypeScript compilation
- Include RED → GREEN → REFACTOR evidence in report

### Must NOT Do ❌
- Write implementation before tests (violates TDD)
- Skip RED phase (assume test would fail)
- Skip GREEN phase verification (assume test passes)
- Claim "tests should pass" without running them
- Gold-plate implementation in GREEN phase (add only what's needed)
- Skip edge case handling in REFACTOR phase
- Report completion without TDD evidence

---

## Example: Complete TDD Cycle

### Task: Implement GPU VRAM estimation

**From spec**: "Calculate VRAM needed for model inference based on parameter count and precision"

**From plan**:
```
Formula: VRAM (GB) = (parameters * bytes_per_param * 1.2) / 1e9
- bytes_per_param: 2 for FP16, 4 for FP32
- 1.2 factor: 20% overhead for activations
```

### RED Phase

```typescript
// convex/__tests__/gpu_estimation.test.ts
test("estimateVRAM calculates for FP16 model", async () => {
  const t = convexTest(schema);

  const result = await t.query(api.queries.estimateVRAM, {
    parameters: 7_000_000_000,  // 7B model
    precision: "fp16"
  });

  expect(result.vram_gb).toBeCloseTo(16.8, 1);  // 7B * 2 * 1.2 / 1e9
});
```

Run test → FAILS (function doesn't exist)

### GREEN Phase

```typescript
// convex/queries/estimateVRAM.ts
export const estimateVRAM = query({
  args: {
    parameters: v.number(),
    precision: v.union(v.literal("fp16"), v.literal("fp32"))
  },
  handler: async (ctx, args) => {
    const bytes_per_param = args.precision === "fp16" ? 2 : 4;
    const vram_gb = (args.parameters * bytes_per_param * 1.2) / 1e9;

    return { vram_gb };
  }
});
```

Run test → PASSES

### REFACTOR Phase

Add validation:
```typescript
if (args.parameters <= 0) {
  throw new Error("Parameter count must be positive");
}
```

Add tests for edge cases:
```typescript
test("estimateVRAM validates positive parameters", async () => {
  const t = convexTest(schema);

  await expect(
    t.query(api.queries.estimateVRAM, {
      parameters: -1000,
      precision: "fp16"
    })
  ).rejects.toThrow("Parameter count must be positive");
});

test("estimateVRAM calculates for FP32 model", async () => {
  const t = convexTest(schema);

  const result = await t.query(api.queries.estimateVRAM, {
    parameters: 7_000_000_000,
    precision: "fp32"
  });

  expect(result.vram_gb).toBeCloseTo(33.6, 1);  // 7B * 4 * 1.2 / 1e9
});
```

Run tests → All 3 PASS

---

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Writing Code Before Tests

**WRONG**:
```typescript
// Writing implementation first
export const calculatePricing = mutation({ /* ... */ });

// Then writing test
test("calculatePricing works", async () => { /* ... */ });
```

**CORRECT**:
```typescript
// 1. Write test first (RED)
test("calculatePricing returns positive price", async () => { /* ... */ });
// Run → FAILS

// 2. Write minimal implementation (GREEN)
export const calculatePricing = mutation({ /* ... */ });
// Run → PASSES

// 3. Refactor and add edge cases (REFACTOR)
// Add validation, more tests
// Run → All PASS
```

---

### ❌ Anti-Pattern 2: No RED Phase Evidence

**WRONG**:
```markdown
## Task Complete

**Files Created**: test.ts, implementation.ts
**Notes**: Tests pass, should work
```

**CORRECT**:
```markdown
## Task Complete

**TDD Evidence**:

### RED Phase
```bash
$ npm test pricing.test.ts
FAIL: 1 failed
[actual error output]
```

### GREEN Phase
```bash
$ npm test pricing.test.ts
PASS: 1 passed
[actual pass output]
```

### REFACTOR Phase
```bash
$ npm test pricing.test.ts
PASS: 3 passed
[actual pass output]
```
```

---

### ❌ Anti-Pattern 3: Gold-Plating in GREEN Phase

**WRONG** (GREEN phase):
```typescript
// Adding features not required by test
export const calculatePricing = mutation({
  handler: async (ctx, args) => {
    // ❌ Test doesn't require validation yet
    if (args.base_cost <= 0) throw new Error("...");
    if (args.margin < 0) throw new Error("...");

    // ❌ Test doesn't require logging
    console.log("Calculating pricing...");

    // ✅ Only this is needed to pass test
    const input_price = args.base_cost * (1 + args.margin);
    const output_price = input_price * 2;
    return { input_price, output_price };
  }
});
```

**CORRECT** (GREEN phase → REFACTOR phase):
```typescript
// GREEN: Minimal to pass test
export const calculatePricing = mutation({
  handler: async (ctx, args) => {
    const input_price = args.base_cost * (1 + args.margin);
    const output_price = input_price * 2;
    return { input_price, output_price };
  }
});

// REFACTOR: Add validation AFTER test passes
export const calculatePricing = mutation({
  handler: async (ctx, args) => {
    if (args.base_cost <= 0) throw new Error("...");
    if (args.margin < 0) throw new Error("...");

    const input_price = args.base_cost * (1 + args.margin);
    const output_price = input_price * 2;
    return { input_price, output_price };
  }
});
```

---

## Remember

**The Iron Law** (from pre-completion-verification):
> No completion claims without fresh verification evidence.

**Before claiming complete**:
1. Capture RED phase output (test failing)
2. Capture GREEN phase output (test passing)
3. Capture REFACTOR phase output (all tests passing)
4. Run TypeScript compilation (0 errors)
5. Include ALL evidence in completion report

**TDD cycle is NOT complete unless you can show RED → GREEN evidence.**
