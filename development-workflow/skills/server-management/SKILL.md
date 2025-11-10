---
name: server-management
description: "[WORKFLOW] Reliable server startup, verification, and shutdown for development workflows"
when_to_use: At session start/end, when servers needed for testing, or when verifying server health
version: 1.1.0
type: workflow
---

# Server Management Skill

**Purpose**: Provide reliable patterns for starting, verifying, and managing development servers on Windows Git Bash.

---

## Prerequisites

**FIRST-TIME SETUP**: If this is your first time using the server-management skill in a new repository, initialize the server scripts:

```bash
# Initialize server management scripts (auto-detects your stack)
Bash: npx tsx .claude/skills/server-management/tools/init-server-scripts.ts

# What it detects:
# - Next.js vs Vite vs custom dev server
# - Convex deployment
# - Monorepo structure (Turborepo, workspaces)
# - Port configuration
# - Custom npm scripts

# Generates:
# - scripts/start-servers.sh (customized for your stack)
# - scripts/stop-servers.sh (with proper cleanup)
```

**After initialization**, you'll have two executable scripts:
- `scripts/start-servers.sh` - Starts all dev servers, tracks PIDs
- `scripts/stop-servers.sh` - Stops all servers, cleans up PIDs

**Skip this if** `scripts/start-servers.sh` already exists in the repository.

**To regenerate** (e.g., after adding Convex to project):
```bash
# Re-run init to update scripts
Bash: npx tsx .claude/skills/server-management/tools/init-server-scripts.ts --port=8765
```

---

## Common Problems This Skill Solves

1. **Assumption over verification**: Seeing port occupied ≠ correct server running
2. **Multiple background processes**: Creating server spam instead of reusing existing
3. **Orphaned processes**: Servers left running after session ends
4. **No health checks**: Servers crash after startup but code assumes they're healthy

---

## Process: Start Servers

### Use the Startup Script

**ALWAYS use the provided scripts** - they handle all the complexity:

**PowerShell**:
```bash
Bash: powershell -File ./scripts/start-servers.ps1
```

**Git Bash**:
```bash
Bash: chmod +x ./scripts/start-servers.sh && ./scripts/start-servers.sh
```

**What the script does**:
1. Creates `.pids/` directory for process tracking
2. Starts Next.js on port 8765 (records PID to `.pids/next.pid`)
3. Starts Convex dev (records PID to `.pids/convex.pid`)
4. Outputs status and URLs
5. Stores logs in `.pids/next.log` and `.pids/convex.log` (Git Bash only)

**DO NOT**:
- ❌ Manually start servers with `npm run dev` or `npx convex dev`
- ❌ Use `run_in_background=true` in Bash tool
- ❌ Try to manage PIDs manually
- ❌ Check ports manually before starting

The script handles all port checking, process management, and error handling.

---

### Step 3: Verify Server Health

**NEVER skip health verification**. Always test endpoints:

```bash
# Next.js health check
curl -s -m 2 http://localhost:8765 | head -n 1
# Expected: HTML response or redirect

# Convex health check
BashOutput: [convex-task-id]
# Expected: "Convex functions ready" in stderr
```

**If health check fails**:
1. Check BashOutput for error messages
2. Kill background process
3. Check logs for root cause
4. Fix issue and retry

---

### Step 4: Record Server State

Create or update a server state file for session tracking:

```markdown
## Current Session Servers

**Next.js**:
- Port: 8765
- Task ID: bf3ead
- Status: Healthy ✓
- Started: 2025-11-03 20:00:00

**Convex**:
- Port: 3001
- Task ID: 0f2016
- Status: Healthy ✓
- Started: 2025-11-03 20:00:05
```

This helps:
- Future agents know servers are running
- Avoid duplicate server starts
- Track which processes to kill at session end

---

## Process: Check Server Status

**ALWAYS use the check-servers script** - never write port checks manually.

### Quick Check

```bash
Bash: npx tsx scripts/check-servers.ts
```

**Output**:
```
============================================================
SERVER STATUS CHECK
============================================================

Timestamp: 11/7/2025, 12:30:00 PM

✓ Next.js
  Status: RUNNING
  Details: Server responding with HTTP 200
  Port: 8765
  PID: 35412
  URL: http://localhost:8765

✓ Convex
  Status: RUNNING
  Details: Deployment accessible at https://successful-wren-357.convex.cloud
  URL: https://successful-wren-357.convex.cloud

============================================================
Overall Status: ✓ ALL HEALTHY
============================================================
```

**Exit codes**:
- `0`: All servers healthy ✓
- `1`: Some servers down ⚠️
- `2`: All servers down ✗

### JSON Output (for scripts)

```bash
Bash: npx tsx scripts/check-servers.ts --json
```

Returns structured JSON:
```json
{
  "timestamp": "2025-11-07T17:30:00.000Z",
  "allHealthy": true,
  "servers": [
    {
      "name": "Next.js",
      "status": "running",
      "details": "Server responding with HTTP 200",
      "port": 8765,
      "pid": 35412,
      "url": "http://localhost:8765"
    },
    {
      "name": "Convex",
      "status": "running",
      "details": "Deployment accessible at https://...",
      "url": "https://successful-wren-357.convex.cloud"
    }
  ]
}
```

### When to Use

**Run check-servers.ts before**:
- Starting browser tests
- Running E2E tests
- Frontend validation
- Smoke tests
- Creating validation reports

**DO NOT**:
- ❌ Manually check ports with `netstat` or `powershell`
- ❌ Use `curl` directly to test endpoints
- ❌ Check PIDs manually
- ❌ Write server status checks on the fly

The script handles all verification cross-platform.

---

## Process: Verify Server Health (During Session)

**Use the check-servers script** (see above). If it reports issues:

1. Check exit code: `echo $?` (bash) or `$LASTEXITCODE` (PowerShell)
2. If exit code = 1 or 2, restart affected servers
3. Run check-servers.ts again to verify

**If script fails repeatedly**:
- Check logs in `.pids/next.log` and `.pids/convex.log`
- Look for port conflicts
- Verify environment variables (`NEXT_PUBLIC_CONVEX_URL`)

---

## Process: Shutdown Servers (End of Session)

### Use the Shutdown Script

**ALWAYS use the provided scripts** - they handle graceful shutdown:

**PowerShell**:
```bash
Bash: powershell -File ./scripts/stop-servers.ps1
```

**Git Bash**:
```bash
Bash: ./scripts/stop-servers.sh
```

**What the script does**:
1. Reads PIDs from `.pids/next.pid` and `.pids/convex.pid`
2. Stops processes gracefully
3. Cleans up PID files
4. Removes log files (Git Bash only)
5. Removes `.pids/` directory

**DO NOT**:
- ❌ Manually kill processes with `KillShell` tool
- ❌ Use `Stop-Process` PowerShell commands
- ❌ Try to verify ports manually
- ❌ Leave background tasks running

The script handles all cleanup and verification.

---

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Port Check = Server Healthy

```bash
# WRONG: Assumes port occupied = correct server
netstat -ano | findstr :3001
if port_found:
  assume_convex_running = true  # DANGEROUS
```

**Fix**: Always verify process name AND test endpoint.

---

### ❌ Anti-Pattern 2: Starting Multiple Servers

```bash
# WRONG: Starting server without checking existing
Bash: npm run dev  # First agent
Bash: npm run dev  # Second agent (conflict!)
Bash: npm run dev  # Third agent (port already in use)
```

**Fix**: Check ports first (Step 1), reuse if healthy.

---

### ❌ Anti-Pattern 3: No Timeout Protection

```bash
# WRONG: Infinite wait for server
Bash (run_in_background=true): npm run dev
# Hangs forever if server fails to start
```

**Fix**: Always set timeout (60000ms recommended).

---

### ❌ Anti-Pattern 4: Orphaned Processes

```bash
# WRONG: Starting servers but never cleaning up
Session starts → Start servers → Session ends → Processes orphaned
```

**Fix**: Use ci-cd agent for session lifecycle management.

---

## Windows-Specific Gotchas

### Issue: `timeout /t N` Not Available in Git Bash

**Problem**: `timeout` is a Windows command, not available in Git Bash.

**Solution**: Use `ping` for delays:
```bash
ping -n 11 127.0.0.1 > nul  # Wait ~10 seconds (n+1)
```

### Issue: PowerShell Errors Are Verbose

**Problem**: PowerShell errors spam output when port not found.

**Solution**: Use `-ErrorAction SilentlyContinue`:
```powershell
Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
```

### Issue: Background Task Output Buffering

**Problem**: `BashOutput` may not show recent output immediately.

**Solution**: Wait briefly before checking:
```bash
ping -n 3 127.0.0.1 > nul
BashOutput: [task-id]
```

---

## Quality Checklist

Before claiming "servers running":

- [ ] Verified ports occupied (not just assumed)
- [ ] Verified correct process names (node.exe)
- [ ] Tested health endpoints (curl or BashOutput)
- [ ] Recorded task IDs for later reference
- [ ] Documented server state for other agents

Before claiming "servers stopped":

- [ ] Killed background tasks (KillShell)
- [ ] Verified ports released (netstat)
- [ ] Cleaned up state files

---

## Integration with Other Skills

- **spec-validate**: Requires servers running for E2E tests
- **frontend-debugging**: Requires servers for page load testing
- **continuous-improvement**: Track server management friction for future automation

---

## Example: Complete Startup Workflow

```bash
# Start servers using script
Bash: powershell -File ./scripts/start-servers.ps1

# Output:
# Starting development servers...
# Starting Next.js dev server on port 8765...
#   Next.js PID: 12345
# Starting Convex dev server...
#   Convex PID: 12346
#
# Servers started successfully!
#   Next.js: http://localhost:8765
#   Convex: Running in background
#
# To stop servers: .\scripts\stop-servers.ps1

# Verify health (optional)
curl -s -o /dev/null -w "%{http_code}" http://localhost:8765
# Expected: 200

# ✅ Servers running and healthy
```

---

## Example: Complete Shutdown Workflow

```bash
# Stop servers using script
Bash: powershell -File ./scripts/stop-servers.ps1

# Output:
# Stopping development servers...
# Stopping Next.js (PID: 12345)...
#   Next.js stopped
# Stopping Convex (PID: 12346)...
#   Convex stopped
#
# Servers stopped successfully!

# ✅ Servers cleanly stopped, PIDs cleaned up
```

---

## ❌ CRITICAL Anti-Pattern: Orchestrators Doing Server Management

### The 50K Token Mistake

**NEVER let orchestrators manually manage servers**. This wastes massive context:

```markdown
❌ BAD: Orchestrator manually starts/stops servers (50K+ tokens wasted)

orchestrator: Let me check if port is occupied...
orchestrator: Kill old server...
orchestrator: Port still occupied, let me force kill...
orchestrator: Check again...
orchestrator: Start new server...
orchestrator: Wait for startup...
orchestrator: Check if it's actually running...
orchestrator: Restart because something went wrong...

Result: 50,000 tokens burned, 30 minutes wasted, multiple orphaned processes
```

```markdown
✅ GOOD: Orchestrator dispatches ci-cd agent (2K tokens)

orchestrator: Task tool with subagent_type=ci-cd
  Action: session-start
  Expected: Servers running and verified

ci-cd agent (with server-management skill):
  - Checks ports
  - Starts servers if needed
  - Verifies health
  - Reports status (200 tokens)

Result: 2,000 tokens total, 2 minutes, clean execution
```

### The Rule

**IF you are an orchestrator AND you need to manage servers**:
1. Stop immediately
2. Dispatch ci-cd agent with server-management skill
3. Wait for agent report
4. Continue with your actual task

**DO NOT**:
- Check ports yourself
- Start servers yourself
- Restart servers yourself
- Debug server issues yourself
- Fiddle with multiple task IDs
- Try to kill processes manually

### Why This Matters

- **Context waste**: 50K tokens = $1-2 USD per session
- **Time waste**: 30 min of back-and-forth vs 2 min agent execution
- **Process waste**: Multiple orphaned processes, port conflicts
- **Error prone**: Manual steps introduce bugs

### Example from Real Session

**What happened** (2025-11-03):
- Orchestrator manually checked ports: 5 commands
- Started server: 1 command
- Restart because port conflict: 3 commands
- Check BashOutput: 4 times
- Kill and restart again: 3 commands
- **Total**: 16 tool calls, 50K tokens, 30 minutes

**What should have happened**:
- Dispatch ci-cd agent: 1 tool call
- Agent reports back: 200 tokens
- **Total**: 1 tool call, 2K tokens, 2 minutes

---

## Continuous Improvement Log

### 2025-11-07: Added check-servers.ts Script

**Friction Detected**: Agents were writing server status checks manually every time, using inconsistent commands across Windows/Linux, wasting 10+ tool calls per check.

**Tool Created**: `scripts/check-servers.ts`
- Cross-platform server status checker (Windows/Linux/Mac)
- Checks both Next.js (port 8765) and Convex deployment
- JSON output for programmatic use
- Clear exit codes (0=healthy, 1=partial, 2=down)

**Impact**:
- Reduced from 10+ commands to 1 command
- Consistent output format
- Works on any platform
- Reusable by all agents

**Usage**: `npx tsx scripts/check-servers.ts`

---

**Last Updated**: 2025-11-07 (Added check-servers.ts script)
**Status**: Production ready
**Related Skills**: spec-validate, frontend-debugging, continuous-improvement
