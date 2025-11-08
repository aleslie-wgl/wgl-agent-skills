/**
 * Configuration types for PDF generation
 * All types follow strict TypeScript standards (no 'any' allowed)
 */

export interface PDFConfig {
    /** Input markdown file path (absolute or relative) */
    input: string;

    /** Output PDF path (auto-generated if not provided) */
    output?: string;

    /** Branding configuration for the PDF */
    branding: BrandingConfig;

    /** Optional validation configuration */
    validation?: ValidationConfig;
}

export interface BrandingConfig {
    /** Document title (auto-extracted from first H1 if not provided) */
    title?: string;

    /** Client name (appears in header) */
    client: string;

    /** Company information */
    company: CompanyInfo;

    /** Logo configuration */
    logo: LogoConfig;

    /** Color scheme for branding */
    colors: ColorScheme;
}

export interface CompanyInfo {
    /** Company name */
    name: string;

    /** Company website URL */
    website: string;

    /** Primary contact email */
    email: string;

    /** Optional phone number */
    phone?: string;

    /** Optional physical address */
    address?: string;
}

export interface LogoConfig {
    /** Path to title page logo file (absolute or relative to config) */
    titlePath: string;

    /** Path to header logo/icon file (absolute or relative to config) */
    headerPath: string;

    /** Logo width on title page (in pixels) */
    titlePageWidth: number;

    /** Logo height in page header (in pixels) */
    headerHeight: number;
}

export interface ColorScheme {
    /** Primary brand color (hex code) */
    primary: string;

    /** Secondary brand color (hex code) */
    secondary: string;

    /** Accent color (hex code) */
    accent: string;

    /** Table header background color (hex code) */
    tableHeader: string;

    /** Alternating table row background color (hex code) */
    tableRowAlt: string;
}

export interface ValidationConfig {
    /** Enable validation loop */
    enabled: boolean;

    /** Specific page numbers to extract for validation */
    pagesToExtract?: number[];

    /** Auto-extract first N pages */
    autoExtractFirst?: number;

    /** Maximum validation attempts before failing */
    maxAttempts?: number;
}

/**
 * Runtime configuration with resolved paths and defaults
 */
export interface ResolvedPDFConfig extends PDFConfig {
    /** Resolved output path (never undefined) */
    output: string;

    /** Resolved logo paths (absolute) */
    branding: BrandingConfig & {
        logo: LogoConfig & {
            titlePath: string; // Absolute path
            headerPath: string; // Absolute path
        };
    };

    /** Validation config with defaults applied */
    validation: Required<ValidationConfig>;
}
