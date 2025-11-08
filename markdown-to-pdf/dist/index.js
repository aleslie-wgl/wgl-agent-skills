/**
 * Main entry point for markdown-to-pdf
 * Orchestrates the entire workflow
 */
import { Config } from './config/Config.js';
import { MarkdownProcessor } from './markdown/MarkdownProcessor.js';
import { PDFGenerator } from './pdf/PDFGenerator.js';
import { logger } from './utils/logger.js';
export async function generatePDF(config) {
    logger.section('Markdown to PDF Generator v1.0');
    logger.info(`Input:  ${config.input}`);
    logger.info(`Output: ${config.output}`);
    logger.info(`Title:  ${config.branding.title ?? '(auto-extracted)'}`);
    logger.info(`Client: ${config.branding.client}\n`);
    // Validate input file exists
    await Config.validateInputFile(config);
    // Step 1: Process markdown
    const markdownProcessor = new MarkdownProcessor();
    const parseResult = await markdownProcessor.process(config);
    // Update config with extracted title if needed
    if (!config.branding.title && parseResult.metadata.title) {
        config.branding.title = parseResult.metadata.title;
    }
    // Step 2: Generate PDF
    const pdfGenerator = new PDFGenerator();
    const result = await pdfGenerator.generate(parseResult.html, parseResult.headings, config);
    logger.section('Generation Complete');
    logger.info(`Output: ${result.outputPath}`);
    logger.info(`Pages: ${result.pageCount}`);
    logger.info(`Size: ${(result.fileSize / (1024 * 1024)).toFixed(2)} MB`);
    logger.info(`Headings: ${result.headings.filter(h => h.pageNumber).length} / ${result.headings.length} with page numbers\n`);
}
// CLI entry point
export async function main(args) {
    try {
        // Parse arguments
        const configPath = args.find((arg) => arg.endsWith('.json'));
        const input = args.find((arg) => arg.endsWith('.md'));
        if (!input) {
            console.error('Usage: markdown-to-pdf <input.md> [config.json] [--client "Client Name"]');
            process.exit(1);
        }
        let config;
        if (configPath) {
            // Load from config file
            const partialConfig = await Config.load(configPath);
            config = {
                ...partialConfig,
                input,
            };
        }
        else {
            // Parse CLI options
            const clientIndex = args.indexOf('--client');
            const client = clientIndex >= 0 ? args[clientIndex + 1] : undefined;
            config = await Config.fromCLI(input, {
                client,
                validate: args.includes('--validate'),
            });
        }
        await generatePDF(config);
    }
    catch (error) {
        if (error instanceof Error) {
            logger.error(`Error: ${error.message}`);
            if (error.stack) {
                console.error(error.stack);
            }
        }
        else {
            logger.error(`Unknown error: ${String(error)}`);
        }
        process.exit(1);
    }
}
// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main(process.argv.slice(2));
}
//# sourceMappingURL=index.js.map