/**
 * Heading ID transformation
 * Adds unique IDs to HTML headings after markdown rendering
 * This is applied to HTML, not markdown
 */
export class HeadingTransform {
    name = 'HeadingTransform';
    /**
     * Add IDs to HTML headings
     * @param html - Rendered HTML content
     * @param config - PDF configuration
     * @returns HTML with heading IDs
     */
    apply(html, _config) {
        let headingCounter = 0;
        return html.replace(/<h([1-6])>(.*?)<\/h\1>/g, (_match, level, content) => {
            headingCounter++;
            const id = `heading-${headingCounter}`;
            return `<h${level} id="${id}">${content}</h${level}>`;
        });
    }
}
//# sourceMappingURL=HeadingTransform.js.map