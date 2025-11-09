---
name: typescript-standards
type: knowledge
description: "[KNOWLEDGE] Enforce strict TypeScript patterns that pass ESLint and maintain type safety."
version: 1.0.0
---

# TypeScript Coding Standards

**Purpose**: Enforce strict TypeScript patterns that pass ESLint and maintain type safety.

**Load this skill**: `kb-implementer` and `kb-tdd-executor` agents should load this skill for all TypeScript implementations.

---

## ⚠️ CRITICAL: Never Use `any`

**ESLint Rule**: `@typescript-eslint/no-explicit-any` - **WILL FAIL PRE-COMMIT HOOKS**

### ❌ NEVER Do This

```typescript
// ❌ WRONG - Will fail ESLint
const data: any = fetchData();
const client: any = getClient();
function process(input: any): any { }
```

### ✅ ALWAYS Do This Instead

```typescript
// ✅ CORRECT - Use unknown for external data
const data: unknown = fetchData();

// ✅ CORRECT - Use specific types when known
interface Client {
  mutation: (name: string, args: unknown) => Promise<unknown>;
}
const client: Client = getClient();

// ✅ CORRECT - Type parameters explicitly
function process(input: unknown): string { }
```

---

## Type Hierarchy for Unknown Data

**Rule**: When you don't know the type, follow this hierarchy:

1. **Best**: Define explicit interface if structure is known
2. **Good**: Use `unknown` for external/dynamic data
3. **Acceptable**: Use `Record<string, unknown>` for objects
4. **Last Resort**: Use type assertion with `unknown` intermediate step

### Examples

#### 1. External API Responses (Unknown Structure)

```typescript
// ✅ CORRECT
const response: unknown = await fetch('/api/data');
if (isValidResponse(response)) {
  // Type guard narrows to specific type
  const typed: MyDataType = response;
}

// ✅ CORRECT - Runtime validation required
function isValidResponse(data: unknown): data is MyDataType {
  return (
    typeof data === 'object' &&
    data !== null &&
    'field' in data
  );
}
```

#### 2. Dynamic Global Properties (MCP Tools, Test Mocks)

```typescript
// ❌ WRONG
const mcpTool = (globalThis as any).mcp__convex__status;

// ✅ CORRECT - Define interface for dynamic property
const mcpTool = (globalThis as {
  mcp__convex__status?: (...args: unknown[]) => Promise<unknown>
}).mcp__convex__status;
```

#### 3. Test Mocks (Vitest, Jest)

```typescript
// ❌ WRONG
let mockClient: any;

// ✅ CORRECT - Define mock interface
interface MockConvexClient {
  mutation: ReturnType<typeof vi.fn>;
  query: ReturnType<typeof vi.fn>;
}
let mockClient: MockConvexClient;

// ✅ CORRECT - Mock function return types
beforeEach(() => {
  mockClient = {
    mutation: vi.fn().mockResolvedValue({ success: true }),
    query: vi.fn(),
  };
});
```

#### 4. Generic Data Structures

```typescript
// ❌ WRONG
const params: Record<string, any> = { id: '123' };

// ✅ CORRECT - Use unknown for values
const params: Record<string, unknown> = { id: '123' };

// ✅ BETTER - Use specific type if possible
interface QueryParams {
  id: string;
  filters?: Record<string, string | number>;
}
const params: QueryParams = { id: '123' };
```

#### 5. Type Assertions (When Absolutely Necessary)

```typescript
// ❌ WRONG - Direct cast from any
const value = input as string;

// ✅ CORRECT - Use unknown intermediate step
const value = (input as unknown) as string;

// ✅ BETTER - Use type guard
function isString(value: unknown): value is string {
  return typeof value === 'string';
}
if (isString(input)) {
  const value: string = input; // Type narrowed
}
```

---

## Convex-Specific Patterns

### Convex Client Interface

```typescript
// ✅ CORRECT - Convex client always returns unknown
interface ConvexClient {
  mutation: (name: string, args: unknown) => Promise<unknown>;
  query: (name: string, args: unknown) => Promise<unknown>;
  action: (name: string, args: unknown) => Promise<unknown>;
}
```

### Convex Schema Validators

```typescript
// ❌ WRONG
v.any() as Validator<CoreMessage, "required", any>

// ✅ CORRECT - Third parameter is string literal, not any
v.any() as Validator<CoreMessage, "required", "required">
```

### Convex Query Results

```typescript
// ✅ CORRECT - Always validate Convex results
const result: unknown = await ctx.db.query('table').first();

if (!isValidResult(result)) {
  throw new Error('Invalid result from Convex');
}

// Now result is typed
const typedResult: MyTableRow = result;
```

---

## Common Patterns in This Codebase

### 1. MCP Tool Wrappers

```typescript
// Pattern: Dynamic globalThis access
export function wrapMcpTool() {
  const mcpTool = (globalThis as {
    mcp__tool_name?: (...args: unknown[]) => Promise<unknown>
  }).mcp__tool_name;

  if (!mcpTool) {
    throw new Error('MCP tool not available');
  }

  const response: unknown = await mcpTool(args);

  // Validate before using
  if (!isValidResponse(response)) {
    throw new Error('Invalid response');
  }

  return response as MyResponseType;
}
```

### 2. Library Interfaces (Foundation Libraries)

```typescript
// Pattern: External clients passed as dependencies
export interface SessionManager {
  createSession(params: SessionParams): Promise<Session>;
  getSession(id: string): Promise<Session | null>;
}

export class SessionManagerImpl implements SessionManager {
  constructor(
    private convexClient: ConvexClient // Typed interface, not any
  ) {}

  async createSession(params: SessionParams): Promise<Session> {
    const result: unknown = await this.convexClient.mutation(
      'sessions:create',
      params
    );

    // Validate runtime data
    if (!isSession(result)) {
      throw new Error('Invalid session created');
    }

    return result;
  }
}
```

### 3. Test Fixtures

```typescript
// Pattern: Explicit test data types
interface TestUser {
  id: string;
  email: string;
  name: string;
}

const mockUser: TestUser = {
  id: 'test-123',
  email: 'test@example.com',
  name: 'Test User',
};

// NOT: const mockUser: any = { ... }
```

---

## Type Guards (Runtime Validation)

**Rule**: When receiving `unknown` data, use type guards to validate and narrow types.

```typescript
// Type guard pattern
function isMyType(value: unknown): value is MyType {
  return (
    typeof value === 'object' &&
    value !== null &&
    'requiredField' in value &&
    typeof (value as Record<string, unknown>).requiredField === 'string'
  );
}

// Usage
const data: unknown = externalSource();
if (isMyType(data)) {
  // TypeScript knows data is MyType here
  console.log(data.requiredField.toUpperCase());
}
```

---

## Function Signatures

### Input Parameters

```typescript
// ❌ WRONG
function process(data: any, options: any) { }

// ✅ CORRECT - Specific types
interface ProcessOptions {
  format: 'json' | 'xml';
  validate: boolean;
}
function process(data: unknown, options: ProcessOptions) { }

// ✅ CORRECT - Generic with constraints
function process<T extends Record<string, unknown>>(
  data: T,
  options: ProcessOptions
) { }
```

### Return Types

```typescript
// ❌ WRONG - Implicit any from missing return type
async function fetchData() {
  return await api.get('/data');
}

// ✅ CORRECT - Explicit return type
async function fetchData(): Promise<ApiResponse> {
  const response: unknown = await api.get('/data');

  if (!isApiResponse(response)) {
    throw new Error('Invalid API response');
  }

  return response;
}
```

---

## Dealing with Third-Party Libraries

### Untyped Libraries

```typescript
// If library lacks types, create minimal interface
interface UntypedLibrary {
  method: (arg: string) => unknown;
}

declare const untypedLib: UntypedLibrary;
```

### Vitest/Jest Mocks

```typescript
// ✅ CORRECT - Type mock explicitly
import { vi } from 'vitest';

const mockFn = vi.fn<[string], Promise<boolean>>();
//             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//             [args], returnType

mockFn.mockResolvedValue(true);
```

---

## Migration Path (Fixing Existing `any`)

If you encounter existing code with `any`, fix it in this order:

1. **Identify the true type**: What does this value actually represent?
2. **Define interface**: Create explicit interface if structure is known
3. **Use `unknown`**: If type varies, use `unknown` + type guard
4. **Add validation**: Runtime checks for external data
5. **Test**: Ensure TypeScript compiles and tests pass

---

## Pre-Commit Checklist

Before completing any task:

- [ ] Search files for `any` keyword: `grep -r "any" <your-files>`
- [ ] Replace all `any` with appropriate types
- [ ] Run TypeScript: `npx tsc --noEmit` (should be 0 errors)
- [ ] Run ESLint: `npx eslint <your-files>` (should be 0 errors)
- [ ] Verify tests pass: `npm test`

---

## Quick Reference Card

| Scenario | ❌ Wrong | ✅ Correct |
|----------|----------|-----------|
| External API response | `const data: any` | `const data: unknown` |
| Dynamic global property | `(globalThis as any).tool` | `(globalThis as { tool?: (...args: unknown[]) => Promise<unknown> }).tool` |
| Test mock | `let mock: any` | `interface Mock { ... }; let mock: Mock` |
| Generic object | `Record<string, any>` | `Record<string, unknown>` |
| Function parameter | `function f(x: any)` | `function f(x: unknown)` or `function f(x: SpecificType)` |
| Type assertion | `value as MyType` | `(value as unknown) as MyType` |
| Validator type param | `Validator<T, 'required', any>` | `Validator<T, 'required', 'required'>` |

---

## When in Doubt

1. Can you define an explicit interface? → **Use interface**
2. Is it external/dynamic data? → **Use `unknown`**
3. Is it a generic object? → **Use `Record<string, unknown>`**
4. Must you assert type? → **Use `(value as unknown) as Type`**

**Never reach for `any`** - it will fail pre-commit hooks and create technical debt.

---

**Version**: 1.0.0
**Last Updated**: 2025-11-01
**Status**: Active - Mandatory for all TypeScript implementations
