/**
 * Configuration loader and validator
 * Handles loading config from JSON files and applying defaults
 */
import type { PDFConfig, ResolvedPDFConfig, BrandingConfig } from '../types/index.js';
/**
 * Partial config that can be loaded from JSON
 * (before resolution and validation)
 */
export interface PartialPDFConfig {
    input: string;
    output?: string;
    branding: Partial<BrandingConfig> & {
        client: string;
        company: BrandingConfig['company'];
    };
    validation?: PDFConfig['validation'];
}
/**
 * Configuration manager
 */
export declare class Config {
    /**
     * Load configuration from JSON file
     * @param configPath - Path to config JSON file
     * @returns Resolved configuration
     */
    static load(configPath: string): Promise<ResolvedPDFConfig>;
    /**
     * Create configuration from CLI arguments
     * @param input - Input markdown file
     * @param options - CLI options
     * @returns Resolved configuration
     */
    static fromCLI(input: string, options: {
        output?: string;
        client?: string;
        title?: string;
        company?: string;
        website?: string;
        email?: string;
        phone?: string;
        address?: string;
        logo?: string;
        titleLogo?: string;
        headerLogo?: string;
        validate?: boolean;
    }): Promise<ResolvedPDFConfig>;
    /**
     * Validate that required config fields are present
     */
    private static validatePartialConfig;
    /**
     * Resolve configuration with defaults and path resolution
     */
    private static resolveConfig;
    /**
     * Validate that input file exists
     */
    static validateInputFile(config: ResolvedPDFConfig): Promise<void>;
}
//# sourceMappingURL=Config.d.ts.map