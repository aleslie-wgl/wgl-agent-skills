/**
 * Heading ID transformation
 * Adds unique IDs to HTML headings after markdown rendering
 * This is applied to HTML, not markdown
 */
import type { PDFConfig } from '../../types/index.js';
export declare class HeadingTransform {
    readonly name = "HeadingTransform";
    /**
     * Add IDs to HTML headings
     * @param html - Rendered HTML content
     * @param config - PDF configuration
     * @returns HTML with heading IDs
     */
    apply(html: string, _config: PDFConfig): string;
}
//# sourceMappingURL=HeadingTransform.d.ts.map