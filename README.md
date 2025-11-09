# WhiteGlove Labs Agent Skills Marketplace

Professional skills for Claude Code - Complete development workflows, knowledge base, thinking frameworks, and enterprise tools.

## Available Plugins

The marketplace is organized into 5 thematic plugins:

### 1. development-workflow [WORKFLOW]

Complete development workflow plugin for spec-driven development, TDD, git operations, testing, and deployment.

**Contents**: Spec-driven dev skills, TDD workflows, git automation, deployment management.

**Use when**: Building features with spec-first methodology, implementing TDD, deploying code.

### 2. development-knowledge [KNOWLEDGE]

Reference documentation and best practices for technical development tools and patterns.

**Contents**: Claude SDK patterns, Convex reference, TypeScript best practices, testing patterns.

**Use when**: Looking up SDK documentation, needing pattern examples, checking best practices.

### 3. thinking-frameworks [META]

Meta-thinking skills for advanced problem-solving, architectural decisions, and innovation.

**Contents**: Collision zones, inversion thinking, pattern recognition, root cause analysis, scale thinking, simplification.

**Use when**: Need breakthrough thinking, solving complex architectural problems, debugging at source.

### 4. markdown-to-pdf [TOOL]

Professional PDF generation from markdown with branding, formatting, and visual validation.

**Features**: Configuration-driven branding, accurate TOC with page numbers, professional headers/footers.

**Use when**: Converting markdown to professional PDFs, branding required, accurate formatting needed.

### 5. mcp-recommended-servers [CONFIG]

Optional MCP server configurations for enhanced development tools.

**Includes**: context7, perplexity, playwright, convex servers.

**Use when**: Setting up development environment with recommended servers.

## Plugin Type Tags

- **[WORKFLOW]**: Complete development workflows with orchestration and agents
- **[KNOWLEDGE]**: Reference documentation and best practices
- **[META]**: Meta-thinking skills for architectural decisions
- **[TOOL]**: Standalone tools and utilities
- **[CONFIG]**: Configuration files and server setup

## Installation

### Option 1: Via Claude Code UI (Coming Soon)

Once Claude Code supports marketplace UI, you'll be able to install directly from settings.

### Option 2: Manual Installation

Add to your `C:\Users\YourName\.claude\plugins\known_marketplaces.json`:

```json
{
  "wgl-agent-skills": {
    "source": {
      "source": "github",
      "repo": "aleslie-wgl/wgl-agent-skills"
    },
    "installLocation": "C:\Users\YourName\.claude\plugins\marketplaces\wgl-agent-skills",
    "lastUpdated": "2025-11-08T00:00:00.000Z"
  }
}
```

### Enabling/Disabling Individual Plugins

After installation, control which plugins are active in your `settings.json`:

```json
{
  "enabledPlugins": {
    "development-workflow@wgl-agent-skills": true,
    "development-knowledge@wgl-agent-skills": true,
    "thinking-frameworks@wgl-agent-skills": true,
    "markdown-to-pdf@wgl-agent-skills": true,
    "mcp-recommended-servers@wgl-agent-skills": false
  }
}
```

### Post-Installation Setup

Install dependencies for plugins that require them:

```bash
# For markdown-to-pdf (requires Node.js 18+)
cd C:\Users\YourName\.claude\plugins\marketplaces\wgl-agent-skills\markdown-to-pdf
npm install
npx playwright install chromium

# Optional: For visual validation of PDFs
pip install PyMuPDF
```

## Usage Examples

### Using development-workflow
```
I need to build a new feature. Here's the description:
"Add user profile page with edit capability, real-time sync, and validation"

Please spec this feature and create an implementation plan.
```

### Using development-knowledge
```
I'm implementing a Convex mutation with authentication. What's the pattern
for checking user permissions before allowing the mutation?
```

### Using thinking-frameworks
```
I'm stuck on this architecture problem. Can you help me think through it
using some meta-thinking frameworks?
```

### Using markdown-to-pdf
```
Convert my proposal.md to a branded PDF for [Client Name]
```

## Dependencies by Plugin

### development-workflow
- Node.js 18+ (for testing and validation scripts)

### development-knowledge
- No external dependencies (reference documentation only)

### thinking-frameworks
- No external dependencies (meta-thinking skills only)

### markdown-to-pdf
- Node.js 18+ (required)
- Chromium (via `npx playwright install chromium`)
- PyMuPDF (Python, optional): For visual validation

### mcp-recommended-servers
- Node.js 18+ (to run MCP servers)
- Respective API keys for each service

## Contributing

To add new plugins to this marketplace:
1. Fork this repository
2. Create a new plugin directory at root level
3. Create `.claude-plugin/plugin.json` with plugin metadata
4. Add skills, agents, commands, or config files as needed
5. Update `.claude-plugin/marketplace.json` to include your plugin
6. Submit a pull request

## Marketplace Structure

```
wgl-agent-skills/
├── .claude-plugin/
│   └── marketplace.json                    ← Marketplace metadata
├── development-workflow/                    ← Workflow plugin
│   ├── .claude-plugin/
│   │   └── plugin.json
│   ├── skills/
│   ├── agents/
│   └── commands/
├── development-knowledge/                   ← Knowledge plugin
│   ├── .claude-plugin/
│   │   └── plugin.json
│   └── skills/
├── thinking-frameworks/                     ← Meta-thinking plugin
│   ├── .claude-plugin/
│   │   └── plugin.json
│   └── skills/
├── markdown-to-pdf/                         ← Tool plugin
│   ├── .claude-plugin/
│   │   └── plugin.json
│   ├── SKILL.md
│   ├── README.md
│   ├── scripts/
│   ├── reference/
│   └── dist/
├── mcp-recommended-servers/                 ← Config plugin
│   ├── .claude-plugin/
│   │   └── plugin.json
│   └── .mcp.json
├── README.md                                ← This file
└── .gitignore
```

## License

Individual plugins may have their own licenses. Check each plugin's directory for license information.

---

**Maintained by**: WhiteGlove Labs AI
**Contact**: alexander.leslie@whiteglovelabs.ai
**Website**: https://whiteglovelabs.ai
**GitHub**: https://github.com/aleslie-wgl/wgl-agent-skills
**Version**: 2.0.0 - Plugin-based architecture with 5 thematic plugins
