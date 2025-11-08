/**
 * Default configuration values
 * These are used as fallbacks when not specified in config file
 */

import type { ColorScheme, ValidationConfig } from '../types/index.js';

/**
 * Default color scheme (WhiteGlove Labs branding)
 */
export const DEFAULT_COLORS: ColorScheme = {
    primary: '#1a365d',
    secondary: '#2c5282',
    accent: '#60a5fa',
    tableHeader: '#1a365d',
    tableRowAlt: '#f7fafc',
};

/**
 * Default validation configuration
 */
export const DEFAULT_VALIDATION: Required<ValidationConfig> = {
    enabled: false,
    pagesToExtract: [],
    autoExtractFirst: 0,
    maxAttempts: 3,
};

/**
 * Default logo dimensions
 */
export const DEFAULT_LOGO = {
    titlePageWidth: 375,
    headerHeight: 50,
};

/**
 * PDF rendering defaults
 */
export const PDF_DEFAULTS = {
    pageWidth: 816, // Letter size at 96 DPI
    pageHeight: 1056,
    printBackground: true,
    displayHeaderFooter: true,
    preferCSSPageSize: true,
};

/**
 * Compression defaults
 */
export const COMPRESSION_DEFAULTS = {
    titleLogoTargetSize: 21 * 1024, // 21KB
    headerLogoTargetSize: 1024, // 1KB
    quality: 90,
};
