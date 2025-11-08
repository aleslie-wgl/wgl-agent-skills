/**
 * Image compression utilities using Sharp
 */
import type { CompressedImage } from '../types/index.js';
/**
 * Compress logo for title page
 * @param logoPath - Path to original logo
 * @param targetWidth - Target width in pixels
 * @param targetSize - Target file size in bytes
 * @returns Path to compressed logo
 */
export declare function compressLogoForTitlePage(logoPath: string, targetWidth: number, targetSize: number): Promise<CompressedImage>;
/**
 * Compress logo for page header
 * @param logoPath - Path to original logo
 * @param targetHeight - Target height in pixels
 * @param targetSize - Target file size in bytes
 * @returns Path to compressed logo
 */
export declare function compressLogoForHeader(logoPath: string, targetHeight: number, targetSize: number): Promise<CompressedImage>;
/**
 * Format file size for display
 */
export declare function formatFileSize(bytes: number): string;
//# sourceMappingURL=imageCompression.d.ts.map