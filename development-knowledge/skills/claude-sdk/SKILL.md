---
name: claude-sdk
description: "[KNOWLEDGE] Quick reference for @anthropic-ai/sdk - Text generation, streaming, tool calling, and vision with Claude API"
when_to_use: Implementing Claude API calls for text generation, streaming responses, tool/function calling, vision (images/PDFs), or replacing OpenAI API calls with Claude equivalents
version: 2.0.0
type: knowledge
---

# Claude SDK (Standard)

Quick reference for `@anthropic-ai/sdk` - Direct Claude API access for text generation, streaming, tools, and vision.

**Official Documentation**: https://docs.anthropic.com/

**For autonomous agents with tools**: See `claude-agent-sdk` skill instead.

---

## When to Use This SDK

**Use Standard SDK for**:
- Chat interfaces and text generation
- Streaming responses
- Tool/function calling
- Image or PDF analysis
- Replacing OpenAI API calls

**Use Agent SDK for**:
- Agents with file operations (Read, Write, Bash)
- Autonomous code generation/refactoring
- Running inside Claude Code

---

## Installation

```bash
npm install @anthropic-ai/sdk
```

---

## Quick Start Template

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  system: 'You are a helpful assistant.',  // System prompt separate from messages
  messages: [
    { role: 'user', content: 'Hello, Claude!' }
  ],
});

console.log(message.content[0].text);
```

---

## Model Selection

| Model | Use Case | Cost | Speed |
|-------|----------|------|-------|
| `claude-3-5-haiku-20241022` | Simple tasks, classification | Low | Very Fast |
| `claude-3-5-sonnet-20241022` | General tasks, coding | Medium | Fast |
| `claude-3-opus-20240229` | Complex analysis, highest quality | High | Slower |

**Recommendation**: Use Haiku for simple tasks, Sonnet for general work, Opus for complex reasoning.

---

## Common Patterns

### Streaming Response
```typescript
const stream = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Write a story' }],
  stream: true,
});

for await (const event of stream) {
  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
    process.stdout.write(event.delta.text);
  }
}
```

### Tool/Function Calling
```typescript
const tools: Anthropic.Tool[] = [
  {
    name: 'get_weather',
    description: 'Get current weather for a location',
    input_schema: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name' },
        unit: { type: 'string', enum: ['celsius', 'fahrenheit'] }
      },
      required: ['location']
    }
  }
];

const message = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  tools,
  messages: [{ role: 'user', content: 'What\'s the weather in SF?' }],
});

// If message.stop_reason === 'tool_use', extract tool calls from message.content
```

### Image Analysis
```typescript
const message = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: base64ImageString,
          },
        },
        { type: 'text', text: 'What\'s in this image?' }
      ],
    },
  ],
});
```

### PDF Analysis
```typescript
import fs from 'fs';

const pdfData = fs.readFileSync('document.pdf').toString('base64');

const message = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: pdfData },
        },
        { type: 'text', text: 'Summarize this document' }
      ],
    },
  ],
});
```

---

## Error Handling with Retries

```typescript
import { RateLimitError, APIConnectionError } from '@anthropic-ai/sdk';

async function callClaudeWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof RateLimitError) {
        const retryAfter = parseInt(error.headers?.['retry-after'] || '5');
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      } else if (error instanceof APIConnectionError) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error; // Don't retry other errors
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## Migration from OpenAI

### Key Differences
- **System prompt**: Separate `system` parameter (not in messages array)
- **Response path**: `message.content[0].text` (not `choices[0].message.content`)
- **Streaming**: `event.delta.text` (not `delta.content`)

### Side-by-Side

**OpenAI**:
```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: 'You are helpful.' },
    { role: 'user', content: 'Hello!' }
  ],
  max_tokens: 1024,
});
console.log(completion.choices[0].message.content);
```

**Claude (equivalent)**:
```typescript
const message = await anthropic.messages.create({
  model: 'claude-3-5-haiku-20241022',
  system: 'You are helpful.',
  messages: [{ role: 'user', content: 'Hello!' }],
  max_tokens: 1024,
});
console.log(message.content[0].text);
```

---

## Best Practices

1. **Clear instructions** - Be specific in system prompts
2. **Use XML tags** - Structure prompts with `<task>`, `<code>`, `<output_format>`
3. **Chain-of-thought** - Let Claude think in `<thinking>` tags
4. **Stream large outputs** - Use `stream: true` for `max_tokens > 2048`
5. **Handle retries** - Implement exponential backoff for rate limits

---

## Resources

- **Official Docs**: https://docs.anthropic.com/
- **TypeScript SDK**: https://github.com/anthropics/anthropic-sdk-typescript
- **Python SDK**: https://github.com/anthropics/anthropic-sdk-python
- **API Reference**: https://docs.anthropic.com/en/api/
- **Prompt Engineering**: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/
- **Rate Limits**: https://docs.anthropic.com/en/api/rate-limits
