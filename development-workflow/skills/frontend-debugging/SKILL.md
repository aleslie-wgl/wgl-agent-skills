---
name: frontend-debugging
description: "[WORKFLOW] Programmatic browser debugging loop using Playwright to diagnose and fix page load failures, runtime errors, and component crashes"
when_to_use: When pages fail to load, E2E tests timeout, or runtime errors crash components
version: 1.0.0
type: workflow
---

**Input**: Page URL that's failing, error symptoms (timeout, crash, blank page)
**Output**: Root cause identified, fix applied, browser verification screenshot

---

## Overview

This skill defines the complete self-correcting loop for debugging frontend issues programmatically using Playwright. **Never rely on users to open browsers** - you have full programmatic access.

**Key Principle**: Programmatic detection over human verification - Always use Playwright to see what's actually happening in the browser.

---

## Critical: Screenshot Size Limit

**CATASTROPHIC FAILURE RISK**: Screenshots with dimensions exceeding 8000 pixels cause API errors that crash conversations and make them unrecoverable.

### The Rule

❌ **NEVER** use `page.screenshot({ fullPage: true })` without size validation
✅ **ALWAYS** screenshot viewport only OR specific elements

### Safe Screenshot Patterns

```typescript
// ✅ BEST - Viewport only (default behavior, always safe)
await page.screenshot({ path: 'debug.png' });

// ✅ SAFE - Specific element
await page.locator('#error-message').screenshot({ path: 'error.png' });

// ⚠️ CONDITIONAL - Only if you VERIFY page height < 8000px first
const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
if (bodyHeight < 8000) {
  await page.screenshot({ fullPage: true, path: 'full-page.png' });
} else {
  // Take viewport screenshot instead
  await page.screenshot({ path: 'viewport.png' });
}

// ✅ ALTERNATIVE - Use accessibility snapshot (no size limit)
const snapshot = await page.locator('body').ariaSnapshot();
console.log(snapshot); // Text representation of page structure
```

**If a conversation crashes due to screenshot size**: You CANNOT resume it. Start a new conversation.

---

## Process: Frontend Debugging Loop

### Step 1: Write Programmatic Debug Script

When E2E tests fail or pages don't load, **immediately** write a Playwright script to diagnose the issue.

```typescript
// scripts/debug-page-load.ts
import { chromium } from '@playwright/test';

async function debugPageLoad() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  const consoleMessages: string[] = [];
  page.on('console', (msg) => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Capture page errors (React errors, JS exceptions)
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => {
    pageErrors.push(`PAGE ERROR: ${error.message}\nStack: ${error.stack}`);
  });

  // Capture request failures
  const requestFailures: string[] = [];
  page.on('requestfailed', (request) => {
    requestFailures.push(
      `REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`
    );
  });

  // Track pending requests (hung API calls)
  const pendingRequests = new Map<string, number>();
  page.on('request', (request) => {
    pendingRequests.set(request.url(), Date.now());
  });
  page.on('requestfinished', (request) => {
    pendingRequests.delete(request.url());
  });
  page.on('requestfailed', (request) => {
    pendingRequests.delete(request.url());
  });

  try {
    const url = process.env.TEST_URL || 'http://localhost:3000/page-path';
    console.log(`Navigating to ${url}...`);

    // Try domcontentloaded first (faster, catches early errors)
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });

    console.log('✅ DOM loaded');

    // Take screenshot of what rendered (VIEWPORT ONLY - safe)
    await page.screenshot({ path: 'debug-page.png' });
    console.log('📸 Screenshot saved to debug-page.png');

    // Get page metadata
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Try to wait for network idle (optional)
    try {
      await page.waitForLoadState('networkidle', { timeout: 5000 });
      console.log('✅ Network idle reached');
    } catch {
      console.warn('⚠️ Network never reached idle state');
    }

  } catch (error) {
    console.error('❌ Page failed to load:', error instanceof Error ? error.message : error);

    // Take error screenshot (VIEWPORT ONLY)
    try {
      await page.screenshot({ path: 'debug-page-error.png' });
      console.log('📸 Error screenshot saved');
    } catch {}
  } finally {
    // Print diagnostics
    console.log('\n=== PENDING REQUESTS ===');
    if (pendingRequests.size === 0) {
      console.log('None');
    } else {
      pendingRequests.forEach((startTime, url) => {
        const duration = Date.now() - startTime;
        console.log(`${url} (pending for ${duration}ms)`);
      });
    }

    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach((msg) => console.log(msg));

    console.log('\n=== PAGE ERRORS ===');
    if (pageErrors.length === 0) {
      console.log('None');
    } else {
      pageErrors.forEach((err) => console.log(err));
    }

    console.log('\n=== REQUEST FAILURES ===');
    if (requestFailures.length === 0) {
      console.log('None');
    } else {
      requestFailures.forEach((req) => console.log(req));
    }

    await browser.close();
  }
}

debugPageLoad();
```

### Step 2: Run Debug Script and Analyze Output

```bash
npx tsx scripts/debug-page-load.ts
```

**Look for**:
1. **PAGE ERRORS**: React component crashes, JS exceptions
2. **REQUEST FAILURES**: API calls returning 404, 500, timeout
3. **PENDING REQUESTS**: Hung API calls that never resolve
4. **CONSOLE MESSAGES**: Warnings, errors from libraries

### Step 3: Identify Root Cause

Common patterns and fixes:

#### Pattern 1: TypeScript Type Depth Error (Convex)

**Symptom**:
```
components/MyComponent.tsx(42,5): error TS2589: Type instantiation is excessively deep and possibly infinite.
```

**Cause**: Nested Convex API paths exceed TypeScript inference limits

**Fix**: Use string-based function references

```typescript
// ❌ BROKEN - Type depth error
const data = useQuery(api.actions.nested.module.functionName);

// ✅ FIXED - String-based reference
const data = useQuery('actions/nested/module:functionName' as any);
```

#### Pattern 2: Wrong API Path (Convex)

**Symptom**: Page hangs on `domcontentloaded`, no errors in console

**Cause**: Incorrect import path or function reference

**Diagnosis**:
```bash
# Check generated API structure
grep "huggingface" convex/_generated/api.d.ts

# Output shows: "actions/huggingface" (with slash)
```

**Fix**: Match the generated API structure

```typescript
// ❌ BROKEN - Doesn't match generated API
const searchAction = useAction(
  (api as any).actions.huggingface.searchModels
);

// ✅ FIXED - Use string path
const searchAction = useAction('actions/huggingface:searchModels' as any);
```

#### Pattern 3: Dev Server Cache

**Symptom**: Fixed code but page still crashes

**Cause**: Next.js dev server cached old broken version

**Fix**: Restart dev server

```bash
# Kill old server
powershell -Command "Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess | Stop-Process -Force"

# Start fresh
npm run dev
```

#### Pattern 4: Hung Authentication (Clerk)

**Symptom**: Page renders but never finishes loading, Clerk JS pending

**Diagnosis**: `pendingRequests` shows Clerk resources stuck

**Fix**: Use `domcontentloaded` instead of `load` event

```typescript
// E2E tests - use faster wait
await page.goto(url, { waitUntil: 'domcontentloaded' });
```

### Step 4: Apply Fix and Re-Run Debug Script

After fixing the issue:

```bash
# 1. Re-run debug script to verify fix
npx tsx scripts/debug-page-load.ts

# 2. If screenshot shows page rendering, run E2E tests
BASE_URL=http://localhost:3004 npx playwright test

# 3. Verify all tests passing
```

### Step 5: Update TodoWrite and Document Fix

```markdown
✅ Fixed admin discovery page - useAction type casting issue
- Changed from broken type cast to string-based reference
- Restarted dev server to clear cache
- Verified with Playwright screenshot (page renders correctly)
- All 5 E2E tests passing
```

---

## Playwright SDK Patterns

### Essential API Methods

```typescript
// Navigation
await page.goto(url, {
  waitUntil: 'domcontentloaded', // Fast - don't wait for all resources
  timeout: 10000
});

// Screenshots (VIEWPORT ONLY)
await page.screenshot({ path: 'debug.png' }); // ✅ Safe
await page.locator('#element').screenshot({ path: 'element.png' }); // ✅ Safe

// Get page content
const title = await page.title();
const html = await page.content();
const bodyText = await page.locator('body').textContent();

// Accessibility snapshot (no size limit, text only)
const snapshot = await page.locator('body').ariaSnapshot();

// Evaluate JavaScript in browser context
const pageHeight = await page.evaluate(() => document.body.scrollHeight);
const hasErrors = await page.evaluate(() => {
  const errors = document.querySelectorAll('[data-error]');
  return errors.length > 0;
});

// Wait for conditions
await page.waitForSelector('#element', { timeout: 5000 });
await page.waitForLoadState('networkidle', { timeout: 5000 });
await page.waitForFunction(() => window.myApp?.isReady);

// Interact with elements
await page.locator('#search-input').fill('test query');
await page.locator('#submit-button').click();
await page.locator('#checkbox').check();

// Get text content
const errorMessage = await page.locator('.error-message').textContent();
const allLinks = await page.locator('a').allTextContents();
```

### Common Debug Queries

```typescript
// Check if element exists
const exists = await page.locator('#my-element').count() > 0;

// Get all console logs
const logs: string[] = [];
page.on('console', msg => logs.push(msg.text()));

// Check for React errors
const reactErrors: string[] = [];
page.on('pageerror', error => {
  if (error.message.includes('React')) {
    reactErrors.push(error.message);
  }
});

// Get network timing
const resourceTiming = await page.evaluate(() =>
  JSON.stringify(window.performance.getEntriesByType('resource'))
);
```

---

## Integration with Validation Workflow

### When to Use This Skill

**validator agent should invoke this skill when**:
1. E2E tests timeout at `page.goto()`
2. Tests report `net::ERR_ABORTED` or similar browser errors
3. Page loads but tests fail to find expected elements
4. Manual browser check reveals blank/broken page

### Validation Checklist Update

Update `spec-validate` skill Step 3 (Run Automated Tests) to include:

```markdown
#### E2E Test Failures - Browser Diagnosis

If E2E tests fail with timeout or ERR_ABORTED:

1. **DO NOT** analyze component files
2. **IMMEDIATELY** invoke `frontend-debugging` skill
3. Write debug script, run it, get screenshot + console errors
4. Identify root cause from browser output
5. Apply fix
6. Re-run debug script to verify
7. Re-run E2E tests
```

### Required Evidence for "PASS"

Before marking phase as PASS:
- ✅ Debug script runs successfully (page loads in < 5s)
- ✅ Screenshot shows expected UI elements
- ✅ Zero page errors in console
- ✅ Zero request failures
- ✅ E2E tests passing with < 3s per test

---

## Common Mistakes to Avoid

### ❌ Don't Do This

1. **Reading component files to "analyze" the error**
   - You can't see runtime errors by reading code
   - Browser tells you exactly what's wrong

2. **Using `page.screenshot({ fullPage: true })` without validation**
   - Will crash API if page > 8000px
   - Conversation becomes unrecoverable

3. **Trusting TypeScript compilation as proof page works**
   - TS can compile but page still crashes at runtime
   - Always verify in browser

4. **Asking user to open browser manually**
   - You have Playwright - use it
   - Programmatic verification is faster and more reliable

5. **Skipping server restart after code changes**
   - Next.js caches components
   - Stale cache looks like your fix didn't work

### ✅ Do This Instead

1. **Write debug script immediately when tests fail**
2. **Use viewport screenshots only (safe by default)**
3. **Check browser console for actual runtime errors**
4. **Restart dev server after fixes**
5. **Re-run debug script to verify fix before re-running full E2E**

---

## Example: Complete Debugging Session

**Problem**: All 5 E2E tests fail with `net::ERR_ABORTED` at page load

**Step 1**: Write debug script (`scripts/debug-page-load.ts`) ✅

**Step 2**: Run script
```bash
npx tsx scripts/debug-page-load.ts
# Output: Page times out, no console errors, Clerk JS pending
```

**Step 3**: Analyze - Clerk auth hanging, but page should render

**Step 4**: Check components
```bash
grep "useAction" components/admin/*.tsx
# Found: ModelDiscoveryResults.tsx has broken type cast
```

**Step 5**: Fix the issue
```typescript
// Changed from:
const action = useAction((api as any).actions.huggingface.searchModels);
// To:
const action = useAction('actions/huggingface:searchModels' as any);
```

**Step 6**: Restart server + Re-run debug
```bash
powershell -Command "Stop-Process -Id 55528 -Force"
npm run dev
npx tsx scripts/debug-page-load.ts
# Output: ✅ Page loads, screenshot shows UI, 2 pending requests (normal)
```

**Step 7**: Re-run E2E tests
```bash
BASE_URL=http://localhost:3004 npx playwright test
# Output: ✓ 5 passed (12.3s)
```

**Result**: Problem diagnosed and fixed in < 5 minutes using programmatic debugging.

---

## Tools Used

- **Playwright API**: Browser automation, event listeners, screenshots
- **Bash**: Run scripts, restart servers, check ports
- **Grep**: Search for patterns in code (post-diagnosis)
- **Edit**: Apply fixes to components
- **Read**: View screenshot output (verify fix worked)

---

## Remember

**The debugging mantra**:
> When tests fail, don't read code - run the browser.
>
> When the browser fails, don't guess - screenshot it.
>
> When screenshots are too large, crash the conversation.

**Before marking any validation PASS**:
1. Run debug script
2. Get screenshot (viewport only)
3. Verify zero console errors
4. Run E2E tests
5. Document evidence

If you skip browser verification and just "trust the code", you will create false positives and waste time.
