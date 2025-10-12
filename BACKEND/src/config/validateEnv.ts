/**
 * Environment Variable Validation
 * Version: 1.0.0
 * 
 * Validates all required environment variables at startup
 * Provides clear error messages for missing/invalid configuration
 */

import { logger } from '../utils/logger';

interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  
  // Optional but recommended
  HF_TOKEN?: string;
  
  // Model configuration
  LLM_MODEL: string;
  LLM_DEVICE: 'cpu' | 'cuda' | 'auto';
  
  // Voice model configuration
  STT_MODEL: string;
  TTS_MODEL: string;
  
  // API configuration
  CORS_ORIGIN: string;
  
  // Logging
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Validation rules for each environment variable
 */
const validationRules = {
  NODE_ENV: {
    required: true,
    validator: (value: string) => ['development', 'production', 'test'].includes(value),
    default: 'development',
    message: 'NODE_ENV must be one of: development, production, test'
  },
  PORT: {
    required: true,
    validator: (value: string) => !isNaN(parseInt(value)) && parseInt(value) > 0 && parseInt(value) < 65536,
    default: '3000',
    transform: (value: string) => parseInt(value),
    message: 'PORT must be a valid port number (1-65535)'
  },
  DATABASE_URL: {
    required: true,
    validator: (value: string) => value.length > 0,
    default: './data/database.sqlite',
    message: 'DATABASE_URL must be a valid database path or connection string'
  },
  JWT_SECRET: {
    required: true,
    validator: (value: string) => value.length >= 32,
    message: 'JWT_SECRET must be at least 32 characters long for security'
  },
  HF_TOKEN: {
    required: false,
    validator: (value: string) => value.startsWith('hf_'),
    message: 'HF_TOKEN should start with "hf_" (HuggingFace token format)'
  },
  LLM_MODEL: {
    required: true,
    default: 'HooshvareLab/bert-fa-base-uncased',
    validator: (value: string) => value.includes('/') || value.length > 0,
    message: 'LLM_MODEL must be a valid model identifier'
  },
  LLM_DEVICE: {
    required: true,
    default: 'auto',
    validator: (value: string) => ['cpu', 'cuda', 'auto'].includes(value),
    message: 'LLM_DEVICE must be one of: cpu, cuda, auto'
  },
  STT_MODEL: {
    required: true,
    default: 'small',
    validator: (value: string) => ['tiny', 'base', 'small', 'medium', 'large'].includes(value),
    message: 'STT_MODEL must be one of: tiny, base, small, medium, large'
  },
  TTS_MODEL: {
    required: true,
    default: 'persian_mms',
    validator: (value: string) => value.length > 0,
    message: 'TTS_MODEL must be a valid TTS model identifier'
  },
  CORS_ORIGIN: {
    required: true,
    default: 'http://localhost:5173',
    validator: (value: string) => value.length > 0,
    message: 'CORS_ORIGIN must be set'
  },
  LOG_LEVEL: {
    required: true,
    default: 'info',
    validator: (value: string) => ['debug', 'info', 'warn', 'error'].includes(value),
    message: 'LOG_LEVEL must be one of: debug, info, warn, error'
  }
};

/**
 * Validate all environment variables
 * Exits process with code 1 if validation fails
 */
export function validateEnv(): EnvConfig {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config: any = {};

  logger.info('Validating environment variables...');

  // Check each validation rule
  for (const [key, rule] of Object.entries(validationRules)) {
    const value = process.env[key];
    
    // Check if required and missing
    if (rule.required && !value) {
      if (rule.default) {
        config[key] = rule.default;
        warnings.push(`${key} not set, using default: ${rule.default}`);
      } else {
        errors.push(`${key} is required but not set. ${rule.message}`);
      }
      continue;
    }
    
    // If optional and missing, skip
    if (!rule.required && !value) {
      if (key === 'HF_TOKEN') {
        warnings.push('HF_TOKEN not set - HuggingFace API rate limits will apply');
      }
      continue;
    }
    
    // Validate value if present
    if (value && rule.validator && !rule.validator(value)) {
      errors.push(`${key} has invalid value: ${value}. ${rule.message}`);
      continue;
    }
    
    // Transform value if needed
    config[key] = rule.transform ? rule.transform(value!) : value;
  }

  // Log warnings
  if (warnings.length > 0) {
    logger.warn('Environment configuration warnings:');
    warnings.forEach(warning => logger.warn(`  ⚠️  ${warning}`));
  }

  // If errors, log and exit
  if (errors.length > 0) {
    logger.error('❌ Environment validation failed:');
    errors.forEach(error => logger.error(`  - ${error}`));
    logger.error('\nPlease check your .env file and ensure all required variables are set correctly.');
    process.exit(1);
  }

  logger.info('✅ Environment validation passed');
  
  return config as EnvConfig;
}

/**
 * Get validated environment configuration
 * Call this once at app startup
 */
export function getEnvConfig(): EnvConfig {
  if (!global.__envConfig) {
    global.__envConfig = validateEnv();
  }
  return global.__envConfig;
}

/**
 * Print current environment configuration (safe - no secrets)
 */
export function printEnvConfig(): void {
  const config = getEnvConfig();
  
  logger.info('Current environment configuration:');
  logger.info(`  NODE_ENV: ${config.NODE_ENV}`);
  logger.info(`  PORT: ${config.PORT}`);
  logger.info(`  DATABASE_URL: ${config.DATABASE_URL}`);
  logger.info(`  JWT_SECRET: ${config.JWT_SECRET ? '[SET]' : '[NOT SET]'}`);
  logger.info(`  HF_TOKEN: ${config.HF_TOKEN ? '[SET]' : '[NOT SET]'}`);
  logger.info(`  LLM_MODEL: ${config.LLM_MODEL}`);
  logger.info(`  LLM_DEVICE: ${config.LLM_DEVICE}`);
  logger.info(`  STT_MODEL: ${config.STT_MODEL}`);
  logger.info(`  TTS_MODEL: ${config.TTS_MODEL}`);
  logger.info(`  CORS_ORIGIN: ${config.CORS_ORIGIN}`);
  logger.info(`  LOG_LEVEL: ${config.LOG_LEVEL}`);
}

// Extend global type
declare global {
  var __envConfig: EnvConfig | undefined;
}
