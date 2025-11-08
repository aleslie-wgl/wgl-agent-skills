#!/usr/bin/env node
/**
 * markdown-to-pdf: Professional PDF Generator from Markdown
 *
 * Usage:
 *   node generate-pdf.js <input.md> [options]
 *
 * Options:
 *   --output <path>        Output PDF path
 *   --client <name>        Client name
 *   --company <name>       Company name
 *   --website <url>        Company website
 *   --email <address>      Contact email
 *   --phone <number>       Contact phone
 *   --address <address>    Company address
 *   --logo <path>          Logo file path (used for both title and header if specific ones not provided)
 *   --title-logo <path>    Title page logo file path
 *   --header-logo <path>   Header logo/icon file path
 *
 * Example:
 *   node generate-pdf.js proposal.md --client "Acme Corp" --logo ./logo.png
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pathToFileURL } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if dependencies are installed
const nodeModulesPath = join(__dirname, '..', 'node_modules');
if (!existsSync(nodeModulesPath)) {
    console.error('❌ Error: Dependencies not installed');
    console.error('');
    console.error('This skill requires npm dependencies to be installed.');
    console.error('Please run the following commands:');
    console.error('');
    console.error(`  cd "${join(__dirname, '..')}"`);
    console.error('  npm install');
    console.error('  npx playwright install chromium');
    console.error('');
    process.exit(1);
}

// Import from compiled dist directory
const distPath = join(__dirname, '..', 'dist');

// Dynamic import of the compiled TypeScript modules
async function main() {
    try {
        // Convert Windows paths to file:// URLs for ESM imports
        const configPath = pathToFileURL(join(distPath, 'config', 'Config.js')).href;
        const markdownPath = pathToFileURL(join(distPath, 'markdown', 'MarkdownProcessor.js')).href;
        const pdfPath = pathToFileURL(join(distPath, 'pdf', 'PDFGenerator.js')).href;
        const loggerPath = pathToFileURL(join(distPath, 'utils', 'logger.js')).href;

        const { Config } = await import(configPath);
        const { MarkdownProcessor } = await import(markdownPath);
        const { PDFGenerator } = await import(pdfPath);
        const { logger } = await import(loggerPath);

        // Parse command line arguments
        const args = process.argv.slice(2);

        if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
            printHelp();
            process.exit(0);
        }

        const input = args[0];
        if (!input || input.startsWith('--')) {
            console.error('Error: Input markdown file is required');
            printHelp();
            process.exit(1);
        }

        // Parse options
        const options = {};
        for (let i = 1; i < args.length; i++) {
            const arg = args[i];
            if (arg.startsWith('--')) {
                // Convert kebab-case to camelCase (e.g., title-logo -> titleLogo)
                const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
                const nextArg = args[i + 1];

                // Check if next arg is a value or another flag/end of args
                if (nextArg && !nextArg.startsWith('--')) {
                    options[key] = nextArg;
                    i++;
                } else {
                    // Boolean flag (no value)
                    options[key] = true;
                }
            }
        }

        logger.section('Markdown to PDF Generator v1.0');

        // Build configuration
        const config = await Config.fromCLI(input, options);

        logger.info(`Input:  ${config.input}`);
        logger.info(`Output: ${config.output}`);
        logger.info(`Client: ${config.branding.client}\n`);

        // Validate input
        await Config.validateInputFile(config);

        // Process markdown
        const processor = new MarkdownProcessor();
        const result = await processor.process(config);

        // Update title if extracted
        if (!config.branding.title && result.metadata.title) {
            config.branding.title = result.metadata.title;
        }

        logger.info(`Title: ${config.branding.title}\n`);

        // Generate PDF
        const generator = new PDFGenerator();
        const pdf = await generator.generate(
            result.html,
            result.headings,
            config
        );

        logger.section('Generation Complete');
        logger.info(`Output: ${pdf.outputPath}`);
        logger.info(`Pages: ${pdf.pageCount}`);
        logger.info(`Size: ${(pdf.fileSize / (1024 * 1024)).toFixed(2)} MB`);
        logger.info(`Headings: ${pdf.headings.filter(h => h.pageNumber).length} / ${pdf.headings.length} with page numbers\n`);

    } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
        if (error.stack && process.env.DEBUG) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
        process.exit(1);
    }
}

function printHelp() {
    console.log(`
markdown-to-pdf: Professional PDF Generator

Usage:
  node generate-pdf.js <input.md> [options]

Options:
  --output <path>        Output PDF path (default: same as input with .pdf extension)
  --client <name>        Client name (required)
  --company <name>       Company name
  --website <url>        Company website
  --email <address>      Contact email
  --phone <number>       Contact phone
  --address <address>    Company address
  --logo <path>          Logo file path (used for both if specific ones not set)
  --title-logo <path>    Title page logo file path
  --header-logo <path>   Header logo/icon file path

Examples:
  # Basic usage
  node generate-pdf.js proposal.md --client "Acme Corp"

  # Full options with separate logos
  node generate-pdf.js proposal.md \\
    --output final.pdf \\
    --client "Alberta Pensions Services" \\
    --company "WhiteGlove Labs AI Ltd." \\
    --email "contact@whiteglovelabs.ai" \\
    --title-logo "./logo-gold.png" \\
    --header-logo "./icon.jpg"

Note: Ensure the skill's TypeScript code has been built first:
  cd C:\\Users\\LeeLee\\.claude\\skills\\markdown-to-pdf
  npm run build
`);
}

// Run the script
main();
