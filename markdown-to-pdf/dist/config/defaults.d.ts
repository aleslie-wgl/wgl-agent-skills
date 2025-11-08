/**
 * Default configuration values
 * These are used as fallbacks when not specified in config file
 */
import type { ColorScheme, ValidationConfig } from '../types/index.js';
/**
 * Default color scheme (WhiteGlove Labs branding)
 */
export declare const DEFAULT_COLORS: ColorScheme;
/**
 * Default validation configuration
 */
export declare const DEFAULT_VALIDATION: Required<ValidationConfig>;
/**
 * Default logo dimensions
 */
export declare const DEFAULT_LOGO: {
    titlePageWidth: number;
    headerHeight: number;
};
/**
 * PDF rendering defaults
 */
export declare const PDF_DEFAULTS: {
    pageWidth: number;
    pageHeight: number;
    printBackground: boolean;
    displayHeaderFooter: boolean;
    preferCSSPageSize: boolean;
};
/**
 * Compression defaults
 */
export declare const COMPRESSION_DEFAULTS: {
    titleLogoTargetSize: number;
    headerLogoTargetSize: number;
    quality: number;
};
//# sourceMappingURL=defaults.d.ts.map