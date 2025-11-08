/**
 * PDF Generator - Main orchestrator for PDF generation
 * Implements two-pass generation: measure positions, then generate with TOC
 */
import type { ResolvedPDFConfig, Heading, PDFGenerationResult } from '../types/index.js';
export declare class PDFGenerator {
    private browser;
    generate(html: string, headings: Heading[], config: ResolvedPDFConfig): Promise<PDFGenerationResult>;
    private generateTitlePage;
    private extractPageNumbers;
    private generateContent;
    private buildContentHTML;
    private buildTOC;
    private buildHeaderTemplate;
    private buildFooterTemplate;
    private mergePDFs;
    private cleanup;
    private escapeHtml;
    /**
     * Validate layout to detect header/content overlaps across multiple pages
     * Samples multiple pages to catch issues that vary by page
     */
    private validateLayout;
}
//# sourceMappingURL=PDFGenerator.d.ts.map