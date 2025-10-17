#!/usr/bin/env ts-node
/**
 * API Health Check Script
 * Tests all API endpoints and integrations
 */

import http from 'http';
import { ENV } from '../src/config/env';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'pass' | 'fail';
  statusCode?: number;
  responseTime?: number;
  message: string;
  details?: any;
}

const results: TestResult[] = [];
const API_BASE = `http://localhost:${ENV.PORT || 3001}`;

/**
 * Make HTTP request
 */
function makeRequest(
  method: string,
  path: string,
  headers?: Record<string, string>,
  body?: any
): Promise<{ statusCode: number; data: any; responseTime: number }> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const url = new URL(path, API_BASE);

    const options: http.RequestOptions = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode || 0,
            data: parsed,
            responseTime
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode || 0,
            data: { raw: data },
            responseTime
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Test endpoint
 */
async function testEndpoint(
  name: string,
  method: string,
  path: string,
  expectedStatus: number | number[],
  headers?: Record<string, string>,
  body?: any
): Promise<void> {
  try {
    const response = await makeRequest(method, path, headers, body);
    const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    const statusMatch = expectedStatuses.includes(response.statusCode);

    results.push({
      endpoint: path,
      method,
      status: statusMatch ? 'pass' : 'fail',
      statusCode: response.statusCode,
      responseTime: response.responseTime,
      message: statusMatch
        ? `Success (${response.responseTime}ms)`
        : `Expected status ${expectedStatuses.join(' or ')}, got ${response.statusCode}`,
      details: response.data
    });
  } catch (error: any) {
    results.push({
      endpoint: path,
      method,
      status: 'fail',
      message: error.message,
      details: { error: error.toString() }
    });
  }
}

/**
 * Check if server is running
 */
async function checkServerRunning(): Promise<boolean> {
  try {
    await makeRequest('GET', '/health');
    return true;
  } catch (error) {
    console.error(`\n❌ Server is not running on ${API_BASE}`);
    console.error('Please start the server first with: npm run dev\n');
    return false;
  }
}

/**
 * Test basic health endpoints
 */
async function testHealthEndpoints(): Promise<void> {
  console.log('\n📋 Testing Health Endpoints...');

  await testEndpoint('Health Check', 'GET', '/health', 200);
  await testEndpoint('API Health Check', 'GET', '/api/health', 200);
}

/**
 * Test sources/models endpoints
 */
async function testSourcesEndpoints(): Promise<void> {
  console.log('\n📦 Testing Sources/Models Endpoints...');

  // Test search endpoint (should work without auth for public endpoints)
  await testEndpoint(
    'Search Persian Models',
    'GET',
    '/api/sources/search?q=persian',
    [200, 401] // May require auth
  );

  // Test models endpoint
  await testEndpoint(
    'List Models',
    'GET',
    '/api/models/detected',
    [200, 401]
  );
}

/**
 * Test training endpoints
 */
async function testTrainingEndpoints(): Promise<void> {
  console.log('\n🎓 Testing Training Endpoints...');

  await testEndpoint(
    'Training Status',
    'GET',
    '/api/train/status',
    200
  );

  await testEndpoint(
    'Training Jobs',
    'GET',
    '/api/training',
    [200, 401]
  );
}

/**
 * Test settings endpoints
 */
async function testSettingsEndpoints(): Promise<void> {
  console.log('\n⚙️  Testing Settings Endpoints...');

  await testEndpoint(
    'Get Settings',
    'GET',
    '/api/settings',
    [200, 401]
  );
}

/**
 * Test monitoring endpoints
 */
async function testMonitoringEndpoints(): Promise<void> {
  console.log('\n📊 Testing Monitoring Endpoints...');

  await testEndpoint(
    'System Metrics',
    'GET',
    '/api/monitoring/metrics',
    200
  );
}

/**
 * Test download endpoints
 */
async function testDownloadEndpoints(): Promise<void> {
  console.log('\n⬇️  Testing Download Endpoints...');

  await testEndpoint(
    'Download Queue',
    'GET',
    '/api/sources/downloads',
    200
  );
}

/**
 * Test HuggingFace integration
 */
async function testHuggingFaceIntegration(): Promise<void> {
  console.log('\n🤗 Testing HuggingFace Integration...');

  // Test token validation with invalid token (should return error but API should work)
  await testEndpoint(
    'Validate HF Token',
    'POST',
    '/api/sources/validate-token',
    [200, 400, 401],
    undefined,
    { token: 'hf_test_invalid_token' }
  );
}

/**
 * Test WebSocket connection
 */
async function testWebSocketConnection(): Promise<void> {
  console.log('\n🔌 Testing WebSocket...');

  // We can't easily test WebSocket from Node's http module,
  // but we can check if the endpoint is accessible
  try {
    const response = await makeRequest('GET', '/socket.io/');
    
    results.push({
      endpoint: '/socket.io/',
      method: 'GET',
      status: 'pass',
      statusCode: response.statusCode,
      responseTime: response.responseTime,
      message: 'WebSocket endpoint accessible'
    });
  } catch (error: any) {
    results.push({
      endpoint: '/socket.io/',
      method: 'GET',
      status: 'fail',
      message: error.message
    });
  }
}

/**
 * Test database queries through API
 */
async function testDatabaseQueries(): Promise<void> {
  console.log('\n💾 Testing Database Queries...');

  // These endpoints hit the database
  await testEndpoint(
    'Models Database Query',
    'GET',
    '/api/models/detected',
    [200, 401]
  );

  await testEndpoint(
    'Datasets Database Query',
    'GET',
    '/api/datasets',
    [200, 401]
  );
}

/**
 * Test response formats
 */
async function testResponseFormats(): Promise<void> {
  console.log('\n📝 Testing Response Formats...');

  try {
    const response = await makeRequest('GET', '/api/health');
    
    if (response.data && typeof response.data === 'object') {
      const hasRequiredFields = 'ok' in response.data || 'services' in response.data;
      
      results.push({
        endpoint: '/api/health',
        method: 'GET',
        status: hasRequiredFields ? 'pass' : 'fail',
        message: hasRequiredFields 
          ? 'Response format valid'
          : 'Missing required fields in response',
        details: { format: 'JSON', fields: Object.keys(response.data) }
      });
    } else {
      results.push({
        endpoint: '/api/health',
        method: 'GET',
        status: 'fail',
        message: 'Invalid response format'
      });
    }
  } catch (error: any) {
    results.push({
      endpoint: '/api/health',
      method: 'GET',
      status: 'fail',
      message: `Response format test failed: ${error.message}`
    });
  }
}

/**
 * Test error handling
 */
async function testErrorHandling(): Promise<void> {
  console.log('\n🚨 Testing Error Handling...');

  // Test 404 handling
  await testEndpoint(
    '404 Not Found',
    'GET',
    '/api/non-existent-endpoint',
    404
  );

  // The response should be JSON with error information
  try {
    const response = await makeRequest('GET', '/api/non-existent-endpoint');
    
    const hasErrorFormat = 
      response.data &&
      ('error' in response.data || 'message' in response.data);
    
    results.push({
      endpoint: '/api/non-existent-endpoint',
      method: 'GET',
      status: hasErrorFormat ? 'pass' : 'fail',
      message: hasErrorFormat
        ? 'Error format valid'
        : 'Invalid error response format',
      details: response.data
    });
  } catch (error: any) {
    results.push({
      endpoint: '/api/non-existent-endpoint',
      method: 'GET',
      status: 'fail',
      message: `Error handling test failed: ${error.message}`
    });
  }
}

/**
 * Calculate statistics
 */
function calculateStats() {
  const total = results.length;
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const avgResponseTime = results
    .filter(r => r.responseTime)
    .reduce((sum, r) => sum + (r.responseTime || 0), 0) / 
    results.filter(r => r.responseTime).length;

  return { total, passed, failed, avgResponseTime };
}

/**
 * Print results
 */
function printResults(): void {
  console.log('\n' + '='.repeat(80));
  console.log('API VERIFICATION REPORT');
  console.log('='.repeat(80) + '\n');

  // Group by endpoint type
  const grouped: Record<string, TestResult[]> = {};
  
  for (const result of results) {
    const category = result.endpoint.split('/')[2] || 'root';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(result);
  }

  for (const [category, tests] of Object.entries(grouped)) {
    console.log(`\n📂 ${category.toUpperCase()}`);
    console.log('-'.repeat(80));
    
    for (const test of tests) {
      const icon = test.status === 'pass' ? '✅' : '❌';
      const time = test.responseTime ? `${test.responseTime}ms` : 'N/A';
      const status = test.statusCode ? `[${test.statusCode}]` : '';
      
      console.log(`${icon} ${test.method} ${test.endpoint} ${status} - ${time}`);
      console.log(`   ${test.message}`);
      
      if (test.status === 'fail' && process.argv.includes('--verbose')) {
        console.log(`   Details: ${JSON.stringify(test.details, null, 2)}`);
      }
    }
  }

  const stats = calculateStats();
  
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${stats.total}`);
  console.log(`✅ Passed: ${stats.passed}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`⚡ Avg Response Time: ${stats.avgResponseTime.toFixed(2)}ms`);
  console.log('='.repeat(80) + '\n');

  if (stats.failed > 0) {
    console.log('⚠️  Some tests failed. Run with --verbose flag for details\n');
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('\n🚀 Starting API Verification...');
  console.log(`📡 Target: ${API_BASE}\n`);

  // Check if server is running
  const isRunning = await checkServerRunning();
  if (!isRunning) {
    process.exit(1);
  }

  // Run all tests
  await testHealthEndpoints();
  await testSourcesEndpoints();
  await testTrainingEndpoints();
  await testSettingsEndpoints();
  await testMonitoringEndpoints();
  await testDownloadEndpoints();
  await testHuggingFaceIntegration();
  await testWebSocketConnection();
  await testDatabaseQueries();
  await testResponseFormats();
  await testErrorHandling();

  // Print results
  printResults();

  // Exit with appropriate code
  const hasFailures = results.some(r => r.status === 'fail');
  process.exit(hasFailures ? 1 : 0);
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { main as verifyAPI };
