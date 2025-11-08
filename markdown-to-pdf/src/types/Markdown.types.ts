/**
 * Markdown processing types
 */

import type { PDFConfig } from './Config.types.js';

/**
 * Transform interface for markdown preprocessing
 * Each transform modifies the markdown before HTML rendering
 */
export interface Transform {
    /** Human-readable name of the transform */
    name: string;

    /**
     * Apply the transform to markdown content
     * @param markdown - Raw markdown string
     * @param config - PDF configuration
     * @returns Transformed markdown string
     */
    apply(markdown: string, config: PDFConfig): string;
}

/**
 * Result of parsing markdown to HTML
 */
export interface MarkdownParseResult {
    /** Rendered HTML content */
    html: string;

    /** Extracted headings with metadata */
    headings: Heading[];

    /** Document metadata */
    metadata: DocumentMetadata;
}

/**
 * Heading extracted from document
 */
export interface Heading {
    /** Heading level (1-6) */
    level: number;

    /** Heading text content */
    text: string;

    /** Generated ID for linking */
    id: string;

    /** Page number (populated after PDF generation) */
    pageNumber?: number;
}

/**
 * Document metadata extracted from markdown
 */
export interface DocumentMetadata {
    /** Document title (from first H1 or config) */
    title?: string;

    /** Author name */
    author?: string;

    /** Document date */
    date?: Date;

    /** Custom frontmatter fields */
    custom?: Record<string, string | number | boolean>;
}

/**
 * Table detected in markdown for transformation
 */
export interface TableMatch {
    /** Original matched string */
    original: string;

    /** Table header row */
    headers: string[];

    /** Table data rows */
    rows: string[][];

    /** Starting position in markdown */
    startIndex: number;

    /** Ending position in markdown */
    endIndex: number;
}
