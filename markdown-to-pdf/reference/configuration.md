# Configuration Guide

## Overview

The markdown-to-pdf skill uses configuration-driven branding, allowing you to generate professional PDFs for multiple clients using the same tool.

## Configuration Methods

### 1. CLI Arguments (Recommended for Quick Use)

```bash
node scripts/generate-pdf.js input.md \
  --output output.pdf \
  --client "Client Name" \
  --company "Your Company Name" \
  --website "yourcompany.com" \
  --email "contact@yourcompany.com" \
  --phone "(123) 456-7890" \
  --address "123 Main St, City, State ZIP" \
  --title-logo "/path/to/title-logo.png" \
  --header-logo "/path/to/header-icon.png"
```

### 2. JSON Configuration File (Recommended for Reuse)

Create a configuration file (e.g., `client-config.json`):

```json
{
  "branding": {
    "client": "Alberta Pensions Services Corporation",
    "company": {
      "name": "WhiteGlove Labs AI Ltd.",
      "website": "whiteglovelabs.ai",
      "email": "alexander.leslie@whiteglovelabs.ai",
      "phone": "(613) 875-5831",
      "address": "1925 Caprihani Way, Orleans, ON K4A 4T4"
    },
    "logo": {
      "titlePath": "G:/Shared drives/Branding/Logo Gold.png",
      "headerPath": "G:/Shared drives/Branding/icon-leaf.jpg",
      "titlePageWidth": 375,
      "headerHeight": 50
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

**Usage**:
```bash
node scripts/generate-pdf.js input.md --config client-config.json
```

## Configuration Options

### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| `client` | Client name (appears in header) | "Alberta Pensions Services" |
| `company.name` | Your company name (footer) | "WhiteGlove Labs AI Ltd." |
| `company.website` | Company website (footer) | "whiteglovelabs.ai" |
| `company.email` | Contact email (footer) | "contact@company.com" |

### Optional Fields

| Field | Description | Default |
|-------|-------------|---------|
| `output` | Output PDF path | Input filename with .pdf extension |
| `company.phone` | Contact phone number | None |
| `company.address` | Company address | None |
| `logo.titlePath` | Title page logo file | None (no logo) |
| `logo.headerPath` | Header logo/icon file | Uses titlePath if not specified |
| `logo.titlePageWidth` | Logo width on title (px) | 375 |
| `logo.headerHeight` | Logo height in header (px) | 50 |
| `colors.primary` | Primary brand color (hex) | #1a365d (dark blue) |
| `colors.secondary` | Secondary brand color (hex) | #2c5282 (medium blue) |
| `colors.tableHeader` | Table header background (hex) | #1a365d |
| `colors.tableRowAlt` | Alternating row background (hex) | #f7fafc (light gray) |

## Logo Guidelines

### Title Page Logo

**Purpose**: Large, prominent logo on the title page

**Recommended**:
- Format: PNG with transparency
- Size: 1000-1500px width (will be compressed)
- Aspect ratio: Maintain original
- File size: Any (will be optimized to ~20KB)

**Configuration**:
```json
{
  "logo": {
    "titlePath": "/path/to/logo-full.png",
    "titlePageWidth": 375
  }
}
```

### Header Logo/Icon

**Purpose**: Small icon in page header (top of every page)

**Recommended**:
- Format: PNG or JPG
- Size: 100-200px height
- Aspect ratio: Square or wide
- File size: Any (will be optimized to ~1KB)

**Configuration**:
```json
{
  "logo": {
    "headerPath": "/path/to/icon-small.png",
    "headerHeight": 50
  }
}
```

### Using Same Logo for Both

If you want the same logo for title and header:

**Option 1** (CLI):
```bash
--logo "/path/to/logo.png"
```

**Option 2** (JSON):
```json
{
  "logo": {
    "titlePath": "/path/to/logo.png",
    "headerPath": "/path/to/logo.png"
  }
}
```

## Color Schemes

### Professional Blue (Default)

```json
{
  "colors": {
    "primary": "#1a365d",      // Navy blue
    "secondary": "#2c5282",    // Medium blue
    "tableHeader": "#1a365d",  // Navy blue
    "tableRowAlt": "#f7fafc"   // Light gray
  }
}
```

### Corporate Gray

```json
{
  "colors": {
    "primary": "#2d3748",      // Dark gray
    "secondary": "#4a5568",    // Medium gray
    "tableHeader": "#2d3748",
    "tableRowAlt": "#f7fafc"
  }
}
```

### Modern Teal

```json
{
  "colors": {
    "primary": "#0f766e",      // Teal
    "secondary": "#14b8a6",    // Light teal
    "tableHeader": "#0f766e",
    "tableRowAlt": "#f0fdfa"
  }
}
```

## Path Handling

### Windows Paths

**Use forward slashes** (/) even on Windows:

✅ **Correct**:
```json
"titlePath": "G:/Shared drives/Branding/Logo.png"
```

❌ **Incorrect**:
```json
"titlePath": "G:\\Shared drives\\Branding\\Logo.png"
```

### Relative vs Absolute Paths

**Absolute paths** (recommended):
```json
"titlePath": "G:/Users/Name/Documents/logo.png"
```

**Relative paths** (relative to where you run the command):
```json
"titlePath": "./assets/logo.png"
```

## Configuration Template

Copy and customize this template:

```json
{
  "branding": {
    "client": "CLIENT_NAME_HERE",
    "company": {
      "name": "YOUR_COMPANY_NAME",
      "website": "yourcompany.com",
      "email": "contact@yourcompany.com",
      "phone": "(000) 000-0000",
      "address": "Street, City, State ZIP"
    },
    "logo": {
      "titlePath": "/path/to/title-logo.png",
      "headerPath": "/path/to/header-icon.png",
      "titlePageWidth": 375,
      "headerHeight": 50
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

Save as `config-template.json` and customize for each client.

## Multiple Client Configurations

### Recommended Structure

```
project/
├── configs/
│   ├── client-a.json
│   ├── client-b.json
│   └── client-c.json
├── proposals/
│   ├── proposal-client-a.md
│   ├── proposal-client-b.md
│   └── proposal-client-c.md
└── output/
    ├── proposal-client-a.pdf
    ├── proposal-client-b.pdf
    └── proposal-client-c.pdf
```

### Usage

```bash
# Generate for Client A
node scripts/generate-pdf.js \
  proposals/proposal-client-a.md \
  --config configs/client-a.json \
  --output output/proposal-client-a.pdf

# Generate for Client B
node scripts/generate-pdf.js \
  proposals/proposal-client-b.md \
  --config configs/client-b.json \
  --output output/proposal-client-b.pdf
```

## Default Values

If not specified, the following defaults are used:

| Field | Default Value |
|-------|---------------|
| `output` | `{input-filename}.pdf` |
| `logo.titlePageWidth` | 375 |
| `logo.headerHeight` | 50 |
| `colors.primary` | #1a365d |
| `colors.secondary` | #2c5282 |
| `colors.tableHeader` | #1a365d |
| `colors.tableRowAlt` | #f7fafc |

## Troubleshooting Configuration

### Issue: Logo Not Appearing

1. Verify file exists at specified path
2. Use absolute path instead of relative
3. Use forward slashes (/)
4. Check file format (PNG/JPG supported)

### Issue: Colors Not Applied

1. Verify hex color format includes `#`
2. Use 6-character hex codes (#rrggbb)
3. Check spelling of color field names

### Issue: Company Info Not in Footer

1. Verify `company.name`, `company.website`, `company.email` are set
2. Check for typos in field names
3. Ensure company object is inside branding object

---

**Last Updated**: November 2025
