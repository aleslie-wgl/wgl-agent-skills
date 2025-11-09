#!/bin/bash
# SessionEnd Hook: Continuous Improvement Review
#
# This hook reminds Claude to review friction and improvements before ending the session

echo "

🔄 ═══════════════════════════════════════════════════════════════════════
   CONTINUOUS IMPROVEMENT CHECK (Before Session End)
═══════════════════════════════════════════════════════════════════════

Before ending this session, review your work for improvement opportunities:

📋 FRICTION DETECTION:
   - What manual steps did you repeat 3+ times?
   - What errors occurred repeatedly?
   - What knowledge did you lack that caused delays?
   - What queries/checks used excessive context tokens?
   - What debugging took longer than expected?

🛠️ IMPROVEMENTS TO CREATE:
   □ Skills - Document new patterns/techniques discovered
   □ Scripts - Automate repeated manual steps
   □ Guidelines - Add best practices to CLAUDE.md
   □ Templates - Create reusable code patterns
   □ Hooks - Automate future quality checks

💡 QUALITY CHECKS:
   □ Did you create validation scripts instead of manual queries?
   □ Did you use Convex Operations skill for API paths?
   □ Did you follow MCP Query Optimization guidelines?
   □ Did you stay under 70% context usage?
   □ Did you document what the next agent needs?

📊 SESSION METRICS:
   - Context used: Check with /context command
   - Tools created: Count new files in .claude/skills/ and scripts/
   - Documentation updated: Check git diff

═══════════════════════════════════════════════════════════════════════

If you created improvements during the session, summarize them for the user.
If you didn't but should have, note what could be improved for next time.

"
