/**
 * Configuration loader and validator
 * Handles loading config from JSON files and applying defaults
 */
import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_COLORS, DEFAULT_VALIDATION, DEFAULT_LOGO, } from './defaults.js';
/**
 * Configuration manager
 */
export class Config {
    /**
     * Load configuration from JSON file
     * @param configPath - Path to config JSON file
     * @returns Resolved configuration
     */
    static async load(configPath) {
        // Read config file
        const configContent = await fs.promises.readFile(configPath, 'utf-8');
        const partialConfig = JSON.parse(configContent);
        // Validate required fields
        this.validatePartialConfig(partialConfig);
        // Resolve and apply defaults
        return this.resolveConfig(partialConfig, path.dirname(configPath));
    }
    /**
     * Create configuration from CLI arguments
     * @param input - Input markdown file
     * @param options - CLI options
     * @returns Resolved configuration
     */
    static async fromCLI(input, options) {
        // Determine logo paths (with backwards compatibility)
        const titleLogoPath = options.titleLogo ?? options.logo;
        const headerLogoPath = options.headerLogo ?? options.logo;
        const partialConfig = {
            input,
            output: options.output,
            branding: {
                title: options.title,
                client: options.client ?? 'Client',
                company: {
                    name: options.company ?? 'Company Name',
                    website: options.website ?? 'example.com',
                    email: options.email ?? 'contact@example.com',
                    phone: options.phone,
                    address: options.address,
                },
                logo: (titleLogoPath || headerLogoPath)
                    ? {
                        titlePath: titleLogoPath || '',
                        headerPath: headerLogoPath || '',
                        titlePageWidth: DEFAULT_LOGO.titlePageWidth,
                        headerHeight: DEFAULT_LOGO.headerHeight,
                    }
                    : undefined,
            },
            validation: options.validate
                ? { enabled: true, autoExtractFirst: 3 }
                : undefined,
        };
        return this.resolveConfig(partialConfig, process.cwd());
    }
    /**
     * Validate that required config fields are present
     */
    static validatePartialConfig(config) {
        if (!config.input) {
            throw new Error('Config must specify "input" field');
        }
        if (!config.branding) {
            throw new Error('Config must specify "branding" field');
        }
        if (!config.branding.client) {
            throw new Error('Config branding must specify "client"');
        }
        if (!config.branding.company) {
            throw new Error('Config branding must specify "company"');
        }
        const { company } = config.branding;
        if (!company.name || !company.website || !company.email) {
            throw new Error('Config branding.company must specify name, website, and email');
        }
    }
    /**
     * Resolve configuration with defaults and path resolution
     */
    static resolveConfig(partial, baseDir) {
        // Resolve input path
        const inputPath = path.isAbsolute(partial.input)
            ? partial.input
            : path.resolve(baseDir, partial.input);
        // Resolve output path
        const outputPath = partial.output ??
            inputPath.replace(/\\.md$/, '.pdf');
        // Resolve logo paths (if provided)
        let titleLogoPath = '';
        let headerLogoPath = '';
        if (partial.branding.logo?.titlePath && partial.branding.logo.titlePath.trim() !== '') {
            titleLogoPath = path.isAbsolute(partial.branding.logo.titlePath)
                ? partial.branding.logo.titlePath
                : path.resolve(baseDir, partial.branding.logo.titlePath);
            // Verify title logo exists
            if (!fs.existsSync(titleLogoPath)) {
                throw new Error(`Title logo file not found: ${titleLogoPath}`);
            }
        }
        if (partial.branding.logo?.headerPath && partial.branding.logo.headerPath.trim() !== '') {
            headerLogoPath = path.isAbsolute(partial.branding.logo.headerPath)
                ? partial.branding.logo.headerPath
                : path.resolve(baseDir, partial.branding.logo.headerPath);
            // Verify header logo exists
            if (!fs.existsSync(headerLogoPath)) {
                throw new Error(`Header logo file not found: ${headerLogoPath}`);
            }
        }
        // Build resolved config
        const resolved = {
            input: inputPath,
            output: outputPath,
            branding: {
                title: partial.branding.title,
                client: partial.branding.client,
                company: partial.branding.company,
                logo: {
                    titlePath: titleLogoPath,
                    headerPath: headerLogoPath,
                    titlePageWidth: partial.branding.logo?.titlePageWidth ??
                        DEFAULT_LOGO.titlePageWidth,
                    headerHeight: partial.branding.logo?.headerHeight ??
                        DEFAULT_LOGO.headerHeight,
                },
                colors: {
                    ...DEFAULT_COLORS,
                    ...partial.branding.colors,
                },
            },
            validation: {
                ...DEFAULT_VALIDATION,
                ...partial.validation,
            },
        };
        return resolved;
    }
    /**
     * Validate that input file exists
     */
    static async validateInputFile(config) {
        if (!fs.existsSync(config.input)) {
            throw new Error(`Input file not found: ${config.input}`);
        }
        const stats = await fs.promises.stat(config.input);
        if (!stats.isFile()) {
            throw new Error(`Input path is not a file: ${config.input}`);
        }
    }
}
//# sourceMappingURL=Config.js.map