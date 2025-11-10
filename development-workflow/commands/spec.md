# /spec Command

**Purpose**: Generate specification → plan → tasks for ONE feature (with user review between steps)

**Usage**: `/spec <feature-description>`

**Example**: `/spec Build admin pricing interface with bulk updates`

---

## Workflow

### Step 1: Generate Specification

**Load skill**: spec-write

**Input**: Feature description from user

**Process**:
1. Read context files (if exist):
   - docs/constitution.md
   - docs/architecture.md
2. Generate feature ID (FEAT-XXX)
3. Clarify if description vague
4. Elaborate user stories (3-10)
5. Document requirements (FR, NFR, constraints)
6. Identify research needs (RQ1-RQN)
7. Write specification file

**Output**: docs/features/[FEAT-XXX]-spec.md

**STOP for user review**:
- Present specification summary
- Ask: "Is this accurate? Any changes?"
- If approved → Proceed to Step 2
- If changes needed → Iterate on spec

---

### Step 2: Create Implementation Plan

**Load skill**: spec-plan

**Input**: Approved specification from Step 1

**Process**:
1. Read specification
2. **Parallel research + analysis**:
   - Extract RQ1-RQN from spec (if exist)
   - Check if research exists (Grep knowledge/*.md)
   - Determine if analyzer needed (3+ user stories, integration needs)
   - Dispatch researchers + analyzer in parallel:
     ```
     Task 1: researcher (haiku) → RQ1
     Task 2: researcher (haiku) → RQ2
     Task 3: analyzer (haiku) → Search codebase for patterns (conditional)
     ```
   - Wait for all to complete (fan-in)
   - Aggregate research findings + pattern analysis
3. Design architecture (system components, diagram)
4. Define database schema changes
5. Define API contracts (TypeScript)
6. Document existing patterns to follow (from analyzer)
7. Add data flow diagrams
8. Define testing strategy
9. Document technical decisions (TD1 includes integration points)
10. Write plan file

**Output**: docs/features/[FEAT-XXX]-plan.md

**STOP for user review**:
- Present plan summary
- Highlight technical decisions
- Reference research documents
- Ask: "Does this make sense? Any changes?"
- If approved → Proceed to Step 3
- If changes needed → Iterate on plan

---

### Step 3: Generate Tasks

**Load skill**: spec-tasks

**Input**: Approved plan from Step 2

**Process**:
1. Read implementation plan
2. Generate TDD-aware tasks:
   - Classify task type (TDD vs. direct)
   - Assign agent (tdd-executor vs. implementer)
   - Define dependencies (minimal for parallelism)
   - Write acceptance criteria with file paths (per Plan §TD1)
3. Add cross-references:
   - Implements (links to user stories)
   - Plan References (links to plan sections)
   - Knowledge Prerequisites (skills and research)
   - Related Tasks (shared context)
4. Optimize for parallelism (minimize dependencies)
5. Enforce phase sizing (max 15 tasks per phase)
6. Group into parallel batches (dependency-ordered)
7. Detect emergent phases (from dependency patterns)
8. Calculate totals (count, critical path)
9. Write tasks file

**Output**: docs/features/[FEAT-XXX]-tasks.md

**Present final output**:
- Show task breakdown
- Show batches (execution order)
- Show emergent phases
- Show critical path
- Inform user: "Ready for `/execute-feature [FEAT-XXX]`"

---

## Success Criteria

- ✅ Specification has 3-10 user stories with acceptance criteria
- ✅ Plan addresses all RQs (research completed)
- ✅ Tasks are dependency-ordered (30-100 tasks)
- ✅ TDD tasks are single-cycle (not split)
- ✅ Integration checkpoints every 10 tasks
- ✅ User approves spec and plan before task generation

---

## Output Files

After completion:
- docs/features/[FEAT-XXX]-spec.md
- docs/features/[FEAT-XXX]-plan.md
- docs/features/[FEAT-XXX]-tasks.md
- knowledge/[topic]-YYYY-MM-DD.md (if RQs existed)

**Next Step**: Run `/execute-feature [FEAT-XXX]` to execute tasks
