/**
 * Simple logger utility
 */
export class Logger {
    prefix;
    constructor(prefix = '') {
        this.prefix = prefix;
    }
    info(message) {
        console.log(`${this.prefix}${message}`);
    }
    success(message) {
        console.log(`✓ ${message}`);
    }
    error(message) {
        console.error(`✗ ${message}`);
    }
    warn(message) {
        console.warn(`⚠ ${message}`);
    }
    step(current, total, message) {
        console.log(`  [${current}/${total}] ${message}`);
    }
    section(title) {
        console.log('\n' + '='.repeat(70));
        console.log(title);
        console.log('='.repeat(70) + '\n');
    }
}
export const logger = new Logger();
//# sourceMappingURL=logger.js.map