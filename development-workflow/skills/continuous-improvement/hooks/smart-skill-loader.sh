#!/bin/bash
# Smart Skill Loader - Dynamic skill injection based on conversation patterns
#
# Purpose: Analyze user messages and inject relevant skills/reminders automatically
# Event: UserPromptSubmit
# Type: Command hook with pattern matching

INPUT=$(cat)
USER_MESSAGE=$(echo "$INPUT" | jq -r '.user_message // empty')

# Exit if no user message
if [[ -z "$USER_MESSAGE" ]]; then
  echo '{"decision": "approve"}'
  exit 0
fi

# Convert to lowercase for case-insensitive matching
MESSAGE_LOWER=$(echo "$USER_MESSAGE" | tr '[:upper:]' '[:lower:]')

# Pattern 1: Convex-related errors or questions
if [[ "$MESSAGE_LOWER" =~ convex.*(error|fail|function.*not.*found|api|mutation|query) ]]; then
  echo '{
    "decision": "approve",
    "additionalContext": "💡 **Convex Pattern Detected**: Load @convex-operations skill for API path patterns, double-name structure, and common error fixes."
  }'
  exit 0
fi

# Pattern 2: Validation requests
if [[ "$MESSAGE_LOWER" =~ validat|check.*phase|test.*phase|verify.*complete ]]; then
  echo '{
    "decision": "approve",
    "additionalContext": "💡 **Validation Pattern Detected**: Consider using validation script pattern from @spec-validate skill. Template at .claude/skills/spec-validate/tools/validate-phase-template.ts saves 20K tokens vs direct MCP queries."
  }'
  exit 0
fi

# Pattern 3: Context/memory concerns
if [[ "$MESSAGE_LOWER" =~ context|memory|token|compact|running.*out ]]; then
  echo '{
    "decision": "approve",
    "additionalContext": "💡 **Context Management Detected**: Review Context Management guidelines in CLAUDE.md (lines 185-257). Context > 70%? Use validation scripts instead of direct MCP queries."
  }'
  exit 0
fi

# Pattern 4: MCP data queries
if [[ "$MESSAGE_LOWER" =~ mcp.*data|get.*all.*gpu|list.*all|query.*database ]]; then
  echo '{
    "decision": "approve",
    "additionalContext": "⚠️ **MCP Query Warning**: Direct mcp__convex__data queries can return 25K+ tokens. Consider creating a filtering script instead (see CLAUDE.md MCP Query Optimization, lines 102-182)."
  }'
  exit 0
fi

# Pattern 5: Debugging/troubleshooting
if [[ "$MESSAGE_LOWER" =~ debug|troubleshoot|why.*fail|investigate.*error|not.*working ]]; then
  echo '{
    "decision": "approve",
    "additionalContext": "💡 **Debugging Pattern Detected**: Use @systematic-debugging skill for structured root cause analysis. Also check @frontend-debugging for UI issues."
  }'
  exit 0
fi

# Pattern 6: Frontend/UI work
if [[ "$MESSAGE_LOWER" =~ frontend|ui|component|page.*load|browser|playwright ]]; then
  echo '{
    "decision": "approve",
    "additionalContext": "💡 **Frontend Pattern Detected**: Use @frontend-validation skill for proactive testing. Always validate in browser before claiming completion."
  }'
  exit 0
fi

# Pattern 7: Testing reminders
if [[ "$MESSAGE_LOWER" =~ test|tdd|unit.*test|integration.*test ]]; then
  echo '{
    "decision": "approve",
    "additionalContext": "💡 **Testing Pattern Detected**: Use @test-driven-development skill. Remember: Test FIRST (RED), then implement (GREEN), then refactor."
  }'
  exit 0
fi

# Pattern 8: Research requests
if [[ "$MESSAGE_LOWER" =~ research|look.*up|find.*documentation|how.*does.*work|learn.*about ]]; then
  echo '{
    "decision": "approve",
    "additionalContext": "💡 **Research Pattern Detected**: Use @spec-research skill for parallelizable research with Context7/Perplexity. Results stored in knowledge/ directory."
  }'
  exit 0
fi

# Pattern 9: Completion claims (testing enforcement)
if [[ "$MESSAGE_LOWER" =~ done|complete|finish|ready|works?|fixed|should.*work ]]; then
  echo '{
    "decision": "approve",
    "additionalContext": "⚠️ **Completion Claim Detected**: Use @pre-completion-verification skill. NEVER claim something works without ACTUAL VERIFICATION (run tests, check browser, inspect output)."
  }'
  exit 0
fi

# Pattern 10: Planning/spec requests
if [[ "$MESSAGE_LOWER" =~ plan|spec|design|architect|feature.*request|implement.*new ]]; then
  echo '{
    "decision": "approve",
    "additionalContext": "💡 **Planning Pattern Detected**: Use spec-driven workflow: /spec (generate specification) → review → /implement (execute with parallel agents)."
  }'
  exit 0
fi

# No pattern matched - approve without context
echo '{"decision": "approve"}'
exit 0
