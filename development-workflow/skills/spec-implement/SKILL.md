---
name: spec-implement
description: "[WORKFLOW] Direct implementation process for straightforward tasks (UI components, config, simple integrations) with pre-completion verification"
when_to_use: When implementing non-TDD tasks like UI components, schema updates, config changes, or E2E tests after reality check
version: 1.0.0
type: workflow
---

**Input**: Task context from orchestrator (task ID, acceptance criteria, spec/plan excerpts)
**Output**: Implementation + completion report with verification evidence

---

## Overview

This skill defines the complete implementation workflow for straightforward tasks that don't require comprehensive TDD cycles. Focus is on speed and simplicity while maintaining quality through verification.

**Key Principle**: Pre-completion verification - Always run verification commands and show evidence before claiming completion.

---

## Process: Direct Implementation

### Step 1: Read Source Documents

**CRITICAL**: Do NOT trust orchestrator context alone. Verify by reading source documents.

```bash
# Read the actual feature documents
Read: docs/features/FEAT-XXX-spec.md      # Full acceptance criteria, user stories
Read: docs/features/FEAT-XXX-plan.md      # Architecture, component structure, API contracts
Read: docs/features/FEAT-XXX-tasks.md     # Task list, dependencies, acceptance criteria
```

**Extract from documents**:
- **From spec**: Acceptance criteria for THIS task, user story context
- **From plan**: Component props, API contracts, architecture patterns
- **From tasks**: Task dependencies, integration checkpoint requirements

**Parse orchestrator context**:
- Task acceptance criteria
- Spec/plan excerpts
- Expert skill patterns

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

### Step 2: Reality Check (E2E/Integration Tests ONLY)

**If task involves E2E or integration tests**, inspect actual implementation BEFORE writing tests.

#### Why This Matters

Tests fail when they reference selectors that don't exist in the actual implementation. You must inspect the real code to find actual selectors.

#### How to Inspect

```bash
# Find the component/page being tested
Read: [implementation-file]

# Check what selectors actually exist
Grep: "data-testid|aria-label|placeholder" [implementation-file]
```

**Document findings**:
- ✅ **Selectors that exist**: `aria-label="Search models"`, `placeholder="Enter search"`
- ❌ **Selectors that DON'T exist**: `data-testid` attributes (if grep returns nothing)

**Use ACTUAL selectors in tests, not assumed ones.**

#### Example: Writing E2E Test

**WRONG** (assumes selectors):
```typescript
// ❌ Assumes data-testid exists without checking
await page.locator('[data-testid="search-input"]').fill('llama-3');
await page.locator('[data-testid="search-button"]').click();
```

**CORRECT** (inspects first, uses actual selectors):
```typescript
// ✅ After inspecting component and finding actual selectors:
// - Input has placeholder="Search for models..."
// - Button has aria-label="Search"

await page.locator('input[placeholder="Search for models..."]').fill('llama-3');
await page.locator('button[aria-label="Search"]').click();
```

**Skip this step** for non-test tasks (UI components, config, schema).

---

### Step 3: Implement

Follow existing code patterns and use expert knowledge from orchestrator context.

#### UI Component Example

```typescript
// components/PricingCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PricingCardProps {
  modelName: string;
  inputPrice: number;
  outputPrice: number;
}

export function PricingCard({ modelName, inputPrice, outputPrice }: PricingCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{modelName}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Input</span>
          <span className="font-medium">${inputPrice.toFixed(4)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Output</span>
          <span className="font-medium">${outputPrice.toFixed(4)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Schema Update Example

```typescript
// convex/schema.ts
export default defineSchema({
  // ... existing tables

  pricing_configs: defineTable({
    model_id: v.id("models"),
    base_cost: v.number(),
    margin: v.number(),
    input_price: v.number(),
    output_price: v.number(),
    updated_at: v.number()
  })
  .index("by_model", ["model_id"])
  .index("by_updated", ["updated_at"])
});
```

#### Page Layout Example

```typescript
// app/(marketing)/admin/pricing/page.tsx
import { PricingCard } from "@/components/PricingCard";

export default function PricingPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Pricing Management</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Cards will be populated from Convex query */}
      </div>
    </div>
  );
}
```

#### Environment Variables Example

```bash
# Add to .env.local
HF_TOKEN=your_huggingface_token_here

# Add to convex/_generated/env.d.ts
declare module "process" {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        HF_TOKEN: string;
      }
    }
  }
}
```

### Step 4: Verify and Document Evidence

**CRITICAL**: Always run verification commands and capture output.

```bash
# ALWAYS run TypeScript check
Bash: npx tsc --noEmit
# Must show: no output (0 errors)

# For E2E tests: ALWAYS run the test
Bash: SKIP_WEBSERVER=1 npx playwright test [test-file] --reporter=list
# Must show: "X passed" with actual count
```

**Read the output line-by-line**:
- Count passing vs. failing tests
- Check for "0 errors" or "X passed"
- Verify exit code is 0

**Must pass before claiming completion**:
- ✅ TypeScript: 0 errors
- ✅ Tests: X/X passing (if test task)
- ✅ Exit code: 0

#### Verification Evidence Format

**For TypeScript compilation**:
```bash
$ npx tsc --noEmit
[no output = 0 errors]

$ echo %errorlevel%  # Windows
0
```

**For E2E tests**:
```bash
$ SKIP_WEBSERVER=1 npx playwright test e2e/feat-002-admin-workflow.spec.ts --reporter=list
Running 5 tests using 1 worker
  ✓  1 [chromium] › should load discovery page (2.1s)
  ✓  2 [chromium] › should search for models (2.3s)
  ✓  3 [chromium] › should show empty state (1.9s)
  ✓  4 [chromium] › should show clear button (1.8s)
  ✓  5 [chromium] › should handle no results (2.2s)
  5 passed (11.3s)

$ echo %errorlevel%
0
```

---

### Step 5: Generate Completion Report WITH EVIDENCE

Return comprehensive completion report with verification evidence.

#### Standard Task Report

```markdown
## Task T010: Completed ✅

**Status**: completed

**Files Created**:
- components/PricingCard.tsx

**Verification Evidence**:
```bash
$ npx tsc --noEmit
[no output = 0 errors]

$ echo %errorlevel%
0
```

**Notes**: Component renders correctly, uses shadcn/ui Card, responsive design with Tailwind
```

#### E2E Test Task Report

```markdown
## Task T075: Completed ✅

**Status**: completed

**Files Created**:
- e2e/feat-002-admin-workflow.spec.ts

**Verification Evidence**:
```bash
$ SKIP_WEBSERVER=1 npx playwright test e2e/feat-002-admin-workflow.spec.ts --reporter=list
Running 5 tests using 1 worker
  ✓  1 [chromium] › should load discovery page (2.1s)
  ✓  2 [chromium] › should search for models (2.3s)
  ✓  3 [chromium] › should show empty state (1.9s)
  ✓  4 [chromium] › should show clear button (1.8s)
  ✓  5 [chromium] › should handle no results (2.2s)
  5 passed (11.3s)

$ echo %errorlevel%
0
```

**Notes**: All 5 tests passing, used actual selectors from implementation (placeholder="Search for models...", aria-label="Search")
```

---

## Tools Used

- **Read**: Read implementation files to inspect actual selectors (for E2E tests)
- **Grep**: Search for selectors in implementation (data-testid, aria-label, placeholder)
- **Write**: Create new files (components, pages, tests)
- **Edit**: Modify existing files (schema, config)
- **Bash**: Run TypeScript compilation, E2E tests
- **IDE Diagnostics**: Check TypeScript errors across project

---

## Quality Standards

### Must Do ✅
- Read source documents (spec, plan, tasks) to verify context
- For E2E tests: Inspect actual implementation BEFORE writing test
- Use ACTUAL selectors found in code, not assumed selectors
- Run verification commands (TypeScript, tests)
- Capture and include output in completion report
- Use pre-completion-verification skill before claiming done

### Must NOT Do ❌
- Skip document reading and trust orchestrator context alone
- Assume selectors exist without inspecting implementation
- Claim completion without running verification commands
- Report "should work" without evidence
- Write comprehensive tests (that's tdd-executor's job)
- Over-engineer simple tasks (follow YAGNI principle)

---

## Common Patterns

### Pattern 1: UI Component Task

1. Read spec for UI requirements
2. Read plan for component props and structure
3. Implement component following existing patterns
4. Verify TypeScript compiles (0 errors)
5. Report with verification evidence

### Pattern 2: E2E Test Task

1. Read spec for user workflow being tested
2. **CRITICAL**: Read implementation file to find actual selectors
3. Grep for selectors (data-testid, aria-label, placeholder)
4. Write test using ACTUAL selectors found
5. Run test (SKIP_WEBSERVER=1 npx playwright test)
6. Verify all tests passing
7. Report with test output

### Pattern 3: Schema/Config Task

1. Read plan for data model requirements
2. Update schema following Convex conventions
3. Verify TypeScript compiles
4. Report with verification evidence

---

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Assumed Selectors in E2E Tests

**WRONG**:
```typescript
// Writing test without inspecting implementation
test('should search models', async ({ page }) => {
  await page.locator('[data-testid="search-input"]').fill('llama');
  await page.locator('[data-testid="search-button"]').click();
  // Test fails: selectors don't exist
});
```

**CORRECT**:
```typescript
// First: Read implementation file
// Found: <input placeholder="Search for models..." />
// Found: <button aria-label="Search">Search</button>

test('should search models', async ({ page }) => {
  await page.locator('input[placeholder="Search for models..."]').fill('llama');
  await page.locator('button[aria-label="Search"]').click();
  // Test passes: uses actual selectors
});
```

---

### ❌ Anti-Pattern 2: No Verification Evidence

**WRONG**:
```markdown
## Task T010: Completed ✅

**Status**: completed
**Files Created**: components/PricingCard.tsx
**Notes**: Component should work correctly
```

**CORRECT**:
```markdown
## Task T010: Completed ✅

**Status**: completed
**Files Created**: components/PricingCard.tsx

**Verification Evidence**:
```bash
$ npx tsc --noEmit
[no output = 0 errors]

$ echo %errorlevel%
0
```

**Notes**: Component renders correctly, TypeScript compiles
```

---

### ❌ Anti-Pattern 3: Over-Engineering Simple Tasks

**WRONG**:
```typescript
// Creating complex abstraction for simple component
class PricingCardFactory {
  constructor(private strategy: PricingStrategy) {}
  create(props: PricingCardProps): React.FC { /* ... */ }
}
```

**CORRECT**:
```typescript
// Simple, direct implementation
export function PricingCard({ modelName, inputPrice, outputPrice }: PricingCardProps) {
  return <Card>...</Card>;
}
```

---

## Remember

**The Iron Law** (from pre-completion-verification):
> No completion claims without fresh verification evidence.

**Before claiming complete**:
1. Run verification commands (TypeScript, tests if applicable)
2. Capture ACTUAL output (not assumptions)
3. Check exit codes (0 = success)
4. Include evidence in completion report
5. If unsure: Ask orchestrator or mark task as needing clarification

**Focus**: Speed and simplicity. Leave comprehensive testing to tdd-executor.
