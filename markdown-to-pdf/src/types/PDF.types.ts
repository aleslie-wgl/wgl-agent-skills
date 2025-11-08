/**
 * PDF generation types
 */

import type { Heading } from './Markdown.types.js';

/**
 * Result of PDF generation
 */
export interface PDFGenerationResult {
    /** Path to generated PDF file */
    outputPath: string;

    /** Total number of pages */
    pageCount: number;

    /** File size in bytes */
    fileSize: number;

    /** Headings with page numbers */
    headings: Heading[];

    /** Generation timestamp */
    generatedAt: Date;
}

/**
 * Result of page number extraction
 */
export interface PageNumberExtractionResult {
    /** Headings with extracted page numbers */
    headings: Heading[];

    /** Page range in document */
    pageRange: PageRange;

    /** Method used for extraction */
    extractionMethod: ExtractionMethod;

    /** Number of headings successfully extracted */
    successCount: number;

    /** Total number of headings attempted */
    totalCount: number;
}

/**
 * Page range in PDF
 */
export interface PageRange {
    /** Minimum page number */
    min: number;

    /** Maximum page number */
    max: number;
}

/**
 * Method used for page number extraction
 */
export type ExtractionMethod = 'browser' | 'text-matching' | 'fallback';

/**
 * Configuration for PDF rendering
 */
export interface PDFRenderConfig {
    /** Page width in pixels */
    width: number;

    /** Page height in pixels */
    height: number;

    /** Print background graphics */
    printBackground: boolean;

    /** Display header and footer */
    displayHeaderFooter: boolean;

    /** Prefer CSS page size */
    preferCSSPageSize: boolean;
}

/**
 * Compressed image result
 */
export interface CompressedImage {
    /** Output file path */
    path: string;

    /** Original file size in bytes */
    originalSize: number;

    /** Compressed file size in bytes */
    compressedSize: number;

    /** Compression ratio (0-1) */
    ratio: number;
}

/**
 * PDF merge operation
 */
export interface PDFMergeOperation {
    /** Source PDF files to merge */
    sources: string[];

    /** Output PDF path */
    output: string;

    /** Whether to compress the merged PDF */
    compress: boolean;
}
