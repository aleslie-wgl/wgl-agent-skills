---
name: validation-patterns
type: knowledge
description: "[KNOWLEDGE] Validation patterns: result parsing, error handling, progress tracking, integration checkpoints, and phase validation strategies"
when_to_use: When validating task completion, handling agent errors, tracking progress, or running integration checkpoints
version: 1.0.0
---

**Input**: Agent results, test outputs, acceptance criteria
**Output**: Validation strategies and error handling patterns

---

## Pattern 1: Result Parsing & Error Handling

### Parse Agent Response

**Expected Result Format**:

```typescript
interface AgentResult {
  taskId: string;
  status: "completed" | "failed" | "blocked";
  filesCreated: string[];
  errors?: string[];
  notes?: string;
}
```

**Parsing Logic**:

```typescript
function parseAgentResult(response: string): AgentResult {
  // Extract structured data from agent response
  // Look for patterns:
  // - "Task T001: completed"
  // - "Created: convex/actions/huggingface.ts"
  // - "Error: TypeScript compilation failed"

  return {
    taskId: extractTaskId(response),
    status: extractStatus(response),
    filesCreated: extractFiles(response),
    errors: extractErrors(response),
    notes: extractNotes(response)
  };
}
```

### Error Handling Logic

```typescript
function handleAgentResult(result: AgentResult): Action {
  if (result.status === "completed") {
    // ✅ Success
    updateTaskCheckbox(result.taskId, "completed");
    logSuccess(result);
    return "proceed";
  }

  if (result.status === "failed") {
    // ❌ Failure
    if (isRateLimitError(result.errors)) {
      // Retry once after 30s
      return "retry_after_30s";
    }

    if (isTypeScriptError(result.errors)) {
      // STOP, report to user
      reportToUser(`Task ${result.taskId} failed: ${result.errors}`);
      return "stop";
    }

    if (isTestFailure(result.errors)) {
      // STOP, report to user
      reportToUser(`Task ${result.taskId} tests failed: ${result.errors}`);
      return "stop";
    }
  }

  if (result.status === "blocked") {
    // ⚠️ Blocked (missing dependency, unclear requirement)
    reportToUser(`Task ${result.taskId} blocked: ${result.notes}`);
    askUser("Fix manually | Retry | Skip?");
    return "wait_for_user";
  }
}
```

### Retry Strategy

| Error Type | Retry? | Max Retries | Backoff |
|------------|--------|-------------|---------|
| Rate limit (429) | ✅ Yes | 1 | 30 seconds |
| Timeout | ✅ Yes | 1 | 10 seconds |
| TypeScript error | ❌ No | 0 | STOP, report to user |
| Test failure | ❌ No | 0 | STOP, report to user |
| Checkpoint failure | ❌ No | 0 | STOP, debug issue |
| Agent crash | ✅ Yes | 1 | 5 seconds |

**User Decision Points**:
- If task fails (non-retryable) → Ask user: "Fix manually | Retry | Skip?"
- If checkpoint fails → Ask user: "Debug issue manually | Skip checkpoint (risky!)"
- If blocked → Ask user: "Provide missing information | Skip task"

---

## Pattern 2: Progress Tracking

### Update Markdown Checkboxes

```bash
# After task completion
Edit: docs/features/[feat-id]-tasks.md

# Change:
- [ ] **T001**: Create HuggingFace API action module

# To:
- [x] **T001**: Create HuggingFace API action module
```

### Progress Report (After Each Batch)

```markdown
## Progress Report (Batch 2)

**Batch 2 Results**:
- ✅ T002: Implement pricing calculation with TDD (Sonnet, 45 min)
- ✅ T005: Build pricing form validation (Haiku, 20 min)
- ✅ T008: Add environment variables for API keys (Haiku, 10 min)

**Total Progress**:
- Completed: 8 / 85 tasks (9.4%)
- Remaining: 77 tasks
- Estimated Time Remaining: ~8 days (with 2 developers, parallel work)

**Next Batch** (Batch 3):
- T003: Wire pricing calculation to UI
- T006: Add error handling for API calls
- T009: Update Convex schema for pricing history
```

### Cumulative Progress Log

Keep a running log in tasks.md:

```markdown
## Implementation Log

### 2025-01-15 14:30 - Batch 1 Complete
- Completed: T001, T004, T007
- Duration: 75 minutes (parallel)
- Issues: None
- Next: Batch 2 (T002, T005, T008)

### 2025-01-15 16:00 - Batch 2 Complete
- Completed: T002, T005, T008
- Duration: 90 minutes (parallel)
- Issues: T002 had TypeScript error, fixed in 10 min
- Next: Batch 3 (T003, T006, T009)

### 2025-01-15 18:00 - Checkpoint 1 (INT-01)
- Status: PASS
- Notes: All backend functions working, tests passing, console clean
- Next: Start Phase 2 (Frontend)
```

---

## Pattern 3: Integration Checkpoints

**When to Run**: Every 10 tasks (or end of each phase)

**Purpose**: Verify integration BEFORE proceeding to next batch

### Checkpoint Execution Steps

```markdown
# INT-01: Integration Checkpoint (T001-T010)

**Step 1: Start Dev Servers** (if not running)

# Check if servers running
powershell -Command "Get-NetTCPConnection -LocalPort 8765 -State Listen -ErrorAction SilentlyContinue"
powershell -Command "Get-NetTCPConnection -LocalPort 3210 -State Listen -ErrorAction SilentlyContinue"

# If not running, use server management scripts:
.\scripts\start-servers.ps1  # PowerShell
./scripts/start-servers.sh   # Git Bash

**Step 2: Navigate to Feature URL**

- Open browser: http://localhost:8765/admin/models/discover
- Verify page loads without errors

**Step 3: Test Primary User Action**

For this checkpoint, test:
1. Enter search query: "vision models"
2. Click "Search" button
3. Verify results display correctly
4. Click on first result
5. Verify detail page loads

**Step 4: Check Browser Console**

- Open DevTools console (F12)
- Must have **ZERO errors** (warnings are OK)
- Check Network tab for failed requests

**Step 5: Document Result**

Edit: docs/features/[feat-id]-tasks.md

Add under "Checkpoint Results" section:

### Checkpoint 1 Results (T001-T010)
- Date: 2025-01-15 18:00
- Status: PASS
- Notes: All components render correctly, search works, detail page loads
- Console errors: 0
- Network errors: 0
```

### Checkpoint Failure Protocol

**If checkpoint fails**:

```markdown
# ❌ CHECKPOINT FAILED

**STOP IMMEDIATELY** - Do NOT proceed to next batch

**Failure Details**:
- What failed: [e.g., "Search button click doesn't trigger API call"]
- Error message: [e.g., "TypeError: Cannot read property 'vendor' of undefined"]
- Browser console: [Copy error messages]

**Debug Steps**:
1. Check recent changes (T008-T010)
2. Review console errors
3. Check Network tab for failed API calls
4. Verify Convex schema matches code
5. Check environment variables

**Resolution**:
- Fix issue manually or create bug fix task
- Re-run checkpoint
- Only proceed when checkpoint PASSES
```

**Never skip failed checkpoints** - integration issues compound and become harder to debug later.

---

## Pattern 4: Phase Validation (Acceptance Criteria Testing)

**When to Use**: After each phase completes (Backend, Frontend, Integration)

**Purpose**: Verify that acceptance criteria from spec are actually met, not just that code compiles

**Key Principle**: Don't proceed to next phase until validation passes

### Validation Context Flow

```markdown
Orchestrator (maintains full context)
  ↓ Phase 1 complete
  ↓ Dispatch validator with minimal context
validator (gets: acceptance criteria + tasks completed + test strategy)
  ↓ Runs tests, documents results
  ↓ If issues found: fixes OR reports back
  ↓ Returns validation report
Orchestrator (reviews results)
  ↓ If PASS: proceed to Phase 2
  ↓ If FAIL: dispatch implementers to fix
```

### What Validator Receives

```markdown
You are validating Phase 1 (Backend Foundation) for FEAT-XXX.

**Phase Goal**: Build data layer and business logic

**Tasks Completed**: T001-T015

**Acceptance Criteria from Spec** (relevant to this phase):
- US-1, AC1: Admin can search HuggingFace API for models
- US-1, AC2: Search results include model metadata
- US-2, AC1: System calculates GPU VRAM requirements
- US-2, AC2: System generates pricing from VRAM

**Testing Strategy** (from plan):
- Unit tests: Pricing calculations, VRAM formulas
- Integration tests: HuggingFace API calls, Convex mutations
- Expected: All tests passing, TypeScript compiles

**What to Validate**:
1. Run unit tests (npm test)
2. Run integration tests (if exist)
3. Check TypeScript (npx tsc --noEmit)
4. Verify each acceptance criterion above
5. Test error cases (API failure, invalid inputs)

**Expected Output**:
- Validation report (PASS/FAIL)
- Test results (which tests passed/failed)
- Issues found (if any)
- Fixes applied (if you fixed issues)
- Recommendations (if issues remain)
```

### Validation Process

**Step 1: Run Automated Tests**

```bash
# Unit tests
Bash: npm test

# Integration tests (if exist)
Bash: npm run test:integration

# TypeScript check
Bash: npx tsc --noEmit

# Collect results
test_results = {
  unit_tests: { passed: 45, failed: 2 },
  integration_tests: { passed: 12, failed: 0 },
  typescript: { errors: 0 }
}
```

**Step 2: Test Acceptance Criteria**

```typescript
// For each acceptance criterion in validator's context:
for (criterion in acceptance_criteria) {
  // Backend acceptance criteria
  if (criterion involves API/mutation):
    // Test programmatically
    const result = await testConvexMutation(criterion);
    if (!result.success) {
      issues.push({ criterion, error: result.error });
    }

  // Frontend acceptance criteria (if UI available)
  if (criterion involves UI):
    // Manual check or Playwright test
    const uiTest = await testUserAction(criterion);
    if (!uiTest.success) {
      issues.push({ criterion, error: uiTest.error });
    }
}
```

**Step 3: Fix Issues (If Possible)**

```markdown
If validator finds issues:
  1. Analyze error (TypeScript? Logic? Test?)
  2. If simple fix (missing import, typo):
     - Apply fix
     - Re-run tests
     - Document fix in report
  3. If complex fix (logic error, missing feature):
     - Document issue clearly
     - Return to orchestrator for implementer dispatch
```

**Step 4: Return Validation Report**

```markdown
## Phase 1 Validation: PASS ✅

**Tests Run**:
- ✅ Unit tests: 47/47 passing
- ✅ Integration tests: 12/12 passing
- ✅ TypeScript: 0 errors

**Acceptance Criteria Validated**:
- ✅ US-1, AC1: HuggingFace search works (tested with mock API)
- ✅ US-1, AC2: Metadata returned correctly
- ✅ US-2, AC1: VRAM calculation correct (tested 7B, 70B models)
- ✅ US-2, AC2: Pricing generated (verified formula)

**Issues Found**: None

**Fixes Applied**: None needed

**Recommendation**: ✅ Proceed to Phase 2 (Frontend)
```

**Or if issues:**

```markdown
## Phase 1 Validation: FAIL ❌

**Tests Run**:
- ⚠️ Unit tests: 45/47 passing (2 failed)
- ✅ Integration tests: 12/12 passing
- ✅ TypeScript: 0 errors

**Failed Tests**:
1. `calculatePricing` test: Expected 16.00, got NaN
   - Issue: Division by zero when base_cost = 0
   - Fix needed: Add validation in mutation

2. `estimateVRAM` test: Expected 14, got 28
   - Issue: Not accounting for 16-bit precision
   - Fix needed: Update formula to use params * 2 (not params * 4)

**Acceptance Criteria Validated**:
- ✅ US-1, AC1: HuggingFace search works
- ✅ US-1, AC2: Metadata returned correctly
- ❌ US-2, AC1: VRAM calculation incorrect (wrong formula)
- ❌ US-2, AC2: Pricing fails with invalid inputs

**Issues Found**: 2 test failures affecting acceptance criteria

**Fixes Applied**:
- Fixed VRAM formula (params * 2 instead of * 4)
- Re-ran tests: 46/47 passing (1 still failing)

**Remaining Issue**:
- `calculatePricing` still fails with base_cost = 0
- Needs validation added to mutation

**Recommendation**: ❌ Fix validation issue before proceeding
```

### Orchestrator Response to Validation

```typescript
function handleValidationResult(result: ValidationReport) {
  if (result.status === "PASS") {
    // ✅ All good, proceed to next phase
    log("Phase 1 validation passed");
    proceedToPhase(2);
  }

  else if (result.status === "FAIL" && result.fixes_applied) {
    // ⚠️ Had issues but validator fixed them
    // Re-run validation to confirm
    log("Validator applied fixes, re-validating...");
    dispatchValidator(phase, acceptance_criteria);
  }

  else if (result.status === "FAIL" && result.remaining_issues) {
    // ❌ Issues remain, need implementer to fix
    log("Validation failed, dispatching implementer to fix issues");

    // Create fix tasks from validation report
    for (issue in result.remaining_issues) {
      dispatch_implementer({
        task: `Fix: ${issue.description}`,
        context: issue.details,
        acceptance: issue.criterion
      });
    }

    // After fixes, re-run validation
    waitForFixes();
    dispatchValidator(phase, acceptance_criteria);
  }
}
```

### Iteration Pattern

```markdown
# Phase 1: Implementation
Batch 1-3 complete → T001-T015 done

# Phase 1: Validation (Attempt 1)
Dispatch: validator
Result: FAIL (2 test failures)
Issues: VRAM formula wrong, pricing validation missing

# Phase 1: Fix Iteration
Dispatch: implementer
  Fix 1: Update VRAM formula
  Fix 2: Add pricing validation
Result: Fixes applied

# Phase 1: Validation (Attempt 2)
Dispatch: validator
Result: PASS ✅
All tests passing, acceptance criteria met

# Phase 2: Begin Frontend
Proceed to next phase...
```

### Quality Standards

**Validator must verify**:
- ✅ All automated tests pass (unit, integration)
- ✅ TypeScript compiles with 0 errors
- ✅ Acceptance criteria from spec are met
- ✅ Error cases handled (not just happy path)
- ✅ No console errors in browser (for UI phases)

**Validator must NOT**:
- ❌ Claim "should work" without testing
- ❌ Skip acceptance criteria validation
- ❌ Proceed with failing tests
- ❌ Ignore edge cases

---

## Example: Full Orchestration Workflow

```markdown
# /execute-feature FEAT-XXX

## Step 1: Load Context
Read: docs/features/FEAT-XXX-spec.md
Read: docs/features/FEAT-XXX-plan.md
Read: docs/features/FEAT-XXX-tasks.md

## Step 2: Build Dependency Graph
Parse tasks → Identify dependencies → Create batches

Batch 1: [T001, T004, T007, T011]  # 4 independent tasks
Batch 2: [T002, T005, T008, T012]  # Depend on Batch 1
... (7 batches total)

## Step 3: Execute Batch 1 (Parallel Dispatch)
Task 1: tdd-executor → T001 (Convex mutation with TDD)
Task 2: implementer → T004 (Schema update)
Task 3: implementer → T007 (Environment variables)
Task 4: implementer → T011 (UI component)

Wait for all → All completed successfully

Update tasks.md:
- [x] T001, T004, T007, T011

Progress: 4 / 85 tasks (4.7%), ~9 days remaining

## Step 4: Execute Batch 2 (Parallel Dispatch)
[Same pattern as Batch 1]

## Step 5: Run Checkpoint (INT-01)
After T010 complete:
  1. Start dev servers (use scripts/start-servers.ps1 or .sh)
  2. Navigate to http://localhost:8765/admin/pricing
  3. Test: Enter price, click save, verify update
  4. Check console: 0 errors
  5. Result: PASS

Continue to Batch 3...

## Final Report
Total: 85 tasks
Completed: 85 tasks
Failed: 0 tasks
Duration: 11 days (actual), 8 days (estimated)
Checkpoints: 3 / 3 PASS

Feature FEAT-XXX implementation complete ✅
```

---

**Related Skills**:
- For dispatch patterns: agent-dispatch-patterns
- For context provision: context-provision-patterns
- For pre-completion checks: pre-completion-verification
