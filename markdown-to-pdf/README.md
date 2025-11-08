# Markdown to PDF Skill - Installation Guide

Convert markdown documents to professional, branded PDFs with accurate page numbering and visual validation.

## For Recipients: How to Install This Skill

### Prerequisites

- **Node.js 18+**: [Download here](https://nodejs.org/)
- **Python 3.7+**: [Download here](https://www.python.org/) (optional, for visual validation)
- **Claude Code**: This skill is designed for Claude Code CLI

### Installation Steps

#### 1. Locate Your Claude Skills Directory

**Windows**:
```bash
C:\Users\YourUsername\.claude\skills\
```

**macOS/Linux**:
```bash
~/.claude/skills/
```

#### 2. Extract This Skill

Extract the `markdown-to-pdf` folder into your skills directory:

```
.claude/
└── skills/
    └── markdown-to-pdf/    ← Extract here
        ├── SKILL.md
        ├── reference/
        ├── scripts/
        ├── package.json
        └── ...
```

#### 3. Install Dependencies

Open a terminal and run:

```bash
# Navigate to the skill folder
cd C:/Users/YourUsername/.claude/skills/markdown-to-pdf

# Install Node.js dependencies
npm install

# Install Chromium for PDF rendering
npx playwright install chromium

# Optional: Install PyMuPDF for visual validation
pip install PyMuPDF
```

**Note**: The `npm install` step will take a few minutes and download ~200MB of dependencies.

#### 4. Verify Installation

Test the skill:

```bash
node scripts/generate-pdf.js --help
```

You should see usage information.

### First Use

Create a simple test:

**1. Create a test markdown file** (`test.md`):
```markdown
# Test Document

This is a test.

## Section 1

Some content here.
```

**2. Generate a PDF**:
```bash
node scripts/generate-pdf.js test.md \
  --client "Test Client" \
  --company "Your Company" \
  --website "yourcompany.com" \
  --email "you@yourcompany.com"
```

**3. Check the output**: You should see `test.pdf` created.

## Usage with Claude

Once installed, Claude Code will automatically detect this skill. Ask Claude:

> "Convert my proposal.md to a branded PDF for [Client Name]"

Claude will:
1. Ask for client details and logo paths
2. Run the PDF generation
3. Perform visual validation
4. Deliver the final PDF

## Customization

### Create Client Configurations

Save reusable configurations in JSON files:

```json
{
  "branding": {
    "client": "Your Client Name",
    "company": {
      "name": "Your Company",
      "website": "yourcompany.com",
      "email": "contact@yourcompany.com"
    },
    "logo": {
      "titlePath": "/absolute/path/to/title-logo.png",
      "headerPath": "/absolute/path/to/header-icon.png"
    },
    "colors": {
      "primary": "#1a365d",
      "secondary": "#2c5282",
      "tableHeader": "#1a365d",
      "tableRowAlt": "#f7fafc"
    }
  }
}
```

Use with:
```bash
node scripts/generate-pdf.js proposal.md --config my-config.json
```

## Troubleshooting

### "Cannot find module" errors

Run:
```bash
npm install
```

### "Chromium not found" errors

Run:
```bash
npx playwright install chromium
```

### Logo not found errors

- Use **absolute paths** to logo files
- Use **forward slashes** (/) even on Windows
- Verify the file exists: `ls "/path/to/logo.png"`

### Visual validation not working

Install PyMuPDF:
```bash
pip install PyMuPDF
```

## Getting Help

- **Workflow guide**: See `SKILL.md`
- **Configuration options**: See `reference/configuration.md`
- **Common issues**: See `reference/troubleshooting.md`
- **Architecture details**: See `reference/architecture.md`

## What This Skill Does

- ✅ Converts markdown to professional PDFs
- ✅ Adds branded title page with logo
- ✅ Generates accurate table of contents with page numbers
- ✅ Adds headers and footers to every page
- ✅ Styles tables with brand colors
- ✅ Compresses logos for optimal file size
- ✅ Visual validation to verify layout

## System Requirements

- **Node.js**: 18+ (required)
- **Python**: 3.7+ (optional, for visual validation)
- **Disk space**: ~250MB (for dependencies)
- **Operating system**: Windows, macOS, or Linux

## License

Internal use only - check with the skill creator for distribution rights.

---

**Version**: 1.0.0
**Last Updated**: November 2025
**Created by**: WhiteGlove Labs AI
