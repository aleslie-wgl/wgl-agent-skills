---
name: markdown-to-pdf
description: Convert markdown documents to professional PDFs with configuration-driven branding (logos, colors, contact info), accurate page numbering via browser-based measurement, and visual validation. Follow the workflow to transform any markdown into a branded proposal with headers, footers, TOC, and styled tables.
---

# Markdown to PDF Workflow

Convert markdown documents into professional, branded PDFs with accurate page numbers, styled tables, and visual validation.

## When to Use This Skill

- Converting markdown proposals, RFPs, or technical documents to PDF
- Professional branding required (logos, colors, company information)
- Accurate table of contents with page numbers needed
- Need to verify layout visually before completion

## Prerequisites Check

Before running, verify dependencies are installed:

```bash
# Check Node.js installation
node --version  # Should be 18+

# If first time using this skill, install dependencies:
cd C:/Users/LeeLee/.claude/skills/markdown-to-pdf
npm install
npx playwright install chromium

# For visual validation (optional):
pip install PyMuPDF
```

## Workflow: Convert Markdown to PDF

### Step 1: Gather Information

Before generating, collect:

- **Input file**: Path to markdown file
- **Output file**: Where to save PDF (optional, defaults to input name + .pdf)
- **Client name**: Appears in header on every page
- **Company info**: Name, website, email (appears in footer)
- **Logos**:
  - Title logo: Large logo for title page (PNG recommended)
  - Header logo: Small icon for page header (PNG/JPG)
  - Or single logo for both
- **Brand colors** (optional): Hex codes for primary, secondary, table colors

### Step 2: Generate PDF

Run the generation command:

```bash
cd C:/Users/LeeLee/.claude/skills/markdown-to-pdf

node scripts/generate-pdf.js "path/to/input.md" \
  --output "path/to/output.pdf" \
  --client "Client Name" \
  --company "Your Company" \
  --website "yourcompany.com" \
  --email "contact@yourcompany.com" \
  --title-logo "path/to/title-logo.png" \
  --header-logo "path/to/header-icon.png"
```

**Path Guidelines**:
- Use forward slashes (/) even on Windows
- Use absolute paths for reliability
- Wrap paths with spaces in quotes

**Example** (using temp directory for validation):
```bash
node scripts/generate-pdf.js \
  "G:/Shared drives/Proposals/proposal.md" \
  --output "G:/Shared drives/Proposals/proposal.pdf" \
  --client "Alberta Pensions Services Corporation" \
  --company "WhiteGlove Labs AI Ltd." \
  --website "whiteglovelabs.ai" \
  --email "alexander.leslie@whiteglovelabs.ai" \
  --title-logo "G:/Shared drives/Branding/Logo Gold.png" \
  --header-logo "G:/Shared drives/Branding/icon-leaf.jpg"

# Then validate (screenshots go to temp):
python scripts/validation/extract_pdf_pages.py \
  "G:/Shared drives/Proposals/proposal.pdf" \
  "%TEMP%/pdf-validation" \
  2 3 4

# Clean up after viewing:
del /Q "%TEMP%\pdf-validation\page-*.png"
rmdir "%TEMP%\pdf-validation"
```

### Step 3: Verify Output

The tool will output:
```
✓ Generated PDF: output.pdf (578KB)
Pages: 37
Size: 0.56 MB
Headings: 87 / 87 with page numbers
```

Check the summary:
- **Headings**: Should show "X / X with page numbers" (100% accuracy)
- **File size**: Should be reasonable (~500KB-1MB for typical proposals)
- **Pages**: Note the page count

### Step 4: Visual Validation (Critical!)

**Always perform visual validation** when:
- First time processing a new document type
- User has changed configuration (logos, colors)
- User reports visual issues
- Making layout changes

**Extract sample pages to temp directory**:

```bash
# Windows: Use %TEMP% environment variable
python scripts/validation/extract_pdf_pages.py \
  "path/to/output.pdf" \
  "%TEMP%/pdf-validation" \
  2 3 4 5
```

This extracts pages 2, 3, 4, 5 as PNG images to a temporary directory for visual inspection.

**What to check**:
- ✅ Header appears on all pages with proper spacing
- ✅ Content doesn't overlap header line
- ✅ Footer appears on all pages
- ✅ Tables are formatted properly
- ✅ Page breaks occur at H1 headings
- ✅ Logos render correctly

**View extracted images**:

Use the Read tool to view the extracted PNG files from the temp directory and verify layout.

**IMPORTANT: Clean up after validation**:

```bash
# Windows: Delete temp screenshots after viewing
del /Q "%TEMP%\pdf-validation\page-*.png"
rmdir "%TEMP%\pdf-validation"
```

Always delete the temporary screenshots immediately after verification to avoid clutter.

### Step 5: Fix Issues (If Found)

If visual validation reveals problems:

1. **Header overlap**: Check reference/troubleshooting.md
2. **Logo issues**: Verify paths use forward slashes
3. **Color problems**: Check hex code format (#rrggbb)
4. **Layout problems**: Review reference/architecture.md

Common fixes:
- Re-run after fixing logo paths
- Adjust brand colors if needed
- Rebuild if you modified TypeScript source: `npm run build`

### Step 6: Deliver

Once visual validation passes:
- Confirm PDF location with user
- Report file size and page count
- Ensure temp validation files were cleaned up in Step 4

## Quick Reference

### Minimal Command (Default Colors/Settings)

```bash
node scripts/generate-pdf.js input.md \
  --client "Client Name" \
  --logo "path/to/logo.png"
```

### With Custom Colors

```bash
node scripts/generate-pdf.js input.md \
  --client "Client Name" \
  --logo "path/to/logo.png" \
  --primary-color "#1a365d" \
  --secondary-color "#2c5282"
```

### Using Configuration File

Create `client-config.json`:
```json
{
  "branding": {
    "client": "Client Name",
    "company": {
      "name": "Your Company",
      "website": "yourcompany.com",
      "email": "contact@yourcompany.com"
    },
    "logo": {
      "titlePath": "/path/to/title-logo.png",
      "headerPath": "/path/to/header-icon.png"
    }
  }
}
```

Run:
```bash
node scripts/generate-pdf.js input.md --config client-config.json
```

## Features Explained

### Automatic Table Transformation

Code blocks containing markdown tables are automatically converted to styled HTML:

**Input**:
````markdown
```
Month | Phase      | Budget
------|------------|--------
Jan   | Planning   | $50,000
Feb   | Execution  | $150,000
```
````

**Output**: Professional styled table with:
- Brand-colored headers
- Cell borders
- Alternating row colors
- Proper spacing

### Accurate Page Numbering

- Uses browser-based position measurement (Playwright)
- Two-pass generation: first pass measures, second generates with accurate TOC
- 100% accuracy (all headings get correct page numbers)
- Accounts for title page offset

### Logo Compression

- Automatically compresses logos for optimal file size
- Title logo: ~20KB (from 1MB+)
- Header logo: ~1KB (from 36KB+)
- Maintains visual quality

### Professional Output

- **Title page**: Logo, client name, date, company branding
- **Table of contents**: Accurate page numbers for level 1-2 headings
- **Headers**: Logo + client name on every page (1.25" top margin)
- **Footers**: Company info + page numbers (0.75" bottom margin)
- **Styled tables**: Brand colors, borders, alternating rows
- **Page breaks**: Each level 1 heading starts new page

## Troubleshooting

### Error: "Logo file not found"

- Use absolute paths
- Use forward slashes (/)
- Verify file exists: `ls "path/to/logo.png"`

### Header Overlapping Content

- This is fixed in current version (1.25" top margin)
- Run visual validation to confirm
- See reference/troubleshooting.md if issues persist

### Inaccurate Page Numbers

- Should be 100% accurate with browser-based measurement
- Verify output shows "X / X with page numbers" (all headings counted)
- Check reference/architecture.md for calculation details

### Build Errors

```bash
npm run clean
npm install
npm run build
```

### Visual Validation Fails

- Install PyMuPDF: `pip install PyMuPDF`
- Verify script exists: `ls scripts/validation/extract_pdf_pages.py`
- Check Python is in PATH

## Detailed Documentation

For advanced topics, see:

- **reference/architecture.md**: Implementation details, design decisions
- **reference/troubleshooting.md**: Common issues and solutions
- **reference/configuration.md**: Configuration options and examples

## Key Principles

1. **Visual validation is critical** - Always verify layout with actual PDF screenshots
2. **Use adequate margins** - Don't use CSS tricks to compensate for insufficient space
3. **Simple over complex** - Straightforward solutions beat clever CSS workarounds
4. **Progressive disclosure** - Check detailed references only when needed

## Workflow Checklist

For each PDF generation:

- [ ] Gather client info, logos, branding
- [ ] Run generate-pdf.js with proper paths
- [ ] Check output summary (page count, file size, heading accuracy)
- [ ] Run visual validation (extract pages 2-5 to %TEMP%/pdf-validation)
- [ ] View extracted screenshots using Read tool
- [ ] Verify headers, footers, spacing, tables
- [ ] Delete temp screenshots immediately after viewing
- [ ] Fix any issues found (repeat validation if needed)
- [ ] Deliver PDF to user with confirmation

## Example Session

**User**: "Convert this proposal to PDF for Alberta Pensions"

**Claude**:
1. Checks prerequisites (npm, playwright installed)
2. Gathers info: client name, logos, company details
3. Runs generate-pdf.js with full parameters
4. Extracts pages 2-5 for visual validation
5. Uses Read tool to view screenshots
6. Verifies header spacing, table formatting, logo placement
7. Confirms PDF location and specs with user

---

**Version**: 1.0.0
**Dependencies**: Node.js 18+, Playwright, PyMuPDF (Python, optional)
**Last Updated**: November 2025
