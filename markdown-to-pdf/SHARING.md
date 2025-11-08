# How to Share the Markdown-to-PDF Skill

This guide explains how to share this Claude skill with colleagues, clients, or other Claude Code users.

## Quick Answer: Yes, You Can Share It!

You can share this skill via:
- ✅ Email (ZIP file)
- ✅ Cloud storage (Google Drive, Dropbox, OneDrive)
- ✅ Git repository (GitHub, GitLab, Bitbucket)
- ✅ Internal file server
- ✅ USB drive

## Option 1: Share ZIP File (Easiest)

### Create the Distribution Package

**On Windows**:
```powershell
cd C:/Users/LeeLee/.claude/skills/markdown-to-pdf
powershell -ExecutionPolicy Bypass -File package-for-distribution.ps1
```

This creates: `markdown-to-pdf-skill-v1.0.0.zip` (~99KB)

### Send to Recipients

**Via Email**:
1. Attach `markdown-to-pdf-skill-v1.0.0.zip`
2. Include instructions (see template below)
3. Send!

**Via Cloud Storage**:
1. Upload ZIP to Google Drive / Dropbox / OneDrive
2. Share link with recipients
3. Include instructions

### Email Template

```
Subject: Claude Skill - Markdown to PDF Converter

Hi [Name],

I'm sharing a Claude Code skill that converts markdown documents
to professional, branded PDFs with accurate page numbering.

What it does:
- Converts markdown → PDF with branding
- Adds logo, headers, footers
- Generates table of contents with page numbers
- Visual validation to verify layout

Installation:
1. Download the attached ZIP file
2. Extract to: C:\Users\YourName\.claude\skills\
3. Open terminal in the extracted folder
4. Run: npm install
5. Run: npx playwright install chromium

Usage:
Ask Claude: "Convert my proposal.md to a branded PDF"

See README.md inside the ZIP for detailed instructions.

[Your name]
```

## Option 2: GitHub Repository (Professional)

### Create a GitHub Repo

```bash
cd C:/Users/LeeLee/.claude/skills/markdown-to-pdf

# Initialize git (if not already)
git init

# Create .gitignore
echo "node_modules/
dist/
*.zip
*.tar.gz
.DS_Store
Thumbs.db" > .gitignore

# Add files
git add .
git commit -m "Initial commit - markdown-to-pdf skill v1.0.0"

# Create repo on GitHub, then:
git remote add origin https://github.com/yourusername/markdown-to-pdf-skill.git
git push -u origin main
```

### Recipients Clone the Repo

```bash
cd C:/Users/TheirName/.claude/skills/
git clone https://github.com/yourusername/markdown-to-pdf-skill.git markdown-to-pdf
cd markdown-to-pdf
npm install
npx playwright install chromium
```

**Benefits**:
- Version control
- Easy updates (git pull)
- Issue tracking
- Collaboration

## Option 3: Internal File Server

For organizations with shared drives:

```
\\fileserver\shared\claude-skills\markdown-to-pdf-skill-v1.0.0.zip
```

Recipients:
1. Copy ZIP from shared drive
2. Extract to `.claude/skills/`
3. Run `npm install` and `npx playwright install chromium`

## What Gets Shared

The distribution package includes:

**Essential Files**:
- `SKILL.md` - Workflow guide for Claude
- `README.md` - Installation instructions
- `reference/` - Detailed documentation
- `scripts/` - PDF generation scripts
- `dist/` - Compiled JavaScript
- `package.json` - Dependency list
- `config-template.json` - Example configuration

**Source Code** (optional):
- `src/` - TypeScript source
- `tsconfig.json` - TypeScript config

**NOT Included** (recipient installs these):
- `node_modules/` - npm dependencies (~200MB)
- Generated PDFs
- Temporary files

## Recipient Requirements

**Software**:
- Node.js 18+ (required)
- Python 3.7+ (optional, for visual validation)
- Claude Code CLI (required)

**System**:
- Windows, macOS, or Linux
- ~250MB disk space (after npm install)

**Skills**:
- Basic terminal/command line usage
- Ability to run npm commands

## Updates and Versioning

When you update the skill:

**Option A - New ZIP**:
1. Update version in `package-for-distribution.ps1`
2. Run the script to create new ZIP
3. Share new version: `markdown-to-pdf-skill-v1.1.0.zip`

**Option B - Git**:
1. Commit changes: `git commit -am "v1.1.0 - Added feature X"`
2. Tag version: `git tag v1.1.0`
3. Push: `git push && git push --tags`
4. Recipients update: `git pull`

## License and Distribution Rights

**Current Status**: Internal use only

Before widespread distribution:
- [ ] Decide on license (MIT, Apache 2.0, Proprietary, etc.)
- [ ] Add LICENSE file
- [ ] Update README.md with license info
- [ ] Consider intellectual property rights
- [ ] Check dependencies' licenses (all are permissive open source)

**Dependencies used** (all open source):
- Playwright (Apache 2.0)
- pdf-lib (MIT)
- markdown-it (MIT)
- sharp (Apache 2.0)
- PyMuPDF (AGPL, optional)

## Troubleshooting for Recipients

### "npm install fails"

- Ensure Node.js 18+ is installed: `node --version`
- Run as administrator (Windows) or with sudo (macOS/Linux)
- Clear npm cache: `npm cache clean --force`

### "Chromium download fails"

- Run separately: `npx playwright install chromium`
- Check internet connection
- Check firewall/proxy settings

### "Skill not detected by Claude"

- Verify location: `C:\Users\TheirName\.claude\skills\markdown-to-pdf\SKILL.md` must exist
- Restart Claude Code
- Check `.claude/skills/` (not `.claude/skill/` - note the 's')

## Support

**For Recipients**:
- First, check `README.md` and `reference/troubleshooting.md`
- Then contact the skill provider (you)

**For You** (the provider):
- Keep a copy of the skill in your `.claude/skills/` folder
- Document any customizations you make
- Consider creating a FAQ based on common questions

## Example Distribution Workflow

**You**:
1. ✅ Run `package-for-distribution.ps1`
2. ✅ Get `markdown-to-pdf-skill-v1.0.0.zip` (99KB)
3. ✅ Email to colleague

**Recipient**:
1. ✅ Downloads ZIP
2. ✅ Extracts to `C:\Users\TheirName\.claude\skills\`
3. ✅ Opens terminal in extracted folder
4. ✅ Runs `npm install`
5. ✅ Runs `npx playwright install chromium`
6. ✅ Asks Claude: "Convert my proposal to PDF"
7. ✅ It works!

---

**Bottom Line**: The skill is fully portable and shareable. Just package it as a ZIP, send it, and the recipient installs dependencies with npm. That's it!
