/**
 * Table transformation
 * Converts markdown tables in code blocks to styled HTML tables
 */
import type { Transform } from './Transform.js';
import type { PDFConfig } from '../../types/index.js';
export declare class TableTransform implements Transform {
    readonly name = "TableTransform";
    apply(markdown: string, config: PDFConfig): string;
    private transformTable;
    private isTotalRow;
    private lightenColor;
    private isNumericValue;
    private escapeHtml;
}
//# sourceMappingURL=TableTransform.d.ts.map