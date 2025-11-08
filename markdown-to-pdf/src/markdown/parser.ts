/**
 * Markdown parser configuration
 * Sets up markdown-it with appropriate options
 */

import MarkdownIt from 'markdown-it';

/**
 * Create configured markdown parser
 */
export function createMarkdownParser(): MarkdownIt {
    return new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
        breaks: false,
    });
}
