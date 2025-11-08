/**
 * Markdown processor
 * Orchestrates markdown transformation and rendering to HTML
 */
import * as fs from 'fs';
import { createMarkdownParser } from './parser.js';
import { TableTransform } from './transforms/TableTransform.js';
import { HeadingTransform } from './transforms/HeadingTransform.js';
export class MarkdownProcessor {
    transforms;
    headingTransform;
    parser;
    constructor() {
        // Initialize transforms
        this.transforms = [
            new TableTransform(),
        ];
        this.headingTransform = new HeadingTransform();
        this.parser = createMarkdownParser();
    }
    /**
     * Process markdown file to HTML
     * @param config - PDF configuration
     * @returns Parsed result with HTML and metadata
     */
    async process(config) {
        // Read markdown file
        const markdown = await fs.promises.readFile(config.input, 'utf-8');
        // Extract title from first H1 if not in config
        const title = config.branding.title ?? this.extractTitle(markdown);
        // Remove title from content if it was auto-extracted
        let contentMarkdown = markdown;
        if (!config.branding.title && title) {
            contentMarkdown = markdown.replace(/^#\s+.+$/m, '').trim();
        }
        // Apply markdown transforms (before HTML rendering)
        let transformedMarkdown = contentMarkdown;
        for (const transform of this.transforms) {
            transformedMarkdown = transform.apply(transformedMarkdown, config);
        }
        // Render to HTML
        let html = this.parser.render(transformedMarkdown);
        // Apply HTML transforms (after rendering)
        html = this.headingTransform.apply(html, config);
        // Extract headings
        const headings = this.extractHeadings(html);
        return {
            html,
            headings,
            metadata: {
                title,
                date: new Date(),
            },
        };
    }
    /**
     * Extract title from first H1 heading
     */
    extractTitle(markdown) {
        const match = markdown.match(/^#\s+(.+)$/m);
        return match?.[1]?.trim();
    }
    /**
     * Extract headings from HTML
     */
    extractHeadings(html) {
        const headings = [];
        const headingRegex = /<h([1-6])\s+id="([^"]+)">(.+?)<\/h\1>/g;
        let match;
        while ((match = headingRegex.exec(html)) !== null) {
            const level = parseInt(match[1] ?? '1', 10);
            const id = match[2] ?? '';
            const text = match[3] ?? '';
            // Strip HTML tags from text
            let cleanText = text.replace(/<[^>]+>/g, '');
            // Decode HTML entities (&amp; -> &, &lt; -> <, etc.)
            cleanText = this.decodeHtmlEntities(cleanText);
            headings.push({
                level,
                id,
                text: cleanText,
                pageNumber: undefined, // Will be populated by PDF generator
            });
        }
        return headings;
    }
    /**
     * Decode HTML entities in text
     */
    decodeHtmlEntities(text) {
        return text
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'");
    }
}
//# sourceMappingURL=MarkdownProcessor.js.map