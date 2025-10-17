type LogMessage = string | Record<string, any>;
export declare const logger: {
    info: (msg: LogMessage) => void;
    error: (msg: LogMessage) => void;
    debug: (msg: LogMessage) => void;
    warn: (msg: LogMessage) => void;
};
export {};
//# sourceMappingURL=logger.d.ts.map