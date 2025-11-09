---
name: spec-plan
description: "[WORKFLOW] Create implementation plan with architecture, data models, testing strategy, and parallel research dispatch"
when_to_use: When creating a technical plan to address a specification
version: 1.0.0
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

### Step 2: Parallel Research Phase (If RQs Exist)

**Extract open questions from spec:**
```markdown
RQ1: "HuggingFace API rate limits"
RQ2: "GPU VRAM estimation formulas"
RQ3: "Convex search performance at 10K+ records"
```

**Check if research already exists:**
```bash
# For each RQ, check knowledge base
Grep: knowledge/*.md --pattern "huggingface api rate"
Grep: knowledge/*.md --pattern "gpu vram estimation"
Grep: knowledge/*.md --pattern "convex search performance"
```

**Collect RQs needing research:**
```markdown
# If grep found existing research → Use existing file
# If grep found nothing → Add to research queue

research_queue = [RQ1, RQ2]  # RQ3 already researched
```

**Dispatch parallel researchers (fan-out):**
```markdown
# Single message with N Task calls

Task 1: spec-research
  Query: "HuggingFace API rate limits for model metadata"
  Save to: knowledge/huggingface-api-rate-limits-2025-01-15.md

Task 2: spec-research
  Query: "GPU VRAM estimation formulas for FP16 inference"
  Save to: knowledge/gpu-vram-estimation-2025-01-15.md

# Wait for ALL to complete (fan-in)
# Each returns: { query, summary, file, status }
```

**Aggregate results:**
```markdown
# Store research references for plan
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
]
```

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

### Step 6: Testing Strategy

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

### Step 7: Technical Decisions

**First decision is always File Organization** - Read CLAUDE.md "Repository Structure" and populate Plan §TD1 template with feature-specific paths.

Document other key decisions with rationale:

```markdown
### Decision 1: Single Mutation vs Batch for Bulk Updates

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

### Step 8: Write Plan File

```bash
# Read template
Read: templates/feature-plan.md

# Fill sections:
# - Research summary (from Step 2)
# - Architecture (from Step 3)
# - Schema changes (from Step 4)
# - API contracts (from Step 5)
# - Testing strategy (from Step 6)
# - Technical decisions (from Step 7)

# Write file
Write: docs/features/[FEAT-XXX]-plan.md
```

---

### Step 9: Present to User

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

**Testing Strategy**:
- Unit tests: Business logic, edge cases (80%+ coverage)
- Integration tests: Database operations, error handling
- E2E tests: Critical user workflows, responsive design

**File created**: docs/features/FEAT-XXX-plan.md

Does this make sense? Any changes needed?
```

**User options:**
1. Approve → Proceed to Step 3 (task generation)
2. Request changes → Iterate on plan
3. Cancel → Stop workflow

---

## Quality Checks

- ✅ All RQs researched (or existing research referenced)
- ✅ Schema changes complete (all fields, indexes)
- ✅ API contracts have TypeScript definitions
- ✅ Technical decisions have clear rationale
- ✅ Testing strategy covers unit, integration, E2E

---

**Usage**: Load this skill when running `/spec` command (Step 2: Planning)
