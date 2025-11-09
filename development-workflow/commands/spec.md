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
2. **Parallel research** (if RQs exist):
   - Extract RQ1-RQN from spec
   - Check if research exists (Grep knowledge/*.md)
   - Dispatch all researchers in parallel:
     ```
     Task 1: spec-research → RQ1
     Task 2: spec-research → RQ2
     Task 3: spec-research → RQ3
     ```
   - Wait for all to complete (fan-in)
   - Aggregate results
3. Design architecture (system components, diagram)
4. Define database schema changes
5. Define API contracts (TypeScript)
6. Define testing strategy
7. Document technical decisions
8. Write plan file

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
   - Write acceptance criteria
   - Add file paths
3. Add integration checkpoints (every 10 tasks)
4. Group into parallel batches (dependency-ordered)
5. Detect emergent phases (from dependency patterns)
6. Calculate totals (count, estimates, critical path)
7. Write tasks file

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
