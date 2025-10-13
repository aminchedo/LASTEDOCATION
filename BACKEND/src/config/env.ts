import 'dotenv/config';

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 3001),
  LOG_DIR: process.env.LOG_DIR || 'logs',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: Number(process.env.DB_PORT || 5432),
  DB_NAME: process.env.DB_NAME || 'persian_tts',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
  
  // API override (external)
  CUSTOM_API_ENDPOINT: process.env.CUSTOM_API_ENDPOINT || '',
  CUSTOM_API_KEY: process.env.CUSTOM_API_KEY || '',
  
  // CORS
  CORS_ORIGIN: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173').split(','),
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // HuggingFace
  HF_TOKEN: process.env.HF_TOKEN || '',
};;
