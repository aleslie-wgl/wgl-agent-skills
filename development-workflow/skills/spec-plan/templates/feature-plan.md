# Implementation Plan: [Feature Name]

**Feature ID**: [FEAT-XXX]
**Status**: Draft | Approved | In Progress | Complete
**Created**: [YYYY-MM-DD]
**Last Updated**: [YYYY-MM-DD]

**Related Documents**:
- Specification: `docs/features/[FEAT-XXX]-spec.md`
- Tasks: `docs/features/[FEAT-XXX]-tasks.md` (generated from this plan)

---

## Research Summary

**Research Questions Investigated**:

### RQ1: [Question]
**Findings**: [3-5 bullet points summarizing key findings]
**Source**: `knowledge/[topic]-YYYY-MM-DD.md`

### RQ2: [Question]
**Findings**: [3-5 bullet points summarizing key findings]
**Source**: `knowledge/[topic]-YYYY-MM-DD.md`

[Repeat for each RQ from spec]

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────┐
│              Component Diagram                   │
│  [ASCII diagram showing how components connect]  │
│                                                   │
│  Frontend ──> API ──> Backend ──> Database       │
└─────────────────────────────────────────────────┘
```

**Key components**:
- **Frontend**: [Description]
- **Backend**: [Description]
- **Database**: [Description]
- **External APIs**: [Description]

---

## Database Schema Changes

### New Tables

```typescript
// Table: [table_name]
defineTable({
  field1: v.string(),
  field2: v.number(),
  field3: v.optional(v.boolean()),
  created_at: v.number(),
  updated_at: v.number()
})
.index("by_field1", ["field1"])
.index("by_field2", ["field2"])
.searchIndex("search_field1", {
  searchField: "field1",
  filterFields: ["field2"]
});
```

### Modified Tables

```typescript
// Table: [existing_table]
// Add fields:
// - new_field1: v.string()
// - new_field2: v.number()
// Add indexes:
// - index("by_new_field1", ["new_field1"])
```

---

## API Contracts

### Queries

```typescript
// Query: [queryName]
export const queryName = query({
  args: {
    param1: v.string(),
    param2: v.number()
  },
  returns: v.array(v.object({
    field1: v.string(),
    field2: v.number()
  })),
  handler: async (ctx, args) => {
    // Implementation notes
  }
});
```

### Mutations

```typescript
// Mutation: [mutationName]
export const mutationName = mutation({
  args: {
    param1: v.string(),
    param2: v.number()
  },
  returns: v.id("table_name"),
  handler: async (ctx, args) => {
    // Implementation notes
  }
});
```

### Actions

```typescript
// Action: [actionName]
export const actionName = action({
  args: {
    param1: v.string()
  },
  returns: v.object({
    result: v.string()
  }),
  handler: async (ctx, args) => {
    // Implementation notes (external API calls)
  }
});
```

---

## Technical Decisions

### Decision 1: File Organization

**Context**: Where to place new files for this feature

**Decision**:
- **Pages**: `app/(marketing)/[route]/page.tsx` (for pages using marketing layout)
- **Admin pages**: `app/(marketing)/admin/[route]/page.tsx` (shares nav/layout)
- **API routes**: `app/api/[route]/route.ts`
- **Components**: `components/marketing/` or `components/admin/` based on usage
- **Business logic**: `lib/[feature-name]/core.ts` (library-first pattern)
- **Convex (Database) functions**: `convex/mutations/[name].ts`, `convex/queries/[name].ts`, `convex/actions/[name].ts`

**Rationale**: Follows CLAUDE.md repository structure (see "Repository Structure" section)

**Reference**: All task file paths will reference this section (e.g., "per Plan §TD1")

---

### Decision 2: [Next Decision Title]

**Context**: [Why we needed to make a decision]

**Options Considered**:
1. **Option A**: [Description, pros/cons]
2. **Option B**: [Description, pros/cons]

**Decision**: We chose **Option B** because [rationale]

**Implications**:
- [Impact on architecture]
- [Impact on performance]

---

## Testing Strategy

### Unit Tests

**What to test**:
- Business logic functions (pricing calculations, validation)
- Data transformations
- Edge cases (null, empty, negative values)

**Coverage target**: 80%+ for business logic

**Example**:
```typescript
test("calculatePricing returns positive price", () => {
  const result = calculatePricing({ base_cost: 10, margin: 0.6 });
  expect(result.input_price).toBeGreaterThan(0);
});
```

---

### Integration Tests

**What to test**:
- Convex queries return expected data
- Mutations update database correctly
- API contracts match TypeScript definitions
- Error handling (invalid inputs, missing data)

**Example**:
```typescript
test("updateModelPricing validates positive prices", async () => {
  await expect(
    t.mutation(api.mutations.updateModelPricing, {
      model_id: testId,
      input_price: -10 // Invalid
    })
  ).rejects.toThrow("Input price must be positive");
});
```

---

### E2E Tests

**What to test**:
- Critical user workflows (happy path)
- Error states (network failure, validation errors)
- Responsive design (mobile, tablet, desktop)

**Example**:
```typescript
test("admin can update pricing and see changes", async () => {
  await page.goto("/admin/pricing");
  await page.fill("#input-price", "0.50");
  await page.click("#save-button");
  await expect(page.locator(".success-message")).toBeVisible();
});
```

---

## Performance Considerations

**Bottlenecks identified**:
- [Potential bottleneck, e.g., "Full table scan on models table"]
  - **Mitigation**: Add index on `vendor_name` field
  - **Impact**: 10-100× faster queries

**Optimization strategies**:
- Use indexed filtering (not post-filter)
- Paginate large result sets (>1000 records)
- Cache read-heavy data (use Convex caching)
- Lazy load heavy components

---

## Security Considerations

**Input validation**:
- All user inputs validated with Zod schemas
- Backend mutations re-validate (never trust client)

**Authentication/Authorization**:
- Admin-only endpoints check `ctx.auth` for admin role
- Public endpoints filter sensitive fields (margin, base_cost)

**Data protection**:
- Never expose sensitive data in public queries
- Use environment variables for API keys
- Sanitize error messages (no stack traces in production)

---

## Rollout Strategy

**Deployment phases**:
1. **Dev**: Deploy to dev environment, test with sample data
2. **Staging**: Deploy to staging, test with production-like data
3. **Production**: Deploy to production with feature flag (gradual rollout)

**Rollback plan**:
- If critical bug → Disable feature flag
- If data corruption → Restore from backup, revert migration

---

## Dependencies

**Required before implementation**:
- [Feature dependencies, e.g., "FEAT-001 (authentication) must be complete"]
- [Infrastructure dependencies, e.g., "Convex environment variables configured"]

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| [Risk description] | High/Med/Low | High/Med/Low | [Mitigation strategy] |
| API rate limits | Medium | Medium | Implement caching, batching |
| Data migration issues | High | Low | Test on staging data first |

---

## Success Criteria

**Definition of Done**:
- [ ] All user stories have passing acceptance tests
- [ ] Unit test coverage >80% for business logic
- [ ] Integration tests cover all API endpoints
- [ ] E2E tests cover critical user paths
- [ ] Performance targets met (p95 <200ms)
- [ ] Security review complete (no sensitive data exposed)
- [ ] Documentation updated (API contracts, user guide)
- [ ] Code review approved
- [ ] Deployed to production

---

## Next Steps

After approval of this plan:
1. Generate detailed tasks: Run `/spec-tasks` or generate `[FEAT-XXX]-tasks.md`
2. Review task breakdown
3. Begin implementation: Run `/execute-feature [FEAT-XXX]`

---

## Notes

[Additional context, design mockups, prototype links, etc.]
