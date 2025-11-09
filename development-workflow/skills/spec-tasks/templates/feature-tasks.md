# Task List: [Feature Name]

**Feature ID**: [FEAT-XXX]
**Status**: Not Started | In Progress | Complete
**Created**: [YYYY-MM-DD]
**Last Updated**: [YYYY-MM-DD]

**Related Documents**:
- Specification: `docs/features/[FEAT-XXX]-spec.md`
- Implementation Plan: `docs/features/[FEAT-XXX]-plan.md`

---

## Summary

**Total Tasks**: [N] tasks
**Estimated Duration**: [N days] with [M developers] working in parallel
**Critical Path**: T001 → T005 → T010 → T020 ([N days])
**Parallelism Opportunities**: Up to [M] tasks can run concurrently

---

## Batches (Execution Order)

**Batch 1** (no dependencies - parallel):
- T001: [Task name]
- T003: [Task name]
- T004: [Task name]
- T007: [Task name]

**Batch 2** (depends on Batch 1 - parallel):
- T002: [Task name] (depends on T001)
- T005: [Task name] (depends on T001)
- T008: [Task name] (depends on T007)

**Batch 3** (depends on Batch 2 - parallel):
- T006: [Task name] (depends on T002)
- T009: [Task name] (depends on T005)
- T010: [Task name] (depends on T008)

[Continue batching...]

---

## Phases (Emergent from Dependencies)

**Phase 1: Foundation** (Batches 1-3, Tasks T001-T010)
- **Pattern**: No dependencies, sets up base infrastructure
- **Components**: Schema changes, environment setup, core backend functions
- **Duration**: 2 days
- **Completion Criteria**: TypeScript compiles with 0 errors, schema deployed

**Phase 2: Business Logic** (Batches 4-7, Tasks T011-T025)
- **Pattern**: Depends on Phase 1 schema, backend-focused
- **Components**: Queries, mutations, calculations, validations
- **Duration**: 3 days
- **Completion Criteria**: All backend tests pass, API contracts verified

**Phase 3: UI Components** (Batches 8-10, Tasks T026-T035)
- **Pattern**: Depends on Phase 2 APIs, UI-focused
- **Components**: Pages, components, forms, styling
- **Duration**: 2 days
- **Completion Criteria**: Components render, no console errors

**Phase 4: Integration** (Batches 11-12, Tasks T036-T042)
- **Pattern**: Wires frontend to backend, end-to-end tests
- **Components**: API integration, error handling, E2E tests
- **Duration**: 2 days
- **Completion Criteria**: Full user workflows work, all tests pass

---

## Critical Path

T001 → T002 → T006 → T012 → T021 → T022 ([N days])

**With Parallelism**: [N days] (assuming [M] developers working on independent batches)

---

## Task Details

### Phase 1: Foundation (T001-T010)

**Goal**: Build data layer and business logic
**Duration**: [N days]

### T001: [Task Description with TDD]

**Type**: Backend | Mutation | TDD Required
**Agent**: tdd-executor (Sonnet)
**Estimate**: 3-4 hours
**Dependencies**: None
**Priority**: High



**Implements**: US-[N] (§AC[X], §AC[Y])

**Plan References**: §[Section].[Subsection]

**Knowledge Prerequisites**: [@skill §section], [Research topic if needed]

**Related Tasks**: T[XXX] (shares context), T[YYY] (same domain)

**Acceptance Criteria**:
- [ ] Write failing test for [functionality] (RED)
- [ ] Implement minimal [functionality] (GREEN)
- [ ] Refactor for edge cases: [case1, case2, case3] (REFACTOR)
- [ ] All tests passing (unit + integration)
- [ ] TypeScript compiles with 0 errors

**Files to Create/Modify** (per Plan §TD1):
- `convex/__tests__/[module].test.ts`
- `convex/mutations/[module].ts`

**Expert Skills**: convex-expert (mutation patterns, testing)

---

### T002: [Task Description with TDD]

**Type**: Backend | Query | TDD Required
**Agent**: tdd-executor (Sonnet)
**Estimate**: 2-3 hours
**Dependencies**: T001 (needs schema from T001)
**Priority**: High



**Implements**: US-[N] (§AC[X])

**Plan References**: §[Section].[Subsection]

**Knowledge Prerequisites**: [@skill §section], [Research topic if needed]

**Related Tasks**: T[XXX] (shares context), T[YYY] (same domain)

**Acceptance Criteria**:
- [ ] Write failing test for [query] (RED)
- [ ] Implement [query] with indexed filtering (GREEN)
- [ ] Refactor for performance (REFACTOR)
- [ ] All tests passing
- [ ] Query p95 latency <100ms

**Files to Create/Modify** (per Plan §TD1):
- `convex/__tests__/[module].test.ts`
- `convex/queries/[module].ts`

**Expert Skills**: convex-expert (query patterns, indexes)

---

### T003: [Simple Task - No TDD]

**Type**: Backend | Schema Update
**Agent**: implementer (Haiku)
**Estimate**: 1 hour
**Dependencies**: None
**Priority**: Medium



**Implements**: US-[N] (§AC[X])

**Plan References**: §[Section].[Subsection]

**Knowledge Prerequisites**: [@skill §section], [Research topic if needed]

**Related Tasks**: T[XXX] (shares context), T[YYY] (same domain)

**Acceptance Criteria**:
- [ ] Add new fields to `[table]` table
- [ ] Add indexes: `by_[field1]`, `by_[field2]`
- [ ] Add search index if needed
- [ ] Schema validates (npx convex dev)

**Files to Create/Modify** (per Plan §TD1):
- `convex/schema.ts`

**Expert Skills**: convex-expert (schema design)

---

[Continue with T004-T010...]

---


## Phase 2: Frontend UI

**Goal**: Build user interface components
**Duration**: [N days]

### T011: [UI Component Task]

**Type**: Frontend | Component | No TDD
**Agent**: implementer (Haiku)
**Estimate**: 2 hours
**Dependencies**: T001 (needs data structure from T001)
**Priority**: Medium


**Implements**: US-[N] (§AC[X], §AC[Y])
**Plan References**: §[Section].[Subsection]
**Knowledge Prerequisites**: [@skill §section], [Research topic if needed]
**Related Tasks**: T[XXX] (shares context), T[YYY] (same domain)

**Acceptance Criteria**:
- [ ] Component renders without errors
- [ ] Displays [data fields]: [field1, field2, field3]
- [ ] Matches design mockup (if applicable)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Accessible (keyboard navigation, ARIA labels)

**Files to Create/Modify**:
- `components/[ComponentName].tsx`

**Expert Skills**: nextjs-expert (component patterns)

---

### T012: [Page Layout Task]

**Type**: Frontend | Page | No TDD
**Agent**: implementer (Haiku)
**Estimate**: 2-3 hours
**Dependencies**: T011 (uses component from T011)
**Priority**: High


**Implements**: US-[N] (§AC[X])
**Plan References**: §[Section].[Subsection]
**Knowledge Prerequisites**: [@skill §section], [Research topic if needed]
**Related Tasks**: T[XXX] (shares context), T[YYY] (same domain)

**Acceptance Criteria**:
- [ ] Page loads at `/[route]`
- [ ] Layout matches design
- [ ] Integrates components: [Component1, Component2]
- [ ] Loading states implemented
- [ ] Error states implemented

**Files to Create/Modify**:
- `app/(marketing)/[route]/page.tsx`

**Expert Skills**: nextjs-expert (App Router, page patterns)

---

[Continue with T013-T020...]

---


## Phase 3: Integration & Testing

**Goal**: Wire frontend to backend, validate end-to-end
**Duration**: [N days]

### T021: [Integration Task]

**Type**: Integration | Frontend + Backend
**Agent**: implementer (Haiku)
**Estimate**: 2-3 hours
**Dependencies**: T012 (page), T002 (query)
**Priority**: High


**Implements**: US-[N] (§AC[X], §AC[Y])
**Plan References**: §[Section].[Subsection]
**Knowledge Prerequisites**: [@skill §section], [Research topic if needed]
**Related Tasks**: T[XXX] (shares context), T[YYY] (same domain)

**Acceptance Criteria**:
- [ ] Page successfully calls Convex query
- [ ] Data displays correctly in UI
- [ ] Error handling implemented (network failure, validation)
- [ ] Loading states work correctly
- [ ] No console errors

**Files to Create/Modify**:
- `app/(marketing)/[route]/page.tsx` (add Convex query call)

**Expert Skills**: convex-expert (client integration), nextjs-expert (data fetching)

---

### T022: [E2E Test Task]

**Type**: Testing | E2E | TDD Required
**Agent**: tdd-executor (Sonnet)
**Estimate**: 3-4 hours
**Dependencies**: T021 (integration complete)
**Priority**: High


**Implements**: US-[N] (§AC[X])
**Plan References**: §[Section].[Subsection]
**Knowledge Prerequisites**: [@skill §section], [Research topic if needed]
**Related Tasks**: T[XXX] (shares context), T[YYY] (same domain)

**Acceptance Criteria**:
- [ ] Write failing E2E test for critical user path (RED)
- [ ] Implement any missing functionality to pass test (GREEN)
- [ ] Refactor for edge cases (REFACTOR)
- [ ] E2E test passes consistently

**Files to Create/Modify**:
- `tests/e2e/[feature].spec.ts`

**Expert Skills**: General testing patterns (no expert skill needed)

---

[Continue with T023-T030...]

---

## Risk Log

| Task | Risk | Impact | Mitigation |
|------|------|--------|------------|
| T001 | [Risk description] | High/Med/Low | [Mitigation strategy] |
| T015 | External API rate limits | Medium | Implement caching, exponential backoff |

---

## Notes

[Additional context, blockers, decisions made during implementation, etc.]
