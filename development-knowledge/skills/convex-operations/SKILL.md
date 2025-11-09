---
name: convex-operations
type: knowledge
description: "[KNOWLEDGE] Comprehensive Convex patterns: function syntax, validators, API paths, queries, mutations, actions, testing, and error handling"
when_to_use: When writing Convex functions, calling Convex APIs from scripts, testing Convex code, or debugging Convex errors. When you need validator syntax, function registration patterns, or query/mutation operations.
version: 2.0.0
---

**Input**: Convex function to write, call, test, or debug
**Output**: Correct syntax, proper API paths, type-safe operations, error-free execution

---

## Overview

Convex has specific patterns that differ from standard TypeScript. Getting these wrong causes "function not found" errors, type mismatches, and runtime failures.

**Core Principles**:
1. Function names appear twice: file name + export name
2. Always use validators for args and returns
3. Use generated API (`api`/`internal`) objects, never direct imports
4. Internal functions are private, public functions are exposed

---

## Part 1: Function Basics

### Function Syntax

**ALWAYS use the new function syntax** with `args`, `returns`, and `handler`:

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const myQuery = query({
  args: {
    userId: v.id("users"),
    limit: v.number(),
  },
  returns: v.array(v.object({
    _id: v.id("messages"),
    content: v.string(),
  })),
  handler: async (ctx, args) => {
    // Function body
    return await ctx.db
      .query("messages")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .take(args.limit);
  },
});
```

**Key requirements**:
- ✅ **ALWAYS** include `args` validator
- ✅ **ALWAYS** include `returns` validator
- ✅ If function returns nothing, use `returns: v.null()`
- ✅ If function has no arguments, use `args: {}`

---

### Validators & Types

#### Basic Validators

```typescript
import { v } from "convex/values";

// Primitives
v.string()
v.number()  // Float64
v.boolean()
v.null()
v.int64()   // Use this, not v.bigint() (deprecated)
v.bytes()   // ArrayBuffer

// Convex-specific
v.id("tableName")  // Type-safe table ID

// Compound
v.array(v.string())
v.object({ name: v.string(), age: v.number() })
v.optional(v.string())  // Can be undefined
v.union(v.string(), v.number())  // Either type
v.literal("success")  // Exact string value

// Collections
v.record(v.string(), v.number())  // Record<string, number>
// Note: v.map() and v.set() are NOT supported
```

#### Array Validator Example

**Array validators support mixed types using unions.**

Below is an example of an array validator:

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const processItems = mutation({
  args: {
    // Array of mixed types
    items: v.array(v.union(v.string(), v.number())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Process items
    return null;
  },
});
```

#### Discriminated Union Example

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  results: defineTable(
    v.union(
      v.object({
        kind: v.literal("error"),
        errorMessage: v.string(),
      }),
      v.object({
        kind: v.literal("success"),
        value: v.number(),
      }),
    ),
  ),
});
```

**Important**: Always use `as const` for string literals in discriminated unions.

#### Null Return Example

```typescript
export const logAction = mutation({
  args: { message: v.string() },
  returns: v.null(),  // ALWAYS use v.null() for null returns
  handler: async (ctx, args) => {
    console.log(args.message);
    return null;  // JavaScript undefined becomes null
  },
});
```

---

### Function Registration

#### Public Functions (Exposed API)

```typescript
import { query, mutation, action } from "./_generated/server";

// Public query - anyone can call
export const getPublicData = query({
  args: {},
  returns: v.array(v.object({ name: v.string() })),
  handler: async (ctx, args) => {
    return await ctx.db.query("public_data").collect();
  },
});

// Public mutation - anyone can call
export const createItem = mutation({
  args: { name: v.string() },
  returns: v.id("items"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("items", { name: args.name });
  },
});

// Public action - anyone can call
export const processExternal = action({
  args: { url: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const response = await fetch(args.url);
    return null;
  },
});
```

#### Internal Functions (Private)

```typescript
import { internalQuery, internalMutation, internalAction } from "./_generated/server";

// Internal query - only callable by other Convex functions
export const getSecretData = internalQuery({
  args: {},
  returns: v.array(v.object({ secret: v.string() })),
  handler: async (ctx, args) => {
    return await ctx.db.query("secrets").collect();
  },
});

// Internal mutation - only callable by other Convex functions
export const updateSecret = internalMutation({
  args: { id: v.id("secrets"), value: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { value: args.value });
    return null;
  },
});

// Internal action - only callable by other Convex functions
export const backgroundProcess = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    // Heavy processing
    return null;
  },
});
```

**CRITICAL**:
- ❌ Do NOT use `query`, `mutation`, `action` for sensitive internal functions
- ✅ Use `internalQuery`, `internalMutation`, `internalAction` for private APIs
- ✅ Internal functions can only be called by other Convex functions
- ❌ You CANNOT register functions through `api` or `internal` objects

---

## Part 2: Function References & Calling

### Function References - The Double-Name Pattern

**File structure**:
```typescript
// File: convex/mutations/createGPUType.ts
export const createGPUType = mutation({
  args: { name: v.string() },
  returns: v.id("gpu_types"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("gpu_types", { name: args.name });
  },
});
```

**Usage in scripts**:
```typescript
// CORRECT: Function name appears TWICE
api.mutations.createGPUType.createGPUType
//             ^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^
//             filename        export name
```

#### Common Mistakes

❌ **WRONG** - Missing second part:
```typescript
api.mutations.createGPUType
// Error: "Cannot read properties of undefined"
```

❌ **WRONG** - Trying to use .default:
```typescript
(api.mutations.createGPUType as any).default
// Error: "function not found" - Convex doesn't use default exports
```

❌ **WRONG** - Using module import:
```typescript
import createGPUTypeModule from '../mutations/createGPUType';
// Error: Convex requires generated API references
```

✅ **CORRECT** - Double name from generated API:
```typescript
import { api } from '../convex/_generated/api';
await client.mutation(api.mutations.createGPUType.createGPUType, { name: "H100" });
```

---

### Internal Function References

**Public functions** use the `api` object:
```typescript
import { api } from "./_generated/api";

// File: convex/example.ts, export const f = query(...)
const publicRef = api.example.f;
```

**Internal functions** use the `internal` object:
```typescript
import { internal } from "./_generated/api";

// File: convex/example.ts, export const g = internalQuery(...)
const internalRef = internal.example.g;
```

**Nested directories**:
```typescript
// File: convex/messages/access.ts, export const h = query(...)
const ref = api.messages.access.h;

// File: convex/messages/access.ts, export const i = internalQuery(...)
const ref = internal.messages.access.i;
```

---

### Function Calling Patterns

#### From Queries

```typescript
export const f = query({
  args: {},
  returns: v.string(),
  handler: async (ctx, args) => {
    // Can only call OTHER queries
    const result = await ctx.runQuery(api.other.getData, {});
    return result;
  },
});
```

#### From Mutations

```typescript
export const g = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    // Can call queries
    const data = await ctx.runQuery(api.queries.getData, {});

    // Can call other mutations
    await ctx.runMutation(api.mutations.updateData, { data });

    return null;
  },
});
```

#### From Actions

```typescript
export const h = action({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    // Can call queries
    const data = await ctx.runQuery(api.queries.getData, {});

    // Can call mutations
    await ctx.runMutation(api.mutations.updateData, { data });

    // Can call other actions
    await ctx.runAction(api.actions.processData, { data });

    return null;
  },
});
```

**IMPORTANT**:
- ✅ Use `ctx.runQuery` to call queries
- ✅ Use `ctx.runMutation` to call mutations
- ✅ Use `ctx.runAction` to call actions
- ❌ ONLY call actions from actions if crossing runtimes (V8 ↔ Node)
- ❌ Do NOT pass function directly - always use `FunctionReference`
- ⚠️ Minimize action→query/mutation calls (each is a transaction - avoid race conditions)

#### Type Annotation for Same-File Calls

When calling a function in the same file, add type annotation to work around TypeScript circularity:

```typescript
export const f = query({
  args: { name: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    return "Hello " + args.name;
  },
});

export const g = query({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    // Type annotation required for same-file call
    const result: string = await ctx.runQuery(api.example.f, { name: "Bob" });
    console.log(result);
    return null;
  },
});
```

---

### Function Path Structure

#### Mutations

```typescript
// File: convex/mutations/[fileName].ts
// Export: export const [functionName] = mutation({ ... });
// Reference: api.mutations.[fileName].[functionName]

// Examples:
api.mutations.createGPUType.createGPUType
api.mutations.updateGPUType.updateGPUType
api.mutations.queueDiscoveredModel.queueDiscoveredModel
```

#### Queries

```typescript
// File: convex/queries/[fileName].ts
// Export: export const [functionName] = query({ ... });
// Reference: api.queries.[fileName].[functionName]

// Examples:
api.queries.estimateThroughput.estimateThroughput
api.queries.getGPUTypes.getGPUTypes
```

#### Actions

```typescript
// File: convex/actions/[fileName].ts
// Export: export const [functionName] = action({ ... });
// Reference: api.actions.[fileName].[functionName]

// Examples:
api.actions.processDiscovery.processDiscovery
```

#### Nested Folders

```typescript
// File: convex/mutations/admin/createUser.ts
// Export: export const createUser = mutation({ ... });
// Reference: api.mutations.admin.createUser.createUser

// The folder becomes part of the path
api.mutations.admin.createUser.createUser
//             ^^^^^  ^^^^^^^^^^  ^^^^^^^^^^
//             folder filename    export name
```

---

## Part 3: Database Operations

### Schema Guidelines

**Always define schema in `convex/schema.ts`**:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
  })
  .index("by_email", ["email"]),

  messages: defineTable({
    userId: v.id("users"),
    content: v.string(),
    channelId: v.string(),
  })
  .index("by_user", ["userId"])
  .index("by_channel", ["channelId"])
  .searchIndex("search_content", {
    searchField: "content",
    filterFields: ["channelId"],
  }),
});
```

**Index naming convention**:
- ✅ Include all fields: `by_field1_and_field2`
- ✅ Single field: `by_email`
- ✅ Multiple fields: `by_channel_and_timestamp`
- ❌ Generic names: `index1`, `main_index`

**System fields** (automatically added):
- `_id`: `v.id(tableName)` - Document ID
- `_creationTime`: `v.number()` - Timestamp when created

**Index field order matters**:
- Fields must be queried in the same order they're defined
- Need both `["field1", "field2"]` and `["field2", "field1"]`? Create separate indexes

---

### Query Operations

#### Basic Query

```typescript
export const getMessages = query({
  args: { channelId: v.id("channels") },
  returns: v.array(v.object({
    _id: v.id("messages"),
    content: v.string(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_channel", q => q.eq("channelId", args.channelId))
      .collect();
  },
});
```

#### Query Methods

```typescript
// Collect all (careful - can be large)
const all = await ctx.db.query("messages").collect();

// Take first N
const first10 = await ctx.db.query("messages").take(10);

// Get unique (throws if multiple found)
const unique = await ctx.db
  .query("users")
  .withIndex("by_email", q => q.eq("email", "user@example.com"))
  .unique();

// Async iteration (no .collect() needed)
for await (const message of ctx.db.query("messages")) {
  console.log(message.content);
}
```

#### Ordering

```typescript
// Default: ascending by _creationTime
const asc = await ctx.db.query("messages").collect();

// Explicit ascending
const ascending = await ctx.db.query("messages").order("asc").collect();

// Descending
const descending = await ctx.db.query("messages").order("desc").collect();
```

**IMPORTANT**:
- ❌ Do NOT use `.filter()` - use indexes with `.withIndex()` instead
- ❌ Queries do NOT support `.delete()` - collect first, then iterate and `ctx.db.delete()`
- ✅ Indexed queries avoid slow table scans

---

### Mutation Operations

#### Insert

```typescript
export const createUser = mutation({
  args: { name: v.string(), email: v.string() },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
    });
  },
});
```

#### Patch (Shallow Merge)

```typescript
export const updateUser = mutation({
  args: { id: v.id("users"), name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Shallow merge - only updates specified fields
    await ctx.db.patch(args.id, { name: args.name });
    // Throws if document doesn't exist
    return null;
  },
});
```

#### Replace (Full Replacement)

```typescript
export const replaceUser = mutation({
  args: {
    id: v.id("users"),
    name: v.string(),
    email: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Completely replaces document
    await ctx.db.replace(args.id, {
      name: args.name,
      email: args.email,
    });
    // Throws if document doesn't exist
    return null;
  },
});
```

#### Delete

```typescript
export const deleteUser = mutation({
  args: { id: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});
```

#### Get by ID

```typescript
export const getUser = query({
  args: { id: v.id("users") },
  returns: v.union(
    v.object({ _id: v.id("users"), name: v.string() }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);  // Returns null if not found
  },
});
```

---

### Pagination

```typescript
import { paginationOptsValidator } from "convex/server";

export const listMessages = query({
  args: {
    paginationOpts: paginationOptsValidator,
    channelId: v.string(),
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("messages"),
      content: v.string(),
    })),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .filter(q => q.eq(q.field("channelId"), args.channelId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
```

**paginationOpts structure**:
- `numItems`: `v.number()` - Max documents to return
- `cursor`: `v.union(v.string(), v.null())` - Cursor for next page

**Paginate returns**:
- `page`: Array of documents
- `isDone`: Boolean - is this the last page?
- `continueCursor`: String - cursor for next page

---

### Full Text Search

```typescript
export const searchMessages = query({
  args: {
    query: v.string(),
    channel: v.string(),
  },
  returns: v.array(v.object({
    _id: v.id("messages"),
    content: v.string(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withSearchIndex("search_content", q =>
        q.search("content", args.query).eq("channel", args.channel)
      )
      .take(10);
  },
});
```

**Requirements**:
- Define search index in schema with `.searchIndex()`
- Use `.withSearchIndex()` in query
- Specify search field and optional filter fields

---

## Part 4: Advanced Features

### Action Guidelines

**Always add `"use node";` for Node.js built-ins**:

```typescript
"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import fs from "fs";  // Node.js built-in

export const readFile = action({
  args: { path: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    const content = fs.readFileSync(args.path, "utf-8");
    return content;
  },
});
```

**CRITICAL**:
- ❌ NEVER use `ctx.db` in actions - actions don't have database access
- ✅ Call queries/mutations from actions using `ctx.runQuery`/`ctx.runMutation`
- ✅ Use actions for external API calls, file system, heavy computation

---

### HTTP Endpoints

**Define in `convex/http.ts`**:

```typescript
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/api/echo",  // Exact path - no prefix added
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.bytes();
    return new Response(body, { status: 200 });
  }),
});

// Export the router
export default http;
```

**Important**:
- Routes are registered at exact path specified in `path` field
- No automatic prefixes added - `/api/echo` registers at `/api/echo`
- Use complete path including any `/api/` prefix
- Use `httpAction` wrapper
- Access request with `req` parameter
- Return standard `Response` object

**See also**:
- Part 4: Advanced Features → Action Guidelines for `"use node"` directive
- Part 2: Function References for calling HTTP endpoints from functions

---

### Scheduling & Crons

**Define in `convex/crons.ts`**:

```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

// Define the function to run
const cleanup = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log("Running cleanup");
    return null;
  },
});

// Create cron schedule
const crons = cronJobs();

// Run every 2 hours
crons.interval(
  "cleanup inactive users",
  { hours: 2 },
  internal.crons.cleanup,
  {}
);

// Run on cron schedule
crons.cron(
  "daily backup",
  "0 2 * * *",  // 2 AM daily
  internal.crons.backup,
  {}
);

export default crons;
```

**CRITICAL**:
- ✅ Use `crons.interval` or `crons.cron` methods
- ❌ Do NOT use `crons.hourly`, `crons.daily`, `crons.weekly` helpers
- ✅ Pass `FunctionReference`, not function directly
- ✅ Always use `internal` object even for same-file functions

---

### File Storage

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get file URL
export const getFileUrl = query({
  args: { fileId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.fileId);
    // Returns null if file doesn't exist
  },
});

// Get file metadata
export const getFileMetadata = query({
  args: { fileId: v.id("_storage") },
  returns: v.union(
    v.object({
      _id: v.id("_storage"),
      _creationTime: v.number(),
      contentType: v.optional(v.string()),
      sha256: v.string(),
      size: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Query _storage system table
    return await ctx.db.system.get(args.fileId);
  },
});
```

**IMPORTANT**:
- ❌ Do NOT use deprecated `ctx.storage.getMetadata()`
- ✅ Query `_storage` system table with `ctx.db.system.get()`
- ✅ Storage uses `Blob` objects - convert to/from `Blob`
- ✅ `ctx.storage.getUrl()` returns signed URL or null

---

## Part 5: Testing & Debugging

### Testing from Scripts (ConvexHttpClient)

```typescript
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import { config } from 'dotenv';

config({ path: '.env.local' });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const client = new ConvexHttpClient(CONVEX_URL);

// Query (read-only)
const result = await client.query(
  api.queries.estimateThroughput.estimateThroughput,
  {
    gpu_id: "rx74t1x9j0...",
    model_size_billions: 34,
    quantization: "FP16"
  }
);

// Mutation (write operation)
const id = await client.mutation(
  api.mutations.createGPUType.createGPUType,
  {
    name: "H100 (80GB)",
    vendor: "NVIDIA",
  }
);
```

---

### Testing from Tests (ConvexTestingHelper)

```typescript
import { convexTest } from 'convex-test';
import { api } from './_generated/api';
import schema from './schema';

describe('estimateThroughput', () => {
  test('returns interpolated value', async () => {
    const t = convexTest(schema);

    // Setup: Insert test data
    await t.run(async (ctx) => {
      await ctx.db.insert('gpu_types', {
        name: "Test GPU",
        vendor: "NVIDIA",
      });
    });

    // Execute: Call query
    const result = await t.query(
      api.queries.estimateThroughput.estimateThroughput,
      {
        gpu_id: testGPUId,
        model_size_billions: 34,
        quantization: "FP16"
      }
    );

    // Assert: Check result
    expect(result.interpolation_method).toBe('cubic');
  });
});
```

---

### Verifying Functions Exist

Before writing a script that calls a Convex function, verify it exists:

```bash
# List all functions
npx convex functions list

# Search for specific function
npx convex functions list | grep createGPUType

# Expected output:
# mutations/createGPUType:createGPUType
```

**If function not listed**:
1. Check file exists: `convex/mutations/createGPUType.ts`
2. Check export is named: `export const createGPUType = mutation({ ... })`
3. Run `npx convex dev` to regenerate API types
4. Check `convex/_generated/api.d.ts` includes the function

---

### Error Handling

#### Error: "Could not find public function"

```
Error: [Request ID: xxx] Server Error
Could not find public function for 'mutations/createGPUType'
```

**Causes**:
1. Using wrong path (missing double name)
2. Function not exported
3. Convex dev not running
4. Generated types out of sync

**Fix**:
```bash
# 1. Verify function exists
npx convex functions list | grep createGPUType

# 2. Check it's exported properly
# File should have: export const createGPUType = mutation({ ... })

# 3. Regenerate types
npx convex dev

# 4. Use correct double-name path
api.mutations.createGPUType.createGPUType
```

#### Error: "Cannot read properties of undefined"

```typescript
api.mutations.createGPUType.someFunction
// Error: Cannot read properties of undefined (reading 'someFunction')
```

**Cause**: Wrong function name or file name

**Fix**:
```bash
# List actual functions in file
npx convex functions list | grep createGPUType
# Output shows: mutations/createGPUType:createGPUType

# Use the name after the colon
api.mutations.createGPUType.createGPUType
                            ^^^^^^^^^^^^^^
                            must match export name
```

---

## Part 6: TypeScript Guidelines

### ID Types

```typescript
import { Id } from "./_generated/dataModel";

// Type-safe IDs
const userId: Id<"users"> = "j976x7d8n3...";
const messageId: Id<"messages"> = "k874y2c1m4...";

// In function args
export const getUser = query({
  args: { userId: v.id("users") },  // Validator
  returns: v.union(
    v.object({
      _id: Id<"users">,  // TypeScript type
      name: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const userId: Id<"users"> = args.userId;
    return await ctx.db.get(userId);
  },
});
```

---

### Record Types

```typescript
import { Id } from "./_generated/dataModel";

export const getUsernames = query({
  args: { userIds: v.array(v.id("users")) },
  returns: v.record(v.id("users"), v.string()),  // Validator
  handler: async (ctx, args) => {
    // TypeScript type must match validator
    const idToUsername: Record<Id<"users">, string> = {};

    for (const userId of args.userIds) {
      const user = await ctx.db.get(userId);
      if (user) {
        idToUsername[user._id] = user.username;
      }
    }

    return idToUsername;
  },
});
```

**IMPORTANT**:
- ✅ Use `Record<KeyType, ValueType>` with correct types
- ✅ Key type must match validator: `v.record(v.id('users'), v.string())` → `Record<Id<'users'>, string>`
- ❌ Don't use generic `Record<string, any>`

---

### Arrays and Type Declarations

```typescript
// Always use explicit type declarations for arrays
const array: Array<string> = ["a", "b", "c"];

// For records
const record: Record<string, number> = {
  a: 1,
  b: 2,
};
```

---

### Node.js Types

When using Node.js built-in modules, add to `package.json`:

```json
{
  "devDependencies": {
    "@types/node": "^20.0.0"
  }
}
```

---

## Part 7: Reference

### MCP Convex Tools

When using MCP Convex tools, the function path format uses `.js` extension:

```typescript
// Format: "path/to/file.js:functionName"
await mcp__convex__run({
  deploymentSelector: "...",
  functionName: "queries/estimateThroughput.js:estimateThroughput",
  //                                          ^^^ JS extension
  //                                              ^^^ colon separator
  args: JSON.stringify({ gpu_id: "...", model_size_billions: 34 })
});
```

**Key differences from normal API**:
- Use `.js` extension (not `.ts`)
- Use `:` to separate file from function name
- Args must be JSON string

---

### Quick Reference Card

| Scenario | Pattern | Example |
|----------|---------|---------|
| Public function | `query`, `mutation`, `action` | `export const f = query({ ... })` |
| Internal function | `internalQuery`, `internalMutation`, `internalAction` | `export const g = internalQuery({ ... })` |
| Script calls mutation | `api.mutations.[file].[export]` | `api.mutations.createGPUType.createGPUType` |
| Script calls query | `api.queries.[file].[export]` | `api.queries.getGPUTypes.getGPUTypes` |
| Call internal function | `internal.path.file.export` | `internal.mutations.updateSecret.updateSecret` |
| Test calls function | Same as script | `t.query(api.queries.getData.getData)` |
| MCP tool | `path/file.js:export` | `queries/estimateThroughput.js:estimateThroughput` |
| Nested folder | `api.type.folder.file.export` | `api.mutations.admin.createUser.createUser` |
| Verify exists | `npx convex functions list` | Check output includes function |
| Call from query | `ctx.runQuery(ref, args)` | `await ctx.runQuery(api.queries.getData, {})` |
| Call from mutation | `ctx.runMutation(ref, args)` | `await ctx.runMutation(api.mutations.update, {})` |
| Call from action | `ctx.runAction(ref, args)` | `await ctx.runAction(api.actions.process, {})` |

---

### Complete Validator Type Reference

| Convex Type | TS/JS Type | Validator | Example | Notes |
|-------------|-----------|-----------|---------|-------|
| **Id** | string | `v.id(tableName)` | `v.id("users")` | Type-safe table reference |
| **Null** | null | `v.null()` | `returns: v.null()` | Use instead of undefined |
| **Int64** | bigint | `v.int64()` | `3n` | -2^63 to 2^63-1 range |
| **Float64** | number | `v.number()` | `3.14` | IEEE-754 double precision |
| **Boolean** | boolean | `v.boolean()` | `true` | Standard boolean |
| **String** | string | `v.string()` | `"hello"` | UTF-8, <1MB |
| **Bytes** | ArrayBuffer | `v.bytes()` | `new ArrayBuffer(8)` | Binary data, <1MB |
| **Array** | Array | `v.array(itemType)` | `v.array(v.string())` | Max 8192 items |
| **Object** | Object | `v.object({ ... })` | `v.object({ name: v.string() })` | Plain objects only, max 1024 entries |
| **Record** | Record | `v.record(key, value)` | `v.record(v.string(), v.number())` | Dynamic keys, ASCII only |
| **Union** | union | `v.union(typeA, typeB)` | `v.union(v.string(), v.number())` | Either type |
| **Optional** | T \| undefined | `v.optional(type)` | `v.optional(v.string())` | Can be undefined |
| **Literal** | exact value | `v.literal(value)` | `v.literal("success")` | Exact string match |

**Important notes**:
- `v.bigint()` is deprecated - use `v.int64()` instead
- `v.map()` and `v.set()` are NOT supported - use `v.record()` or `v.array()`
- Object field names: nonempty, can't start with `$` or `_`
- Record keys: ASCII only, nonempty, can't start with `$` or `_`

---

### Workflow: Adding New Convex Function

1. **Create function file**:
   ```typescript
   // convex/mutations/myFunction.ts
   export const myFunction = mutation({
     args: { name: v.string() },
     returns: v.id("items"),
     handler: async (ctx, args) => {
       return await ctx.db.insert("items", { name: args.name });
     },
   });
   ```

2. **Verify it's generated**:
   ```bash
   npx convex functions list | grep myFunction
   # Should output: mutations/myFunction:myFunction
   ```

3. **Use in script**:
   ```typescript
   import { api } from '../convex/_generated/api';
   await client.mutation(api.mutations.myFunction.myFunction, { name: "test" });
   ```

4. **Test it works**:
   ```bash
   npx tsx scripts/test-my-function.ts
   ```

---

### Complete Example: Chat App with AI

See the complete working example in `examples/chat-app/` showing:
- User and channel management
- Message storage with indexing
- AI response generation (OpenAI integration)
- Internal vs public function patterns
- Proper validator usage
- Scheduling pattern for background AI processing

Key files:
- `convex/index.ts` - All functions (public + internal)
- `convex/schema.ts` - Schema with indexes
- `package.json` - Dependencies including OpenAI

This example demonstrates:
- ✅ Public mutations: `createUser`, `createChannel`, `sendMessage`
- ✅ Public query: `listMessages` with pagination
- ✅ Internal action: `generateResponse` for AI processing
- ✅ Internal query: `loadContext` for conversation history
- ✅ Internal mutation: `writeAgentResponse` for AI messages
- ✅ Scheduling: `ctx.scheduler.runAfter()` for async AI response
- ✅ Proper validator usage throughout
- ✅ Index usage for efficient queries

---

## Key Reminders

1. **Always double the name**: `api.type.file.export` where `export` often matches `file`
2. **Always use validators**: Every function needs `args` and `returns`
3. **Use generated API**: Never import files directly - use `api`/`internal` objects
4. **Verify before using**: `npx convex functions list` shows what exists
5. **Internal = private**: Use `internalQuery`/`internalMutation`/`internalAction` for sensitive operations
6. **Check types**: Generated types catch most errors at compile time
7. **Use indexes**: Never use `.filter()` - use `.withIndex()` for performance
8. **Read errors carefully**: "Could not find function" → check the path format
9. **MCP uses .js**: When using MCP tools, use `.js:functionName` format
10. **No ctx.db in actions**: Actions can't access database - call queries/mutations

---

**Last Updated**: 2025-11-08
**Version**: 2.0.0 (Comprehensive merge of patterns + official guidelines)
**Related Skills**: pre-completion-verification, spec-validate, typescript-standards
**Related Docs**: Convex documentation at https://docs.convex.dev
