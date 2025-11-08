# Troubleshooting Guide

## Common Issues & Solutions

### Issue: Header Overlapping Content

**Symptoms**: Content on pages 3+ appears too close to or intersecting the header line.

**Solution**: This is fixed in the current version (top margin = 1.25in). If you see this issue:

1. Verify you're using the latest compiled dist/ files:
   ```bash
   npm run build
   ```

2. Check PDF generation settings (PDFGenerator.ts:260):
   ```typescript
   margin: { top: '1.25in', ... }
   ```

3. **Visual validation**:
   ```bash
   python scripts/validation/extract_pdf_pages.py output.pdf ./screenshots 2 3 4
   ```

**Root Cause**: Insufficient top margin (original 1in = 96px couldn't accommodate 70px header + clearance)

---

### Issue: Table of Contents Shows `&amp;`

**Symptoms**: TOC displays HTML entities instead of decoded characters (e.g., "SECURITY &amp; PRIVACY")

**Solution**: Fixed in MarkdownProcessor.ts - `decodeHtmlEntities()` method decodes before adding to TOC.

**Verify fix**: Check that extracted headings are decoded:
```typescript
cleanText = this.decodeHtmlEntities(cleanText);
```

---

### Issue: PDF Pages are Rotated 90 Degrees

**Symptoms**: Entire PDF appears in landscape orientation.

**Root Cause**: Conflicting CSS `@page` margin rules with Playwright PDF margins.

**Solution**: Remove CSS `@page` margin rules, keep only:
```css
@page { size: Letter portrait; }
```

**Never use**:
```css
@page { margin: 96px; }  /* CAUSES ROTATION */
```

---

### Issue: Page Numbers are Inaccurate

**Symptoms**: TOC page numbers don't match actual content pages.

**Solution**: Use browser-based position measurement (current implementation).

**Verify calculation** (PDFGenerator.ts):
```typescript
const usablePageHeight = 936; // Letter 11" - 1.25" top - 0.75" bottom
const pageNumber = Math.floor(yPosition / usablePageHeight) + 2;
```

**Common mistakes**:
- Wrong usable height calculation
- Forgetting +2 offset for title page
- Using text-based extraction instead of position measurement

---

### Issue: Logo Not Found

**Symptoms**: Error message "Logo file not found at path..."

**Solution**:
1. Verify logo path is absolute or relative to current working directory
2. Use forward slashes (/) even on Windows
3. Check file exists:
   ```bash
   ls "G:/Shared drives/WhitegloveLabs-Shared/Branding/Logo Gold.png"
   ```

**CLI usage**:
```bash
--title-logo "G:/Shared drives/.../Logo Gold.png"
--header-logo "G:/Shared drives/.../icon.jpg"
```

---

### Issue: Build Errors (TypeScript)

**Symptoms**: `tsc` compilation fails with type errors.

**Solution**:
```bash
cd C:/Users/LeeLee/.claude/skills/markdown-to-pdf
npm run clean
npm install
npm run build
```

**Common type errors**:
- Using `any` type (strict mode enabled)
- Missing return types on functions
- Unused variables (prefix with `_` or remove)

---

### Issue: Missing Dependencies

**Symptoms**: "Cannot find module..." errors when running.

**Solution**:
```bash
# Install Node.js dependencies
npm install

# Install Chromium for Playwright
npx playwright install chromium

# Install Python dependency (for visual validation)
pip install PyMuPDF
```

---

### Issue: Visual Validation Not Working

**Symptoms**: Python script fails to extract PDF pages.

**Solution**:
1. Verify PyMuPDF is installed:
   ```bash
   pip install PyMuPDF
   ```

2. Check script path:
   ```bash
   ls scripts/validation/extract_pdf_pages.py
   ```

3. Test manually:
   ```bash
   python scripts/validation/extract_pdf_pages.py test.pdf ./output 2 3
   ```

**Why not Node.js**: Multiple libraries (pdf2pic, pdfjs-dist, pdf-img-convert) failed due to Canvas/GTK dependencies on Windows. PyMuPDF works reliably.

---

### Issue: Financial Values Not Right-Aligned

**Symptoms**: Numbers in tables are left-aligned instead of right-aligned.

**Solution**: Add text-align CSS to table cells containing financial data:
```css
td.financial { text-align: right; }
```

**Note**: Automatic detection of financial columns is a future enhancement.

---

### Issue: Table Headers Missing Cell Borders

**Symptoms**: Table header cells don't have visible borders.

**Solution**: Verify CSS includes border on `th` elements:
```css
th {
    border: 1px solid #cbd5e0;
    background: #1a365d;
    color: white;
}
```

---

### Issue: Total Rows Not Highlighted

**Symptoms**: Table rows with totals don't have shaded background.

**Solution**: Add CSS class for total rows:
```css
tr.total td {
    background: rgba(26, 54, 93, 0.1);  /* Light shade of primary */
    font-weight: 600;
}
```

**Note**: Automatic detection of total rows is a future enhancement.

---

## Debugging Workflow

When encountering layout issues:

1. **Enable visual validation**:
   ```bash
   python scripts/validation/extract_pdf_pages.py output.pdf ./screenshots 2 3 4 5
   ```

2. **View extracted images** to see actual PDF rendering

3. **Compare working vs broken pages** to identify patterns

4. **Check CSS in PDFGenerator.ts** (buildContentHTML method)

5. **Verify PDF margins** (page.pdf call)

6. **Test incrementally** - change one thing at a time

7. **Use browser DevTools** - Playwright renders in Chromium, you can inspect elements

---

## Known Limitations

1. **CLI-only**: No interactive configuration UI
2. **Node.js required**: Requires Node.js 18+ and npm
3. **Playwright dependency**: Requires Chromium (~200MB)
4. **Python dependency**: PyMuPDF required for visual validation (optional)
5. **Windows paths**: Must use forward slashes (/) in file paths

---

## Getting Help

1. Check this troubleshooting guide
2. Review reference/architecture.md for implementation details
3. Check SKILL.md for workflow guidance
4. Verify you're using latest compiled code (`npm run build`)
5. Use visual validation to see actual PDF output

---

**Last Updated**: November 2025
