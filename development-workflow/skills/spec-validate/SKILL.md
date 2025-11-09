---
name: spec-validate
description: "[WORKFLOW] Phase validation process - verify acceptance criteria through automated tests, manual AC checks, frontend testing, and comprehensive reporting"
when_to_use: When validating phase completion against specification acceptance criteria with test evidence
version: 1.0.0
type: workflow
---

**Input**: Validation context from orchestrator (phase info, tasks, ACs, testing strategy)
**Output**: Validation report (PASS/FAIL/PARTIAL) with test results and AC verification

---

## Overview

This skill defines the complete validation workflow for verifying that a phase meets its acceptance criteria through automated testing and manual verification.

**Key Principle**: Detection over trust - Always re-run tests, never trust task completion claims.

---

## Process: Phase Validation

### Step 1: Read Source Documents

**CRITICAL**: Do NOT trust orchestrator context alone. Verify by reading source files.

```bash
# Read the actual feature documents
Read: docs/features/FEAT-XXX-spec.md      # Full acceptance criteria
Read: docs/features/FEAT-XXX-plan.md      # Testing strategy, architecture
Read: docs/features/FEAT-XXX-tasks.md     # Task status, completion claims

# Verify files exist
Glob: docs/features/FEAT-XXX-*.md
```

**Extract from documents**:
- **From spec**: All acceptance criteria (not just phase subset)
- **From plan**: Testing strategy, integration checkpoints, phases
- **From tasks**: Which tasks claim completion, what evidence provided

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

### Step 2: Verify Infrastructure Prerequisites

Before running tests, check that build infrastructure is working:

```bash
# Check TypeScript compiles
Bash: npx tsc --noEmit
# Expected: 0 errors

# Check test files exist
Glob: **/*.test.ts
Glob: **/__tests__/*.test.ts
```

**If infrastructure broken** (TypeScript errors, missing files):
- Fix simple issues (import errors, typos)
- Report complex issues to orchestrator
- Mark as FAIL with details

---

### Step 3: Run Automated Tests

**CRITICAL**: You MUST re-run ALL tests yourself. Do NOT trust task completion reports.

**Common false positives to detect**:
- Task claims "TypeScript compiles" but you find errors when running `npx tsc`
- Task claims "5/5 tests passing" but you find 3/5 failing when running tests
- Task claims "component renders" but tests reference non-existent selectors

**Your job**: Run tests, count actual failures, report discrepancies.

#### Unit Tests
```bash
# Run unit tests
Bash: npm test

# Read output line-by-line
# Count actual passes vs. failures
# Compare to task claims
```

**Expected**: All unit tests passing (0 failures)

**If mismatch**: Report which tasks claimed passing but tests fail

#### Integration Tests (if exist)
```bash
# Run integration tests
Bash: npm test -- --run integration

# Read actual output
```

**Expected**: All integration tests passing (0 failures)

#### Frontend Features - Proactive Validation

**If this phase includes any UI/frontend changes, you MUST run frontend-validation BEFORE E2E tests**:

1. **Invoke `frontend-validation` skill** (see `.claude/skills/frontend-validation/SKILL.md`):
   - Write validation script for the feature
   - Run iterative loop: test → fix → retest
   - Continue until all exit criteria pass (zero console errors, elements present, interactions work)
   - Document validation evidence

2. **ONLY AFTER frontend-validation passes**: Run E2E tests
   ```bash
   # E2E tests should pass on first run if validation was thorough
   Bash: SKIP_WEBSERVER=1 npx playwright test [test-files] --reporter=list
   ```

3. **If E2E tests still fail**: Invoke `frontend-debugging` skill to diagnose root cause

**Critical**: Do NOT run E2E tests without frontend-validation first. Do NOT claim "component works" without browser verification.

**Expected**: All E2E tests passing (0 failures)

#### TypeScript Compilation
```bash
# Always run TypeScript check
Bash: npx tsc --noEmit

# Count actual errors (not just check exit code)
```

**Expected**: 0 TypeScript errors

**Parse output for each test suite**:
- How many tests ran?
- How many passed/failed?
- Which assertions failed?
- Exit code (0 = success, non-zero = failure)

#### Validation Script Pattern (Recommended)

For phases with multiple validation points (database state, API tests, UI checks), create a consolidated validation script instead of running separate commands.

**How to Create**:

1. **Copy the template**:
   ```bash
   # Template is in skill tools directory
   Read: .claude/skills/spec-validate/tools/validate-phase-template.ts

   # Copy to project scripts (customize N to phase number)
   cp .claude/skills/spec-validate/tools/validate-phase-template.ts scripts/validate-phase-N.ts
   ```

2. **Customize validation checks**:
   - Replace database queries with your actual queries
   - Update API endpoints to test your endpoints
   - Add phase-specific validations
   - Update pass/fail criteria

3. **Run the validation**:
   ```bash
   Bash: npx tsx scripts/validate-phase-N.ts
   # Output: Concise report (< 1K tokens)
   ```

4. **Delete after phase complete** (cleanup):
   ```bash
   # Keep as reference or delete if one-off
   rm scripts/validate-phase-N.ts
   ```

**When to Use**:
- Phase has 3+ validation points
- Need to check database state AND query logic AND API endpoints
- Want reusable validation for similar phases
- Context usage > 50% and need to conserve tokens

**Example Output**:
```
🧪 Phase 3 Validation

📊 Checking database state...
   ✅ Database populated (4 GPUs)

🔍 Testing query logic...
   ✅ Query returns expected result

🌐 Testing API endpoint...
   ✅ API endpoint working (200)

📊 Validation Summary
   ✅ Passed: 3
   ❌ Failed: 0

✅ All validation checks passed!
```

**Pattern Location**: See CLAUDE.md "Context Management" for more context-saving patterns.

---

### Step 4: Verify Acceptance Criteria

For each acceptance criterion from the spec, **manually verify** it's met by running actual tests.

#### Example: AC1 - "Admin can search HuggingFace API for text-generation models"

```bash
# Step 1: Check implementation exists
Read: convex/actions/huggingface.ts
Grep: "function.*search" convex/actions/

# Step 2: Find corresponding test
Grep: "search.*huggingface" convex/__tests__/
Read: [test file]

# Step 3: RUN the test (don't just read it)
Bash: npm test huggingface.test.ts

# Step 4: Verify test output
# - Does test pass? (look for "✓" or "passed")
# - Does test actually call search action?
# - Does test verify filtering works?
```

**Mark as**:
- ✅ **MET** if implementation + test exist AND test passes when run
- ⚠️ **PARTIAL** if implementation exists but test incomplete OR test skipped
- ❌ **NOT MET** if implementation missing OR test fails when run

**Critical**: "MET" requires RUNNING the test successfully, not just reading test code.

Repeat for ALL acceptance criteria.

---

### Step 5: Fix Simple Issues (Surgical Fixes Only)

If you find **simple, obvious issues**, fix them:

**✅ Fix these**:
- Missing imports
- Typos in function names
- Incorrect type annotations (clear fix)
- Missing test assertions (add obvious checks)
- Console.log statements left in code (remove)

**❌ Do NOT fix these** (report to orchestrator):
- Logic errors requiring design decisions
- Test failures indicating wrong implementation
- Missing entire components or functions
- Performance issues
- Security vulnerabilities

**After each fix**:
- Re-run affected tests
- Verify fix resolves issue
- Document what was fixed

---

### Step 6: Generate Validation Report

Return comprehensive validation report:

```markdown
## Phase [N] Validation Report

**Feature**: [FEAT-XXX] [Feature Name]
**Phase**: [Phase Number] - [Phase Goal]
**Date**: [YYYY-MM-DD HH:MM]
**Validator**: validator agent

---

### Overall Result: [PASS / FAIL / PARTIAL]

**Summary**:
[1-2 sentence summary of validation outcome]

---

### Test Results

#### Unit Tests
- **Status**: PASS / FAIL
- **Tests Run**: [count]
- **Passed**: [count]
- **Failed**: [count]
- **Details**: [If failures, list which tests and why]

#### Integration Tests
- **Status**: PASS / FAIL / NOT APPLICABLE
- **Tests Run**: [count]
- **Passed**: [count]
- **Failed**: [count]
- **Details**: [If failures, list which tests and why]

#### TypeScript Compilation
- **Status**: PASS / FAIL
- **Errors**: [count]
- **Details**: [If errors, list files and error messages]

---

### Acceptance Criteria Verification

**Tasks Validated**: [T001-T015]

#### US-1: [User Story Title]
- ✅ **AC1**: [Description]
  - **Evidence**: [file:line], test at [test-file:line]
  - **Test Status**: Passing ([N]/[N] assertions)

- ⚠️ **AC2**: [Description]
  - **Evidence**: Implementation exists, but test incomplete
  - **Issue**: [What's missing]
  - **Recommendation**: [How to fix]

- ❌ **AC3**: [Description]
  - **Evidence**: Implementation missing
  - **Issue**: [What's wrong]
  - **Recommendation**: [How to implement]

[... continue for all ACs ...]

---

### Issues Found

#### Critical (Block Phase Completion)
1. **[Issue Title]**
   - **Location**: [file:line]
   - **Description**: [What's wrong]
   - **Impact**: [Why this blocks completion]
   - **Recommendation**: [How to fix]

#### Non-Critical (Can Proceed with Warnings)
1. **[Issue Title]**
   - **Location**: [file:line]
   - **Description**: [What's wrong]
   - **Impact**: [Why this matters but doesn't block]
   - **Recommendation**: [How to fix in next phase or refactor]

---

### Fixes Applied

**Simple Issues Fixed by Validator**:
1. **Fixed [issue description]**
   - **Change**: [What was changed]
   - **Verification**: [Test result after fix]

---

### Recommendations for Orchestrator

**If PASS**:
- ✅ All acceptance criteria met for this phase
- ✅ All tests passing
- ✅ Ready to proceed to Phase [N+1]

**If PARTIAL**:
- ⚠️ Core functionality works but [X] acceptance criteria incomplete
- ⚠️ Recommend fixing [list ACs] before proceeding to Phase [N+1]
- ⚠️ Alternative: Proceed to Phase [N+1] and fix in refactor phase

**If FAIL**:
- ❌ Critical issues block phase completion
- ❌ Recommend dispatching implementers to fix:
  - Task [TXX-FIX]: [Fix description]
  - Task [TYY-FIX]: [Fix description]
- ❌ Re-validate after fixes applied

---

### Next Steps

**Recommended Action**:
[What orchestrator should do next - proceed to next phase, dispatch fix tasks, etc.]

---

**Validation Complete**: [YYYY-MM-DD HH:MM]
```

---

## Output Format for Orchestrator

**In addition to the markdown report above**, return structured data that orchestrator can parse:

```typescript
{
  phase: number,
  phaseName: string,
  result: "PASS" | "FAIL" | "PARTIAL",
  testResults: {
    unit: { passed: number, failed: number },
    integration: { passed: number, failed: number },
    typescript: { errors: number }
  },
  acceptanceCriteria: [
    {
      id: string,          // e.g. "US-1, AC2"
      description: string,  // e.g. "Admin can view GPU catalog"
      status: "MET" | "PARTIAL" | "NOT_MET",
      evidence: string      // e.g. "components/admin/GPUCatalog.tsx:45"
    }
  ],
  issues: [
    {
      severity: "critical" | "non-critical",
      description: string,
      location: string
    }
  ],
  fixesApplied: string[],
  recommendation: string
}
```

**Orchestrator writes this report to STATUS.md Phase History section.**

---

## Tools Used

- **Read**: Read implementation files to verify acceptance criteria
- **Glob**: Find test files and implementation files
- **Grep**: Search for patterns (function names, test assertions)
- **Bash**: Run tests, check TypeScript, start dev servers
- **Edit**: Fix simple issues (imports, typos)
- **IDE Diagnostics**: Check TypeScript errors across project

---

## Quality Standards

### Must Do ✅
- Run ALL relevant tests (unit, integration, TypeScript)
- Verify EVERY acceptance criterion listed in context
- Fix simple issues (imports, typos) autonomously
- Provide evidence for every claim (file:line references)
- Use pre-completion-verification before claiming PASS

### Must NOT Do ❌
- Skip tests and assume they pass
- Mark phase as PASS without running tests
- Fix complex logic errors without orchestrator approval
- Report issues without providing evidence (file:line)
- Claim "should work" - run tests to verify

---

## Example Validation Scenarios

### Scenario 1: All Tests Pass, All ACs Met
**Result**: PASS
**Report**: All green, proceed to next phase
**Evidence**: Test output, AC verification details

### Scenario 2: Tests Pass, But 1 AC Incomplete
**Result**: PARTIAL
**Report**: Core functionality works, but AC3 missing exponential backoff
**Recommendation**: Fix in next phase or proceed with warning

### Scenario 3: TypeScript Errors Block Testing
**Result**: FAIL
**Report**: Cannot run tests due to 5 TypeScript errors in api files
**Action Taken**: Fixed 2 import errors, 3 remain (complex type issues)
**Recommendation**: Dispatch implementer to fix type errors, re-validate

---

## Remember

**The Iron Law** (from pre-completion-verification):
> No completion claims without fresh verification evidence.

**Before marking PASS**:
1. Run FULL test suite (not just one test)
2. Read FULL test output (check exit codes, count failures)
3. Verify EVERY acceptance criterion (not just some)
4. Document EVIDENCE for every claim (file:line references)
5. If unsure: Mark as PARTIAL with detailed notes, let orchestrator decide.
