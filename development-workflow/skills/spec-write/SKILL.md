---
name: spec-write
description: "[WORKFLOW] Generate feature specification with user stories, requirements, acceptance criteria through collaborative elaboration"
when_to_use: When creating initial feature specification from natural language description (first step of spec-driven development)
version: 1.0.0
type: workflow
---

**Input**: Feature description (natural language from user) + optional context files (constitution, architecture, previous specs)
**Output**: `docs/features/[FEAT-XXX]-spec.md`

---

## Process

### Step 1: Read Context (If Exists)

```bash
# Check for context files
Glob: docs/*.md

# Read if found:
Read: docs/constitution.md     # Project values, tech stack
Read: docs/architecture.md     # System architecture
```

**What to extract from context**:
- **Tech stack**: Backend, frontend, database, APIs
- **Project values**: Quality standards, design principles
- **Architectural patterns**: Data models, API patterns
- **Existing features**: For consistency


**LOAD SKILLS FOR THE JOB**:
- Load skills based on the task at hand (Next.js patterns, shadcn/ui, Convex-operations etc...)
- examine the task and compare to your list of skills and select the best skills for the task:
  - Select up to 3 skills with [KNOWLEDGE] tags in the description field
  - Select up to 3 skills with the [META] tag in the description field
- Keep it simple (no over-engineering)
- Follow existing patterns in codebase
- YAGNI (You Aren't Gonna Need It)

---

### Step 2: Generate Feature ID

```bash
# Find existing features
Glob: docs/features/FEAT-*.md

# Extract highest number
# Example: FEAT-001-spec.md, FEAT-015-spec.md → Highest = 015

# Increment
next_id = highest + 1  # FEAT-016
```

**Naming Convention**:
- Format: `FEAT-XXX` (zero-padded 3 digits)
- Examples: `FEAT-001`, `FEAT-015`, `FEAT-123`

---

### Step 3: Clarify User Intent (If Vague)

**If description is clear** (e.g., "Build admin pricing interface with bulk updates"):
- Proceed directly to elaboration

**If description is vague** (e.g., "Add pricing feature"):
- Ask clarifying questions:

```markdown
I need more details about the pricing feature:

1. **Who uses this feature**?
   - Admins only, or end users too?
   - What permissions/roles are required?

2. **What pricing functionality**?
   - Display existing pricing?
   - Calculate new pricing?
   - Edit pricing manually or auto-calculate?
   - Bulk update multiple models at once?

3. **What data sources**?
   - HuggingFace API for model metadata?
   - Manual input by admin?
   - Third-party pricing APIs?

4. **What's the output**?
   - Display in UI table?
   - Export to CSV?
   - API endpoint for programmatic access?
```

**Wait for user response before proceeding.**

---

### Step 4: Elaborate User Stories

**Given**: Clear feature description (from user or after clarification)

**Generate**: 3-10 user stories with acceptance criteria

#### User Story Template

```markdown
### US-X: [User Story Title]

**As a** [persona]
**I want** [capability]
**So that** [benefit]

**Acceptance Criteria**:
- [ ] AC1: [Testable criterion - user-visible behavior]
- [ ] AC2: [Testable criterion - user-visible behavior]
- [ ] AC3: [Testable criterion - user-visible behavior]

**Priority**: High | Medium | Low
```

#### Guidelines for Good User Stories

**DO**:
- ✅ Focus on user-visible behavior (not implementation)
- ✅ Make acceptance criteria testable (specific actions + expected results)
- ✅ Write from user's perspective ("I want..." not "System should...")
- ✅ Keep stories independent (each delivers value alone)
- ✅ Prioritize stories (High = MVP, Medium = Nice-to-have, Low = Future)

**DON'T**:
- ❌ Describe technical implementation ("Create a React component...")
- ❌ Make acceptance criteria vague ("Works correctly")
- ❌ Write 20+ user stories (too granular, should be 3-10)
- ❌ Duplicate acceptance criteria across multiple stories

#### Example (Good User Story)

```markdown
### US-1: Admin Updates Model Pricing

**As an** admin
**I want** to update pricing for AI models
**So that** I can keep pricing accurate as GPU costs change

**Acceptance Criteria**:
- [ ] AC1: Navigate to /admin/pricing and see list of all models
- [ ] AC2: Click "Edit" on a model and see current input/output prices
- [ ] AC3: Update prices and click "Save"
- [ ] AC4: See success message and updated prices in table
- [ ] AC5: Verify prices persist after page refresh

**Priority**: High
```

---

### Step 5: Document Requirements

#### Functional Requirements (FR)

**What are functional requirements?**
- Features the system must have
- Actions the system must perform
- Data the system must store/process

**Format**:
```markdown
- **FR1**: System must store pricing for each model (input price, output price, margin)
- **FR2**: System must calculate pricing using formula: input_price = base_cost * (1 + margin)
- **FR3**: System must validate prices are positive numbers
- **FR4**: System must support bulk updates (select multiple models, update all at once)
```

**Guidelines**:
- ✅ Each requirement should be independent
- ✅ Requirements should be testable
- ❌ Don't duplicate user stories (FRs describe WHAT, user stories describe WHY)

---

#### Non-Functional Requirements (NFR)

**Categories**:
1. **Performance**: Response times, throughput
2. **Security**: Authentication, authorization, data protection
3. **Usability**: UI/UX, accessibility, responsiveness
4. **Scalability**: Concurrent users, data volume
5. **Reliability**: Uptime, error handling

**Format**:
```markdown
- **NFR1 (Performance)**: API response time <200ms p95 for pricing updates
- **NFR2 (Security)**: Only admins can update pricing (check auth role)
- **NFR3 (Usability)**: UI is responsive (mobile, tablet, desktop)
- **NFR4 (Scalability)**: Support 10K+ models without pagination slowdown
- **NFR5 (Reliability)**: Validation errors show clear messages (not generic "Error occurred")
```

**Guidelines**:
- ✅ Make NFRs measurable (200ms, not "fast")
- ✅ Include category label (Performance, Security, etc.)
- ❌ Don't write NFRs that can't be tested

---

#### Constraints

**Types**:
1. **Technical**: Must use specific tech stack, APIs
2. **Business**: Budget, timeline, compliance
3. **Design**: Must follow existing design system

**Format**:
```markdown
- **Technical**: Must use Convex backend (no other database)
- **Technical**: Must integrate with HuggingFace API for model metadata
- **Business**: Launch by Q2 2025
- **Business**: Budget for API calls <$100/month
- **Design**: Follow existing admin dashboard design (no custom layouts)
```

---

### Step 6: Identify Research Needs

**Purpose**: Flag open questions that will be researched during planning phase

**Format**:
```markdown
## Open Questions (Research Needed)

These questions will be researched during the planning phase:

- **RQ1**: What are HuggingFace API rate limits for model metadata?
- **RQ2**: How to calculate GPU VRAM requirements for different model sizes?
- **RQ3**: Convex search performance at 10K+ records (need pagination)?
- **RQ4**: Best practice for bulk updates in Convex (single mutation or batch)?
```

**When to create RQs**:
- ✅ Unknown API limits or performance characteristics
- ✅ Unclear best practices for specific tech stack
- ✅ Need to choose between multiple technical approaches
- ✅ External service integration not yet validated

**When NOT to create RQs**:
- ❌ Questions that can be answered from existing docs
- ❌ Simple implementation details (let planner decide)
- ❌ Questions not relevant to this feature

---

### Step 7: Write Specification File

**Use template**: `templates/feature-spec.md`

```bash
# Read template
Read: templates/feature-spec.md

# Fill in all sections
# Replace placeholders with actual content

# Write file
Write: docs/features/[FEAT-XXX]-spec.md
```

**Template Sections to Fill**:
1. **Header**: Feature ID, status, dates
2. **Problem Statement**: Who, what, why, impact
3. **Proposed Solution**: High-level description, key capabilities, out of scope
4. **User Stories**: US-1 through US-N (3-10 stories)
5. **Requirements**: FR1-FRN, NFR1-NFRN, constraints
6. **Open Questions**: RQ1-RQN
7. **Dependencies**: Other features, blocks, related
8. **Success Metrics**: How we'll measure success
9. **Notes**: Additional context

---

### Step 8: Present to User for Review

**Show**:
- Feature ID assigned
- Number of user stories generated
- Summary of requirements
- Open questions identified

**Example presentation**:

```markdown
I've created specification **FEAT-XXX** for the admin pricing feature:

**User Stories** (5):
- US-1: Admin updates model pricing (High priority)
- US-2: Admin performs bulk pricing updates (High priority)
- US-3: Admin views pricing history (Medium priority)
- US-4: Admin exports pricing to CSV (Low priority)
- US-5: System auto-calculates pricing from GPU costs (High priority)

**Requirements**:
- 8 functional requirements (pricing calculation, validation, bulk updates)
- 5 non-functional requirements (performance <200ms, admin-only access, responsive UI)

**Open Questions** (4 research questions):
- RQ1: HuggingFace API rate limits
- RQ2: GPU VRAM calculation formulas
- RQ3: Convex search performance at scale
- RQ4: Bulk update best practices

**File created**: docs/features/FEAT-XXX-spec.md

Is this accurate? Any changes needed?
```

**User options**:
1. **Approve** → Proceed to Step 2 of `/spec` command (planning)
2. **Request changes** → Iterate on spec (modify user stories, requirements, etc.)
3. **Cancel** → Stop workflow

**If user requests changes**:
- Read current spec file
- Make requested edits
- Re-present for approval
- Repeat until approved

---

## Quality Checks

Before presenting to user, verify:

- ✅ **Feature ID is unique** (not already used)
- ✅ **User stories have 2-5 acceptance criteria each**
- ✅ **Acceptance criteria are testable** (specific actions + expected results)
- ✅ **Requirements don't duplicate user stories** (different level of detail)
- ✅ **NFRs are measurable** (numbers, not adjectives like "fast")
- ✅ **Open questions are clear** (not vague "research pricing")
- ✅ **File uses template structure** (all sections present)
- ✅ **No placeholder text left** ([brackets] should be filled in)

---

## Examples

### Example 1: Admin Pricing Feature

**Input**: "Build admin pricing interface with bulk updates"

**Output** (docs/features/FEAT-XXX-spec.md):

```markdown
# Feature Specification: Admin Pricing Management

**Feature ID**: FEAT-XXX
**Status**: Approved
**Created**: 2025-01-15
**Last Updated**: 2025-01-15

---

## Problem Statement

Currently, admins must manually calculate pricing for AI models, which is error-prone and time-consuming. When GPU costs change, updating 500+ models requires individual edits.

**Who**: Admin users managing AI model catalog
**What**: Update pricing for models efficiently
**Why**: Manual pricing leads to errors (5% of models have incorrect pricing)
**Impact**: 90% reduction in pricing update time, zero pricing errors

---

## Proposed Solution

Create an admin interface for pricing management with:
- Bulk update capabilities (select multiple models, update all at once)
- Auto-calculation from GPU costs + margin
- Pricing history tracking
- CSV export for reporting

**Key capabilities**:
- Update pricing for individual models
- Bulk update pricing for multiple models
- Auto-calculate pricing from base costs
- View pricing history
- Export pricing data

**Out of scope**:
- Public pricing API (admin-only feature)
- Integration with accounting systems (future enhancement)
- Real-time GPU cost monitoring (use static costs for now)

---

## User Stories

### US-1: Admin Updates Model Pricing

**As an** admin
**I want** to update pricing for AI models
**So that** I can keep pricing accurate as GPU costs change

**Acceptance Criteria**:
- [ ] AC1: Navigate to /admin/pricing and see list of all models
- [ ] AC2: Click "Edit" on a model and see current input/output prices
- [ ] AC3: Update prices and click "Save"
- [ ] AC4: See success message and updated prices in table
- [ ] AC5: Verify prices persist after page refresh

**Priority**: High

---

### US-2: Admin Performs Bulk Pricing Updates

**As an** admin
**I want** to select multiple models and update pricing at once
**So that** I can efficiently update 500+ models when GPU costs change

**Acceptance Criteria**:
- [ ] AC1: Select multiple models using checkboxes
- [ ] AC2: Click "Bulk Update" and see pricing form
- [ ] AC3: Enter new margin (e.g., 60%)
- [ ] AC4: Click "Apply to All" and see confirmation dialog
- [ ] AC5: Confirm and see success message with count updated

**Priority**: High

---

[... US-3 through US-5 ...]

---

## Requirements

### Functional Requirements

- **FR1**: System must store pricing for each model (input price, output price, margin, base cost)
- **FR2**: System must calculate pricing using formula: input_price = base_cost * (1 + margin)
- **FR3**: System must validate prices are positive numbers
- **FR4**: System must support bulk updates (select multiple models, update all at once)
- **FR5**: System must track pricing history (timestamp, old value, new value, admin who changed)
- **FR6**: System must export pricing to CSV format
- **FR7**: System must prevent non-admins from accessing pricing interface
- **FR8**: System must show clear validation errors (not generic "Error occurred")

### Non-Functional Requirements

- **NFR1 (Performance)**: API response time <200ms p95 for pricing updates
- **NFR2 (Performance)**: Bulk update of 500 models completes in <5 seconds
- **NFR3 (Security)**: Only admins can update pricing (check auth role)
- **NFR4 (Security)**: Pricing history cannot be deleted (audit trail)
- **NFR5 (Usability)**: UI is responsive (mobile, tablet, desktop)

### Constraints

- **Technical**: Must use Convex backend (no other database)
- **Technical**: Must integrate with HuggingFace API for model metadata
- **Business**: Launch by Q2 2025
- **Design**: Follow existing admin dashboard design

---

## Open Questions (Research Needed)

- **RQ1**: What are HuggingFace API rate limits for model metadata?
- **RQ2**: How to calculate GPU VRAM requirements for different model sizes?
- **RQ3**: Convex search performance at 10K+ records (need pagination)?
- **RQ4**: Best practice for bulk updates in Convex (single mutation or batch)?

---

## Dependencies

- **Depends on**: FEAT-XXX (Authentication) - Admin role must be defined
- **Blocks**: FEAT-YYY (Public Pricing API) - Public API will use this pricing data
- **Related to**: FEAT-ZZZ (Model Discovery) - Uses same model database

---

## Success Metrics

- Metric 1: 90% reduction in time to update 500+ models (from 8 hours to <1 hour)
- Metric 2: Zero pricing calculation errors in production
- Metric 3: 100% admin adoption (replace manual pricing spreadsheet)

---

## Notes

- Design mockups: [link to Figma]
- Previous discussion: [link to Slack thread]
- Inspiration: Similar bulk update feature in Stripe dashboard
```

---

### Example 2: Email Notifications Feature

**Input**: "Add email notifications for pricing changes"

**Clarification Questions**:
```markdown
I need more details about email notifications:

1. **Who receives notifications**?
   - All admins?
   - Only admins who made the change?
   - End users who use the affected models?

2. **When are notifications sent**?
   - Immediately after pricing update?
   - Daily digest of all changes?
   - Only for changes exceeding X% threshold?

3. **What information is included**?
   - Just model name and new price?
   - Old vs. new price comparison?
   - Link to pricing history?

4. **Email service**?
   - Use existing email service (which one)?
   - Or set up new service (e.g., SendGrid, Resend)?
```

**After user clarifies → Generate spec following same process**

---

## Tips for Success

1. **Start with "Why"**: Always understand the problem before jumping to solution
2. **Ask questions**: If unclear, ask user for clarification (don't guess)
3. **Be specific**: Vague acceptance criteria ("works correctly") are not testable
4. **Stay high-level**: Spec describes WHAT, not HOW (implementation details go in plan)
5. **Think like a user**: Write user stories from user's perspective, not developer's

---

**Lines**: ~200 (process + examples + guidelines)

**Usage**: Load this skill when running `/spec` command (Step 1: Specification generation)
