/**
 * Markdown processor
 * Orchestrates markdown transformation and rendering to HTML
 */
import type { MarkdownParseResult, ResolvedPDFConfig } from '../types/index.js';
export declare class MarkdownProcessor {
    private readonly transforms;
    private readonly headingTransform;
    private readonly parser;
    constructor();
    /**
     * Process markdown file to HTML
     * @param config - PDF configuration
     * @returns Parsed result with HTML and metadata
     */
    process(config: ResolvedPDFConfig): Promise<MarkdownParseResult>;
    /**
     * Extract title from first H1 heading
     */
    private extractTitle;
    /**
     * Extract headings from HTML
     */
    private extractHeadings;
    /**
     * Decode HTML entities in text
     */
    private decodeHtmlEntities;
}
//# sourceMappingURL=MarkdownProcessor.d.ts.map