---
name: spec-plan
description: "[WORKFLOW] Create implementation plan with architecture, data models, testing strategy, parallel research dispatch, and codebase pattern analysis"
when_to_use: When creating a technical plan to address a specification
version: 3.0.0
type: workflow
---

**Input**: Approved specification from spec-write
**Output**: `docs/features/[FEAT-XXX]-plan.md`

---

## Process

### Step 1: Read Specification

```bash
Read: docs/features/[FEAT-XXX]-spec.md
```

Extract:
- Feature ID, problem statement
- User stories with acceptance criteria
- Requirements (FR, NFR, constraints)
- Open questions (RQ1-RQN)

**LOAD SKILLS FOR THE JOB**:
- Load skills based on the task at hand (Next.js patterns, shadcn/ui, Convex-operations etc...)
- examine the task and compare to your list of skills and select the best skills for the task:
  - Select up to 3 skills with [KNOWLEDGE] tags in the description field
  - Select up to 3 skills with the [META] tag in the description field
- Keep it simple (no over-engineering)
- Follow existing patterns in codebase
- YAGNI (You Aren't Gonna Need It)

---

### Step 2: Parallel Research + Analysis Phase

**Purpose**: Research open questions AND search codebase for existing patterns

#### Step 2.1: Determine What to Dispatch

**Check for Research Questions** (from spec):
```bash
# Extract RQs from spec
Read: docs/features/[FEAT-XXX]-spec.md
# Look for "## Open Questions" section with RQ1-RQN

# Check if research already exists
Grep: knowledge/*.md --pattern "[keyword from RQ]"

# Collect RQs needing research
research_queue = [RQ1, RQ2]  # RQ3 already exists
```

**Determine if Analyzer Needed**:

Dispatch analyzer agent when:
- ✅ Feature has 3+ user stories (likely substantial, 15+ tasks)
- ✅ Spec mentions integration with existing features
- ✅ Feature type likely has existing patterns (mutations, UI components, admin features)

Skip analyzer when:
- ❌ Feature is trivial (1-2 user stories, <5 tasks)
- ❌ Feature is net-new functionality with no existing patterns
- ❌ Codebase is very small (<50 files)

**Example decision**:
```markdown
# Feature: Admin pricing interface with bulk updates
# User stories: 5 (US-1 through US-5)
# Existing patterns: Admin mutations, bulk updates, UI tables
# Decision: ✅ Dispatch analyzer
```

#### Step 2.2: Dispatch Agents in Parallel (Fan-Out)

**Single message with multiple Task calls**:

```markdown
Task 1: researcher (haiku)
  Query: "HuggingFace API rate limits for model metadata"
  Save to: knowledge/huggingface-api-rate-limits-2025-01-15.md
  Expected: Research summary with findings

Task 2: researcher (haiku)
  Query: "GPU VRAM estimation formulas for FP16 inference"
  Save to: knowledge/gpu-vram-estimation-2025-01-15.md
  Expected: Research summary with findings

Task 3: analyzer (haiku)
  Feature keywords: ["pricing", "bulk update", "admin"]
  Feature type: "backend mutation + admin UI"
  Search scope: "thorough"
  Spec excerpt: |
    US-1: Admin updates model pricing
    US-2: Admin performs bulk pricing updates
    US-3: Admin views pricing history
  Expected: Structured pattern analysis with file:line references

# Wait for ALL to complete (fan-in)
```

#### Step 2.3: Aggregate Results

**From researchers**:
```typescript
research_summary = [
  {
    question: "RQ1: HuggingFace API rate limits",
    findings: ["5,000 requests/hour authenticated", "429 errors on limit", "Use caching"],
    file: "knowledge/huggingface-api-rate-limits-2025-01-15.md"
  },
  {
    question: "RQ2: GPU VRAM estimation",
    findings: ["Formula: params * 2 bytes (FP16)", "Add 20% overhead", "Batch size multiplier"],
    file: "knowledge/gpu-vram-estimation-2025-01-15.md"
  }
];
```

**From analyzer** (if dispatched):
```typescript
pattern_analysis = {
  patterns_found: [
    {
      pattern_type: "admin_mutation_auth",
      description: "Admin role check before mutations",
      example_location: "convex/mutations/updateModel.ts:23-30",
      code_snippet: "const identity = await ctx.auth.getUserIdentity();\nif (identity.role !== 'admin') throw new Error('Unauthorized');",
      usage_instruction: "Copy auth check pattern for pricing mutations"
    }
  ],
  integration_points: [
    {
      file_location: "convex/schema.ts:45",
      integration_type: "schema_addition",
      instruction: "Add pricing_configs table after models table",
      existing_pattern: "Follow defineTable pattern from lines 45-67"
    }
  ],
  similar_implementations: [
    {
      file: "convex/mutations/bulkUpdateModels.ts:56-78",
      description: "Bulk update with chunking",
      relevance: "Apply same pattern for bulk pricing updates"
    }
  ],
  anti_patterns: [
    {
      file: "lib/old-pricing/index.ts",
      issue: "Deprecated pricing calculation - DO NOT USE",
      reason: "Hard-coded values, no validation"
    }
  ],
  recommendations: [
    "Follow admin auth pattern from updateModel.ts:23",
    "Reuse DataTable component for pricing table",
    "Use chunking pattern from bulkUpdateModels.ts:56-78"
  ]
};
```

#### Step 2.4: Use Results in Planning Sections

**Research findings** → Include in:
- Performance Considerations (if RQ about scale/performance)
- External API integration details (if RQ about third-party APIs)
- Technical Decisions (research informs choices)

**Pattern analysis** → Include in:
- Technical Decisions §TD1 (file organization with integration points)
- NEW: "Existing Patterns to Follow" section (after TD1)
- API Contracts (reference similar function signatures)
- Testing Strategy (follow existing test patterns)

---

### Step 3: Design Architecture

**System components (ASCII diagram):**
```
┌─────────────────────────────────────────┐
│           Frontend (Next.js)             │
│  /admin/pricing → PricingDashboard       │
└────────────┬────────────────────────────┘
             │ useQuery/useMutation
             ▼
┌─────────────────────────────────────────┐
│        Backend (Convex)                  │
│  - queries/getPricing.ts                 │
│  - mutations/updatePricing.ts            │
└────────────┬────────────────────────────┘
             │ ctx.db
             ▼
┌─────────────────────────────────────────┐
│        Database (Convex)                 │
│  - pricing_configs table                 │
│  - pricing_history table                 │
└─────────────────────────────────────────┘
```

**Key components:**
- Frontend: Admin dashboard pages and components
- Backend: Convex queries, mutations, actions
- Database: Schema changes and indexes
- External APIs: HuggingFace integration (if needed)

---

### Step 4: Database Schema Changes

**New tables:**
```typescript
pricing_configs: defineTable({
  model_id: v.id("models"),
  base_cost: v.number(),
  margin: v.number(),
  input_price: v.number(),
  output_price: v.number(),
  updated_at: v.number(),
  updated_by: v.string()
})
.index("by_model", ["model_id"])
.index("by_updated", ["updated_at"])

pricing_history: defineTable({
  pricing_config_id: v.id("pricing_configs"),
  old_input_price: v.number(),
  new_input_price: v.number(),
  old_output_price: v.number(),
  new_output_price: v.number(),
  changed_at: v.number(),
  changed_by: v.string()
})
.index("by_config", ["pricing_config_id"])
.index("by_date", ["changed_at"])
```

**Modified tables:**
```typescript
models: defineTable({
  // Existing fields...
  // Add:
  has_pricing: v.optional(v.boolean())
})
.index("by_pricing_status", ["has_pricing"])
```

---

### Step 5: API Contracts

**Queries:**
```typescript
export const getPricingConfigs = query({
  args: { vendor_filter: v.optional(v.string()) },
  returns: v.array(v.object({
    _id: v.id("pricing_configs"),
    model_id: v.id("models"),
    model_name: v.string(),
    input_price: v.number(),
    output_price: v.number(),
    margin: v.number()
  }))
});
```

**Mutations:**
```typescript
export const updatePricing = mutation({
  args: {
    pricing_config_id: v.id("pricing_configs"),
    input_price: v.number(),
    output_price: v.number()
  },
  returns: v.id("pricing_configs")
});

export const bulkUpdateMargin = mutation({
  args: {
    model_ids: v.array(v.id("models")),
    margin: v.number()
  },
  returns: v.object({
    updated_count: v.number()
  })
});
```

---

### Step 6: Technical Decisions

**First decision is always File Organization** - Read CLAUDE.md "Repository Structure" and populate Plan §TD1 template with feature-specific paths.

Document other key decisions with rationale:

```markdown
### Decision 1: File Organization (§TD1)
[See template - always first technical decision]

### Decision 2: Single Mutation vs Batch for Bulk Updates

**Context**: Need to update 500+ models efficiently

**Options**:
1. Single mutation with array of model_ids
2. Batch of individual mutations (client-side loop)

**Decision**: Option 1 (single mutation)

**Rationale**:
- 100× fewer database round-trips
- Atomic (all succeed or all fail)
- Better performance (<5s vs 30s+)

**Implications**:
- Need to handle partial failures in mutation
- Add transaction timeout handling
```

---

### Step 7: Testing Strategy

**Unit tests:**
- Business logic (pricing calculations, validation)
- Edge cases (negative prices, zero margin)
- Coverage target: 80%+

**Integration tests:**
- Convex mutations update database correctly
- Queries return expected data
- Error handling (invalid inputs)

**E2E tests:**
- Critical user workflows (update pricing, bulk update)
- Error states (network failure, validation)
- Responsive design

---

### Step 8: Performance Planning

**Identify potential bottlenecks from architecture:**

```markdown
**Bottleneck 1**: Full table scan on 500+ models for vendor filtering
- **Solution**: Add index on vendor_name field
- **Impact**: 10-100× faster queries

**Bottleneck 2**: Bulk update of 500+ records in single mutation
- **Solution**: Batch updates in chunks of 100, use Promise.all
- **Impact**: Prevents timeout, maintains atomicity per batch

**Bottleneck 3**: Real-time pricing calculations on page load
- **Solution**: Pre-calculate and cache in pricing_configs table
- **Impact**: <200ms page load vs 5s+ calculation time
```

**Set performance targets:**
- Query response time: p95 <200ms
- Mutation response time: p95 <500ms
- Page load: p95 <1s
- Bulk update (500 models): <10s

---

### Step 9: Security Planning

**Input validation:**
```markdown
- All mutations use Zod schemas (v.number(), v.string(), etc.)
- Backend re-validates (never trust client input)
- Reject negative prices, zero margins at mutation level
```

**Authentication/Authorization:**
```markdown
- Admin-only endpoints: Check ctx.auth.getUserIdentity()
- Verify admin role before allowing pricing updates
- Public queries filter sensitive fields (margin, base_cost)
```

**Data protection:**
```markdown
- Never expose pricing calculations in public queries
- Use environment variables for API keys (HuggingFace)
- Sanitize error messages (no stack traces to client)
```

---

### Step 10: Rollout Planning (Optional/Light)

**Deployment approach:**
```markdown
1. Deploy schema changes first (backwards compatible)
2. Deploy backend functions (test in dev)
3. Deploy frontend (feature flag if needed)
4. Gradual rollout (monitor for errors)
```

**Rollback plan:**
```markdown
- Feature flag: Disable frontend feature
- Database: Schema changes designed for rollback safety
- Monitor: Watch error rates, performance metrics
```

---

### Step 11: Dependency Analysis
**DO NOT PLAN DETAILED TASKS YET**

**Required before implementation:**
```markdown
- Authentication system (FEAT-001) must be complete
- Admin role permissions configured in Convex
- Convex environment variables set (HUGGINGFACE_API_KEY if needed)
```

**Affects task ordering:**
```markdown
- Schema changes must complete before backend mutations
- Backend mutations must complete before frontend integration
- Testing can run in parallel with frontend development
```

---

### Step 12: Risk Assessment

**Identify risks with mitigation:**

```markdown
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| API rate limits hit | Medium | Medium | Implement caching, batching, retry logic |
| Data migration fails | High | Low | Test on staging data first, backup before migration |
| Performance degrades | Medium | Medium | Add indexes, monitor query times, optimize on metrics |
| Bulk update timeout | Medium | Medium | Chunk updates (100 per batch), add progress indicator |
```

---

### Step 13: Success Criteria

**Derive from spec acceptance criteria + technical metrics:**

```markdown
**Functional** (from spec):
- [ ] All user stories have passing acceptance tests (from spec AC1-ACN)
- [ ] Admin can update individual model pricing
- [ ] Admin can bulk update margins for filtered models
- [ ] Pricing history tracks all changes with timestamps

**Technical** (from plan):
- [ ] Unit test coverage >80% for business logic
- [ ] Integration tests cover all API endpoints (queries, mutations)
- [ ] E2E tests cover critical user paths (update pricing, bulk update)
- [ ] Performance targets met (p95 <200ms queries, <500ms mutations)
- [ ] Security review complete (no sensitive data exposed in public queries)
- [ ] All TypeScript compiles with 0 errors
- [ ] Pre-commit hooks pass (ESLint, tests)

**Quality** (general):
- [ ] Code review approved by team
- [ ] Documentation updated (API contracts, user guide)
- [ ] Deployed to production without rollback
```

---

### Step 14: Write Plan File

```bash
# Read template
Read: templates/feature-plan.md

# Fill sections (in template order):
# 1. Research Summary (from Step 2)
# 2. Architecture Overview (from Step 3)
# 3. Database Schema Changes (from Step 4)
# 4. API Contracts (from Step 5)
# 5. Technical Decisions (from Step 6) - TD1 first
# 6. Testing Strategy (from Step 7)
# 7. Performance Considerations (from Step 8)
# 8. Security Considerations (from Step 9)
# 9. Rollout Strategy (from Step 10)
# 10. Dependencies (from Step 11)
# 11. Risks & Mitigation (from Step 12)
# 12. Success Criteria (from Step 13)

# Write file
Write: docs/features/[FEAT-XXX]-plan.md
```

---

### Step 15: Present to User

```markdown
I've created implementation plan for **FEAT-XXX**:

**Research completed** (2 questions):
- RQ1: HuggingFace rate limits (5K/hour, use caching)
- RQ2: GPU VRAM formula (params × 2 bytes + 20% overhead)
- Files: knowledge/huggingface-api-*.md, knowledge/gpu-vram-*.md

**Architecture**:
- 2 new tables (pricing_configs, pricing_history)
- 3 queries, 2 mutations
- Frontend: /admin/pricing dashboard

**Key Technical Decisions**:
- TD1: File organization (lib/pricing/core.ts for logic)
- TD2: Single mutation for bulk updates (100× faster than loop)

**Performance Targets**:
- Query p95: <200ms
- Bulk update (500 models): <10s

**Security**:
- Admin-only endpoints with auth checks
- Zod validation on all mutations
- Public queries filter sensitive pricing data

**Testing Strategy**:
- Unit tests: Business logic, edge cases (80%+ coverage)
- Integration tests: Database operations, error handling
- E2E tests: Critical user workflows, responsive design

**Dependencies**:
- Requires: Authentication system (FEAT-001) complete
- Affects: Task ordering (schema → backend → frontend)

**Success Criteria**:
- All spec acceptance criteria met
- Performance targets achieved
- Security review passed
- 0 TypeScript errors

**File created**: docs/features/FEAT-XXX-plan.md

Does this make sense? Any changes needed?
```

**User options:**
1. Approve → Proceed to Step 3 (task generation via spec-tasks)
2. Request changes → Iterate on plan
3. Cancel → Stop workflow

---

## Quality Checks

- ✅ All RQs researched (or existing research referenced)
- ✅ Schema changes complete (all fields, indexes)
- ✅ API contracts have TypeScript definitions
- ✅ Technical decisions have clear rationale (TD1: File Org is first)
- ✅ Testing strategy covers unit, integration, E2E
- ✅ Performance bottlenecks identified with solutions
- ✅ Security considerations documented
- ✅ Dependencies identified for task ordering
- ✅ Success criteria bridge spec ACs to technical metrics

---

## Integration with spec-tasks

**Plan sections that inform task generation**:
- **§TD1 (File Organization)**: Tasks reference "(per Plan §TD1)" for file paths
- **API Contracts**: Tasks implement exact TypeScript signatures from plan
- **Testing Strategy**: Tasks classified as TDD (tdd-executor) vs Direct (implementer)
- **Performance Considerations**: Tasks add optimization (indexes, caching, batching)
- **Security Considerations**: Tasks add validation, auth checks, sanitization
- **Dependencies**: Tasks ordered to respect prerequisite completion

---

**Usage**: Load this skill when running `/spec` command (Step 2: Planning)
