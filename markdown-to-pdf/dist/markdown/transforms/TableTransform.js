/**
 * Table transformation
 * Converts markdown tables in code blocks to styled HTML tables
 */
export class TableTransform {
    name = 'TableTransform';
    apply(markdown, config) {
        // Pattern to detect tables in code blocks
        // Fixed: Allow optional whitespace and newlines before closing backticks
        const codeBlockTablePattern = /```\s*\n([^\n]+\|[^\n]+\n[-|]+\n(?:[^\n]+\n?)+)\n*```/gs;
        return markdown.replace(codeBlockTablePattern, (_match, tableContent) => {
            return this.transformTable(tableContent, config);
        });
    }
    transformTable(tableContent, config) {
        // Parse the table
        const lines = tableContent.trim().split('\n');
        const headers = lines[0]
            ?.split('|')
            .map(h => h.trim())
            .filter(h => h);
        if (!headers || headers.length === 0) {
            // Not a valid table, return original
            return '```\n' + tableContent + '\n```';
        }
        const rows = lines.slice(2).map(line => line.split('|')
            .map(cell => cell.trim())
            .filter(cell => cell));
        if (rows.length === 0) {
            // No data rows, return original
            return '```\n' + tableContent + '\n```';
        }
        // Generate professionally styled HTML table
        const tableHeaderBg = config.branding.colors.tableHeader;
        const tableRowAlt = config.branding.colors.tableRowAlt;
        const totalRowBg = this.lightenColor(tableHeaderBg, 0.7); // Lighter shade for total rows
        const tableHTML = `
<div style="page-break-inside: avoid; margin: 20px 0;">
<table style="width: 100%; border-collapse: collapse; page-break-inside: avoid;">
<thead>
<tr style="background-color: ${tableHeaderBg}; color: white;">
${headers.map(h => `<th style="border: 1px solid #cbd5e0; padding: 10px; text-align: left; font-weight: 600;">${this.escapeHtml(h)}</th>`).join('')}
</tr>
</thead>
<tbody>
${rows.map((row, idx) => {
            const isTotalRow = this.isTotalRow(row);
            const rowBg = isTotalRow
                ? totalRowBg
                : (idx % 2 === 1 ? tableRowAlt : 'transparent');
            const rowStyle = rowBg !== 'transparent' ? ` style="background-color: ${rowBg};"` : '';
            const fontWeight = isTotalRow ? ' font-weight: 600;' : '';
            return `
<tr${rowStyle}>
${row.map(cell => {
                const isNumeric = this.isNumericValue(cell);
                const alignment = isNumeric ? 'right' : 'left';
                return `<td style="border: 1px solid #cbd5e0; padding: 8px; text-align: ${alignment};${fontWeight}">${this.escapeHtml(cell)}</td>`;
            }).join('')}
</tr>`;
        }).join('')}
</tbody>
</table>
</div>`;
        return tableHTML;
    }
    isTotalRow(row) {
        // Check if the first cell contains "total", "sum", "subtotal", etc.
        const firstCell = row[0]?.trim().toLowerCase() || '';
        return /^(total|sum|subtotal|grand total)/i.test(firstCell);
    }
    lightenColor(hex, amount) {
        // Convert hex to RGB
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        // Lighten by mixing with white
        const newR = Math.round(r + (255 - r) * amount);
        const newG = Math.round(g + (255 - g) * amount);
        const newB = Math.round(b + (255 - b) * amount);
        // Convert back to hex
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
    isNumericValue(text) {
        const trimmed = text.trim();
        // Check if it's a currency value (starts with $, £, €, etc.)
        if (/^[$£€¥]/.test(trimmed)) {
            return true;
        }
        // Check if it's a number with optional commas and decimal
        // Examples: 1,234.56, 1234, 50%, 3.14
        if (/^-?\d{1,3}(,\d{3})*(\.\d+)?%?$/.test(trimmed)) {
            return true;
        }
        // Check if it's a simple number
        if (/^-?\d+(\.\d+)?%?$/.test(trimmed)) {
            return true;
        }
        return false;
    }
    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}
//# sourceMappingURL=TableTransform.js.map