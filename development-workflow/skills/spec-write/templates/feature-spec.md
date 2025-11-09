# Feature Specification: [Feature Name]

**Feature ID**: [FEAT-XXX]
**Status**: Draft | Approved | In Progress | Complete
**Created**: [YYYY-MM-DD]
**Last Updated**: [YYYY-MM-DD]

---

## Problem Statement

[1-2 paragraphs describing the problem this feature solves]

**Who**: [Target users/personas]
**What**: [What they need to do]
**Why**: [Why current solution is inadequate]
**Impact**: [Business impact if solved]

---

## Proposed Solution

[2-3 paragraphs describing the solution at a high level]

**Key capabilities**:
- Capability 1
- Capability 2
- Capability 3

**Out of scope**:
- What we're NOT building in this feature
- Future enhancements

---

## User Stories

### US-1: [User Story Title]

**As a** [persona]
**I want** [capability]
**So that** [benefit]

**Acceptance Criteria**:
- [ ] AC1: [Testable criterion - user-visible behavior]
- [ ] AC2: [Testable criterion - user-visible behavior]
- [ ] AC3: [Testable criterion - user-visible behavior]

**Priority**: High | Medium | Low

---

### US-2: [User Story Title]

**As a** [persona]
**I want** [capability]
**So that** [benefit]

**Acceptance Criteria**:
- [ ] AC1: [Testable criterion]
- [ ] AC2: [Testable criterion]
- [ ] AC3: [Testable criterion]

**Priority**: High | Medium | Low

---

[Repeat for US-3 through US-N, typically 3-10 user stories]

---

## Requirements

### Functional Requirements

- **FR1**: [Functional requirement]
- **FR2**: [Functional requirement]
- **FR3**: [Functional requirement]

### Non-Functional Requirements

- **NFR1 (Performance)**: [Performance requirement, e.g., "API response time <200ms p95"]
- **NFR2 (Security)**: [Security requirement, e.g., "All inputs validated with Zod"]
- **NFR3 (Usability)**: [Usability requirement, e.g., "Responsive design for mobile/tablet/desktop"]
- **NFR4 (Scalability)**: [Scalability requirement, e.g., "Support 10K+ concurrent users"]

### Constraints

- **Technical**: [Technical constraints, e.g., "Must use Convex backend"]
- **Business**: [Business constraints, e.g., "Launch by Q2 2025"]
- **Design**: [Design constraints, e.g., "Follow existing design system"]

---

## Open Questions (Research Needed)

These questions will be researched during the planning phase:

- **RQ1**: [Research question, e.g., "What are HuggingFace API rate limits?"]
- **RQ2**: [Research question, e.g., "How to calculate GPU VRAM for LLM inference?"]
- **RQ3**: [Research question, e.g., "Convex search performance at 10K+ records?"]

---

## Dependencies

- **Depends on**: [Other features that must be completed first]
- **Blocks**: [Other features waiting for this one]
- **Related to**: [Related features for context]

---

## Success Metrics

**How we'll measure success**:
- Metric 1: [Measurable outcome, e.g., "50% reduction in manual pricing errors"]
- Metric 2: [Measurable outcome, e.g., "Admin pricing updates take <30 seconds"]
- Metric 3: [Measurable outcome, e.g., "Zero pricing calculation bugs in production"]

---

## Implementation Verification

**When `/execute-feature` runs, the following verification is performed BEFORE marking tasks complete**:

### Code Quality
- [ ] TypeScript compiles with 0 errors (`npx tsc --noEmit`)
- [ ] All tests passing (unit, integration, E2E)
- [ ] No console errors in browser DevTools

### Testing
- [ ] TDD followed for business logic (RED → GREEN → REFACTOR evidence required)
- [ ] E2E tests use actual selectors from implementation (not assumed ones)
- [ ] All acceptance criteria have corresponding passing tests

### User-Visible Validation
- [ ] Dev servers running (Next.js + Convex)
- [ ] Feature accessible at documented URL
- [ ] User journey from acceptance criteria verified in browser
- [ ] Integration checkpoint passed (every 10 tasks)

**Note**: Tasks are NOT marked complete unless verification evidence is provided. See agent prompt files (implementer.md, tdd-executor.md, validator.md) for enforcement details.

---

## Notes

[Additional context, links to designs, previous discussions, etc.]
