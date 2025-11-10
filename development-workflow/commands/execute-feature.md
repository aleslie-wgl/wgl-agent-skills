# /execute-feature Command

**Purpose**: Execute tasks from feature spec using parallel dispatch, TDD patterns, and integration checkpoints

**Usage**: `/execute-feature <feat-id>`

**Example**: `/execute-feature FEAT-XXX`

---

## Prerequisites

Must have run `/spec` first. Required files:
- docs/features/[FEAT-XXX]-spec.md
- docs/features/[FEAT-XXX]-plan.md
- docs/features/[FEAT-XXX]-tasks.md

If missing → ERROR: "Run /spec first"

---

## Workflow

### Step 0: Session Start

**Dispatch ci-cd agent** for server management:

```markdown
Task: ci-cd (haiku)
  Action: session-start
  Feature ID: [FEAT-XXX]
  Working directory: [current directory]
  Servers required: Next.js (port 8765), Convex (port 3001)

  Expected:
  - Start servers if not running
  - Verify health
  - Report status with task IDs for later shutdown
```

**Wait for agent report**. If session start fails → STOP, resolve issue.

**Record server task IDs** from report for later shutdown.

---

### Step 1: Initialize Implementation

**Read feature documents:**
```bash
Read: docs/features/[FEAT-XXX]-spec.md
Read: docs/features/[FEAT-XXX]-plan.md
Read: docs/features/[FEAT-XXX]-tasks.md
```

**Load Skills**
Skill: @agent-dispatch-patterns:
Skill: @context-provision-patterns
Skill: @validation-patterns:


**Create STATUS.md from template:**
```bash
Read: .claude/skills/implement/templates/feature-status.md
Write: docs/features/[FEAT-XXX]-STATUS.md
  # Fill in header:
  Feature ID: [FEAT-XXX]
  Feature Name: [from spec]
  Status: In Progress
  Created: [YYYY-MM-DD]
  Last Updated: [YYYY-MM-DD]
```

---

### Step 2: Read Orchestration Data

**Read from tasks.md:**
- Batches (pre-calculated in spec-tasks Step 6)
- Phases (emergent from dependencies, spec-tasks Step 6.5)
- Critical path
- Task details (IDs, dependencies, estimates, acceptance criteria)

**Expected format in tasks.md:**
```markdown
## Batches (Execution Order)
Batch 1: [T001, T003, T004, T007]  // Parallel
Batch 2: [T002, T005, T008]         // Parallel (depend on Batch 1)
Batch 3: [T006, T009, T010]         // Parallel (depend on Batch 2)

## Phases (Emergent from Dependencies)
Phase 1: Batches 1-3 (T001-T010) - Foundation
Phase 2: Batches 4-7 (T011-T025) - Business Logic
Phase 3: Batches 8-10 (T026-T035) - UI Components
Phase 4: Batches 11-12 (T036-T042) - Integration

## Critical Path
T001 → T002 → T006 → T012 → T021 (8 days)
```

**No recalculation needed** - Trust tasks.md as single source of truth.

---

### Step 3: Execute Batches (Parallel Fan-Out/Fan-In)

**For each batch** (max 5 tasks per batch):

#### 1. Classify Tasks

```typescript
for task in batch:
  if task requires TDD:
    agent = "tdd-executor"
    model = "sonnet"
  else:
    agent = "implementer"
    model = "haiku"

  // Load expert skills based on task context
  if task involves Convex:
    expertSkills = ["convex-expert"]
  if task involves Next.js:
    expertSkills.push("nextjs-expert")
```

#### 2. Dispatch Agents in Parallel (Single Message)

```markdown
Task 1: tdd-executor
  Task ID: T001
  Task: "Implement pricing calculation with TDD"
  Context: [spec excerpt + plan excerpt + full task details including acceptance criteria, integration points, data transformation]
  Expert Skills: convex-expert
  Expected: Test file + implementation + completion report

Task 2: implementer
  Task ID: T004
  Task: "Build PricingCard UI component"
  Context: [spec excerpt + plan excerpt + full task details including acceptance criteria, integration points, data transformation]
  Expert Skills: nextjs-expert
  Expected: Component file + completion report

Task 3: implementer
  Task ID: T007
  Task: "Update Convex schema"
  Context: [spec excerpt + plan excerpt + task acceptance criteria]
  Expert Skills: convex-expert
  Expected: Schema file + completion report
```

#### 3. Wait for ALL to Complete (Fan-In)

Collect results from all agents.

#### 4. Parse Results

```typescript
for result in results:
  extract: {
    taskId: string,
    status: "completed" | "failed" | "blocked",
    filesCreated: string[],
    errors: string[],
    notes: string
  }
```

#### 5. Handle Results & Update Tasks File

```typescript
if status === "completed":
  // Mark task complete in tasks.md file
  Edit: docs/features/[FEAT-XXX]-tasks.md
    Find task acceptance criteria section
    Change all "- [ ]" to "- [x]" for this task

  log("✅ Task complete - tasks.md updated")
  proceed

else if status === "failed":
  if isRateLimitError:
    retry once after 30s
  else if isTypeScriptError or isTestFailure:
    STOP, report to user
    askUser("Fix manually | Retry | Skip?")

else if status === "blocked":
  STOP, report to user
  askUser("Provide missing info | Skip?")
```

#### 6. Write Batch Results to STATUS.md

Orchestrator writes batch completion to STATUS.md:

```bash
Write/Append: docs/features/[FEAT-XXX]-STATUS.md
  # Section: Batch Execution Log
```

```markdown
## Batch Execution Log

**Completed**:
- ✅ T002: Pricing calculation (Sonnet, 45 min) - tasks.md updated
- ✅ T005: Form validation (Haiku, 20 min) - tasks.md updated
- ✅ T008: Environment variables (Haiku, 10 min) - tasks.md updated

**Progress**: 8 / 85 tasks (9.4%)
**Remaining**: 77 tasks
**Estimated Time**: ~8 days (with 2 developers)

**Next Batch**: T003, T006, T009
```

**Every 5 batches (or ~20 tasks)**: Consider committing progress to preserve work.

---

### Step 3: Phase Validation & Commit (After Each Phase)

**When phase boundary reached** (end of Phase 1, 2, 3, etc.):

**CRITICAL**: Commit work after each phase to avoid losing progress.

#### 1. Extract Phase Context

From spec and plan files:

```typescript
// Parse spec for acceptance criteria relevant to this phase
const phaseACs = extractAcceptanceCriteria(spec, phase);

// Parse plan for testing strategy
const testStrategy = extractTestingStrategy(plan, phase);

// Get tasks completed in this phase
const phaseTasks = getPhaseTasksFromTasksFile(phase);
```

#### 2. Dispatch validator Agent

**Single Task call** with full validation context:

```markdown
You are validating Phase [N] ([Phase Name]) for FEAT-XXX.

**Feature**: [Feature Name]

**Phase Goal**: [What this phase accomplishes]

**Tasks Completed**: [T001-T015]
[List each task ID and description]

**Acceptance Criteria from Spec** (relevant to this phase):
[Extract ACs from user stories that apply to backend/frontend/integration]

From US-1 ([User Story Title]):
- AC1: [Acceptance criterion 1]
- AC2: [Acceptance criterion 2]

From US-2 ([User Story Title]):
- AC1: [Acceptance criterion 1]

**Testing Strategy from Plan**:
- Unit tests: [Which files/functions need unit tests]
- Integration tests: [Which workflows need integration tests]
- TypeScript: Zero compilation errors
- [Any phase-specific testing requirements]

**Expected Output**:
- Validation report (PASS/FAIL/PARTIAL)
- Test results (pass/fail counts)
- Acceptance criteria verification (which met, which failed)
- Issues found (if any)
- Fixes applied (if simple issues)
- Recommendations for next steps
```

**Wait for validator to complete** (fan-in).

#### 3. Parse Validation Report

Extract from validator response:

```typescript
{
  result: "PASS" | "FAIL" | "PARTIAL",
  testResults: {
    unit: { passed: N, failed: M },
    integration: { passed: N, failed: M },
    typescript: { errors: N }
  },
  acceptanceCriteria: [
    { id: "AC1", status: "MET" | "PARTIAL" | "NOT_MET", evidence: "file:line" },
    { id: "AC2", status: "MET", evidence: "file:line" }
  ],
  issues: [
    { severity: "critical" | "non-critical", description: "...", location: "file:line" }
  ],
  fixesApplied: ["Fixed import in X", "Removed console.log in Y"],
  recommendation: "Proceed to Phase N+1" | "Fix critical issues first"
}
```

#### 4. Handle Validation Results

```typescript
if (result === "PASS"):
  log("✅ Phase [N] validation PASSED")
  log("All acceptance criteria met, tests passing")
  updateTasksFile("### Phase [N] Validation: PASS")

  // COMMIT WORK AFTER PHASE COMPLETION
  commitPhase([N])  // Detailed commit with phase summary

  proceedToNextPhase()

else if (result === "PARTIAL"):
  log("⚠️ Phase [N] validation PARTIAL")
  log("Core functionality works, some ACs incomplete")

  askUser("Options:
    1. Proceed to Phase [N+1] (accept warnings)
    2. Fix incomplete ACs before proceeding
    3. Review validation report and decide
  ")

  if user chooses "Fix":
    generateFixTasks(issues)
    dispatchImplementers(fixTasks)
    re-dispatchValidator()
    loop until PASS

else if (result === "FAIL"):
  log("❌ Phase [N] validation FAILED")
  log("Critical issues block phase completion")

  STOP immediately
  presentIssues(criticalIssues)

  askUser("Options:
    1. Auto-generate fix tasks and retry
    2. Review issues manually
    3. Skip this phase (not recommended)
  ")

  if user chooses "Auto-fix":
    generateFixTasks(criticalIssues)
    dispatchImplementers(fixTasks)
    re-dispatchValidator()
    loop until PASS or PARTIAL
```

#### 5. Write Validation Results to STATUS.md

Orchestrator writes validator's report to STATUS.md:

```bash
Write/Append: docs/features/[FEAT-XXX]-STATUS.md
  # Section: Phase History

### Phase [N]: [Phase Name]
**Date**: [YYYY-MM-DD HH:MM]
**Status**: [result from validator report]

**Test Results**:
- Unit tests: [passed]/[total] (from validator.testResults)
- Integration tests: [passed]/[total]
- TypeScript: [errors] errors

**Acceptance Criteria**:
[Map from validator.acceptanceCriteria array]
- ✅ US-1, AC1: [description] (met)
- ⚠️ US-2, AC1: [description] (partial)
- ❌ US-2, AC2: [description] (not met)

**Issues Found**: [validator.issues.length]
**Fixes Applied**: [validator.fixesApplied.length]
**Recommendation**: [validator.recommendation]
```

#### 6. Validation Loop Pattern

```
Orchestrator: Phase 1 tasks complete
  ↓
Orchestrator: Extract phase context (ACs, test strategy, tasks)
  ↓
Orchestrator: Dispatch validator with context
  ↓
validator: Run tests → Verify ACs → Fix simple issues → Report
  ↓
Orchestrator: Parse validation report
  ↓
If PASS:
  ✅ Update STATUS.md with validation results
  ✅ Proceed to Phase 2

If PARTIAL:
  ⚠️ Update STATUS.md with warnings
  ⚠️ Ask user: proceed or fix?
  ⚠️ If fix: generate tasks, dispatch, re-validate

If FAIL:
  ❌ Update STATUS.md with failures
  ❌ Generate fix tasks from issues
  ❌ Dispatch implementers to fix
  ❌ Re-validate after fixes
  ❌ Loop until PASS or user intervention
```

---

---

### Step 5: Final Report

After all tasks complete:

```markdown
## Feature FEAT-XXX Implementation Complete ✅

**Total Tasks**: 85
**Completed**: 85
**Failed**: 0
**Duration**: 11 days (actual)

**Phase Validations**:
- Phase 1 (Backend Foundation): PASS
- Phase 2 (Admin UI): PASS
- Phase 3 (Public Pages): PASS
- Phase 4 (Testing & Polish): PASS

**Test Results**:
- Unit tests: [passed]/[total]
- Integration tests: [passed]/[total]
- E2E tests: [passed]/[total]
- TypeScript: 0 errors

**Next Steps**:
1. Feature ready for user testing
2. Review code quality (optional)
3. Create PR for review (optional)
4. Deploy to staging (optional)
```

---

## Quality Standards

### Task-Level (Implementers)
Before marking task complete:
- ✅ Acceptance criteria met
- ✅ TypeScript compiles (0 errors)
- ✅ Tests passing (if TDD task)
- ✅ pre-completion-verification passed

Never claim complete if:
- ❌ Tests failing
- ❌ TypeScript errors
- ❌ Partial implementation
- ❌ Did not verify before claiming completion

### Phase-Level (Orchestrator + Validator)
Before proceeding to next phase:
- ✅ All phase tasks completed
- ✅ Phase validation report generated
- ✅ All acceptance criteria met (or PARTIAL accepted by user)
- ✅ All tests passing (unit, integration, TypeScript)
- ✅ Integration checkpoint passed (if applicable)

Never proceed to next phase if:
- ❌ Phase validation FAILED
- ❌ Critical issues found
- ❌ Tests failing
- ❌ Acceptance criteria not met

---

## Output

**During execution**:
- Task checkboxes marked in real-time
- Batch results and phase validation logged to STATUS.md

**After completion**:
- docs/features/[FEAT-XXX]-tasks.md (all tasks checked)
- docs/features/[FEAT-XXX]-STATUS.md (comprehensive report)

---

## Step 6: Continuous Improvement

**After implementation complete, before ending session**:

### Invoke continuous-improvement Skill

**Load skill**: continuous-improvement

**Review this implementation**:
1. **What friction did I encounter?**
   - Repeated commands or patterns
   - Manual research or debugging
   - Error patterns that repeated
   - Assumptions that were wrong
   - Process inefficiencies

2. **What tools should I create?**
   - Debug scripts for common issues
   - Skills for reusable workflows
   - Guidelines for process problems
   - Hooks for automation opportunities
   - Documentation for knowledge gaps

3. **Verify improvements work**:
   - Run the scripts/tools created
   - Test with real inputs
   - Confirm documentation accuracy
   - Check skills load correctly

4. **Document for future use**:
   - Add to CLAUDE.md (if general principle)
   - Create skill (if reusable workflow)
   - Update relevant commands
   - Provide real usage examples

### Examples from Implementation

Good improvements created during implementation:
- ✅ `scripts/debug-page-load.ts` - Programmatic browser debugging
- ✅ `frontend-debugging` skill - Complete debugging workflow
- ✅ Background process management guidelines - Avoid process spam
- ✅ Updated hooks skill - Latest features researched

**Remember**: If you skip improvement, you're only doing half the job. Create tools, not just solutions.

---

## Step 7: Session End

**Dispatch ci-cd agent** for quality checks, commit, and cleanup:

```markdown
Task: ci-cd (haiku)
  Action: session-end
  Feature ID: [FEAT-XXX]
  Server task IDs: [from Step 0 report]
  Files changed: [from git status]

  Expected:
  - Run quality checks (TypeScript, tests)
  - Create commit with proper message
  - Shut down servers cleanly
  - Report status
```

**Agent will**:
1. Run TypeScript and test verification
2. Create comprehensive commit (if quality passes)
3. Kill background server processes
4. Verify ports released

**If quality checks fail**: Agent will NOT commit, will leave servers running for debugging.

**After agent completes**: Review session end report, verify commit created (if quality passed).

---
