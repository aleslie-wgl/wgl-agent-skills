/**
 * PDF Generator - Main orchestrator for PDF generation
 * Implements two-pass generation: measure positions, then generate with TOC
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { chromium, type Browser } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import type {
    ResolvedPDFConfig,
    Heading,
    PDFGenerationResult,
    PageNumberExtractionResult,
} from '../types/index.js';
import { logger } from '../utils/logger.js';
import {
    compressLogoForTitlePage,
    compressLogoForHeader,
    formatFileSize,
} from '../utils/imageCompression.js';

export class PDFGenerator {
    private browser: Browser | null = null;

    async generate(
        html: string,
        headings: Heading[],
        config: ResolvedPDFConfig
    ): Promise<PDFGenerationResult> {

        try {
            // Launch browser
            this.browser = await chromium.launch({ headless: true });

            // Step 1: Compress logos
            logger.step(0, 4, 'Compressing logos for optimal file size...');
            const titleLogo = await compressLogoForTitlePage(
                config.branding.logo.titlePath,
                config.branding.logo.titlePageWidth,
                21 * 1024
            );
            const headerLogo = await compressLogoForHeader(
                config.branding.logo.headerPath,
                config.branding.logo.headerHeight,
                1024
            );
            logger.info(`  Title logo: ${formatFileSize(titleLogo.compressedSize)} (${titleLogo.originalSize > titleLogo.compressedSize ? '↓' : '='}${formatFileSize(titleLogo.originalSize)})`);
            logger.info(`  Header logo: ${formatFileSize(headerLogo.compressedSize)} (${headerLogo.originalSize > headerLogo.compressedSize ? '↓' : '='}${formatFileSize(headerLogo.originalSize)})`);

            // Step 2: Generate title page
            logger.step(1, 4, 'Generating title page...');
            const titlePdfPath = await this.generateTitlePage(config, titleLogo.path);

            // Step 3: Measure heading positions
            logger.step(2, 4, 'Measuring heading positions in browser...');
            const extraction = await this.extractPageNumbers(html, headings, config, headerLogo.path);
            logger.info(`  Extracted page numbers for ${extraction.successCount} headings`);
            logger.info(`  Page range: ${extraction.pageRange.min}-${extraction.pageRange.max}`);

            // Step 4: Generate content with TOC
            logger.step(3, 4, 'Generating content PDF with accurate TOC...');
            const contentPdfPath = await this.generateContent(
                html,
                extraction.headings,
                config,
                headerLogo.path
            );

            // Optional: Run validation to detect layout issues (before cleanup and merge)
            if (config.validation.enabled) {
                logger.step(4.5, 6, 'Validating layout (header/content overlap check)...');
                const validation = await this.validateLayout(html, config, headerLogo.path);
                logger.info(`  Checked ${validation.pagesChecked} pages for overlaps`);

                if (validation.hasOverlap) {
                    logger.warn(`  ⚠️  Warning: Header overlap detected on page ${validation.worstPage}`);
                    logger.warn(`     Content starts at Y=${validation.firstContentY}px`);
                    logger.warn(`     Header area: 0-${validation.headerBottom}px`);
                    logger.warn(`     Overlap: ${validation.overlapAmount}px`);
                } else {
                    logger.info(`  ✓ No overlap detected (minimum ${validation.clearance}px clearance)`);
                }

                // Visual validation - extract pages for inspection (currently disabled)
                // TODO: Implement PDF page extraction using pdf-lib + Sharp
                if (config.validation.autoExtractFirst > 0) {
                    logger.info('  (Visual extraction temporarily disabled - manual PDF review required)');
                }
            }

            // Step 5: Merge PDFs
            logger.step(4, 4, 'Creating final merged PDF...');
            const finalPdfPath = await this.mergePDFs(
                [titlePdfPath, contentPdfPath],
                config.output
            );

            // Get file stats
            const stats = fs.statSync(finalPdfPath);
            const pdfDoc = await PDFDocument.load(fs.readFileSync(finalPdfPath));

            // Cleanup temp files
            this.cleanup([titlePdfPath, contentPdfPath, titleLogo.path, headerLogo.path]);

            const result: PDFGenerationResult = {
                outputPath: finalPdfPath,
                pageCount: pdfDoc.getPageCount(),
                fileSize: stats.size,
                headings: extraction.headings,
                generatedAt: new Date(),
            };

            logger.success(
                `Generated PDF: ${path.basename(finalPdfPath)} (${formatFileSize(result.fileSize)})`
            );

            return result;
        } finally {
            await this.browser?.close();
            this.browser = null;
        }
    }

    private async generateTitlePage(
        config: ResolvedPDFConfig,
        logoPath: string
    ): Promise<string> {
        const page = await this.browser!.newPage();
        const tempPath = path.join(os.tmpdir(), `title-${Date.now()}.pdf`);

        const logoBase64 = fs.readFileSync(logoPath).toString('base64');
        const title = config.branding.title ?? 'Document Title';

        const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        @page { size: Letter portrait; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Calibri', 'Arial', sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            text-align: center;
        }
        .logo { margin-bottom: 60px; }
        .logo img { width: ${config.branding.logo.titlePageWidth}px; height: auto; }
        .title { font-size: 32pt; font-weight: 700; color: ${config.branding.colors.primary}; margin-bottom: 40px; }
        .client { font-size: 24pt; color: ${config.branding.colors.secondary}; margin-bottom: 60px; }
        .company { font-size: 14pt; color: #666; }
        .date { font-size: 12pt; color: #999; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="logo"><img src="data:image/png;base64,${logoBase64}" alt="Logo" /></div>
    <div class="title">${this.escapeHtml(title)}</div>
    <div class="client">${this.escapeHtml(config.branding.client)}</div>
    <div class="company">${this.escapeHtml(config.branding.company.name)}</div>
    <div class="date">${new Date().toLocaleDateString()}</div>
</body>
</html>`;

        await page.setContent(html);
        await page.pdf({
            path: tempPath,
            format: 'Letter',
            printBackground: true,
            margin: { top: '1in', bottom: '0.75in', left: '0.75in', right: '0.75in' }
        });
        await page.close();

        return tempPath;
    }

    private async extractPageNumbers(
        html: string,
        headings: Heading[],
        config: ResolvedPDFConfig,
        logoPath: string
    ): Promise<PageNumberExtractionResult> {
        const page = await this.browser!.newPage();
        await page.setViewportSize({ width: 816, height: 1056 });

        const fullHtml = this.buildContentHTML(html, headings, config, logoPath, false);
        await page.setContent(fullHtml);

        // Wait for content to render
        await page.waitForTimeout(1000);

        // Extract Y positions of all headings
        const positions = await page.evaluate((headingIds: string[]) => {
            const results: Record<string, number> = {};
            headingIds.forEach((id) => {
                const element = document.getElementById(id);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    results[id] = window.scrollY + rect.top;
                }
            });
            return results;
        }, headings.map((h) => h.id));

        await page.close();

        // Calculate page numbers
        // Letter: 11in = 1056px at 96 DPI
        // Top margin: 1in = 96px, Bottom margin: 0.75in = 72px
        // Usable height: 1056 - 96 - 72 = 888px per page
        const usablePageHeight = 888;
        let minPage = Infinity;
        let maxPage = 0;
        let successCount = 0;

        const updatedHeadings = headings.map((heading) => {
            const yPos = positions[heading.id];
            if (yPos !== undefined) {
                const pageNum = Math.floor(yPos / usablePageHeight) + 2; // +2 for title page
                minPage = Math.min(minPage, pageNum);
                maxPage = Math.max(maxPage, pageNum);
                successCount++;
                return { ...heading, pageNumber: pageNum };
            }
            return heading;
        });

        return {
            headings: updatedHeadings,
            pageRange: { min: minPage, max: maxPage },
            extractionMethod: 'browser',
            successCount,
            totalCount: headings.length,
        };
    }

    private async generateContent(
        html: string,
        headings: Heading[],
        config: ResolvedPDFConfig,
        logoPath: string
    ): Promise<string> {
        const page = await this.browser!.newPage();
        const tempPath = path.join(os.tmpdir(), `content-${Date.now()}.pdf`);

        const fullHtml = this.buildContentHTML(html, headings, config, logoPath, true);
        await page.setContent(fullHtml);

        await page.pdf({
            path: tempPath,
            format: 'Letter',
            printBackground: true,
            displayHeaderFooter: true,
            headerTemplate: this.buildHeaderTemplate(config, logoPath),
            footerTemplate: this.buildFooterTemplate(config),
            margin: { top: '1.25in', bottom: '0.75in', left: '0.75in', right: '0.75in' },
        });

        await page.close();
        return tempPath;
    }

    private buildContentHTML(
        content: string,
        headings: Heading[],
        config: ResolvedPDFConfig,
        _logoPath: string,
        includeTOC: boolean
    ): string {

        const tocHTML = includeTOC
            ? this.buildTOC(headings, config)
            : '';

        return `<!DOCTYPE html>
<html>
<head>
    <style>
        @page {
            size: Letter portrait;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Calibri', 'Arial', sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #333;
        }
        h1 {
            font-size: 20pt;
            margin: 0 0 15px 0;
            color: ${config.branding.colors.primary};
            page-break-before: always;
        }
        h1:first-of-type { page-break-before: avoid; }
        h2 { font-size: 16pt; margin: 25px 0 12px; color: ${config.branding.colors.primary}; }
        h3 { font-size: 14pt; margin: 20px 0 10px; color: ${config.branding.colors.secondary}; }
        h4 { font-size: 12pt; margin: 15px 0 8px; color: ${config.branding.colors.secondary}; }
        p { margin: 10px 0; }
        ul, ol { margin: 10px 0 10px 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: ${config.branding.colors.tableHeader}; color: white; padding: 10px; text-align: left; border: 1px solid #cbd5e0; }
        td { border: 1px solid #ddd; padding: 8px; }
        .toc { page-break-after: always; }
    </style>
</head>
<body>
    ${tocHTML}
    ${content}
</body>
</html>`;
    }

    private buildTOC(headings: Heading[], config: ResolvedPDFConfig): string {
        const tocEntries = headings
            .filter((h) => h.level <= 2 && h.pageNumber)
            .map((h) => {
                const indent = (h.level - 1) * 20;
                // Note: h.text is already decoded from HTML entities, so we escape it for HTML output
                return `<div style="display: flex; margin: 5px 0; padding-left: ${indent}px;">
                    <span style="flex: 1;">${this.escapeHtml(h.text)}</span>
                    <span>${h.pageNumber}</span>
                </div>`;
            })
            .join('');

        return `<div class="toc">
            <h1 style="color: ${config.branding.colors.primary};">Table of Contents</h1>
            <div style="margin-top: 20px;">${tocEntries}</div>
        </div>`;
    }

    private buildHeaderTemplate(config: ResolvedPDFConfig, logoPath: string): string {
        const logoBase64 = fs.readFileSync(logoPath).toString('base64');
        // Header template - renders in the top margin area (1in = 96px)
        // Must be smaller than margin to avoid overflow
        return `<div style="width: 100%; height: 70px; font-size: 10pt; margin: 0; padding: 0;">
            <div style="margin: 0 54px; padding: 12px 0 10px; border-bottom: 1px solid rgba(26, 54, 93, 0.2); display: flex; justify-content: space-between; align-items: center; height: 100%;">
                <img src="data:image/png;base64,${logoBase64}" style="height: ${Math.min(config.branding.logo.headerHeight, 40)}px; display: block;" />
                <span style="color: ${config.branding.colors.secondary}; font-weight: 600; white-space: nowrap;">${this.escapeHtml(config.branding.client)}</span>
            </div>
        </div>`;
    }

    private buildFooterTemplate(config: ResolvedPDFConfig): string {
        return `<div style="width: 100%; font-size: 9pt; padding: 10px 40px; display: flex; justify-content: space-between; color: #666;">
            <span>${this.escapeHtml(config.branding.company.name)} | ${this.escapeHtml(config.branding.company.website)}</span>
            <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </div>`;
    }

    private async mergePDFs(sources: string[], output: string): Promise<string> {
        const mergedPdf = await PDFDocument.create();

        for (const source of sources) {
            const pdfBytes = fs.readFileSync(source);
            const pdf = await PDFDocument.load(pdfBytes);
            const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach((page) => mergedPdf.addPage(page));
        }

        const mergedBytes = await mergedPdf.save();
        fs.writeFileSync(output, mergedBytes);

        return output;
    }

    private cleanup(paths: string[]): void {
        paths.forEach((p) => {
            try {
                if (fs.existsSync(p)) fs.unlinkSync(p);
            } catch (e) {
                // Ignore cleanup errors
            }
        });
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Validate layout to detect header/content overlaps across multiple pages
     * Samples multiple pages to catch issues that vary by page
     */
    private async validateLayout(
        html: string,
        config: ResolvedPDFConfig,
        _logoPath: string
    ): Promise<{
        hasOverlap: boolean;
        firstContentY: number;
        headerBottom: number;
        overlapAmount: number;
        clearance: number;
        pagesChecked: number;
        worstPage?: number;
    }> {
        const page = await this.browser!.newPage();
        await page.setViewportSize({ width: 816, height: 1056 });

        // Render the same content as the PDF
        const fullHtml = this.buildContentHTML(html, [], config, _logoPath, false);
        await page.setContent(fullHtml);
        await page.waitForTimeout(500);

        // Get total scroll height to determine number of pages
        const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
        const usablePageHeight = 888;
        const estimatedPages = Math.ceil(scrollHeight / usablePageHeight);

        // Sample pages to check: page 1, 2, 3, mid-point, and last
        const pagesToCheck = new Set([1, 2, 3]);
        if (estimatedPages > 5) {
            pagesToCheck.add(Math.floor(estimatedPages / 2));
        }
        if (estimatedPages > 3) {
            pagesToCheck.add(estimatedPages - 1);
        }

        // Check each page for overlaps
        let worstOverlap = 0;
        let worstPage = 0;
        let bestClearance = Infinity;

        for (const pageNum of Array.from(pagesToCheck).sort((a, b) => a - b)) {
            // Calculate Y position range for this page
            const pageStartY = (pageNum - 1) * usablePageHeight;
            const pageEndY = pageNum * usablePageHeight;

            // Find first element on this page
            const elementY = await page.evaluate(({ start, end }) => {
                const selector = 'h1, h2, h3, h4, p, table, ul, ol, div';
                const elements = Array.from(document.querySelectorAll(selector));

                for (const el of elements) {
                    const rect = el.getBoundingClientRect();
                    const y = window.scrollY + rect.top;

                    // Check if element starts on this page
                    if (y >= start && y < end) {
                        return y - start; // Position relative to page start
                    }
                }
                return -1; // No element found on this page
            }, { start: pageStartY, end: pageEndY });

            if (elementY >= 0) {
                // Check for overlap - content should start after CSS margin (0.75in = 72px)
                // Not the PDF margin which includes header space
                const contentMargin = 72;

                if (elementY < contentMargin) {
                    const overlap = contentMargin - elementY;
                    if (overlap > worstOverlap) {
                        worstOverlap = overlap;
                        worstPage = pageNum;
                    }
                } else {
                    const clearance = elementY - contentMargin;
                    if (clearance < bestClearance) {
                        bestClearance = clearance;
                    }
                }
            }
        }

        await page.close();

        const hasOverlap = worstOverlap > 0;
        const headerBottom = 72;

        return {
            hasOverlap,
            firstContentY: hasOverlap ? (headerBottom - worstOverlap) : (headerBottom + bestClearance),
            headerBottom,
            overlapAmount: worstOverlap,
            clearance: hasOverlap ? 0 : bestClearance,
            pagesChecked: pagesToCheck.size,
            worstPage: hasOverlap ? worstPage : undefined,
        };
    }
}
