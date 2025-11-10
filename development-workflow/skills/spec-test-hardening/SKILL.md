---
name: spec-test-hardening
description: "[WORKFLOW] Generate integration, error injection, and property-based tests AFTER implementation to harden test coverage against real-world failure modes"
when_to_use: After phase tasks complete (before validator), when implementations lack integration/error/property tests, when data flows and interaction diagrams exist in plan
version: 1.0.0
type: workflow
---

**Input**: Phase info, implementations, data flows/interaction diagrams from plan, existing test coverage
**Output**: Enhanced test suite (integration + error injection + property-based) + hardening report

---

## Overview

This skill generates **complementary tests** that TDD doesn't cover:
- **Integration tests** (component ↔ component contracts)
- **Error injection tests** (network failures, timeouts, permission errors)
- **Property-based tests** (generative testing with 100s of inputs)
- **Performance benchmarks** (regression detection)

**Key Principle**: Don't modify implementation code. Only ADD tests that verify behavior under stress, failure, and boundary conditions.

**Relationship to TDD**:
- TDD (spec-tdd): Business logic tests written BEFORE implementation
- Hardening (this skill): Integration/error/property tests written AFTER implementation
- **No overlap**: Clear separation of concerns

---

## Prerequisites

**Requires**:
- [ ] Phase tasks completed (implementations exist)
- [ ] TDD tests passing (from tdd-executor)
- [ ] Plan contains data flows / interaction diagrams (from spec-plan)
- [ ] External dependencies identified (APIs, database, etc.)

**Skip if**:
- Simple CRUD operations (no complex data flows)
- Pure UI components (frontend-validation covers this)
- No external dependencies (no error injection needed)

---

## Process: Test Hardening Cycle

### Step 0: Read Source Documents

**CRITICAL**: Verify implementation and testing strategy from source documents.

```bash
# Read feature documents
Read: docs/features/FEAT-XXX-spec.md      # Acceptance criteria, user stories
Read: docs/features/FEAT-XXX-plan.md      # Data flows, interaction diagrams, testing strategy
Read: docs/features/FEAT-XXX-tasks.md     # Phase tasks, implementations

# Read implementations to harden
Glob: convex/**/*.ts                      # Find implementations
Glob: convex/__tests__/**/*.test.ts       # Find existing tests
```

**Extract from documents**:
- **From spec**: Acceptance criteria, expected behaviors
- **From plan**: Data flows (§DF sections), interaction diagrams (§ID sections), external dependencies
- **From tasks**: Phase N tasks, file paths, implementations
- **From existing tests**: Coverage gaps, missing error cases

---

### Step 1: Analyze Integration Points (from Plan)

**Goal**: Identify component → component data flows that need contract testing

**Look for in plan.md**:
```markdown
## Data Flow §DF1: Model Selection → Pricing Calculation

**Flow**:
1. User selects model in ModelSelector component
2. ModelSelector emits { modelId, parameters } to PricingCalculator
3. PricingCalculator reads GPU catalog from database
4. Calculates pricing based on model.parameters.size + gpu.cost
5. Displays pricing in UI

**Contract**:
- ModelSelector must emit valid modelId (exists in database)
- ModelSelector must emit complete parameters object
- PricingCalculator must handle missing GPU catalog gracefully
```

**Action**: Generate integration test verifying contract:

```typescript
// convex/__tests__/integration/modelSelectionToPricing.test.ts
test("ModelSelector → PricingCalculator data contract", async () => {
  const t = convexTest(schema);

  // Setup: Create model and GPU catalog
  const modelId = await t.mutation(api.mutations.createModel, {
    name: "gpt-3.5",
    parameters: { size: 7_000_000_000, precision: "fp16" }
  });

  // Step 1: ModelSelector emits selection
  const selection = { modelId, parameters: { size: 7_000_000_000, precision: "fp16" } };

  // Step 2: PricingCalculator reads selection
  const pricing = await t.query(api.queries.calculatePricing, selection);

  // Verify contract: pricing matches model parameters
  expect(pricing.modelId).toBe(modelId);
  expect(pricing.vram_gb).toBeCloseTo(16.8, 1); // 7B * 2 * 1.2 / 1e9
});
```

**Repeat for all §DF sections in plan.md**

---

### Step 2: Identify External Dependencies

**Goal**: Find APIs, databases, and services that can fail

**Look for in implementations**:
```bash
# Search for external API calls
Grep: "fetch|axios|http" convex/
Grep: "db\\.|ctx\\.db" convex/
Grep: "process\\.env" convex/
```

**Common external dependencies**:
- HuggingFace API (model metadata fetching)
- Convex database (queries, mutations)
- File system (rare in Convex)
- Environment variables

**Document dependencies**:
```markdown
**External Dependencies Found**:
1. HuggingFace API (convex/actions/fetchModelMetadata.ts:15)
   - fetch('https://huggingface.co/api/models')
   - Can timeout, return 429 (rate limit), return 500 (server error)

2. Convex Database (convex/queries/getModelById.ts:10)
   - ctx.db.get(modelId)
   - Can return null (model not found)

3. Environment variables (convex/actions/huggingface.ts:5)
   - process.env.HUGGINGFACE_API_KEY
   - Can be undefined
```

---

### Step 3: Generate Error Injection Tests

**Goal**: Systematically test failure modes for each external dependency

**Pattern**: For each dependency, test these failure modes:

#### Network Failures (APIs)
```typescript
// Test: API timeout
test("HuggingFace API timeout triggers retry with backoff", async () => {
  const t = convexTest(schema);

  // Mock API to timeout
  vi.spyOn(global, 'fetch').mockImplementation(() =>
    new Promise((resolve) => setTimeout(() => resolve({ ok: false, status: 504 }), 5000))
  );

  // Should retry 3 times with exponential backoff
  const result = await t.action(api.actions.fetchModelMetadata, { modelId: "gpt-3.5" });

  expect(result.error).toBe("API timeout after 3 retries");
  expect(global.fetch).toHaveBeenCalledTimes(3); // Retried 3 times
});
```

#### Rate Limiting (APIs)
```typescript
test("HuggingFace API rate limit triggers backoff", async () => {
  const t = convexTest(schema);

  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: false,
    status: 429,
    headers: new Headers({ 'Retry-After': '60' })
  });

  const result = await t.action(api.actions.fetchModelMetadata, { modelId: "gpt-3.5" });

  expect(result.error).toContain("Rate limited");
  expect(result.retryAfter).toBe(60);
});
```

#### Database Null Returns
```typescript
test("getModelById handles missing model gracefully", async () => {
  const t = convexTest(schema);

  // Query non-existent model
  const result = await t.query(api.queries.getModelById, { modelId: "nonexistent" });

  expect(result).toBeNull();
  // Verify no error thrown
});
```

#### Missing Environment Variables
```typescript
test("HuggingFace action fails fast with missing API key", async () => {
  const t = convexTest(schema);

  // Clear environment variable
  delete process.env.HUGGINGFACE_API_KEY;

  await expect(
    t.action(api.actions.fetchModelMetadata, { modelId: "gpt-3.5" })
  ).rejects.toThrow("HUGGINGFACE_API_KEY environment variable not set");
});
```

**Systematic Coverage**:
| Failure Mode | Test Pattern |
|--------------|--------------|
| **Network timeout** | Mock fetch with 5s delay → verify retry logic |
| **Rate limiting (429)** | Mock 429 response → verify backoff |
| **Server error (500)** | Mock 500 response → verify retry |
| **Database null** | Query non-existent ID → verify null handling |
| **Missing env var** | Delete process.env.X → verify error message |
| **Permission denied** | Mock 403 response → verify error handling |

**Generate tests for ALL external dependencies found in Step 2**

---

### Step 4: Generate Property-Based Tests (Pure Functions)

**Goal**: Test pure functions with 100s of generated inputs to find edge cases

**Find pure functions**:
```bash
# Search for pure calculation functions (no ctx, no database)
Grep: "export (const|function)" convex/lib/
Grep: "=>\\s*{" convex/lib/
```

**Criteria for property-based testing**:
- ✅ Pure function (no side effects)
- ✅ Mathematical calculation (pricing, VRAM, etc.)
- ✅ Data transformation (parsing, formatting)
- ❌ Database query/mutation (has side effects)
- ❌ API call (has side effects)

**Install fast-check** (if not already):
```json
// package.json devDependencies
"fast-check": "^3.15.0"
```

**Generate property test**:

```typescript
// convex/__tests__/properties/vramEstimation.test.ts
import fc from 'fast-check';

test("VRAM estimation always returns non-negative value", () => {
  fc.assert(
    fc.property(
      fc.nat({ max: 100_000_000_000 }),      // parameters: 0 to 100B
      fc.constantFrom("fp16", "fp32"),       // precision: fp16 or fp32
      (parameters, precision) => {
        const vram = estimateVRAM(parameters, precision);

        // Property: VRAM is always non-negative
        return vram >= 0;
      }
    ),
    { numRuns: 1000 }  // Test with 1000 random inputs
  );
});

test("VRAM estimation scales linearly with parameters", () => {
  fc.assert(
    fc.property(
      fc.nat({ max: 50_000_000_000 }),       // parameters
      fc.constantFrom("fp16", "fp32"),       // precision
      (params, precision) => {
        const vram1 = estimateVRAM(params, precision);
        const vram2 = estimateVRAM(params * 2, precision);

        // Property: Doubling parameters doubles VRAM (within tolerance)
        const ratio = vram2 / vram1;
        return Math.abs(ratio - 2.0) < 0.01;  // Within 1%
      }
    ),
    { numRuns: 500 }
  );
});

test("VRAM for fp32 is exactly 2x fp16", () => {
  fc.assert(
    fc.property(
      fc.nat({ max: 50_000_000_000 }),       // parameters
      (params) => {
        const vramFP16 = estimateVRAM(params, "fp16");
        const vramFP32 = estimateVRAM(params, "fp32");

        // Property: fp32 uses 2x bytes per parameter
        const ratio = vramFP32 / vramFP16;
        return Math.abs(ratio - 2.0) < 0.01;
      }
    ),
    { numRuns: 500 }
  );
});
```

**Generate property tests for all pure functions**

---

### Step 5: Generate Performance Benchmarks

**Goal**: Detect performance regressions with baseline benchmarks

**Find performance-critical code**:
- Database queries that could grow (model catalogs, user lists)
- API calls that batch requests
- Calculations repeated in loops

**Generate benchmark tests**:

```typescript
// convex/__tests__/performance/searchModels.test.ts
test("searchModels completes in < 100ms for 1000 models", async () => {
  const t = convexTest(schema);

  // Setup: Create 1000 models
  for (let i = 0; i < 1000; i++) {
    await t.mutation(api.mutations.createModel, {
      name: `model-${i}`,
      parameters: { size: 7_000_000_000, precision: "fp16" }
    });
  }

  // Benchmark: Search all models
  const start = Date.now();
  const results = await t.query(api.queries.searchModels, { query: "", limit: 1000 });
  const duration = Date.now() - start;

  expect(results.length).toBe(1000);
  expect(duration).toBeLessThan(100);  // < 100ms for 1000 models
});

test("calculatePricing for 100 models in < 50ms", async () => {
  const t = convexTest(schema);

  const modelIds = [];
  for (let i = 0; i < 100; i++) {
    const id = await t.mutation(api.mutations.createModel, {
      name: `model-${i}`,
      parameters: { size: 7_000_000_000, precision: "fp16" }
    });
    modelIds.push(id);
  }

  const start = Date.now();
  for (const modelId of modelIds) {
    await t.query(api.queries.calculatePricing, { modelId });
  }
  const duration = Date.now() - start;

  expect(duration).toBeLessThan(50);  // < 50ms for 100 calculations
});
```

**Tag benchmarks for separate CI runs**:
```typescript
test.concurrent("benchmark: large dataset query", async () => {
  // Test code
}, { timeout: 30000 });
```

---

### Step 6: Run Hardening Tests (Verify GREEN)

**Run new tests to verify they all pass**:

```bash
# Run integration tests
Bash: npm test -- --run integration/

# Run error injection tests
Bash: npm test -- --run --grep "timeout|rate limit|missing"

# Run property-based tests
Bash: npm test -- --run properties/

# Run performance benchmarks
Bash: npm test -- --run performance/
```

**Expected**: All new tests pass on first run (since implementations already exist and TDD tests pass)

**If tests fail**:
- ❌ Do NOT modify implementation code
- ✅ Report failures to orchestrator
- ✅ Document as "discovered integration issue" or "missing error handling"
- ✅ Orchestrator dispatches fix task

---

### Step 7: Generate Hardening Report

**Document coverage improvements**:

```markdown
## Phase N Test Hardening Report

**Feature**: FEAT-XXX [Feature Name]
**Phase**: N - [Phase Goal]
**Date**: YYYY-MM-DD HH:MM

---

### Test Coverage Added

**Integration Tests**: 5 tests
- ModelSelector → PricingCalculator data contract (✓ PASS)
- PricingCalculator → GPU Catalog lookup (✓ PASS)
- User selection → Database persistence (✓ PASS)
- Database → UI display flow (✓ PASS)
- Multi-step workflow: Selection → Pricing → Display (✓ PASS)

**Error Injection Tests**: 8 tests
- HuggingFace API timeout with retry (✓ PASS)
- HuggingFace API rate limiting (✓ PASS)
- HuggingFace API server error (✓ PASS)
- Database null return handling (✓ PASS)
- Missing environment variable (✓ PASS)
- Permission denied (403) (✓ PASS)
- Network timeout (5s delay) (✓ PASS)
- Concurrent request handling (✓ PASS)

**Property-Based Tests**: 3 tests
- VRAM estimation non-negative (1000 runs) (✓ PASS)
- VRAM linear scaling (500 runs) (✓ PASS)
- FP32 = 2x FP16 (500 runs) (✓ PASS)

**Performance Benchmarks**: 2 tests
- Search 1000 models < 100ms (✓ PASS)
- Calculate pricing for 100 models < 50ms (✓ PASS)

---

### Coverage Improvement

**Before Hardening**:
- Unit tests: 45 tests (business logic)
- E2E tests: 3 tests (UI flows)
- **Total**: 48 tests

**After Hardening**:
- Unit tests: 45 tests (business logic)
- Integration tests: 5 tests (component contracts)
- Error injection: 8 tests (failure modes)
- Property-based: 3 tests (generative)
- Performance: 2 tests (benchmarks)
- E2E tests: 3 tests (UI flows)
- **Total**: 66 tests (+37% coverage)

---

### Issues Discovered

**None** - All hardening tests passed on first run

*(If tests failed, list issues here for orchestrator to dispatch fixes)*

---

### Recommendations

**For Orchestrator**:
- ✅ All hardening tests passing
- ✅ Ready for validator to verify acceptance criteria
- ✅ Coverage improvements documented in test files
- ⚠️ Consider adding performance benchmarks to CI/CD pipeline

**For Future Phases**:
- Pattern identified: HuggingFace API error handling could be extracted to reusable utility
- Consider adding more property-based tests for pricing calculations
- Performance benchmarks establish baseline for regression detection

---

**Hardening Complete**: YYYY-MM-DD HH:MM
```

---

## Tools Used

- **Read**: Read spec, plan, tasks, implementations, existing tests
- **Glob**: Find implementations, test files, pure functions
- **Grep**: Search for external dependencies, API calls, patterns
- **Write**: Create integration/error/property test files
- **Bash**: Run tests, verify all passing
- **IDE Diagnostics**: Check TypeScript errors

---

## Quality Standards

### Must Do ✅
- Read plan.md for data flows (§DF sections) and interaction diagrams (§ID sections)
- Generate integration tests for ALL data flows identified
- Systematically test ALL failure modes for external dependencies
- Use property-based testing (fast-check) for pure functions
- Run all hardening tests and verify they pass
- Document coverage improvements in report
- Tag tests appropriately (integration/, properties/, performance/)

### Must NOT Do ❌
- Modify implementation code (only add tests)
- Remove existing TDD tests
- Skip error injection tests (critical for production readiness)
- Use arbitrary test values (use plan data flows for fixtures)
- Claim "should pass" without running tests
- Test implementation details (test behavior and contracts)
- Create slow property-based tests (limit to 1000 runs)

---

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Modifying Implementation Code

**WRONG**:
```typescript
// Hardening agent modifies implementation to fix test
export const fetchModelMetadata = action({
  handler: async (ctx, args) => {
    // ❌ Adding retry logic during hardening
    for (let i = 0; i < 3; i++) {
      try {
        return await fetch(...);
      } catch (e) {
        if (i === 2) throw e;
      }
    }
  }
});
```

**CORRECT**:
```typescript
// Hardening agent only adds test
test("fetchModelMetadata should retry on timeout", async () => {
  // Test discovers missing retry logic
  // ❌ Test fails
  // ✅ Report to orchestrator: "Missing retry logic in fetchModelMetadata"
});

// Orchestrator dispatches fix task to implementer
```

---

### ❌ Anti-Pattern 2: Testing Implementation Details

**WRONG**:
```typescript
// Testing internal variable names
test("calculatePricing uses correct variable name", () => {
  const code = readFileSync("convex/queries/calculatePricing.ts", "utf-8");
  expect(code).toContain("const input_price");  // ❌ Implementation detail
});
```

**CORRECT**:
```typescript
// Testing behavior and contracts
test("calculatePricing returns correct pricing structure", async () => {
  const result = await t.query(api.queries.calculatePricing, { modelId });
  expect(result).toHaveProperty("input_price");   // ✅ Contract
  expect(result).toHaveProperty("output_price");  // ✅ Contract
  expect(result.input_price).toBeGreaterThan(0);  // ✅ Behavior
});
```

---

### ❌ Anti-Pattern 3: Arbitrary Test Values

**WRONG**:
```typescript
// Random test values not from plan
test("ModelSelector → PricingCalculator", async () => {
  const selection = { modelId: "abc123", parameters: { foo: "bar" } };  // ❌ Arbitrary
  const pricing = await t.query(api.queries.calculatePricing, selection);
  expect(pricing).toBeDefined();
});
```

**CORRECT**:
```typescript
// Test values from plan.md data flow specification
test("ModelSelector → PricingCalculator data contract", async () => {
  // From plan §DF1: ModelSelector emits { modelId, parameters }
  // From plan §DF1: parameters = { size: number, precision: "fp16" | "fp32" }
  const selection = {
    modelId: validModelId,
    parameters: { size: 7_000_000_000, precision: "fp16" }  // ✅ From plan
  };

  const pricing = await t.query(api.queries.calculatePricing, selection);

  // From plan §DF1: pricing.vram_gb = (size * bytes_per_param * 1.2) / 1e9
  expect(pricing.vram_gb).toBeCloseTo(16.8, 1);  // ✅ Matches plan formula
});
```

---

## Remember

**Complementary to TDD**:
- TDD tests business logic BEFORE implementation
- Hardening tests integration/errors/properties AFTER implementation
- **No overlap** - different test categories

**From pre-completion-verification**:
> No completion claims without fresh verification evidence.

**Before reporting complete**:
1. Run ALL hardening tests (integration, error, property, performance)
2. Capture test output (all passing)
3. Document coverage improvements
4. Include evidence in hardening report

**Integration with Spec Workflow**:
- Runs AFTER phase tasks complete
- Runs BEFORE validator checks acceptance criteria
- Can run in PARALLEL with next phase (save 5-10 min per phase)
