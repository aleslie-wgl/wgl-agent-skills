/**
 * Validation types for PDF quality assurance
 */
import type { PDFConfig } from './Config.types.js';
/**
 * Result of validation process
 */
export interface ValidationResult {
    /** Whether validation passed */
    passed: boolean;
    /** Validation issues found */
    issues: ValidationIssue[];
    /** Paths to extracted page images (for review) */
    extractedPages?: string[];
    /** Validation timestamp */
    timestamp: Date;
    /** Number of validation attempts */
    attempts: number;
}
/**
 * Single validation issue
 */
export interface ValidationIssue {
    /** Issue severity */
    severity: ValidationSeverity;
    /** Page number where issue was found */
    page?: number;
    /** Human-readable description */
    message: string;
    /** Optional suggestion for fixing */
    suggestion?: string;
    /** Type of validation that failed */
    validationType: ValidationType;
}
/**
 * Severity levels for validation issues
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';
/**
 * Types of validation checks
 */
export type ValidationType = 'page-numbers' | 'table-formatting' | 'image-quality' | 'text-rendering' | 'layout' | 'branding' | 'accessibility' | 'file-size';
/**
 * Validator interface - all validators must implement this
 */
export interface Validator {
    /** Validator name */
    name: string;
    /** Type of validation performed */
    type: ValidationType;
    /**
     * Validate a PDF file
     * @param pdfPath - Path to PDF file
     * @param config - PDF configuration
     * @returns Validation result
     */
    validate(pdfPath: string, config: PDFConfig): Promise<ValidationResult>;
}
/**
 * Page extraction request
 */
export interface PageExtractionRequest {
    /** PDF file path */
    pdfPath: string;
    /** Page number to extract (1-indexed) */
    pageNumber: number;
    /** Output image path */
    outputPath: string;
    /** Image format */
    format?: ImageFormat;
    /** Image quality (0-100) */
    quality?: number;
}
/**
 * Supported image formats
 */
export type ImageFormat = 'png' | 'jpg' | 'jpeg' | 'webp';
/**
 * Result of page extraction
 */
export interface PageExtractionResult {
    /** Path to extracted image */
    imagePath: string;
    /** Page number extracted */
    pageNumber: number;
    /** Image dimensions */
    dimensions: {
        width: number;
        height: number;
    };
    /** File size in bytes */
    fileSize: number;
}
/**
 * Validation loop state
 */
export interface ValidationLoopState {
    /** Current attempt number */
    attempt: number;
    /** Maximum attempts allowed */
    maxAttempts: number;
    /** Accumulated issues across attempts */
    allIssues: ValidationIssue[];
    /** Whether loop should continue */
    shouldContinue: boolean;
    /** Extracted pages from current attempt */
    currentPages: PageExtractionResult[];
}
//# sourceMappingURL=Validation.types.d.ts.map