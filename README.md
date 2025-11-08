# WhiteGlove Labs Agent Skills Marketplace

Professional skills for Claude Code - Enterprise-grade document processing and workflow automation.

## Available Skills

### markdown-to-pdf

Convert markdown documents to professional, branded PDFs with accurate page numbering.

**Features**:
- ✅ Configuration-driven branding (logos, colors, contact info)
- ✅ Accurate table of contents with browser-measured page numbers
- ✅ Professional headers and footers on every page
- ✅ Automatic table styling with brand colors
- ✅ Logo compression for optimal file size
- ✅ Visual validation using PyMuPDF
- ✅ Supports separate title page and header logos

**Use when**:
- Converting markdown proposals, RFPs, or technical documents to PDF
- Professional branding required
- Need accurate TOC with page numbers
- Visual verification of layout is critical

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
    "installLocation": "C:\\Users\\YourName\\.claude\\plugins\\marketplaces\\wgl-agent-skills",
    "lastUpdated": "2025-11-08T00:00:00.000Z"
  }
}
```

Then Claude Code will clone this repository and make skills available.

### Post-Installation Setup

After Claude Code clones the marketplace, install dependencies for markdown-to-pdf:

```bash
cd C:\Users\YourName\.claude\plugins\marketplaces\wgl-agent-skills\markdown-to-pdf
npm install
npx playwright install chromium
```

**Optional** (for visual validation):
```bash
pip install PyMuPDF
```

**Note**: This is a one-time setup per skill. After installation, the skill works automatically when Claude uses it.

## Usage

Once installed and enabled in `settings.json`:

```json
{
  "enabledPlugins": {
    "markdown-to-pdf@wgl-agent-skills": true
  }
}
```

Simply ask Claude:
```
Convert my proposal.md to a branded PDF for [Client Name]
```

Claude will:
1. Ask for client details and logos
2. Generate the PDF with accurate page numbers
3. Perform visual validation
4. Deliver the final PDF

## Skill Documentation

Each skill has detailed documentation:
- `markdown-to-pdf/SKILL.md` - Workflow guide for Claude
- `markdown-to-pdf/README.md` - Installation guide for users
- `markdown-to-pdf/reference/` - Detailed technical documentation

## Dependencies per Skill

### markdown-to-pdf
- **Node.js 18+** (required)
- **npm packages**: Installed via `npm install` in skill directory
- **Chromium**: Installed via `npx playwright install chromium`
- **PyMuPDF** (Python, optional): For visual validation

## Contributing

To add skills to this marketplace:
1. Fork this repository
2. Add your skill directory at root level
3. Update `.claude-plugin/marketplace.json` to include your skill
4. Submit a pull request

## Marketplace Structure

```
wgl-agent-skills/
├── .claude-plugin/
│   └── marketplace.json          ← Marketplace metadata
├── markdown-to-pdf/               ← First skill
│   ├── SKILL.md                   ← Claude workflow guide
│   ├── README.md                  ← User installation guide
│   ├── scripts/                   ← Executable scripts
│   ├── reference/                 ← Technical docs
│   └── dist/                      ← Compiled code
├── README.md                      ← This file
└── .gitignore
```

## License

Individual skills may have their own licenses. Check each skill's directory for license information.

The markdown-to-pdf skill is provided for internal use and distribution rights should be verified before sharing.

---

**Maintained by**: WhiteGlove Labs AI
**Contact**: alexander.leslie@whiteglovelabs.ai
**Website**: https://whiteglovelabs.ai
**GitHub**: https://github.com/aleslie-wgl/wgl-agent-skills
