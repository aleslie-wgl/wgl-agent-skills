---
name: convex-operations
type: knowledge
description: "[KNOWLEDGE] Convex-specific patterns for API paths, function references, mutations, queries, and testing"
when_to_use: When writing Convex functions, calling Convex APIs from scripts, or debugging Convex errors
version: 1.0.0
---

**Input**: Convex function to call or create
**Output**: Correct API path, proper testing approach, error-free execution

---

## Overview

Convex has specific patterns for function references that differ from standard TypeScript imports. Getting these wrong causes "function not found" errors that waste significant time.

**Key Principle**: In Convex, function names appear twice: once for the file, once for the export.

---

## Pattern 1: Convex API Function References

### The Double-Name Pattern

**File structure**:
```typescript
// File: convex/mutations/createGPUType.ts
export const createGPUType = mutation({
  args: { ... },
  handler: async (ctx, args) => { ... }
});
```

**Usage in scripts**:
```typescript
// CORRECT: Function name appears TWICE
api.mutations.createGPUType.createGPUType
//             ^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^
//             filename        export name
```

### Common Mistakes

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
await client.mutation(api.mutations.createGPUType.createGPUType, { ... });
```

---

## Pattern 2: Function Path Structure

### Mutations

```typescript
// File: convex/mutations/[fileName].ts
// Export: export const [functionName] = mutation({ ... });
// Reference: api.mutations.[fileName].[functionName]

// Examples:
api.mutations.createGPUType.createGPUType
api.mutations.updateGPUType.updateGPUType
api.mutations.queueDiscoveredModel.queueDiscoveredModel
```

### Queries

```typescript
// File: convex/queries/[fileName].ts
// Export: export const [functionName] = query({ ... });
// Reference: api.queries.[fileName].[functionName]

// Examples:
api.queries.estimateThroughput.estimateThroughput
api.queries.getGPUTypes.getGPUTypes
```

### Actions

```typescript
// File: convex/actions/[fileName].ts
// Export: export const [functionName] = action({ ... });
// Reference: api.actions.[fileName].[functionName]

// Examples:
api.actions.processDiscovery.processDiscovery
```

### Nested Folders

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

## Pattern 3: Testing Convex Functions

### From Scripts (ConvexHttpClient)

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
const result = await client.mutation(
  api.mutations.createGPUType.createGPUType,
  {
    name: "H100 (80GB)",
    vendor: "NVIDIA",
    // ... other args
  }
);
```

### From Tests (ConvexTestingHelper)

```typescript
import { convexTest } from 'convex-test';
import { api } from './_generated/api';
import schema from './schema';

describe('estimateThroughput', () => {
  test('returns interpolated value', async () => {
    const t = convexTest(schema);

    // Setup: Insert test data
    await t.run(async (ctx) => {
      await ctx.db.insert('gpu_types', { ... });
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

## Pattern 4: Verifying Functions Exist

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

## Pattern 5: Type Safety

### Using Generated Types

```typescript
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

// ID types are table-specific
const gpuId: Id<"gpu_types"> = "rx74t1x9j0...";

// Function args are type-checked
await client.query(
  api.queries.estimateThroughput.estimateThroughput,
  {
    gpu_id: gpuId,  // Type: Id<"gpu_types">
    model_size_billions: 34,  // Type: number
    quantization: "FP16"  // Type: "FP16" | "FP8" | "INT8" | "Q4_K_M"
  }
);
```

### Handling Type Complexity

Some Convex function references have deep type inference that causes TypeScript to complain:

```typescript
// If TypeScript error: "Type instantiation is excessively deep"
// @ts-expect-error - Convex type inference complexity
const result = await client.mutation(api.mutations.complexFunction.complexFunction, { ... });
```

**When to use**: Only for actual type inference depth errors, not for masking real type errors.

---

## Pattern 6: Error Handling

### Common Errors and Fixes

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

## Pattern 7: MCP Convex Tools

When using MCP Convex tools, the function path format is slightly different:

### mcp__convex__run

```typescript
// Format: "path/to/file.js:functionName"
await mcp__convex__run({
  deploymentSelector: "...",
  functionName: "queries/estimateThroughput.js:estimateThroughput",
  //                                          ^^^ JS extension
  //                                              ^^^ colon separator
  args: JSON.stringify({ ... })
});
```

**Key differences**:
- Use `.js` extension (not `.ts`)
- Use `:` to separate file from function name
- Args must be JSON string

---

## Quick Reference Card

| Scenario | Pattern | Example |
|----------|---------|---------|
| Script calls mutation | `api.mutations.[file].[export]` | `api.mutations.createGPUType.createGPUType` |
| Script calls query | `api.queries.[file].[export]` | `api.queries.getGPUTypes.getGPUTypes` |
| Test calls function | Same as script | `t.query(api.queries.estimateThroughput.estimateThroughput)` |
| MCP tool | `path/file.js:export` | `queries/estimateThroughput.js:estimateThroughput` |
| Nested folder | `api.type.folder.file.export` | `api.mutations.admin.createUser.createUser` |
| Verify exists | `npx convex functions list` | Check output includes function |

---

## Workflow: Adding New Convex Function

1. **Create function file**:
   ```typescript
   // convex/mutations/myFunction.ts
   export const myFunction = mutation({
     args: { ... },
     handler: async (ctx, args) => { ... }
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
   await client.mutation(api.mutations.myFunction.myFunction, { ... });
   ```

4. **Test it works**:
   ```bash
   npx tsx scripts/test-my-function.ts
   ```

---

## Remember

1. **Always double the name**: `api.type.file.export` where `export` often matches `file`
2. **Verify before using**: `npx convex functions list` shows what actually exists
3. **Use generated API**: Never import the file directly
4. **Check types**: Generated types catch most errors at compile time
5. **Read error messages**: "Could not find function" → check the path
6. **MCP uses .js**: When using MCP tools, use `.js:functionName` format

---

**Last Updated**: 2025-11-05
**Related Skills**: pre-completion-verification, spec-validate
**Related Docs**: Convex documentation at https://docs.convex.dev
