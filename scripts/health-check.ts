/**
 * Comprehensive Health Check Script
 * Version: 1.0.0
 * 
 * Tests all system components and reports their status
 * Usage: npx tsx scripts/health-check.ts
 */

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message: string;
  details?: any;
  latency?: number;
}

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const TIMEOUT = 10000; // 10 seconds

/**
 * Check if backend server is running
 */
async function checkBackend(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: TIMEOUT
    });
    
    const latency = Date.now() - startTime;
    
    return {
      service: 'Backend API',
      status: 'healthy',
      message: 'Backend is running',
      latency,
      details: response.data
    };
  } catch (error: any) {
    return {
      service: 'Backend API',
      status: 'unhealthy',
      message: `Backend not responding: ${error.message}`,
      details: {
        url: API_BASE_URL,
        error: error.code
      }
    };
  }
}

/**
 * Check LLM service health
 */
async function checkLLM(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/models/health`, {
      timeout: TIMEOUT
    });
    
    const latency = Date.now() - startTime;
    
    if (response.data.status === 'healthy') {
      return {
        service: 'LLM Service',
        status: 'healthy',
        message: `Model loaded: ${response.data.model || 'unknown'}`,
        latency,
        details: response.data
      };
    } else {
      return {
        service: 'LLM Service',
        status: 'degraded',
        message: 'LLM service available but model not loaded',
        details: response.data
      };
    }
  } catch (error: any) {
    return {
      service: 'LLM Service',
      status: 'unhealthy',
      message: 'LLM service not available',
      details: { error: error.message }
    };
  }
}

/**
 * Check STT service health
 */
async function checkSTT(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/stt/health`, {
      timeout: TIMEOUT
    });
    
    const latency = Date.now() - startTime;
    
    return {
      service: 'STT (Speech-to-Text)',
      status: response.data.status === 'healthy' ? 'healthy' : 'degraded',
      message: `Whisper model: ${response.data.model || 'unknown'}`,
      latency,
      details: response.data
    };
  } catch (error: any) {
    return {
      service: 'STT (Speech-to-Text)',
      status: 'unhealthy',
      message: 'STT service not available',
      details: { error: error.message }
    };
  }
}

/**
 * Check TTS service health
 */
async function checkTTS(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/tts/health`, {
      timeout: TIMEOUT
    });
    
    const latency = Date.now() - startTime;
    
    return {
      service: 'TTS (Text-to-Speech)',
      status: response.data.status === 'healthy' ? 'healthy' : 'degraded',
      message: 'TTS model ready',
      latency,
      details: response.data
    };
  } catch (error: any) {
    return {
      service: 'TTS (Text-to-Speech)',
      status: 'unhealthy',
      message: 'TTS service not available',
      details: { error: error.message }
    };
  }
}

/**
 * Check HuggingFace API connectivity
 */
async function checkHuggingFace(): Promise<HealthCheck> {
  try {
    const response = await axios.get('https://huggingface.co/api/models?limit=1', {
      timeout: 5000
    });
    
    const hasToken = !!process.env.HF_TOKEN;
    
    return {
      service: 'HuggingFace API',
      status: 'healthy',
      message: hasToken ? 'Connected (authenticated)' : 'Connected (unauthenticated)',
      details: {
        authenticated: hasToken,
        rateLimit: hasToken ? '10,000/hour' : '1,000/hour'
      }
    };
  } catch (error: any) {
    return {
      service: 'HuggingFace API',
      status: 'unhealthy',
      message: 'Cannot reach HuggingFace API',
      details: { error: error.message }
    };
  }
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheck> {
  try {
    const dbPath = process.env.DATABASE_URL || './data/database.sqlite';
    await fs.access(dbPath);
    
    const stats = await fs.stat(dbPath);
    
    return {
      service: 'Database',
      status: 'healthy',
      message: `SQLite database accessible`,
      details: {
        path: dbPath,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        modified: stats.mtime
      }
    };
  } catch (error: any) {
    return {
      service: 'Database',
      status: 'unhealthy',
      message: 'Database file not accessible',
      details: { error: error.message }
    };
  }
}

/**
 * Check training data availability
 */
async function checkTrainingData(): Promise<HealthCheck> {
  try {
    const dataPath = path.join(process.cwd(), 'combined.jsonl');
    await fs.access(dataPath);
    
    const stats = await fs.stat(dataPath);
    const content = await fs.readFile(dataPath, 'utf-8');
    const lines = content.trim().split('\n').length;
    
    return {
      service: 'Training Dataset',
      status: 'healthy',
      message: `Dataset available: ${lines} samples`,
      details: {
        path: dataPath,
        samples: lines,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`
      }
    };
  } catch (error: any) {
    return {
      service: 'Training Dataset',
      status: 'unhealthy',
      message: 'Training data not found',
      details: {
        error: error.message,
        expectedPath: path.join(process.cwd(), 'combined.jsonl')
      }
    };
  }
}

/**
 * Check filesystem directories
 */
async function checkDirectories(): Promise<HealthCheck> {
  const requiredDirs = [
    'logs',
    'data',
    'models',
    'BACKEND/temp'
  ];
  
  const missing: string[] = [];
  
  for (const dir of requiredDirs) {
    try {
      await fs.access(dir);
    } catch {
      missing.push(dir);
    }
  }
  
  if (missing.length === 0) {
    return {
      service: 'Filesystem',
      status: 'healthy',
      message: 'All required directories exist',
      details: { checked: requiredDirs }
    };
  } else {
    return {
      service: 'Filesystem',
      status: 'degraded',
      message: `${missing.length} directories missing`,
      details: {
        missing,
        note: 'These will be created automatically if needed'
      }
    };
  }
}

/**
 * Format and display health check results
 */
function displayResults(checks: HealthCheck[]): void {
  console.log('\n' + '='.repeat(70));
  console.log('🏥 SYSTEM HEALTH CHECK REPORT');
  console.log('='.repeat(70) + '\n');
  
  checks.forEach(check => {
    const icon = check.status === 'healthy' ? '✅' : 
                 check.status === 'degraded' ? '⚠️' : '❌';
    
    console.log(`${icon} ${check.service.padEnd(25)} ${check.message}`);
    
    if (check.latency) {
      console.log(`   Response time: ${check.latency}ms`);
    }
    
    if (check.details && process.env.VERBOSE === 'true') {
      console.log(`   Details: ${JSON.stringify(check.details, null, 2)}`);
    }
    
    console.log();
  });
  
  console.log('='.repeat(70));
  
  // Summary
  const healthy = checks.filter(c => c.status === 'healthy').length;
  const degraded = checks.filter(c => c.status === 'degraded').length;
  const unhealthy = checks.filter(c => c.status === 'unhealthy').length;
  
  console.log('\nSUMMARY:');
  console.log(`  ✅ Healthy: ${healthy}/${checks.length}`);
  if (degraded > 0) console.log(`  ⚠️  Degraded: ${degraded}/${checks.length}`);
  if (unhealthy > 0) console.log(`  ❌ Unhealthy: ${unhealthy}/${checks.length}`);
  
  console.log();
  
  const allHealthy = unhealthy === 0 && degraded === 0;
  
  if (allHealthy) {
    console.log('✅ ALL SYSTEMS OPERATIONAL');
    console.log('The application is ready to use.\n');
  } else if (unhealthy === 0) {
    console.log('⚠️  SOME SYSTEMS DEGRADED');
    console.log('The application is functional but some features may not work optimally.\n');
  } else {
    console.log('❌ SOME SYSTEMS ARE DOWN');
    console.log('The application may not function correctly. Please check the errors above.\n');
  }
  
  console.log('='.repeat(70) + '\n');
}

/**
 * Main health check execution
 */
async function runHealthChecks(): Promise<void> {
  console.log('🔍 Starting comprehensive health checks...\n');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Timeout: ${TIMEOUT}ms\n`);
  
  // Run all checks in parallel for speed
  const checks = await Promise.all([
    checkBackend(),
    checkDatabase(),
    checkTrainingData(),
    checkDirectories(),
    checkLLM(),
    checkSTT(),
    checkTTS(),
    checkHuggingFace()
  ]);
  
  displayResults(checks);
  
  // Exit with appropriate code
  const hasUnhealthy = checks.some(c => c.status === 'unhealthy');
  process.exit(hasUnhealthy ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  runHealthChecks().catch(error => {
    console.error('❌ Health check script failed:', error);
    process.exit(1);
  });
}

export { runHealthChecks, HealthCheck };
