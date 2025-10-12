/**
 * Environment Variable Validation
 * Version: 1.0.0
 *
 * Validates all required environment variables at startup
 * Provides clear error messages for missing/invalid configuration
 */
interface EnvConfig {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: number;
    DATABASE_URL: string;
    JWT_SECRET: string;
    HF_TOKEN?: string;
    LLM_MODEL: string;
    LLM_DEVICE: 'cpu' | 'cuda' | 'auto';
    STT_MODEL: string;
    TTS_MODEL: string;
    CORS_ORIGIN: string;
    LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}
/**
 * Validate all environment variables
 * Exits process with code 1 if validation fails
 */
export declare function validateEnv(): EnvConfig;
/**
 * Get validated environment configuration
 * Call this once at app startup
 */
export declare function getEnvConfig(): EnvConfig;
/**
 * Print current environment configuration (safe - no secrets)
 */
export declare function printEnvConfig(): void;
declare global {
    var __envConfig: EnvConfig | undefined;
}
export {};
//# sourceMappingURL=validateEnv.d.ts.map