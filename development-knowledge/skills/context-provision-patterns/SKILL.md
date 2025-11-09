---
name: context-provision-patterns
type: knowledge
description: "[KNOWLEDGE] Context provision patterns: what information to provide to subagents, expert skill loading, and orchestration best practices"
when_to_use: When preparing context for subagent dispatch - deciding what spec/plan excerpts, expert skills, and instructions to include
version: 1.0.0
---

**Input**: Task details, feature spec/plan, available expert skills
**Output**: Context templates and provision strategies

---

## Pattern 1: Context Provision (What to Include)

**Key Principle**: Provide only relevant context. Don't overload agents with entire spec/plan.

### For tdd-executor (Sonnet - TDD Cycle)

**Context Template**:

```markdown
You are implementing task T002 from feature FEAT-XXX.

**Task**: T002: Implement pricing calculation with TDD

**Acceptance Criteria**:
- [ ] Write failing test for basic pricing calculation (RED)
- [ ] Implement minimal pricing logic (GREEN)
- [ ] Refactor for edge cases: negative inputs, zero margin (REFACTOR)
- [ ] All tests passing, TypeScript compiles with 0 errors

**Feature Context** (from spec):
Problem: Manually calculating pricing is error-prone
Solution: Auto-calculate pricing based on GPU cost + margin

**Implementation Context** (from plan):
Data model:
  PricingConfig {
    base_cost: number,     // GPU hourly cost
    margin: number,        // 0.6 = 60% margin
    input_price: number,   // Calculated
    output_price: number   // Calculated (2× input)
  }

Formula:
  input_price = base_cost * (1 + margin)
  output_price = input_price * 2

**Expert Knowledge**:
Load relevant skills: @convex-operations, @test-driven-development

**TDD Workflow**:
1. RED: Write failing test first
2. GREEN: Write minimal code to pass test
3. REFACTOR: Improve code quality
4. VERIFY: Run full test suite

**Expected Output**:
- Test file: convex/__tests__/pricing.test.ts
- Implementation: convex/mutations/calculatePricing.ts
- Completion report (status, files created, issues)
```

**What to Include**:
- ✅ Task ID and description
- ✅ Acceptance criteria (from tasks.md)
- ✅ Relevant spec excerpt (problem statement, user story)
- ✅ Relevant plan excerpt (data models, API contracts, formulas)
- ✅ Expert skills for the API/framework
- ✅ Expected output files

**What to Exclude**:
- ❌ Entire spec (too much noise)
- ❌ Entire plan (irrelevant sections)
- ❌ Other task details (only the current task)
- ❌ Unrelated expert skills

---

### For implementer (Haiku - Direct Implementation)

**Context Template**:

```markdown
You are implementing task T010 from feature FEAT-XXX.

**Task**: T010: Build PricingCard UI component

**Acceptance Criteria**:
- [ ] Component renders without errors
- [ ] Displays model name, input/output prices
- [ ] Matches design mockup (card layout, Tailwind styles)
- [ ] Responsive (mobile, tablet, desktop)

**Feature Context** (from spec):
UI Requirements: Display pricing information in card format

**Implementation Context** (from plan):
Component structure:
  PricingCard({
    modelName: string,
    inputPrice: number,
    outputPrice: number
  })

Styling: Use shadcn/ui Card component + Tailwind

**Expert Knowledge**:
Load relevant skills: @typescript-standards

**Expected Output**:
- Component file: components/PricingCard.tsx
- Brief completion report (no tests needed for presentational components)
```

**Simpler context for straightforward tasks**:
- ✅ Task description and acceptance criteria
- ✅ Component structure from plan
- ✅ Relevant expert skills
- ❌ No TDD workflow (not needed for UI)

---

## Pattern 2: Expert Skill Loading

### When to Load Expert Skills

```markdown
# Examine task description and files to modify

If task involves Convex:
  - Query/mutation/action implementation
  - Schema changes
  - Database operations
  → Load: @convex-operations, @convex-platform

If task involves TypeScript:
  - All production code
  - Type definitions
  - Strict mode compliance
  → Load: @typescript-standards

If task involves Testing:
  - Unit tests
  - Integration tests
  - TDD cycle
  → Load: @test-driven-development, @test-antipatterns

If task involves UI validation:
  - Frontend changes
  - Component testing
  - Browser validation
  → Load: @frontend-validation

# Can load multiple expert skills for complex tasks
Example: "Implement Convex mutation with full TDD cycle"
  → Load: @convex-operations, @test-driven-development, @typescript-standards
```

### How to Include Expert Skills in Context

```markdown
**Expert Knowledge**:
Load these skills for context: @convex-operations, @test-driven-development

[Agent harness automatically loads skills via @ symbol]
[No need to paste entire skill content - just reference by name]
```

**Don't include**:
- ❌ Entire skill content (agent loads it automatically)
- ❌ Unrelated skills (adds noise)
- ❌ Duplicate information already in task description

---

## Orchestration Best Practices

### 1. Minimize User Interruptions

- **Batch review points**: Review after each phase, not after each task
- **Auto-proceed when possible**: If tests pass and checkpoints pass, continue
- **Only stop for failures**: Don't ask user approval for every task

### 2. Maximize Parallelism

- **Default to parallel**: Always dispatch independent tasks in parallel
- **Only serialize when necessary**: When tasks have true dependencies
- **Group by batch, not by task**: Dispatch 5-10 tasks per batch

### 3. Fail Fast

- **Stop on TypeScript errors**: Don't continue if compilation fails
- **Stop on test failures**: Don't continue if tests fail
- **Stop on checkpoint failures**: Don't continue if integration breaks

### 4. Provide Clear Feedback

- **Progress reports**: After each batch, show completion %, time remaining
- **Error context**: When reporting errors, include task ID, error message, affected files
- **Checkpoint results**: Document what was tested, what passed/failed

### 5. Learn from Failures

- **Log failures**: Keep log of failed tasks, reasons, resolution time
- **Identify patterns**: If same error repeats, update expert skills
- **Improve tasks.md**: If tasks are unclear, update template for next feature

---

## Model Selection Guidelines

**Haiku** (fast, cost-effective):
- UI components (no complex state)
- Configuration changes
- Simple integrations
- Documentation updates
- Schema updates
- Environment variable changes

**Sonnet** (balanced, reliable):
- TDD cycles (RED→GREEN→REFACTOR)
- Complex business logic
- Algorithm implementation
- Critical functionality
- Backend mutations with validation
- Integration of multiple systems

**Opus** (powerful, expensive):
- Rarely needed for feature implementation
- Reserved for complex architectural decisions
- Use only when explicitly required

**Default Rule**: Use haiku for straightforward tasks, sonnet for TDD/complex logic

---

**Related Skills**:
- For dispatch patterns: @agent-dispatch-patterns
- For validation and error handling: @validation-patterns
