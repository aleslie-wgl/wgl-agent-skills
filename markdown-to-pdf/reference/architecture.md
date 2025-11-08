# PDF-from-Markdown: Architecture & Implementation

## Overview

TypeScript-based tool for converting markdown documents to professional PDFs with:
- **Configuration-driven branding** (logos, colors, contact info)
- **Accurate page numbering** via browser-based measurement
- **Visual validation** using PyMuPDF for layout verification
- **Type safety** (strict TypeScript, no `any` types)

## Core Principles

- **SOLID**: Single responsibility, modular components
- **DRY**: Single source of truth for configuration
- **KISS**: Simple solutions over complex CSS tricks
- **Type Safety**: Compile-time error detection

## Directory Structure

```
markdown-to-pdf/
├── SKILL.md                       # Workflow guide (this is what Claude reads first)
├── reference/
│   ├── architecture.md            # This file - detailed implementation
│   ├── troubleshooting.md         # Common issues and solutions
│   └── configuration.md           # Configuration guide
├── src/
│   ├── config/
│   │   ├── Config.ts              # Configuration loader (JSON + CLI)
│   │   └── defaults.ts            # Default colors and settings
│   ├── markdown/
│   │   ├── MarkdownProcessor.ts   # Main processor + heading extraction
│   │   ├── TableTransform.ts      # Code block tables → HTML
│   │   ├── HeadingTransform.ts    # Add heading IDs
│   │   └── parser.ts              # Markdown-it configuration
│   ├── pdf/
│   │   └── PDFGenerator.ts        # Two-pass PDF generation
│   ├── types/
│   │   └── Config.types.ts        # TypeScript interfaces
│   └── utils/
│       ├── logger.ts              # Console output
│       └── imageCompression.ts    # Logo optimization (Sharp)
├── dist/                          # Compiled JavaScript (generated)
├── scripts/
│   ├── generate-pdf.js            # CLI entry point
│   └── validation/
│       └── extract_pdf_pages.py   # Visual validation (PyMuPDF)
└── config-template.json           # Example configuration

**Excluded from skill package** (local development only):
- node_modules/
- package.json, package-lock.json, tsconfig.json
- Temporary test files
```

## Core Interfaces

### Configuration (src/types/Config.types.ts)

```typescript
export interface ResolvedPDFConfig {
    input: string;                    // Input markdown file path
    output: string;                   // Output PDF path
    branding: BrandingConfig;
}

export interface BrandingConfig {
    client: string;                   // Client name (header)
    company: CompanyInfo;
    logo: LogoConfig;
    colors: ColorScheme;
}

export interface LogoConfig {
    titlePath: string;                // Title page logo file
    headerPath: string;               // Header logo/icon file
    titlePageWidth: number;           // Width on title page (px)
    headerHeight: number;             // Height in header (px)
}

export interface CompanyInfo {
    name: string;
    website: string;
    email: string;
    phone?: string;
    address?: string;
}

export interface ColorScheme {
    primary: string;                  // Primary brand color (hex)
    secondary: string;                // Secondary brand color (hex)
    tableHeader: string;              // Table header background
    tableRowAlt: string;              // Alternating row background
}
```

## Workflow: Two-Pass PDF Generation

### Pass 1: Measure Heading Positions

1. Process markdown to HTML (with transforms)
2. Render HTML in Playwright browser
3. Measure Y-position of each heading using `element.getBoundingClientRect()`
4. Calculate page numbers: `pageNumber = Math.floor(yPosition / 936) + 2`
   - 936px = usable page height (Letter 11" - 1.25" top - 0.75" bottom margins)
   - +2 offset accounts for title page and page numbering starting at 2

### Pass 2: Generate Final PDF

1. **Title Page**: Generate with logo, client name, date (pdf-lib)
2. **Content PDF**: Render HTML with accurate TOC page numbers (Playwright)
   - Header template in 1.25" top margin (Playwright displayHeaderFooter)
   - Footer template in 0.75" bottom margin
3. **Merge**: Combine title + content PDFs (pdf-lib)

## Header Overlap Fix (Critical Learning)

### Problem
Content on pages 3+ intersected with header area, while TOC (page 2) displayed correctly.

### Root Cause
- Header template: 70px tall (logo + border + padding)
- Original margin: 1in (96px) = only 26px clearance
- Complex CSS margin rules created conflicts

### Solution
1. **Increased top margin**: 1in → 1.25in (120px)
   - Provides 50px clearance after 70px header
2. **Simplified CSS**: Removed complex margin-top rules
   - Standard element margins only, no special cases

### Key Learning
**Use adequate physical space instead of CSS tricks.** Trying to compensate for insufficient margins with complex CSS creates unpredictable conflicts.

## Visual Validation

### Why It's Critical
- Browser position measurements ≠ final PDF rendering
- CSS calculations can miss margin conflicts
- Playwright rendering ≠ PDF output

### Implementation: PyMuPDF (Python)

```python
# scripts/validation/extract_pdf_pages.py
import fitz  # PyMuPDF

def extract_pages(pdf_path, page_numbers, output_dir):
    doc = fitz.open(pdf_path)
    for page_num in page_numbers:
        page = doc[page_num - 1]
        mat = fitz.Matrix(2, 2)  # 2x zoom for quality
        pix = page.get_pixmap(matrix=mat)
        output_path = Path(output_dir) / f"page-{page_num}-actual.png"
        pix.save(output_path)
```

**Usage**:
```bash
python scripts/validation/extract_pdf_pages.py output.pdf ./screenshots 2 3 4 5
```

**Why Python**: Multiple Node.js libraries failed (pdf2pic, pdfjs-dist, pdf-img-convert) due to Canvas/GTK dependencies. PyMuPDF works reliably on Windows without native compilation.

### When to Use
1. First time processing a new document type
2. User has changed configuration (logos, colors, margins)
3. User reports visual issues (overlaps, spacing problems)
4. Making CSS/layout changes to the skill

## Markdown Transformations

### 1. Table Transform (TableTransform.ts)

Converts code block tables to styled HTML:

**Input**:
````markdown
```
Month | Phase
------|------
Jan   | Planning
```
````

**Output**:
```html
<table>
  <thead>
    <tr><th>Month</th><th>Phase</th></tr>
  </thead>
  <tbody>
    <tr><td>Jan</td><td>Planning</td></tr>
  </tbody>
</table>
```

### 2. Heading Transform (HeadingTransform.ts)

Adds IDs to headings for TOC linking:
```markdown
# Security Approach
→ <h1 id="security-approach">Security Approach</h1>
```

### 3. HTML Entity Decoding

Fixes `&amp;` → `&` in TOC entries (MarkdownProcessor.ts)

## Logo Compression (imageCompression.ts)

Uses Sharp library for optimization:
- **Title page logo**: Compressed to ~20KB (from 1MB+)
- **Header logo**: Compressed to ~1KB (from 36KB+)
- **Method**: Iterative quality reduction while maintaining visual quality

## Page Number Calculation

```typescript
// Browser measurements (Pass 1)
const rect = element.getBoundingClientRect();
const yPosition = rect.top + window.scrollY;

// Calculate page number
const usablePageHeight = 936; // Letter 11" - 1.25" top - 0.75" bottom
const pageNumber = Math.floor(yPosition / usablePageHeight) + 2;

// +2 accounts for:
// - Title page (page 1)
// - Content pages starting at page 2
```

**Accuracy**: 100% (87/87 headings) with browser-based measurement

## CSS Layout (PDFGenerator.ts buildContentHTML)

```css
@page { size: Letter portrait; }

body {
    font-family: 'Calibri', 'Arial', sans-serif;
    font-size: 11pt;
    line-height: 1.6;
}

h1 {
    page-break-before: always;  /* Each H1 starts new page */
    margin: 0 0 15px 0;
}
h1:first-of-type { page-break-before: avoid; }  /* Except first H1 */

table {
    border-collapse: collapse;
    margin: 20px 0;
}
th {
    background: #1a365d;  /* Brand primary color */
    color: white;
    padding: 10px;
    border: 1px solid #cbd5e0;
}
td {
    border: 1px solid #ddd;
    padding: 8px;
}
```

**Key Settings**:
- PDF margins: `{ top: '1.25in', bottom: '0.75in', left: '0.75in', right: '0.75in' }`
- H1 page breaks: Ensures each level-1 section starts on new page
- Simple margins: No complex CSS rules to avoid conflicts

## Performance

- **File size**: ~580KB (91% reduction from 6.6MB original)
- **Logo compression**: Title 19KB, Header 855B
- **Generation time**: ~10-15 seconds for 37-page document
- **Page number accuracy**: 100% (87/87 headings)

## Type Safety

```typescript
// No 'any' types allowed (tsconfig.json)
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

All functions have explicit return types and parameter types.

## Dependencies

**Production**:
- `playwright` - PDF rendering and browser automation
- `pdf-lib` - PDF manipulation (merge, title page)
- `markdown-it` - Markdown parsing
- `sharp` - Image compression
- `PyMuPDF` (Python) - Visual validation (optional)

**Development**:
- `typescript` - Type checking and compilation
- `@types/*` - Type definitions

## Trade-offs

| Decision | Benefit | Cost |
|----------|---------|------|
| 1.25in top margin | Reliable header clearance | +1 page (37 vs 36) |
| Two-pass generation | 100% accurate page numbers | +3-5 seconds |
| Logo compression | 91% smaller file size | Requires Sharp dependency |
| Python for validation | Works reliably on Windows | Additional Python dependency |
| TypeScript | Type safety, fewer runtime errors | Build step required |

## Future Enhancements

- CLI with interactive prompts
- Multiple output formats (DOCX, HTML)
- Custom transforms (Gantt charts, diagrams)
- Plugin system for extensibility
- Automated visual validation in workflow

---

**Last Updated**: November 2025
**Current Version**: 1.0.0
