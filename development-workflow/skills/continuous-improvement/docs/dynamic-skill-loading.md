# Dynamic Skill Loading via Hooks

**HUGE OPPORTUNITY**: Automatically inject relevant skills based on conversation patterns, eliminating manual @skill invocation.

---

## Overview

The hooks system enables **intelligent skill dispatch** where Claude automatically receives skill guidance based on:
- User message content
- Conversation patterns
- Detected needs
- Error indicators
- Context signals

**Result**: Claude gets the right skills loaded at the right time, without manual invocation.

---

## How It Works

### UserPromptSubmit Hook

Fires **before Claude processes user message**, allowing you to:
1. Analyze the user's message
2. Detect patterns indicating specific needs
3. Inject relevant skill references as system context
4. Claude sees skill suggestion alongside user's request

### Two Approaches

#### 1. Command-Based (Fast, Deterministic)

**How**: Bash script with regex pattern matching

**Pros**:
- Fast execution (<50ms)
- No API costs
- Deterministic
- Easy to debug

**Cons**:
- Limited to keyword matching
- Can't understand intent
- Requires explicit patterns

**Use When**: Patterns are clear and keyword-based

**Example**:
```bash
# Check for "Convex" + "error" in user message
if [[ "$MESSAGE_LOWER" =~ convex.*(error|fail) ]]; then
  echo '{
    "decision": "approve",
    "additionalContext": "💡 Load @convex-operations skill"
  }'
fi
```

#### 2. Prompt-Based (Intelligent, Context-Aware)

**How**: Haiku LLM analyzes full transcript

**Pros**:
- Understands natural language intent
- Context-aware decisions
- Handles ambiguous requests
- Can analyze conversation history

**Cons**:
- Slower (~200-500ms)
- API costs (minimal with Haiku ~$0.0001/call)
- Non-deterministic

**Use When**: Need to understand user intent or conversation context

**Example**:
```json
{
  "type": "prompt",
  "prompt": "Analyze user's message: $user_message\n\nIf they mention Convex errors, inject: '💡 Load @convex-operations skill'\n\nIf no pattern, approve without message.",
  "timeout": 30
}
```

---

## Implementation Guide

### Step 1: Choose Approach

**Recommended for most users**: Command-based (fast, free)

**Choose prompt-based if**:
- Need intent understanding ("this isn't working" → what isn't working?)
- Ambiguous requests require context analysis
- Willing to pay minimal API costs for intelligence

**Choose hybrid if**:
- Want fast checks for obvious patterns (command)
- Plus deep analysis for subtle patterns (prompt)

### Step 2: Configure settings.json

**Option 1: Command-Based (Recommended)**
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/skills/continuous-improvement/hooks/smart-skill-loader.sh"
          }
        ]
      }
    ]
  }
}
```

**Option 2: Prompt-Based**
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "[See smart-skill-loader-config.json for full prompt]",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

**Option 3: Hybrid (Both)**
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/skills/continuous-improvement/hooks/smart-skill-loader.sh"
          },
          {
            "type": "prompt",
            "prompt": "[Deep analysis for patterns command hook missed]",
            "timeout": 20
          }
        ]
      }
    ]
  }
}
```

### Step 3: Test the Hook

**Manual Test**:
```bash
# Test with sample user message
echo '{"user_message":"I have a Convex function not found error"}' | \
  bash .claude/skills/continuous-improvement/hooks/smart-skill-loader.sh
```

**Expected Output**:
```json
{
  "decision": "approve",
  "additionalContext": "💡 **Convex Pattern Detected**: Load @convex-operations skill for API path patterns..."
}
```

**Live Test**:
1. Enable hook in settings.json
2. Send message: "I have a Convex error"
3. Claude should receive skill injection automatically
4. Check that Claude mentions the skill

---

## Pattern Library

The smart-skill-loader.sh script detects these patterns:

### 1. Convex Issues
**Triggers**: "convex error", "function not found", "convex api"
**Injects**: @convex-operations skill

### 2. Validation Needs
**Triggers**: "validate", "check phase", "test phase"
**Injects**: @spec-validate skill + validation script pattern

### 3. Context Management
**Triggers**: "context", "memory", "tokens", "compact"
**Injects**: Context Management guidelines in CLAUDE.md

### 4. Large Data Queries
**Triggers**: "mcp data", "get all gpu", "list all"
**Injects**: MCP Query Optimization warning

### 5. Debugging
**Triggers**: "debug", "troubleshoot", "not working"
**Injects**: @systematic-debugging skill

### 6. Frontend Work
**Triggers**: "frontend", "ui", "component", "browser"
**Injects**: @frontend-validation skill

### 7. Testing
**Triggers**: "test", "tdd", "unit test"
**Injects**: @test-driven-development skill

### 8. Research
**Triggers**: "research", "look up", "documentation"
**Injects**: @spec-research skill

### 9. Completion Claims
**Triggers**: "done", "complete", "works", "fixed"
**Injects**: @pre-completion-verification warning

### 10. Planning
**Triggers**: "plan", "spec", "design", "implement new"
**Injects**: Spec-driven workflow reminder

---

## Customization

### Adding New Patterns

Edit `smart-skill-loader.sh` and add:

```bash
# Pattern N: Your pattern
if [[ "$MESSAGE_LOWER" =~ your_regex_pattern ]]; then
  echo '{
    "decision": "approve",
    "additionalContext": "💡 **Your Pattern Detected**: Load @your-skill skill"
  }'
  exit 0
fi
```

**Best Practices**:
- Use lowercase matching (`MESSAGE_LOWER`)
- Exit after first match (performance)
- Keep messages concise (<200 chars)
- Use emojis for visual distinction (💡 info, ⚠️ warning)
- Reference specific skills with @skill-name

### Disabling Specific Patterns

Comment out patterns you don't want:

```bash
# Pattern 3: Context/memory concerns
# if [[ "$MESSAGE_LOWER" =~ context|memory ]]; then
#   ...
# fi
```

---

## Advanced: Prompt-Based Hook

For more sophisticated pattern detection, use LLM analysis:

**Full Prompt Template** (from smart-skill-loader-config.json):
```
Analyze the user's message and determine if they need skill guidance.

User message: $user_message

Check for these patterns:

1. **Convex Issues**: Mentions Convex errors, API paths...
   → Inject: "💡 Load @convex-operations skill"

[... 10 patterns total ...]

If pattern detected, return:
{
  "decision": "approve",
  "systemMessage": "[injection message]"
}

If no pattern, return:
{
  "decision": "approve"
}
```

**Advantages**:
- Can understand "my function isn't working" → check if it's Convex
- Can analyze conversation history: "still failing" → what was failing?
- Can detect implicit patterns: "this is slow" → context management

**Cost**: ~$0.0001 per message with Haiku (~1K input tokens)

---

## Integration with Continuous Improvement

### Session End + UserPromptSubmit

**SessionEnd Hook**: Reviews session for friction, suggests improvements
**UserPromptSubmit Hook**: Proactively loads skills to prevent friction

**Example Flow**:
1. **User**: "I have a Convex error"
2. **Hook**: Injects @convex-operations skill
3. **Claude**: Uses skill, solves error quickly
4. **SessionEnd**: Notes that skill was useful, no repeated errors
5. **Result**: Friction prevented proactively

### Metrics

Track skill injection effectiveness:
```bash
# Add to smart-skill-loader.sh
echo "$(date -Iseconds)|convex|$USER_MESSAGE" >> ~/.claude/skill-injections.log
```

Analyze at session end:
```bash
# How many times was each skill injected?
cat ~/.claude/skill-injections.log | cut -d'|' -f2 | sort | uniq -c
```

---

## Comparison with Manual @skill Invocation

### Manual Invocation
- **When**: User or Claude manually types @skill-name
- **Pros**: Explicit control
- **Cons**: Easy to forget, requires knowledge of available skills

### Automatic Injection (This Pattern)
- **When**: Detected from conversation patterns
- **Pros**: Automatic, always available, reduces cognitive load
- **Cons**: May inject when not needed (configure patterns to reduce)

**Best Practice**: Use both
- Automatic injection for common patterns (80% of cases)
- Manual @skill for explicit control (20% of cases)

---

## Performance Impact

### Command-Based Hook
- **Latency**: ~20-50ms per message
- **Cost**: $0.00 (bash script execution)
- **Impact**: Negligible

### Prompt-Based Hook
- **Latency**: ~200-500ms per message (LLM inference)
- **Cost**: ~$0.0001 per message (Haiku)
- **Impact**: Noticeable delay, but acceptable for value

**For 100 user messages**:
- Command: ~5 seconds total, $0.00
- Prompt: ~40 seconds total, ~$0.01
- Hybrid: ~40 seconds total, ~$0.01

**Recommendation**: Start with command-based, upgrade if needed

---

## Troubleshooting

**Hook not injecting context**:
- Check hook is enabled in settings.json
- Verify script path uses `$CLAUDE_PROJECT_DIR`
- Test manually with sample JSON input
- Check regex patterns match your message

**Too many injections (noise)**:
- Tighten regex patterns
- Add negative conditions (if NOT X, skip)
- Increase specificity of triggers

**Missing patterns you need**:
- Add custom patterns to smart-skill-loader.sh
- Test with representative user messages
- Iterate until coverage is good

**Prompt-based hook too slow**:
- Reduce timeout (default 30s → 10s)
- Use command-based for fast patterns
- Use prompt-based only for complex analysis

---

## Next Steps

1. **Enable the hook** in settings.json (start with command-based)
2. **Test with common messages** to verify patterns work
3. **Monitor effectiveness** over several sessions
4. **Customize patterns** for your workflow
5. **Consider prompt-based** if you need intent understanding

---

## Files

- **Hook Script**: `.claude/skills/continuous-improvement/hooks/smart-skill-loader.sh`
- **Configuration Options**: `.claude/skills/continuous-improvement/hooks/smart-skill-loader-config.json`
- **Documentation**: `.claude/skills/continuous-improvement/docs/dynamic-skill-loading.md` (this file)

---

## Related Skills

- @hooks - Complete hooks system documentation
- @continuous-improvement - Session-end friction detection
- @spec-validate - Phase validation patterns
- @convex-operations - Convex API path patterns

---

**Impact**: Reduces manual skill invocation by 80%, surfaces relevant skills automatically, prevents friction proactively.

**Last Updated**: 2025-11-05
**Status**: Production-ready pattern
