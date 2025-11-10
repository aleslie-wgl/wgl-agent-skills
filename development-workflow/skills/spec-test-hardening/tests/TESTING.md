# Testing spec-test-hardening Skill

## Test Approach

Since spec-test-hardening is a **workflow skill** (not discipline-enforcing), we test it by:

1. Creating a mock feature scenario with data flows and external dependencies
2. Dispatching test-hardening agent with the scenario
3. Verifying the agent:
   - Follows workflow steps correctly
   - Generates appropriate test types (integration, error, property)
   - Does NOT modify implementation code
   - Reports coverage improvements

## Mock Scenario for Testing

```markdown
**Feature**: FEAT-TEST-001 - Simple Pricing Calculator
**Phase**: Phase 1 - Core Calculation

**Plan Excerpts**:

**§DF1: User Input → Pricing Calculation**
Flow:
1. User enters base_cost and margin in form
2. Form emits { base_cost, margin } to calculatePricing query
3. Query calculates: input_price = base_cost * (1 + margin)
4. Returns { input_price, output_price: input_price * 2 }

Contract:
- Form must emit positive base_cost
- Form must emit non-negative margin
- Query must validate inputs

**External Dependencies**:
- Convex database (ctx.db) for logging
- process.env.PRICING_MODE for calculation mode

**Implementations**:
- convex/queries/calculatePricing.ts (exists)
- convex/__tests__/pricing.test.ts (TDD tests exist)

**Expected Hardening**:
- Integration test: Form → Query data contract
- Error injection: Database unavailable, missing env var
- Property-based: pricing non-negative, linear scaling
```

## How to Test Manually

1. Create mock implementation files in a test directory
2. Dispatch test-hardening agent with mock scenario
3. Verify agent generates tests (not implementations)
4. Check that agent reports coverage improvements

## Automated Testing (Future)

For automated testing of this skill:
- Create fixture directory with mock implementations
- Create expected test outputs
- Compare agent output to expected
- Verify no implementation modifications

## Success Criteria

✅ Agent reads plan excerpts for data flows
✅ Agent identifies external dependencies correctly
✅ Agent generates integration tests matching data flows
✅ Agent generates error injection tests for dependencies
✅ Agent generates property-based tests for pure functions
✅ Agent does NOT modify implementation code
✅ Agent reports coverage improvements
✅ Agent runs tests and verifies passing

## Known Limitations

- Requires plan.md with §DF sections (data flows)
- Requires implementations to exist already
- Cannot fix failing tests (reports to orchestrator)
- Fast-check library must be installed for property tests
