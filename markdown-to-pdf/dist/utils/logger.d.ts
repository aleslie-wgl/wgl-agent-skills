/**
 * Simple logger utility
 */
export declare class Logger {
    private readonly prefix;
    constructor(prefix?: string);
    info(message: string): void;
    success(message: string): void;
    error(message: string): void;
    warn(message: string): void;
    step(current: number, total: number, message: string): void;
    section(title: string): void;
}
export declare const logger: Logger;
//# sourceMappingURL=logger.d.ts.map