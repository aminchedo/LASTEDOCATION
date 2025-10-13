import 'dotenv/config';

// Validation helper
function validateEnv() {
  const errors: string[] = [];

  // Validate NODE_ENV
  const validEnvs = ['development', 'production', 'test'];
  if (process.env.NODE_ENV && !validEnvs.includes(process.env.NODE_ENV)) {
    errors.push(`NODE_ENV must be one of: ${validEnvs.join(', ')}`);
  }

  // Validate PORT
  const port = Number(process.env.PORT || 3001);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push('PORT must be a valid number between 1 and 65535');
  }

  // Validate HuggingFace token format (if provided)
  if (process.env.HUGGINGFACE_TOKEN) {
    const token = process.env.HUGGINGFACE_TOKEN.trim();
    if (!token.startsWith('hf_')) {
      console.warn('⚠️  HUGGINGFACE_TOKEN should start with "hf_" - some downloads may fail');
    }
  } else {
    console.warn('⚠️  HUGGINGFACE_TOKEN not set - HuggingFace downloads may be rate-limited or fail');
  }

  // Validate JWT_SECRET in production
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is required in production');
  }

  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach(err => console.error(`   - ${err}`));
    process.exit(1);
  }
}

// Run validation
validateEnv();

// Parse CORS origins
function parseCorsOrigins(originsStr: string): string[] {
  return originsStr
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 3001),
  LOG_DIR: process.env.LOG_DIR || 'logs',
  
  // HuggingFace integration
  HUGGINGFACE_TOKEN: process.env.HUGGINGFACE_TOKEN?.trim() || '',
  
  // API override (external)
  CUSTOM_API_ENDPOINT: process.env.CUSTOM_API_ENDPOINT || '',
  CUSTOM_API_KEY: process.env.CUSTOM_API_KEY || '',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  
  // CORS - support multiple origins
  CORS_ORIGIN: parseCorsOrigins(
    process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173,http://localhost:5174'
  ),
};t(','),
};
