/**
 * Simple logger utility
 */

export class Logger {
    private readonly prefix: string;

    constructor(prefix: string = '') {
        this.prefix = prefix;
    }

    info(message: string): void {
        console.log(`${this.prefix}${message}`);
    }

    success(message: string): void {
        console.log(`✓ ${message}`);
    }

    error(message: string): void {
        console.error(`✗ ${message}`);
    }

    warn(message: string): void {
        console.warn(`⚠ ${message}`);
    }

    step(current: number, total: number, message: string): void {
        console.log(`  [${current}/${total}] ${message}`);
    }

    section(title: string): void {
        console.log('\n' + '='.repeat(70));
        console.log(title);
        console.log('='.repeat(70) + '\n');
    }
}

export const logger = new Logger();
