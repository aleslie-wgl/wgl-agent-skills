---
name: claude-agent-sdk
description: "[KNOWLEDGE] Quick reference for @anthropic-ai/claude-agent-sdk - Building autonomous agents with tools, OAuth auth, and context management"
when_to_use: Building agents that use tools (file I/O, Bash, web fetch). Running inside Claude Code (automatic OAuth). Multi-step agent workflows. Need automatic context management. MCP integrations.
version: 2.0.0
type: knowledge
---

# Claude Agent SDK

Quick reference for building autonomous agents with `@anthropic-ai/claude-agent-sdk`.

**Official Documentation**: https://docs.claude.com/en/api/agent-sdk/

---

## When to Use This SDK

**Use Agent SDK for**:
- Agents that use tools (Read, Write, Bash, Grep, WebFetch)
- Running inside Claude Code (automatic OAuth)
- Autonomous code generation/refactoring
- Multi-step agent workflows
- Automatic context management
- MCP integrations (Slack, GitHub, etc.)

**Use Standard SDK for**:
- Simple text generation or chat interfaces
- No tool use required
- Direct API access preferred

---

## Installation

```bash
npm install @anthropic-ai/claude-agent-sdk
```

---

## Quick Start Template

```typescript
import { query, type SDKMessage, type AgentOptions } from "@anthropic-ai/claude-agent-sdk";

async function runAgent() {
  const options: AgentOptions = {
    model: "sonnet",              // 'haiku' | 'sonnet' | 'opus'
    systemPrompt: "You are a helpful coding assistant.",
    cwd: "/path/to/project",      // Working directory
    allowedTools: ["Read", "Write", "Bash", "Grep"],
    permissionMode: "acceptEdits", // 'manual' | 'acceptEdits' | 'acceptAll'
    maxTurns: 10,                 // Prevent infinite loops
  };

  for await (const message of query({
    prompt: "Create a hello.ts file with a greeting function",
    options,
  })) {
    if (message.role === 'assistant') {
      for (const block of message.content) {
        if (block.type === 'text') {
          console.log('Agent:', block.text);
        }
      }
    }
  }
}
```

---

## Common Patterns

### Read-Only Analysis
```typescript
const options: AgentOptions = {
  model: "haiku",
  allowedTools: ["Read", "Grep", "Glob"],
  permissionMode: "acceptAll",
  maxTurns: 3,
};

for await (const message of query({
  prompt: "Analyze src/index.ts for bugs",
  options,
})) { /* ... */ }
```

### Autonomous Refactoring
```typescript
const options: AgentOptions = {
  model: "sonnet",
  allowedTools: ["Read", "Edit", "MultiEdit", "Grep"],
  permissionMode: "acceptAll",
  maxTurns: 20,
  systemPrompt: "You are an expert TypeScript refactoring specialist.",
};

for await (const message of query({
  prompt: "Refactor all files to use explicit types",
  options,
})) { /* ... */ }
```

### Research and Documentation
```typescript
const options: AgentOptions = {
  model: "sonnet",
  allowedTools: ["WebFetch", "WebSearch", "Write"],
  permissionMode: "acceptEdits",
  maxTurns: 10,
};

for await (const message of query({
  prompt: "Research Stripe API and create integration guide",
  options,
})) { /* ... */ }
```

---

## Key Options Reference

| Option | Values | Description |
|--------|--------|-------------|
| `model` | `'haiku'` \| `'sonnet'` \| `'opus'` | Model selection (haiku=fast, sonnet=balanced, opus=complex) |
| `systemPrompt` | string | Defines agent role and constraints |
| `cwd` | string | Working directory for file operations |
| `allowedTools` | string[] | Tools agent can use (Read, Write, Edit, Bash, Grep, etc.) |
| `permissionMode` | `'manual'` \| `'acceptEdits'` \| `'acceptAll'` | Auto-approve level |
| `maxTurns` | number | Max conversation turns (ALWAYS set to prevent loops) |

**Available Tools**: Read, Write, Edit, MultiEdit, Bash, Grep, Glob, WebFetch, WebSearch

---

## Best Practices

1. **Always set `maxTurns`** - Prevent infinite loops
2. **Use least privilege** - Only grant tools needed for task
3. **Clear system prompts** - Be specific about role and constraints
4. **Choose right model** - haiku for simple, sonnet for complex
5. **Set working directory** - Use absolute paths for `cwd`

---

## Authentication

### Claude Code (Automatic)
Running inside Claude Code requires no API key - authentication is automatic via OAuth.

### Standalone Scripts
Set environment variable:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

---

## Resources

- **Official Docs**: https://docs.claude.com/en/api/agent-sdk/
- **TypeScript Reference**: https://docs.claude.com/en/api/agent-sdk/typescript
- **GitHub Repository**: https://github.com/anthropics/claude-agent-sdk-typescript
- **Engineering Blog**: https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk
