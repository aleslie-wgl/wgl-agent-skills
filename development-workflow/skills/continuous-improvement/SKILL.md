---
name: continuous-improvement
description: "[WORKFLOW] Systematic self-improvement loop - detect friction, create tools, verify improvements, document for reuse. Transforms every task into an opportunity to eliminate administrative burden."
when_to_use: After completing any task, before marking work complete, when encountering repetitive manual steps
version: 1.0.0
type: workflow
---

**Input**: Completed task, friction points encountered during execution
**Output**: New tools/docs/automation created, verified working, documented for future use

---

## Philosophy

Every task has two deliverables:
1. **The immediate goal** - What the user asked for
2. **The improvement** - Tools to make similar tasks easier next time

**Before marking any task complete, ask:**
- What manual steps did I perform?
- Could I have used a tool instead?
- Did I repeat something that should be automated?
- What will the next agent need to avoid repeating my work?

---

## The Improvement Loop

```
Task → Detect Friction → Create Tool → Verify → Document → Next Task
                ↑                                              ↓
                └──────────────────────────────────────────────┘
```

### 1. Detect Friction

While working, notice:
- **Repetitive commands**: Same bash commands run 3+ times
- **Manual research**: Looking up syntax, searching docs
- **Error recovery**: Fixing the same type of error repeatedly
- **Missing tools**: "I wish I had a script for this"
- **Knowledge gaps**: Assumptions that turned out wrong

### 2. Create Tool/Doc/Automation

Based on friction type:

| Friction Type | Solution | Example from This Session |
|---------------|----------|---------------------------|
| Page crashes, unclear why | Debug script | `scripts/debug-page-load.ts` |
| Missing knowledge | Research actual docs | Hooks skill update |
| Repeated pattern | Reusable skill | `frontend-debugging` skill |
| Process waste | Guidelines | Background process management in CLAUDE.md |
| Manual verification | Programmatic check | Playwright browser automation |

### 3. Verify It Works

**Don't create and forget** - Prove the improvement actually helps:
- Run the script you created
- Test the tool with real inputs
- Verify documentation is accurate
- Check the skill loads correctly

### 4. Document for Future Use

**Make it discoverable**:
- Add to CLAUDE.md if it's a general principle
- Create skill if it's a reusable workflow
- Update commands to reference new tools
- Add examples showing actual usage

---

## Friction Detection Patterns

### Pattern 1: Repeated Bash Commands

**Symptom**: Running same command 3+ times with minor variations

**Example**:
```bash
# Run 1
npx tsx scripts/debug-page-load.ts

# Run 2 (changed timeout)
npx tsx scripts/debug-page-load.ts

# Run 3 (changed URL)
npx tsx scripts/debug-page-load.ts

# Run 4 (added flags)
npx tsx scripts/debug-page-load.ts
```

**Improvement**: Parameterize the script
```typescript
// Accept CLI args
const url = process.argv[2] || 'http://localhost:3000';
const timeout = parseInt(process.argv[3] || '10000');
```

### Pattern 2: Knowledge Assumption Failures

**Symptom**: Making decisions based on outdated/assumed knowledge instead of current facts

**Example**:
- Assuming hooks work a certain way (wrong)
- Not checking if new features exist (missed prompt-based hooks)
- Guessing at API syntax (should read actual docs)

**Improvement**: Research-first protocol
1. Check current documentation (web search if needed)
2. Read actual implementation examples
3. Verify with latest release notes
4. Update skills with findings

### Pattern 3: Manual Error Diagnosis

**Symptom**: Reading component source code to figure out why page crashed

**Example**:
- E2E tests fail → Read React components → Guess at error
- **Better**: Write Playwright script → Capture browser console → See actual error

**Improvement**: Programmatic debugging
- Create debug script
- Capture runtime behavior
- Screenshot actual state
- Fix based on real errors, not guesses

### Pattern 4: Process Inefficiency

**Symptom**: Creating unnecessary background processes, duplicate work

**Example**:
- Running same debug script 5 times in background
- Not checking if process already exists
- Not cleaning up completed processes

**Improvement**: Process management guidelines
- Document when to use background vs sync
- Add checks before starting new processes
- Create cleanup procedures

### Pattern 5: Missing Validation Loop

**Symptom**: Claiming something works without actually testing it

**Example**:
- TypeScript compiles → Assume page works (wrong)
- Tests pass → Assume feature complete (incomplete)
- Code looks right → Claim success (untested)

**Improvement**: Verification protocol
- Always run the actual test
- Open browser programmatically
- Screenshot the result
- Verify every acceptance criterion

---

## Tool Creation Workflows

### Workflow 1: Debugging Script

**When**: Tests fail, pages crash, unclear errors

**Steps**:
1. Create `scripts/debug-[issue].ts`
2. Use Playwright to capture browser state
3. Log console errors, pending requests, page errors
4. Take viewport screenshot (NEVER fullPage - 8000px limit)
5. Run it, fix the issue
6. Document in skill for future use

**Template**:
```typescript
import { chromium } from '@playwright/test';

async function debug() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Capture errors
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(process.env.URL || 'http://localhost:3000');
    await page.screenshot({ path: 'debug.png' }); // Viewport only
    console.log('Errors:', errors);
  } finally {
    await browser.close();
  }
}

debug();
```

### Workflow 2: Skill Documentation

**When**: Discover reusable pattern, workflow, or knowledge

**Steps**:
1. Create `.claude/skills/[skill-name]/SKILL.md`
2. Document: when to use, how it works, examples
3. Add frontmatter: name, description, when_to_use
4. Include real examples from actual work
5. Test that skill loads correctly

**Template**:
```markdown
---
name: skill-name
description: One-line description of what this enables
when_to_use: Specific scenarios when this applies
version: 1.0.0
---

**Input**: What agent receives
**Output**: What agent produces

## Overview
[Why this matters]

## Process
[Step-by-step workflow]

## Examples
[Real examples from actual sessions]
```

### Workflow 3: Process Guidelines

**When**: Discover inefficiency, waste, or anti-pattern

**Steps**:
1. Document the problem in CLAUDE.md
2. Show wrong vs right approach
3. Explain why it matters (time/cost/resources)
4. Add to relevant section (e.g., Background Process Management)

**Template**:
```markdown
### [Process Name]

**CRITICAL**: [Why this matters]

#### Rules
1. [Rule with rationale]
2. [Rule with rationale]

#### Example

**❌ WRONG**:
[Bad example with explanation]

**✅ CORRECT**:
[Good example with explanation]
```

### Workflow 4: Hook Implementation

**When**: Need event-driven automation for common patterns

**Steps**:
1. Identify the trigger event (UserPromptSubmit, PreToolUse, etc.)
2. Write bash script or use prompt-based hook
3. Test with sample JSON input
4. Add to `.claude/settings.json`
5. Verify it fires correctly

**Example**: Continuous improvement reminder
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "text",
            "text": "🔄 IMPROVEMENT CHECK: After completing this task, consider what friction you encountered and what tool/doc/automation could eliminate it for future work."
          }
        ]
      }
    ]
  }
}
```

---

## Verification Protocols

### For Scripts

```bash
# 1. Run with test data
npx tsx scripts/new-script.ts --test

# 2. Verify output format
npx tsx scripts/new-script.ts | jq .

# 3. Test error handling
npx tsx scripts/new-script.ts --invalid-input

# 4. Check performance
time npx tsx scripts/new-script.ts
```

### For Skills

```bash
# 1. Verify markdown syntax
Skill: skill-name  # Should load without error

# 2. Check examples are valid
# Copy example code, run it

# 3. Verify frontmatter
# name, description, when_to_use, version all present

# 4. Test with real scenario
# Use skill for actual task it describes
```

### For Guidelines

```bash
# 1. Follow the guideline yourself
# Does it actually work?

# 2. Check it prevents the problem
# Does following it avoid the issue?

# 3. Verify examples are accurate
# Can you copy-paste and run them?

# 4. Update based on feedback
# Did following it cause different issues?
```

---

## Documentation Standards

### Skill Documentation

**Must Have**:
- ✅ Frontmatter with name, description, when_to_use, version
- ✅ Input/output format clearly stated
- ✅ Real examples from actual work (not hypothetical)
- ✅ Step-by-step process
- ✅ Tools used section
- ✅ Common mistakes section

**Good Example** (from this session):
- `frontend-debugging` skill
- Real problem: E2E tests failing
- Real solution: Playwright debug script
- Actual code used in production
- Screenshots showing it working
- 8000px limit warning (learned from near-miss)

### CLAUDE.md Updates

**Must Have**:
- ✅ Section title clearly describes topic
- ✅ "CRITICAL" or "⚠️" for important warnings
- ✅ Wrong vs right examples
- ✅ Explanation of why it matters
- ✅ Real consequences stated

**Good Example** (from this session):
- Background Process Management section
- Shows wrong pattern (5 background scripts)
- Shows right pattern (sync execution)
- Explains resource waste
- Provides decision criteria

### Command Updates

**Must Have**:
- ✅ Reference to relevant skill
- ✅ When to use it in workflow
- ✅ Output expected from skill
- ✅ Next steps after skill completes

**Template**:
```markdown
## Step N: [Stage Name]

[Normal workflow step]

**If [condition], invoke [skill-name] skill**:
- [What skill does]
- [What agent gets back]
- [Next action based on result]
```

---

## Integration Points

### With Commands

Commands should reference improvement at end of workflow:

```markdown
## After Implementation

1. ✅ Run tests and verify functionality
2. ✅ Update documentation
3. 🔄 **Invoke continuous-improvement skill**:
   - What friction did you encounter?
   - What tools would eliminate that friction?
   - Create them now, verify they work
   - Document for future use
```

### With Validation

Validation should check for improvements:

```markdown
### Validation Checklist

- [ ] Feature works as specified
- [ ] Tests passing
- [ ] Documentation updated
- [ ] **Improvements created**:
  - [ ] New tools for friction encountered
  - [ ] Skills updated with new patterns
  - [ ] Guidelines added for process issues
  - [ ] Hooks created for automation
```

### With Hooks

Hooks should remind about improvement:

```json
{
  "hooks": {
    "SubagentStop": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Review the completed task. Did the agent create any reusable tools, scripts, or documentation? If not, suggest what could be created based on the work done."
          }
        ]
      }
    ]
  }
}
```

---

## Real Examples from This Session

### Example 1: Frontend Debugging

**Friction**: E2E tests failing, unclear why, was reading React components instead of using browser

**Tool Created**: `scripts/debug-page-load.ts` + `frontend-debugging` skill

**Verification**: Ran script, got screenshot showing page actually renders, fixed issue

**Documentation**: Complete skill with:
- When to use (tests timeout)
- How it works (Playwright automation)
- Warning about 8000px screenshot limit
- Integration with validation workflow

**Result**: Next time tests fail, agent has immediate pattern to follow

### Example 2: Background Process Management

**Friction**: Created 5+ background processes for same debug script, wasted resources

**Tool Created**: Guidelines in CLAUDE.md

**Verification**: User had to manually kill all processes

**Documentation**: Section showing wrong vs right approach with decision criteria

**Result**: Future agents know when to use background vs sync execution

### Example 3: Hooks Knowledge

**Friction**: Making assumptions about hooks instead of researching current state

**Tool Created**: Dispatched research agent to update hooks skill

**Verification**: Agent found 4 new features, updated skill with 466 new lines

**Documentation**: Complete skill with latest API, real examples, migration guide

**Result**: Accurate knowledge of hooks capabilities, no more guessing

### Example 4: Process Improvement Detection

**Friction**: Not systematically thinking about improvements after tasks

**Tool Created**: This skill (continuous-improvement)

**Verification**: Creating it right now, will add to commands and CLAUDE.md

**Documentation**: Complete workflow for detecting friction and creating tools

**Result**: Improvement becomes systematic, not occasional

---

## Metrics for Success

Good improvement loop creates:
- **Reusable tools**: Scripts used 3+ times
- **Accurate docs**: No corrections needed after first use
- **Time savings**: Next task takes <50% of original time
- **Knowledge growth**: Skills library grows with real patterns
- **Process efficiency**: Less rework, fewer assumptions

Bad improvement loop creates:
- **One-off scripts**: Never used again
- **Outdated docs**: Immediately contradicted by reality
- **False confidence**: "Should work" without testing
- **Assumption debt**: Decisions based on outdated knowledge
- **Process waste**: Repeating same mistakes

---

## Remember

**The improvement mantra**:
> Every task is an opportunity.
>
> The immediate goal is what you deliver.
>
> The improvement is how you reduce my administrative burden.
>
> Create tools, not just solutions.

**Before marking any task complete**:
1. What friction did I encounter?
2. What tool/doc/automation eliminates it?
3. Does it actually work? (verify)
4. Will others find it? (document)
5. Is it systematic? (integrate with workflow)

If you skip improvement, you're only doing half the job.
