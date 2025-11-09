---
name: website-design
type: knowledge
description: "[KNOWLEDGE] Research-backed best practices for creating professional dark-mode visual designs for websites"
version: 1.0
---

# Dark Mode Website Design Skill

## Overview
This skill provides research-backed best practices for creating professional dark-mode visual designs for websites, with emphasis on diagrams, infographics, and UI elements. Use this skill when designing visual elements for dark-themed websites to ensure accessibility, professionalism, and visual comfort.

## When to Use This Skill

Use this skill BEFORE creating ANY visual design element for a dark-mode website, including:
- Architecture diagrams
- Infographics
- Data visualizations
- Charts and graphs
- Hero images
- Illustrations
- Icons with backgrounds
- Any SVG or graphic element

**DO NOT** skip this skill and "wing it" - always consult these principles first.

## Dark Mode Design Principles (Research-Based)

### 1. Background Colors

**❌ NEVER USE:**
- Pure black (#000000) - causes eye strain and "halation effect"
- Pure white (#FFFFFF) for text - too stark, causes eye fatigue

**✅ ALWAYS USE:**
- **Primary backgrounds**: #121212, #1b1b1b, #1e1e1e, #222222, #242424
- **Secondary backgrounds**: Slightly lighter variations (+10-15 in hex)
- **Subtle tints**: Dark blue-grey (#1a1f2e), dark slate (#1e293b) for variety

### 2. Color Saturation

**❌ AVOID:**
- Bright, fully saturated colors (HSL saturation > 80%)
- Neon colors (#FF00FF, #00FFFF, #FFFF00)
- High-contrast accent colors without desaturation

**✅ USE:**
- **Desaturated/pastel colors** with saturation 30-60%
- **Example transformations**:
  - Bright blue #3b82f6 → Desaturated #60a5fa
  - Bright green #10b981 → Desaturated #34d399
  - Bright purple #8b5cf6 → Desaturated #a78bfa

### 3. Text Colors

**Hierarchy (lightest to darkest):**
1. **Primary text**: #e4e4e7, #f4f4f5 (WCAG AA: 4.5:1 minimum)
2. **Secondary text**: #cbd5e1, #d1d5db
3. **Tertiary text**: #94a3b8, #9ca3af
4. **Disabled text**: #64748b, #6b7280

**Never pure white** - causes eye strain on dark backgrounds.

### 4. Contrast Requirements (WCAG 2.1)

**Minimum ratios:**
- **Normal text**: 4.5:1 contrast ratio
- **Large text** (18pt+ or 14pt bold): 3:1 contrast ratio
- **Graphics and UI elements**: 3:1 contrast ratio

**Testing:**
Use WebAIM Contrast Checker or browser DevTools to verify ratios before finalizing design.

### 5. Borders and Separation

**❌ SHADOWS DON'T WORK:**
- Shadows are barely visible on dark backgrounds
- Drop shadows create muddy appearance

**✅ USE INSTEAD:**
- **Subtle borders**: rgba(255, 255, 255, 0.1) to rgba(255, 255, 255, 0.2)
- **Colored borders**: Use desaturated accent color with 0.2-0.4 opacity
- **Glows**: Use CSS glow filters with 2-3px blur, low opacity
- **Elevation**: Slightly lighter background colors for "raised" elements

### 6. Visual Hierarchy

**Clear hierarchy prevents eye strain:**

1. **Most important** (headers, CTAs):
   - Brightest colors (but still desaturated)
   - Larger sizes
   - Optional subtle glow

2. **Secondary** (subheaders, labels):
   - Mid-tone colors (#cbd5e1, #94a3b8)
   - Medium sizes

3. **Tertiary** (descriptions, metadata):
   - Darker colors (#6b7280, #64748b)
   - Smaller sizes

**Rule**: Maximum 3-4 levels of hierarchy to avoid visual chaos.

### 7. Gradients in Dark Mode

**Linear gradients** work well for depth:
- Start: Desaturated color at 8-12% opacity
- End: Same color at 4-6% opacity
- Direction: Top to bottom usually works best

**Example:**
```svg
<linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
  <stop offset="0%" style="stop-color:rgba(52, 211, 153, 0.08)" />
  <stop offset="100%" style="stop-color:rgba(16, 185, 129, 0.04)" />
</linearGradient>
```

### 8. Typography for Dark Mode

**Font choices:**
- System fonts preferred: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- Avoid thin font weights (< 400) - hard to read on dark backgrounds
- Use 500-600 weight for emphasis instead of bold (700)

**Line height:**
- Body text: 1.6-1.8 (more generous for readability)
- Headers: 1.2-1.4

**Letter spacing:**
- Slightly increase for small text (0.01-0.02em)

### 9. Color Palette for Dark Mode Diagrams

**Recommended accent colors (desaturated):**

| Use Case | Color | Hex | Notes |
|----------|-------|-----|-------|
| Success/Primary | Mint green | #34d399 | Main CTAs, success states |
| Info | Sky blue | #60a5fa | Information, links |
| Warning | Amber | #fbbf24 | Warnings, attention |
| Error | Rose | #fb7185 | Errors, destructive actions |
| Neutral | Slate | #cbd5e1 | Text, borders |
| Accent 1 | Teal | #5eead4 | Secondary emphasis |
| Accent 2 | Purple | #a78bfa | Tertiary emphasis |

**Usage rule:** Maximum 3 accent colors per diagram to avoid rainbow effect.

### 10. Architecture Diagrams Specifically

**Structure:**
- **3-box flow** (User → Service → Infrastructure) is ideal
- Center box should be largest/most prominent
- Use horizontal flow (left-to-right)

**Arrows:**
- Stroke width: 2-3px
- Color: Desaturated accent with 50-70% opacity
- Labels: Position above/below arrows, not on them
- Use arrow markers, not just lines

**Boxes:**
- Rounded corners: 12-16px radius
- Border: 1.5-2px with desaturated accent color
- Background: Gradient from 8% to 4% opacity
- Padding: Generous (40-60px internal spacing)

**Text inside boxes:**
- Title: 20-22px, weight 600-700
- Subtitle: 16px, weight 500
- Features: 14-15px, weight 400
- Color hierarchy: Use 3 levels (see section 6)

## Pre-Design Checklist

Before creating ANY dark-mode visual element, verify:

- [ ] Background is NOT pure black (#000000)
- [ ] Colors are desaturated (saturation < 70%)
- [ ] Text contrast meets WCAG 4.5:1 minimum
- [ ] No pure white text
- [ ] No bright neon colors
- [ ] Using borders/glows instead of shadows
- [ ] Maximum 3-4 accent colors
- [ ] Clear visual hierarchy established
- [ ] Typography weights are 400+

## Post-Design Validation

After creating the element:

1. **Contrast check**: Use WebAIM or browser DevTools
2. **Visual test**: View on actual dark-mode website
3. **Squint test**: Blur your eyes - can you still see hierarchy?
4. **Color blindness**: Check with color blind simulator
5. **Different screens**: Test on various brightness levels

## Common Mistakes to Avoid

1. ❌ Using the same colors as light mode
2. ❌ Pure black backgrounds
3. ❌ Over-saturated accent colors
4. ❌ Too many colors (rainbow effect)
5. ❌ Relying on shadows for depth
6. ❌ Pure white text
7. ❌ Thin font weights
8. ❌ Insufficient contrast ratios
9. ❌ No visual hierarchy
10. ❌ Emojis in professional diagrams

## Examples of Good Dark Mode Design

### Good Architecture Diagram:
- Background: #1e1e1e
- Boxes: Gradient from 8% to 4% opacity
- Borders: Desaturated color at 30-40% opacity
- Title: #e4e4e7, 28px, weight 600
- Body text: #cbd5e1, 15px, weight 400
- Accent: #34d399 (desaturated green)
- Arrows: 2.5px stroke, 50% opacity

### Bad Architecture Diagram:
- Background: #000000 (pure black)
- Boxes: Bright saturated colors (#FF0000, #00FF00)
- Borders: None or pure white
- Title: #FFFFFF (pure white)
- Body text: Same brightness as title
- Multiple neon colors competing
- Emojis mixed with professional content

## Research Sources

This skill is based on 2024-2025 research from:
- WCAG 2.1 Guidelines
- Material Design Dark Theme Documentation
- Apple Human Interface Guidelines
- Articles from Smashing Magazine, UX Design Institute
- Analysis of top SaaS dark-mode implementations

## Usage in Development

When Claude encounters a design task:

1. **Recognize design task**: "Create diagram/graphic/visual for dark-mode site"
2. **Invoke this skill**: Read this entire document
3. **Research if needed**: Check current best practices if >6 months since skill update
4. **Apply principles**: Use checklist and guidelines
5. **Validate**: Test with tools and visual inspection
6. **Iterate**: Refine based on validation results

**Never skip step 2** - always consult this skill before creating visual elements.

---

**Version**: 1.0
**Last Updated**: 2025-11-02
**Status**: ✅ Active - Use for all dark-mode design tasks
