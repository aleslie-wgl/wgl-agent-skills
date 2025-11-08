/**
 * Image compression utilities using Sharp
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import sharp from 'sharp';
import type { CompressedImage } from '../types/index.js';

/**
 * Compress logo for title page
 * @param logoPath - Path to original logo
 * @param targetWidth - Target width in pixels
 * @param targetSize - Target file size in bytes
 * @returns Path to compressed logo
 */
export async function compressLogoForTitlePage(
    logoPath: string,
    targetWidth: number,
    targetSize: number
): Promise<CompressedImage> {
    const originalSize = fs.statSync(logoPath).size;
    const tempDir = path.join(os.tmpdir(), 'pdf-logos');

    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputPath = path.join(
        tempDir,
        `title-logo-${Date.now()}.png`
    );

    // Start with high quality
    let quality = 90;
    let compressedSize = originalSize;

    // Iteratively reduce quality until we hit target size
    while (quality > 10 && compressedSize > targetSize) {
        await sharp(logoPath)
            .resize(targetWidth, null, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .png({ quality })
            .toFile(outputPath);

        compressedSize = fs.statSync(outputPath).size;

        if (compressedSize > targetSize) {
            quality -= 10;
        }
    }

    return {
        path: outputPath,
        originalSize,
        compressedSize,
        ratio: compressedSize / originalSize,
    };
}

/**
 * Compress logo for page header
 * @param logoPath - Path to original logo
 * @param targetHeight - Target height in pixels
 * @param targetSize - Target file size in bytes
 * @returns Path to compressed logo
 */
export async function compressLogoForHeader(
    logoPath: string,
    targetHeight: number,
    targetSize: number
): Promise<CompressedImage> {
    const originalSize = fs.statSync(logoPath).size;
    const tempDir = path.join(os.tmpdir(), 'pdf-logos');

    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputPath = path.join(
        tempDir,
        `header-logo-${Date.now()}.png`
    );

    // Start with high quality
    let quality = 90;
    let compressedSize = originalSize;

    // Iteratively reduce quality until we hit target size
    while (quality > 10 && compressedSize > targetSize) {
        await sharp(logoPath)
            .resize(null, targetHeight, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .png({ quality })
            .toFile(outputPath);

        compressedSize = fs.statSync(outputPath).size;

        if (compressedSize > targetSize) {
            quality -= 10;
        }
    }

    return {
        path: outputPath,
        originalSize,
        compressedSize,
        ratio: compressedSize / originalSize,
    };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes}B`;
    } else if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)}KB`;
    } else {
        return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
    }
}
