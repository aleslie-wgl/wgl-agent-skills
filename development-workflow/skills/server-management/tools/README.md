# Server Management Setup

This directory contains tools for managing development servers.

## First-Time Setup

1. Copy templates to your project's scripts/ directory:
   ```bash
   cp .claude/skills/server-management/templates/*.template scripts/
   cd scripts
   mv start-servers.sh.template start-servers.sh
   mv start-servers.ps1.template start-servers.ps1
   mv stop-servers.sh.template stop-servers.sh
   mv stop-servers.ps1.template stop-servers.ps1
   chmod +x *.sh
   ```

2. Customize scripts for your stack by replacing placeholders:
   - `{{FRONTEND_PORT}}` - e.g., 3000, 8765
   - `{{BACKEND_PORT}}` - e.g., 3001, 5001
   - `{{FRONTEND_COMMAND}}` - e.g., "npm run dev", "npx next dev"
   - `{{BACKEND_COMMAND}}` - e.g., "npx convex dev", "python manage.py runserver"

3. Test your scripts:
   ```bash
   ./scripts/start-servers.sh  # or .ps1 on Windows
   ```

## Usage

The server-management skill will automatically check if scripts exist and guide you through setup if needed.
