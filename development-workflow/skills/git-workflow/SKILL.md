---
name: git-workflow
description: "[WORKFLOW] Ensure clean commits and passing pre-commit checks on first attempt"
when_to_use: Before every git commit, especially after schema changes or refactoring
version: 1.0.0
type: workflow
---

# Git Workflow Best Practices

**Purpose**: Ensure clean commits and passing pre-commit checks on first attempt.

**When to Use**: Before every git commit, especially after schema changes or refactoring.

---

## The Pre-commit Check System

### What Runs on Commit

`.husky/pre-commit` executes:
1. **ESLint** via lint-staged (staged *.{js,jsx,ts,tsx} files only)
2. **TypeScript** via `npx tsc --noEmit` (ALL files, not just staged)
3. **Tests** via `npm test` (if tests exist)

### Why Pre-commit Checks Fail

**Common Failure Modes**:
1. **Incremental Staging**: You stage one file → TypeScript sees incomplete changes → errors in unstaged files
2. **Related File Changes**: You change function signature → tests fail but tests aren't staged
3. **Type Inference Context**: TypeScript needs all related files to validate types correctly

---

## Pre-Commit Best Practices

### Rule 1: Stage Related Files Together

**❌ WRONG** (causes multiple commit attempts):
```bash
# Fix schema.ts
git add convex/schema.ts
git commit -m "Update schema"  # FAILS - tests reference old schema

# Fix tests
git add convex/__tests__/schema.test.ts
git commit -m "Fix tests"      # FAILS - migrations.ts references old schema

# Fix migrations
git add convex/migrations.ts
git commit -m "Fix migrations" # FINALLY passes
```

**✅ CORRECT** (passes first time):
```bash
# Stage all related files
git add convex/schema.ts
git add convex/migrations.ts
git add convex/__tests__/*.test.ts
git add scripts/*.ts  # Any scripts that use schema

# Verify before committing
npx tsc --noEmit           # Should pass
npx eslint .               # Should pass
npm test                   # Should pass

# Commit once
git commit -m "refactor(schema): Remove abandoned tables"
```

### Rule 2: Pre-flight Check Before Commit

**Always run these commands BEFORE `git commit`**:

```bash
# 1. TypeScript (same as pre-commit)
npx tsc --noEmit

# 2. ESLint (check all files, not just staged)
npx eslint .

# 3. Tests (if applicable)
npm test

# 4. Only if all pass, then commit
git commit -m "message"
```

### Rule 3: Fix All Errors at Once

**❌ WRONG**:
```bash
# Fix error 1
git add file1.ts
git commit  # FAILS with 5 errors

# Fix error 2
git add file2.ts
git commit  # FAILS with 4 errors
# ... repeat 5 times
```

**✅ CORRECT**:
```bash
# See all errors
npx tsc --noEmit           # Shows 5 errors
npx eslint .               # Shows 10 warnings

# Fix ALL errors
# Edit file1.ts, file2.ts, file3.ts...

# Verify ALL fixed
npx tsc --noEmit           # 0 errors
npx eslint .               # 0 errors

# Stage ALL fixes
git add .

# Commit ONCE
git commit -m "fix: Resolve TypeScript and ESLint errors"
```

---

## Handling Complex Changes

### Large Schema Cleanup Pattern

**Scenario**: Deleting 36 tables + functions + components

**Process**:
1. **Discovery Phase** (don't commit yet):
   ```bash
   # Find all references
   grep -r "old_table" .
   # Use parallel Explore agents for comprehensive search
   ```

2. **Deletion Phase** (still don't commit):
   ```bash
   # Delete in dependency order
   rm convex/__tests__/old_table.test.ts    # Tests first
   rm components/OldComponent.tsx           # Components second
   rm convex/old_table.ts                   # Functions third
   # Update convex/schema.ts                # Schema last
   ```

3. **Verification Phase**:
   ```bash
   npx tsc --noEmit   # Fix ALL TypeScript errors
   npx eslint .       # Fix ALL ESLint errors
   npm test           # Fix ALL test failures
   ```

4. **Commit Phase** (single commit):
   ```bash
   git add .
   git commit -m "refactor(schema): Remove 36 abandoned tables"
   ```

---

## Pre-commit Hook Configuration

### Current Configuration

**File**: `.husky/pre-commit`

```bash
# ESLint on staged files only (via lint-staged)
npx lint-staged || exit 1

# TypeScript on ALL files
npx tsc --noEmit || exit 1

# Tests (if exist)
npm test || exit 1
```

**File**: `package.json` → `lint-staged`

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix --ignore-pattern '**/archive/**' --ignore-pattern '**/archived/**' --ignore-pattern '.claude/**'"
    ]
  }
}
```

### Why This Configuration?

**ESLint on staged files**: Fast, fixes obvious issues
**TypeScript on all files**: Reliable, catches type context issues
**Tests on all files**: Ensures nothing broke

**Trade-off**: TypeScript is slow but necessary for correctness.

---

## Common Errors and Fixes

### Error: "Unused @ts-expect-error directive"

**Cause**: You added `@ts-expect-error` but the error doesn't exist when pre-commit runs (due to staging context).

**Fix**:
```typescript
// Option 1: Remove if truly unused
- // @ts-expect-error - Some error
const result = await mutation(...);

// Option 2: Use both directives (Convex type depth issues)
// @ts-expect-error - Convex type inference depth limitation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const result = await mutation(api.foo.bar as any, ...);
```

### Error: "Unexpected any"

**Cause**: ESLint disallows `any` type.

**Fix**:
```typescript
// Option 1: Use proper type
- const result: any = await query();
+ const result: QueryResult = await query();

// Option 2: Suppress with comment (if justified)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const result = await query() as any;
```

### Error: "File ignored because of ignore pattern"

**Cause**: ESLint tried to lint a file in `.claude/` which is ignored.

**Fix**: This is a warning, not an error. The file is correctly ignored. No action needed.

---

## Bypassing Pre-commit (USE SPARINGLY)

### When to Bypass

**Valid Reasons**:
- Committing work-in-progress on a feature branch
- Pre-existing errors unrelated to your changes
- Emergency hotfix

**Invalid Reasons**:
- "I'll fix it later" (you won't)
- "Tests are slow" (they're there for a reason)
- "It works on my machine" (famous last words)

### How to Bypass

```bash
# Add --no-verify flag
git commit --no-verify -m "WIP: Feature in progress"

# OR set env variable
HUSKY_SKIP_HOOKS=1 git commit -m "Emergency hotfix"
```

**IMPORTANT**: Document in commit message why you bypassed checks.

---

## Session Commit Strategy

### Commit Frequency

**Rule**: Commit after completing each logical unit of work.

**Examples**:
- ✅ After completing one task from task list
- ✅ After fixing all errors from a refactoring
- ✅ After validating a phase checkpoint
- ❌ After every file edit (too granular)
- ❌ At end of session only (too coarse)

### Commit Message Format

**Use Conventional Commits**:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring
- `docs`: Documentation
- `test`: Test changes
- `chore`: Maintenance

**Examples**:
```bash
git commit -m "feat(pricing): Add VRAM calculation library"
git commit -m "fix(schema): Remove unused table definitions"
git commit -m "refactor(tests): Update for new schema structure"
git commit -m "docs: Update Phase 4 validation report"
```

### Handoff Commits

**At end of session**, create detailed handoff commit:

```bash
git add .
git commit -m "$(cat <<'EOF'
refactor(schema): Remove 36 abandoned tables

Comprehensive cleanup of Convex schema removing all agent builder
and Chef platform tables.

## Changes
- Removed 23 agent builder tables
- Removed 13 Chef tables
- Deleted 29 Convex functions
- Deleted 6 React components
- Fixed all TypeScript/ESLint errors

## Validation
- ✅ TypeScript: 0 errors
- ✅ ESLint: 0 critical errors
- ✅ Tests: 82/82 passing

## Next Steps
- Begin Phase 4 (VRAM & GPU Matching)
- Reference: docs/features/FEAT-XXX-tasks.md

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Tools and Scripts

### Pre-commit Simulation Script

**Create**: `scripts/test-pre-commit.sh`

```bash
#!/bin/bash
# Simulate pre-commit checks before committing

echo "🔍 Simulating pre-commit checks..."

# Run checks in same order as pre-commit hook
echo "📝 ESLint..."
npx eslint . || { echo "❌ ESLint failed"; exit 1; }

echo "🔷 TypeScript..."
npx tsc --noEmit || { echo "❌ TypeScript failed"; exit 1; }

echo "🧪 Tests..."
npm test || { echo "❌ Tests failed"; exit 1; }

echo "✅ All pre-commit checks passed!"
```

**Usage**:
```bash
# Before committing
bash scripts/test-pre-commit.sh

# If passes, commit
git commit -m "message"
```

---

## Summary

### Pre-commit Checklist

Before every `git commit`:

- [ ] Run `npx tsc --noEmit` (should show 0 errors)
- [ ] Run `npx eslint .` (should show 0 critical errors)
- [ ] Run `npm test` (all tests passing)
- [ ] Stage all related files together (`git add <related files>`)
- [ ] Write clear commit message (conventional commits format)
- [ ] Commit once with all fixes (`git commit -m "message"`)

### Time Investment vs Savings

**Without following this skill**:
- 15 commit attempts × 2 min = 30 min wasted
- Debugging pre-commit failures = 20 min
- **Total: 50 min lost**

**With following this skill**:
- Pre-flight checks = 3 min
- Commit on first attempt = 1 min
- **Total: 4 min**

**ROI**: 1,150% (50 min saved vs 4 min invested)

---

**Last Updated**: 2025-11-05
**Related Skills**: pre-completion-verification, systematic-debugging
**Status**: Active - Apply to all git operations
