---
name: frontend-validation
description: "[WORKFLOW] Iterative self-correcting frontend testing loop using Playwright - proactively test, fix, retest until feature works in browser"
when_to_use: After implementing any UI/frontend feature, before claiming completion, as part of validation process for frontend changes
version: 1.0.0
type: workflow
---

**Input**: Feature description, acceptance criteria for UI behavior, page URL
**Output**: Validation evidence (screenshot, test results, zero console errors)

---

## Overview

This skill defines the **proactive iterative validation loop** for frontend features. Unlike reactive debugging (fixing broken tests), this is about **preventing completion claims until you've verified the feature actually works in a browser**.

**Key Principle**: Test in browser BEFORE claiming completion - Never trust that "code compiles" means "feature works".

**Difference from frontend-debugging**:
- **frontend-debugging**: REACTIVE - Diagnose why tests failed
- **frontend-validation**: PROACTIVE - Test feature works before claiming complete

---

## When to Use This Skill

**MANDATORY for**:
- Any feature with UI components
- Any page/route changes
- Any user interaction flows
- Any visual elements (tables, forms, buttons, modals)
- Before marking frontend tasks as complete
- Before phase validation if phase includes frontend work

**NOT needed for**:
- Backend-only features (API endpoints with no UI)
- Database schema changes (no frontend impact)
- Pure Convex functions (no UI layer)

---

## Process: Iterative Frontend Validation Loop

### Step 1: Write Feature Validation Script

Before claiming any frontend feature is complete, write a Playwright script that validates user-visible behavior.

**Script Template** (`scripts/validate-[feature-name].ts`):

```typescript
import { chromium } from '@playwright/test';

async function validateFeature() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  const consoleMessages: string[] = [];
  page.on('console', (msg) => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Capture errors
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => {
    pageErrors.push(`ERROR: ${error.message}`);
  });

  try {
    const url = process.env.TEST_URL || 'http://localhost:8765/feature-path';
    console.log(`\n🧪 Testing feature at ${url}...`);

    // Navigate to page
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    console.log('✅ Page loaded');

    // STEP 1: Verify page renders (no crashes)
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);

    // STEP 2: Verify expected UI elements exist
    const elementChecks = [
      { selector: '#element-id', name: 'Main component' },
      { selector: 'button[type="submit"]', name: 'Submit button' },
      { selector: '.data-table', name: 'Data table' },
    ];

    for (const check of elementChecks) {
      const count = await page.locator(check.selector).count();
      if (count > 0) {
        console.log(`✅ ${check.name}: visible (${count} found)`);
      } else {
        console.error(`❌ ${check.name}: NOT FOUND (selector: ${check.selector})`);
      }
    }

    // STEP 3: Test user interactions
    console.log('\n🖱️  Testing interactions...');

    // Example: Fill form field
    await page.locator('#search-input').fill('test query');
    console.log('✅ Form input works');

    // Example: Click button
    await page.locator('#submit-button').click();
    console.log('✅ Button click works');

    // Example: Wait for result
    await page.waitForSelector('.result-item', { timeout: 3000 });
    const resultCount = await page.locator('.result-item').count();
    console.log(`✅ Results displayed: ${resultCount} items`);

    // STEP 4: Take screenshot (VIEWPORT ONLY - safe)
    await page.screenshot({ path: 'validation-success.png' });
    console.log('📸 Screenshot saved: validation-success.png');

    // STEP 5: Verify no console errors
    const errors = consoleMessages.filter((msg) => msg.startsWith('[error]'));
    if (errors.length === 0) {
      console.log('✅ Zero console errors');
    } else {
      console.error(`❌ ${errors.length} console errors found:`);
      errors.forEach((err) => console.error(err));
    }

  } catch (error) {
    console.error('❌ Validation failed:', error instanceof Error ? error.message : error);
    await page.screenshot({ path: 'validation-failure.png' });
  } finally {
    // Print diagnostics
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach((msg) => console.log(msg));

    console.log('\n=== PAGE ERRORS ===');
    if (pageErrors.length === 0) {
      console.log('None ✅');
    } else {
      pageErrors.forEach((err) => console.log(err));
    }

    await browser.close();
  }
}

validateFeature();
```

**Customize for your feature**:
- Update `TEST_URL` to feature route
- Update `elementChecks` with actual selectors from acceptance criteria
- Add interaction tests matching user stories
- Verify expected behavior happens

---

### Step 2: Run Validation Script (First Iteration)

```bash
# Start dev server if not running
Bash: netstat -ano | findstr :8765
# If no result, start server:
# Bash (run_in_background=true): PORT=8765 npm run dev

# Run validation script
Bash: npx tsx scripts/validate-[feature-name].ts
```

**Analyze output**:
- ✅ **PASS indicators**: Page loads, elements found, interactions work, zero console errors
- ❌ **FAIL indicators**: Timeout, elements not found, console errors, exceptions

**Expected on first run**: Usually fails - this is normal!

---

### Step 3: Fix Issues Found (Iteration Loop)

Based on validation output, identify and fix issues:

#### Common Issue 1: Element Not Found

**Symptom**:
```
❌ Data table: NOT FOUND (selector: .data-table)
```

**Fix**:
```bash
# Check if element exists in code
Grep: "data-table" components/**/*.tsx

# If missing, add it to component
Edit: [component-file]
```

#### Common Issue 2: Console Errors

**Symptom**:
```
[error] Uncaught TypeError: Cannot read property 'map' of undefined
```

**Fix**:
```bash
# Check data loading in component
Read: [component-file]

# Add null check or loading state
Edit: [component-file]
```

#### Common Issue 3: Interaction Fails

**Symptom**:
```
❌ Validation failed: locator('#submit-button').click: Timeout 3000ms exceeded
```

**Fix**:
```bash
# Check if button is rendered conditionally
Grep: "submit-button" components/**/*.tsx

# Ensure button is always rendered or wait for condition
Edit: [component-file]
```

#### Common Issue 4: Page Doesn't Load

**Symptom**:
```
❌ Page failed to load: Navigation timeout of 10000ms exceeded
```

**Fix**: Invoke `frontend-debugging` skill to diagnose root cause
```bash
# See frontend-debugging skill for complete debugging process
# This is where reactive debugging comes in
```

---

### Step 4: Restart Dev Server (After Code Changes)

**CRITICAL**: Next.js caches components. After fixing code, you MUST restart the dev server.

```bash
# Kill existing server
Bash: powershell -Command "Get-NetTCPConnection -LocalPort 8765 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }"

# Wait for port to be free
Bash: timeout /t 2 /nobreak

# Start fresh server
Bash (run_in_background=true): PORT=8765 npm run dev

# Wait for server to be ready
Bash: timeout /t 5 /nobreak
```

---

### Step 5: Rerun Validation Script (Next Iteration)

```bash
# Rerun validation to verify fix
Bash: npx tsx scripts/validate-[feature-name].ts
```

**Compare with previous run**:
- Did the error go away?
- Are more elements now found?
- Do interactions now work?
- Are there fewer console errors?

**If still failing**: Return to Step 3, fix next issue, repeat

**If passing**: Proceed to Step 6

---

### Step 6: Verify Exit Criteria

**Exit Criteria** (all must be true):

```markdown
✅ Page loads in < 5 seconds
✅ All expected UI elements present (per acceptance criteria)
✅ All user interactions work (click, type, submit, navigate)
✅ Zero console errors (no [error] messages)
✅ Zero page errors (no exceptions)
✅ Screenshot shows expected UI state
✅ Feature matches acceptance criteria behavior
```

**Only when ALL criteria met**: Feature is validated

**If ANY criteria fail**: Continue iterating (Steps 3-5)

---

### Step 7: Document Validation Evidence

After validation passes, document evidence:

```markdown
## Frontend Validation Evidence

**Feature**: [Feature name]
**Date**: [YYYY-MM-DD HH:MM]
**Validation Script**: scripts/validate-[feature-name].ts

### Validation Results

✅ **Page Load**: Successful in 1.2s
✅ **UI Elements**: All 8 expected elements present
✅ **Interactions**: Form input, button click, results display - all working
✅ **Console**: Zero errors
✅ **Page Errors**: Zero exceptions
✅ **Screenshot**: validation-success.png shows expected state

### Acceptance Criteria Verified (EXAMPLES)

- ✅ **AC1**: User can see model table with pagination
  - Evidence: `.model-table` selector found, pagination controls present
- ✅ **AC2**: User can filter by jurisdiction (US/EU/ALL)
  - Evidence: Filter buttons clickable, table updates after click
- ✅ **AC3**: User can select model and see cost estimator
  - Evidence: Row click highlights selection, cost estimator displays

### Iterations Required (EXAMPLES)

**Iteration 1**: Element not found error
- Fixed: Added missing `id` attribute to component
- Server restarted

**Iteration 2**: Console error "Cannot read property of undefined"
- Fixed: Added null check for `selectedModel`
- Server restarted

**Iteration 3**: All checks passed ✅

**Total Time**: 6 minutes (3 iterations)
```

---

## Integration with Validation Workflow

### Called by spec-validate Skill

The `spec-validate` skill should invoke this skill during Step 3 (Run Automated Tests) when E2E tests exist:

```markdown
#### Frontend Features - Proactive Validation

If this phase includes frontend/UI changes:

1. **Write validation script** (per frontend-validation skill)
2. **Run iterative loop** until all checks pass
3. **Only then** run E2E tests (they should pass on first run)
4. **Document evidence** in validation report

**Do NOT**:
- Run E2E tests without frontend validation first
- Claim "component renders" without browser verification
- Trust that "TypeScript compiles" means UI works
```

### Called by pre-completion-verification Skill

Before claiming ANY frontend task complete:

```markdown
## Frontend Completion Gate

Before marking frontend tasks complete:

1. ✅ Run frontend-validation skill iterative loop
2. ✅ Verify exit criteria all met
3. ✅ Document validation evidence
4. ❌ Do NOT claim complete without browser verification
```

---

## Relationship to Other Skills

### Uses frontend-debugging (Reactive Debugging)

If validation script times out or page won't load:
- **Stop** iterating on fixes
- **Invoke** `frontend-debugging` skill to diagnose root cause
- **Fix** underlying issue (wrong API path, type error, etc.)
- **Return** to validation loop

### Difference from E2E Tests

| Frontend Validation | E2E Tests |
|---------------------|-----------|
| **When**: During development, BEFORE claiming complete | **When**: After validation passes |
| **Purpose**: Iteratively fix until feature works | **Purpose**: Regression testing |
| **Scope**: Single feature validation | **Scope**: Complete user flows |
| **Frequency**: Every iteration | **Frequency**: Once per phase |
| **Failure Mode**: Expected, iterate to fix | **Failure Mode**: Should rarely fail |

---

## Required Evidence Before Claiming "Complete"

When marking ANY frontend task as complete, you MUST provide:

```markdown
## Task [TXX]: [Task description]

**Status**: ✅ Complete

**Frontend Validation Evidence**:
- Validation script: scripts/validate-[feature].ts
- Iterations: 3 (issues fixed per iteration documented)
- Final result: All exit criteria met
- Screenshot: validation-success.png
- Console errors: 0
- Page errors: 0
- Timestamp: 2025-11-04 14:23

**Acceptance Criteria Met**:
- ✅ AC1: [Evidence]
- ✅ AC2: [Evidence]

**Without this evidence, task is NOT complete.**
```

---

## Common Mistakes to Avoid (Anti-patterns)

### ❌ Don't Do This

1. **Anti-pattern: Skip validation because "it's a small change"**
   - Small CSS changes can break layouts
   - Always validate

2. **Anti-pattern: Run validation once and stop**
   - First run usually fails
   - Iterate until all checks pass

3. **Anti-pattern: Trust console.log output instead of browser**
   - Console lies (caching, timing)
   - Browser screenshot is truth

4. **Anti-pattern: Use `page.screenshot({ fullPage: true })` without height check**
   - Crashes conversation if page > 8000px
   - Always use viewport screenshots

5. **Anti-pattern: Claim "component renders" without interaction testing**
   - Rendering ≠ working
   - Test clicks, inputs, navigation

### ✅ Do This Instead

1. **Validate EVERY frontend change** (no exceptions)
2. **Iterate until ALL exit criteria pass** (not just some)
3. **Screenshot viewport only** (always safe)
4. **Test user interactions** (not just element existence)
5. **Document iterations** (shows rigor, helps debugging)

---

## Example: Complete Validation Session

**Feature**: Sovereign AI Model Table with Cost Estimator
**AC**: User can select model from table, see cost estimator update

### Iteration 1: Initial Test

```bash
npx tsx scripts/validate-sovereign-ai.ts

Output:
✅ Page loaded
✅ Model table: visible (20 rows)
❌ Cost estimator: NOT FOUND (selector: .cost-estimator)
❌ Console: 1 error - "selectedModel is undefined"
```

**Fix**: Added null check in CostEstimator component
```typescript
// Before
const cost = calculateCost(selectedModel.input_price);

// After
const cost = selectedModel ? calculateCost(selectedModel.input_price) : null;
```

**Restart server** ✅

---

### Iteration 2: After First Fix

```bash
npx tsx scripts/validate-sovereign-ai.ts

Output:
✅ Page loaded
✅ Model table: visible (20 rows)
✅ Cost estimator: visible
❌ Console: 1 error - "Cannot read property 'click' of null"
```

**Fix**: Button selector was wrong, updated validation script
```typescript
// Before
await page.locator('#submit-button').click();

// After
await page.locator('button[type="submit"]').click();
```

---

### Iteration 3: After Second Fix

```bash
npx tsx scripts/validate-sovereign-ai.ts

Output:
✅ Page loaded
✅ Model table: visible (20 rows)
✅ Cost estimator: visible
✅ Model selection: Row highlighted after click
✅ Cost estimator: Updated with model data
✅ Console: Zero errors
✅ Page errors: Zero exceptions
📸 Screenshot: validation-success.png
```

**Result**: All exit criteria met, feature validated ✅

**Total time**: 8 minutes (3 iterations)
**Evidence**: Screenshot + zero errors + documented iterations

---

## Remember

**The validation mantra**:
> Test in browser before claiming complete.
>
> Iterate until zero errors, not just "looks better".
>
> Screenshot is evidence, claims are not.

**This skill is MANDATORY for frontend features** - No exceptions.

**If you claim a frontend feature is complete without running this validation loop, you are lying, not being efficient.**
