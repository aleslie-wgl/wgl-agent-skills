---
name: convex-platform
type: knowledge
description: "[KNOWLEDGE] Convex platform comprehensive agent development guide - database-native agents, durable workflows, real-time features"
version: 1.0.0
---

# Convex Platform - Comprehensive Agent Development Guide

**Framework**: Convex (Database + Agents + Workflows)
**Version**: Latest (October 2025)
**Trust Score**: 9.9/10
**Research Source**: docs/research/convex-agents.md, convex-workflows.md, convex-runtime.md

---

## When to Use This Skill

✅ **Use when**:
- Building chat-based AI agents (Platform Copilot, user-facing agents)
- Creating durable workflows (multi-step processes that survive restarts)
- Implementing real-time features (collaboration, live updates)
- Integrating LLM calls with database operations
- Need automatic state persistence (threads, messages, executions)

❌ **Don't use when**:
- Need code sandboxes (use E2B)
- Complex graph topologies with cycles (consider LangGraph)
- Pure Python environment (Convex is TypeScript-first)

---

## Core Components

### 1. Convex Agent (`@convex-dev/agent`)

**Purpose**: Chat-based AI agents with automatic persistence

**Key Features**:
- Database-native (threads/messages auto-saved)
- Streaming text with React hooks
- Tool calling with Convex context access
- Vector search for RAG
- TypeScript-native

**Basic Setup**:
```typescript
import { Agent } from "@convex-dev/agent";
import { components } from "./_generated/api";
import { openai } from "@ai-sdk/openai";

const agent = new Agent(components.agent, {
  name: "Support Agent",
  instructions: "You are a helpful assistant.",
  languageModel: openai.chat("gpt-4o-mini"),
  textEmbeddingModel: openai.embedding("text-embedding-3-small"),
  tools: {
    // Define tools here
  },
});

// Expose as actions/mutations
export const chat = agent.asTextAction();
export const createThread = agent.createThreadMutation();
```

**When to Use Convex Agent**:
- ✅ Platform Copilot chat interface
- ✅ User-facing Q&A agents
- ✅ Simple conversational workflows
- ✅ Agents with RAG/knowledge base

---

### 2. Convex Workflows (`@convex-dev/workflow`)

**Purpose**: Durable orchestration for long-running processes

**Key Features**:
- Run for minutes to months
- Automatic retries with exponential backoff
- Survives server restarts
- Step-by-step execution tracking
- Built-in observability

**Basic Setup**:
```typescript
import { WorkflowManager } from "@convex-dev/workflow";
import { components } from "./_generated/api";

const workflow = new WorkflowManager(components.workflow);

export const agentWorkflow = workflow.define({
  args: { prompt: v.string(), userId: v.string() },
  handler: async (step, { prompt, userId }): Promise<string> => {
    // Step 1: Create thread (durable)
    const { threadId } = await step.runMutation(
      internal.agent.createThread,
      { userId }
    );

    // Step 2: Get response (durable, auto-retry)
    const response = await step.runAction(
      internal.agent.chat,
      { threadId, prompt }
    );

    return response;
  },
});
```

**When to Use Workflows**:
- ✅ Multi-step agent execution (research → analyze → generate)
- ✅ Long-running processes (>10 minutes)
- ✅ Need automatic retries
- ✅ Scheduled tasks (cron-like execution)

---

### 3. Convex Actions

**Purpose**: External API calls and tool execution

**Limits**:
- 10-minute timeout (use workflows for longer)
- Can't directly read/write database (use ctx.runQuery/runMutation)
- Supports streaming

**Basic Setup**:
```typescript
import { action } from "./_generated/server";
import { v } from "convex/values";

export const sendEmail = action({
  args: { to: v.string(), body: v.string() },
  handler: async (ctx, { to, body }) => {
    // Call external API
    await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}` },
      body: JSON.stringify({ to, content: body }),
    });

    // Save to database via mutation
    await ctx.runMutation(internal.emails.logSent, { to });
  },
});
```

**When to Use Actions**:
- ✅ Tool calls (external APIs, webhooks)
- ✅ LLM calls (OpenAI, Anthropic)
- ✅ File uploads/downloads
- ✅ Any non-database operation

---

### 4. Convex Queries

**Purpose**: Real-time reactive data fetching

**Features**:
- <25ms latency
- Automatic subscriptions (frontend auto-updates)
- Can only read database (no writes, no external calls)

**Basic Setup**:
```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const listMessages = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .order("desc")
      .take(50);
  },
});
```

**Frontend Usage**:
```typescript
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function Chat({ threadId }) {
  const messages = useQuery(api.chat.listMessages, { threadId });
  // Auto-updates when new messages are added (real-time)
}
```

---

## Architecture Patterns

### Pattern 1: Mutation → Action (RECOMMENDED)

**Problem**: User triggers agent, want immediate response but LLM takes time

**Solution**: Mutation captures intent, schedules action

```typescript
// ✅ GOOD: Mutation (fast) → Action (slow)
export const sendMessage = mutation({
  args: { threadId: v.string(), text: v.string() },
  handler: async (ctx, { threadId, text }) => {
    // Save user message (fast)
    const messageId = await ctx.db.insert("messages", {
      threadId,
      role: "user",
      content: text,
      timestamp: Date.now(),
    });

    // Schedule agent response (async)
    await ctx.scheduler.runAfter(0, internal.agent.generateResponse, {
      threadId,
      messageId,
    });

    return { messageId }; // Returns immediately
  },
});

export const generateResponse = internalAction({
  args: { threadId: v.string(), messageId: v.string() },
  handler: async (ctx, { threadId, messageId }) => {
    // LLM call (slow, but doesn't block user)
    await agent.generateText(ctx, { threadId }, {
      promptMessageId: messageId,
    });
  },
});
```

**Why?**
- User gets instant feedback (message saved)
- LLM runs asynchronously (no timeout)
- Frontend auto-updates via query subscription

---

### Pattern 2: Convex Agent with Tools

**Problem**: Agent needs to search database, call APIs, access context

**Solution**: Create tools with Convex context access

```typescript
import { createTool } from "@convex-dev/agent";
import { z } from "zod/v3";

// Tool with database access
const searchAgents = createTool({
  description: "Search for existing agents by name or description",
  args: z.object({
    query: z.string().describe("Search query"),
  }),
  handler: async (ctx, { query }): Promise<Array<Agent>> => {
    // ctx has: agent, userId, threadId, messageId
    // Plus: auth, storage, runMutation, runAction, runQuery
    const agents = await ctx.runQuery(api.agents.search, { query });
    return agents;
  },
});

// Tool calling external API
const getWeather = createTool({
  description: "Get current weather for a location",
  args: z.object({
    location: z.string().describe("City name"),
  }),
  handler: async (ctx, { location }): Promise<string> => {
    const response = await fetch(
      `https://api.weather.com/current?city=${location}`
    );
    const data = await response.json();
    return `Temperature: ${data.temp}°F, Conditions: ${data.conditions}`;
  },
});

// Agent with tools
const agent = new Agent(components.agent, {
  name: "Platform Copilot",
  instructions: "Help users build agents.",
  tools: { searchAgents, getWeather },
  languageModel: openai.chat("gpt-4o-mini"),
});
```

---

### Pattern 3: Streaming with Real-time Updates

**Problem**: User wants to see agent response as it generates

**Solution**: Save stream deltas to database, frontend subscribes

**Backend**:
```typescript
export const chatStreaming = internalAction({
  args: { threadId: v.string(), prompt: v.string() },
  handler: async (ctx, { threadId, prompt }) => {
    await agent.streamText(
      ctx,
      { threadId },
      { prompt },
      {
        saveStreamDeltas: {
          returnImmediately: true,
          chunking: "word", // or "line"
          throttleMs: 100, // Update every 100ms
        },
      }
    );
  },
});
```

**Frontend**:
```typescript
import { useUIMessages, useSmoothText } from "@convex-dev/agent/react";
import { api } from "../convex/_generated/api";

function Chat({ threadId }) {
  const { results } = useUIMessages(
    api.chat.listMessages,
    { threadId },
    { stream: true }
  );

  return results.map((message) => <Message message={message} />);
}

function Message({ message }) {
  const [visibleText] = useSmoothText(message.text, {
    startStreaming: message.status === "streaming",
  });
  return <div>{visibleText}</div>;
}
```

**Result**: <25ms latency, smooth word-by-word rendering

---

### Pattern 4: Agent Calling Agent (Sub-Agents)

**Problem**: Complex workflow requires specialized agents

**Solution**: Main agent calls sub-agents as tools

```typescript
// Specialized agents
const researchAgent = new Agent(components.agent, {
  name: "Research Agent",
  instructions: "Find and summarize relevant information",
  tools: { searchDocs, fetchURL },
  languageModel: openai.chat("gpt-4o-mini"),
});

const analysisAgent = new Agent(components.agent, {
  name: "Analysis Agent",
  instructions: "Analyze data and provide insights",
  languageModel: openai.chat("gpt-4o"),
});

// Tool that calls research agent
const research = createTool({
  description: "Research a topic using the research agent",
  args: z.object({ topic: z.string() }),
  handler: async (ctx, { topic }, options): Promise<string> => {
    // Create sub-thread for research agent
    const { thread } = await researchAgent.createThread(ctx, {
      userId: ctx.userId,
    });

    // Call research agent
    const result = await thread.generateText({
      prompt: [...options.messages, { role: "user", content: topic }],
    });

    // Link threads (parent-child relationship)
    await saveThreadAsChild(ctx, ctx.threadId, thread.threadId);

    return result.text;
  },
});

// Main orchestrator agent
const orchestratorAgent = new Agent(components.agent, {
  name: "Orchestrator",
  instructions: "Coordinate research and analysis",
  tools: { research }, // Uses research agent as tool
  languageModel: openai.chat("gpt-4o"),
});
```

---

### Pattern 5: RAG with Vector Search

**Problem**: Agent needs context from previous conversations or documents

**Solution**: Enable vector search in agent configuration

```typescript
// Generate embeddings for messages (automatic)
const agent = new Agent(components.agent, {
  name: "Support Agent",
  languageModel: openai.chat("gpt-4o-mini"),
  textEmbeddingModel: openai.embedding("text-embedding-3-small"), // Required for RAG
  contextOptions: {
    searchOptions: {
      limit: 10,
      vectorSearch: true, // Enable semantic search
      messageRange: { before: 2, after: 1 }, // Context around matches
    },
    searchOtherThreads: true, // Search across all user threads
  },
});

// Agent will automatically:
// 1. Embed user's prompt
// 2. Vector search for relevant past messages
// 3. Include in context window
// 4. Generate response with retrieved knowledge
```

**Manual RAG (Advanced)**:
```typescript
import { rag } from "@convex-dev/rag";

const searchKnowledge = createTool({
  description: "Search knowledge base for relevant context",
  args: z.object({ query: z.string() }),
  handler: async (ctx, { query }) => {
    const context = await rag.search(ctx, {
      namespace: ctx.userId,
      query,
    });
    return context.text;
  },
});
```

---

## Best Practices

### 1. Use Mutation → Action Pattern

```typescript
// ❌ BAD: Client calls action directly (10-minute timeout)
const result = await ctx.runAction(internal.agent.chat, { prompt });

// ✅ GOOD: Client calls mutation, mutation schedules action
export const sendMessage = mutation({
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", { ...args });
    await ctx.scheduler.runAfter(0, internal.agent.chat, args);
  },
});
```

### 2. Consolidate Database Access

```typescript
// ❌ BAD: Multiple separate queries (inconsistent data)
const user = await ctx.runQuery(api.users.get, { id });
const team = await ctx.runQuery(api.teams.get, { id: user.teamId });

// ✅ GOOD: Single query with all data
const { user, team } = await ctx.runQuery(api.users.getWithTeam, { id });
```

### 3. Configure Context Fetching

```typescript
// Simple chat (recent messages only)
const result = await agent.generateText(ctx, { threadId }, { prompt }, {
  contextOptions: {
    recentMessages: 50,
    excludeToolMessages: true,
    searchOptions: { limit: 0 }, // No search
  },
});

// RAG-powered chat (semantic search)
const result = await agent.generateText(ctx, { threadId }, { prompt }, {
  contextOptions: {
    recentMessages: 10,
    searchOptions: {
      limit: 20,
      vectorSearch: true,
    },
    searchOtherThreads: true,
  },
});
```

### 4. Track Usage and Costs

```typescript
const agent = new Agent(components.agent, {
  // ...
  usageHandler: async (ctx, { usage, model, userId, threadId }) => {
    await ctx.runMutation(internal.usage.track, {
      userId,
      threadId,
      model,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
    });
  },
});
```

### 5. Rate Limiting

```typescript
import { RateLimiter, MINUTE } from "@convex-dev/rate-limiter";

const rateLimiter = new RateLimiter(components.rateLimiter, {
  sendMessage: {
    kind: "fixed window",
    period: 5000, // 5 seconds
    rate: 1,
    capacity: 2,
  },
});

// Before agent call
await rateLimiter.limit(ctx, "sendMessage", { key: userId });
```

---

## Integration with Our Platform

### Replace LangGraph Orchestrator → Convex Agent

**OLD** (LangGraph with 5 sub-agents):
- 1,500+ lines of code
- Manual state management
- Custom streaming
- External observability (LangSmith)

**NEW** (Convex Agent with tools):
- ~150 lines of code
- Automatic persistence
- Built-in streaming
- Built-in observability (Convex dashboard)

### Replace LangGraph Workflows → Convex Workflows

**OLD** (LangGraph workflows):
- Manual checkpointer
- Custom retry logic
- External observability

**NEW** (Convex Workflows):
- Automatic persistence
- Built-in retries
- Built-in observability

### Keep What Works

- ✅ **CopilotKit** (AG-UI mini-components)
- ✅ **Clerk** (auth)
- ✅ **Next.js 15** (frontend)
- ✅ **OpenAI + Claude** (LLMs via AI SDK)

### Add When Needed

- 🔮 **E2B** (code execution for client agents)
- 🔮 **LangGraph** (complex graph topologies)
- 🔮 **Kong Volcano** (multi-provider orchestration)

---

## Performance Tips

1. **Limit Context Window**:
   ```typescript
   contextOptions: { recentMessages: 50 } // vs 1000
   ```

2. **Exclude Tool Messages**:
   ```typescript
   contextOptions: { excludeToolMessages: true }
   ```

3. **Batch Embeddings**:
   ```typescript
   await ctx.runMutation(components.agent.vector.index.insertBatch, {
     vectors: [/* many */],
   });
   ```

4. **Throttle Stream Deltas**:
   ```typescript
   saveStreamDeltas: { throttleMs: 1000 } // Update every 1 second
   ```

5. **Use Indexes**:
   ```typescript
   .withIndex("by_thread", (q) => q.eq("threadId", threadId))
   ```

---

## Common Pitfalls

### ❌ Calling Actions from Queries

```typescript
// ERROR: Queries can't call actions
export const badQuery = query({
  handler: async (ctx) => {
    await ctx.runAction(internal.agent.chat); // ❌ Error
  },
});
```

**Fix**: Use mutations to schedule actions

### ❌ Long-Running Actions (>10 minutes)

```typescript
// ERROR: Action timeout after 10 minutes
export const longAction = action({
  handler: async (ctx) => {
    await sleep(15 * 60 * 1000); // ❌ Timeout
  },
});
```

**Fix**: Use Convex Workflows

### ❌ Not Handling Tool Errors

```typescript
// BAD: No error handling
const tool = createTool({
  handler: async (ctx, args) => {
    const result = await fetch(url); // Might fail
    return result.json();
  },
});
```

**Fix**: Add try-catch and return error messages

---

## See Also

- **Research**: `docs/research/convex-agents.md` (47KB comprehensive guide)
- **Research**: `docs/research/convex-workflows.md` (8500+ words on workflows)
- **Research**: `docs/research/convex-runtime.md` (runtime capabilities)
- **Arch Decision**: `specs/ARCHITECTURE-DECISION-CONVEX-FIRST.md`
- **Official Docs**: [Convex Agent Component](https://github.com/get-convex/agent)

---

**Version**: 1.0.0
**Last Updated**: 2025-10-19
**Research Date**: 2025-10-19
