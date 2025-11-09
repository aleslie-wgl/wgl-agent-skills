---
name: performance-optimization
type: knowledge
description: "[KNOWLEDGE] Performance optimization patterns: background process management, MCP query optimization, context management for long sessions"
when_to_use: When managing processes, querying large datasets via MCP, or context approaching 70%+ capacity
version: 1.0.0
---

**Input**: Performance bottleneck or resource constraint
**Output**: Optimization strategy and implementation pattern

---

## Pattern 1: Background Process Management

**CRITICAL**: Avoid creating multiple background processes for the same task. This wastes resources and creates cleanup burden.

### Rules for Background Processes

1. **Only use `run_in_background: true` when necessary**:
   - ✅ Long-running dev servers (`npm run dev`, `npx convex dev`)
   - ✅ Watch processes that need to run indefinitely
   - ❌ Short scripts that complete in < 30 seconds
   - ❌ Debug scripts that should run once and exit

2. **Check if process already exists before starting**:
   ```bash
   # Check if port is in use
   netstat -ano | findstr :3000

   # If port is busy, don't start another server
   ```

3. **Don't retry failed background tasks multiple times**:
   - If a debug script times out, fix the issue - don't run it 5 times in background
   - Use synchronous execution for debugging scripts

4. **Clean up background processes when done**:
   ```bash
   # Check status before killing
   BashOutput tool with bash_id

   # Only kill if still running
   KillShell tool with shell_id (if status: running)
   ```

### Example: Debug Script Execution

**❌ WRONG** (creates many background processes):
```bash
# First attempt
Bash: npx tsx scripts/debug.ts (run_in_background: true)
# Second attempt
Bash: npx tsx scripts/debug.ts (run_in_background: true)
# Third attempt
Bash: npx tsx scripts/debug.ts (run_in_background: true)
# Now you have 3 hung processes
```

**✅ CORRECT** (synchronous execution):
```bash
# Run once, wait for result
Bash: npx tsx scripts/debug.ts (timeout: 10000)
# Script completes, output is immediate, no cleanup needed
```

---

## Pattern 2: MCP Query Optimization

**CRITICAL**: MCP database queries can return massive results that exhaust context. Always filter programmatically.

### The Context Cost Problem

Large MCP queries waste context tokens:
- `mcp__convex__data` without limit → Can return 25K+ tokens
- `mcp__convex__tables` → Returns all schema (can be 10K+ tokens)
- Multiple large queries → Context fills up, autocompact triggers

**Rule**: If expected result > 1000 tokens, create a filtering script instead.

### Pattern: Script-Based Filtering

**❌ WRONG** (context-busting):
```typescript
// Tries to get all GPUs, returns everything (25K tokens)
const allGPUs = await mcp__convex__data({
  tableName: "gpu_types",
  order: "asc"
});
// Now you have 25K tokens of data in context
// And you only needed to check if benchmarks exist
```

**✅ CORRECT** (context-preserving):
```typescript
// scripts/check-gpu-benchmarks.ts
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

const client = new ConvexHttpClient(process.env.CONVEX_URL);

async function main() {
  const gpus = await client.query(api.queries.getGPUTypes.getGPUTypes);

  // Filter to only what you need
  const missingBenchmarks = gpus.filter(gpu =>
    gpu.throughput_benchmarks.length < 9
  );

  // Report concisely
  if (missingBenchmarks.length > 0) {
    console.log(`❌ ${missingBenchmarks.length} GPUs missing benchmarks:`);
    missingBenchmarks.forEach(gpu =>
      console.log(`   - ${gpu.name}: ${gpu.throughput_benchmarks.length}/9`)
    );
  } else {
    console.log(`✅ All GPUs have complete benchmarks`);
  }
}

main();
```

**Then run it**:
```bash
Bash: npx tsx scripts/check-gpu-benchmarks.ts
# Output: Concise report (< 500 tokens)
```

### When to Use Scripts vs Direct Queries

| Query Type | Use Direct MCP | Use Script |
|------------|----------------|------------|
| **Single record** | ✅ `mcp__convex__run` with specific ID | - |
| **Small subset** | ✅ `mcp__convex__data` with limit=10 | - |
| **Filtered list** | ❌ Returns everything | ✅ Script with filtering |
| **Aggregation** | ❌ Returns raw data | ✅ Script with reduction |
| **Multiple queries** | ❌ Each query adds tokens | ✅ One script combines |
| **Repeated checks** | ❌ Wastes tokens each time | ✅ Reusable script |

### Benefits of Script-Based Approach

1. **Token Efficiency**: Script output is 50-500 tokens vs 5K-25K for raw query
2. **Reusability**: Same script works across sessions
3. **Clarity**: Focused output, not data dump
4. **Performance**: Faster to run script than process large MCP result
5. **Debugging**: Script logic can be improved iteratively

---

## Pattern 3: Context Management for Long Sessions

**CRITICAL**: Context fills quickly in validation/debugging phases. Preserve tokens by using scripts.

### Context Budget Awareness

Check your context usage with `/context`:
- **< 50% (< 100K tokens)**: Normal operation, direct queries OK
- **50-70% (100K-140K tokens)**: Prefer scripts over direct queries
- **> 70% (> 140K tokens)**: ONLY use scripts, minimize tool calls
- **> 80% (> 160K tokens)**: Approaching autocompact, create concise validation scripts

### Pattern: Validation Script Instead of Multiple Queries

**❌ WRONG** (uses 20K+ tokens):
```bash
# Check database state
mcp__convex__data({ tableName: "gpu_types" })  # 10K tokens

# Check another table
mcp__convex__data({ tableName: "models" })  # 8K tokens

# Run a query
mcp__convex__run({ functionName: "..." })  # 3K tokens

# Total: 21K tokens consumed for validation
```

**✅ CORRECT** (uses < 2K tokens):
```typescript
// scripts/validate-phase-3.ts
async function validate() {
  console.log("🧪 Phase 3 Validation\n");

  // Check 1: GPU benchmarks complete
  const gpus = await client.query(api.queries.getGPUTypes.getGPUTypes);
  const complete = gpus.every(gpu => gpu.throughput_benchmarks.length >= 9);
  console.log(`✅ GPU Benchmarks: ${complete ? 'Complete' : 'Incomplete'}`);

  // Check 2: Interpolation works
  const result = await client.query(api.queries.estimateThroughput.estimateThroughput, {
    gpu_id: gpus[0]._id,
    model_size_billions: 34,
    quantization: "FP16"
  });
  console.log(`✅ Interpolation: ${result.interpolation_method} (${result.confidence * 100}%)`);

  // Check 3: API endpoint
  const apiResponse = await fetch('http://localhost:8765/api/throughput-estimate', {
    method: 'POST',
    body: JSON.stringify({ gpu_id: gpus[0]._id, model_size_billions: 34, quantization: "FP16" })
  });
  console.log(`✅ API: ${apiResponse.ok ? 'Working' : 'Failed'}`);
}

// Total output: < 500 tokens
```

```bash
Bash: npx tsx scripts/validate-phase-3.ts
# Concise output (< 1K tokens) vs 21K tokens from direct queries
```

### Script Templates Location

Store reusable validation scripts in:
- `scripts/validate-*.ts` - Phase validation
- `scripts/check-*.ts` - Database state checks
- `scripts/test-*.ts` - API/UI testing
- `scripts/debug-*.ts` - Debugging tools

These scripts accumulate as **reusable assets** rather than one-off queries.

---

## Decision Matrix

| Scenario | Action | Tool/Pattern |
|----------|--------|--------------|
| Dev server needed | Start once in background | `scripts/start-servers.ps1` |
| Debug script | Run synchronously | `Bash: npx tsx script.ts (timeout: 10000)` |
| Check database | Write filtering script | `scripts/check-*.ts` + Convex client |
| Validate phase | Create validation script | `scripts/validate-*.ts` with concise output |
| Context > 70% | Switch to scripts only | Minimize MCP queries, use scripts |
| Context > 80% | Emergency mode | One-line scripts, no exploration |

---

**Related Skills**:
- For Convex operations: @convex-operations
- For server management: @server-management
- For continuous improvement: @continuous-improvement
