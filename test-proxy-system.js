#!/usr/bin/env node

/**
 * Test script for the proxy-only download system
 * Tests both backend proxy and frontend integration
 */

const http = require('http');

const PROXY_BASE_URL = 'http://localhost:3001';

// Test URLs from the datasets
const TEST_URLS = [
  'https://github.com/mansourehk/ShEMO/raw/master/female.zip',
  'http://download.tensorflow.org/data/speech_commands_v0.02.tar.gz',
  'https://huggingface.co/datasets/mozilla-foundation/common_voice_19_0/resolve/main/transcript/fa/train/train.tar.gz'
];

async function testHealthEndpoint() {
  console.log('🔍 Testing health endpoint...');
  try {
    const response = await fetch(`${PROXY_BASE_URL}/api/v1/health`);
    const data = await response.json();
    if (data.ok) {
      console.log('✅ Health endpoint working');
      return true;
    } else {
      console.log('❌ Health endpoint failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Health endpoint error:', error.message);
    return false;
  }
}

async function testResolveEndpoint(url) {
  console.log(`🔍 Testing resolve endpoint for: ${url}`);
  try {
    const response = await fetch(`${PROXY_BASE_URL}/api/v1/sources/resolve?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    if (data.ok) {
      console.log(`✅ Resolve working - filename: ${data.filename}, size: ${data.sizeBytes}`);
      return true;
    } else {
      console.log(`❌ Resolve failed - status: ${data.status}, error: ${data.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Resolve error: ${error.message}`);
    return false;
  }
}

async function testProxyEndpoint(url) {
  console.log(`🔍 Testing proxy endpoint for: ${url}`);
  try {
    const response = await fetch(`${PROXY_BASE_URL}/api/v1/sources/proxy?url=${encodeURIComponent(url)}`);
    if (response.ok) {
      const contentLength = response.headers.get('content-length');
      const contentDisposition = response.headers.get('content-disposition');
      console.log(`✅ Proxy working - status: ${response.status}, content-length: ${contentLength}, disposition: ${contentDisposition}`);
      return true;
    } else {
      console.log(`❌ Proxy failed - status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Proxy error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting proxy system tests...\n');
  
  // Test health endpoint
  const healthOk = await testHealthEndpoint();
  if (!healthOk) {
    console.log('\n❌ Health test failed. Make sure the proxy server is running:');
    console.log('   cd backend && npm run dev:proxy');
    process.exit(1);
  }
  
  console.log('');
  
  // Test resolve endpoints
  let resolvePassed = 0;
  for (const url of TEST_URLS) {
    const passed = await testResolveEndpoint(url);
    if (passed) resolvePassed++;
    console.log('');
  }
  
  // Test proxy endpoints
  let proxyPassed = 0;
  for (const url of TEST_URLS) {
    const passed = await testProxyEndpoint(url);
    if (passed) proxyPassed++;
    console.log('');
  }
  
  // Summary
  console.log('📊 Test Results:');
  console.log(`   Health: ${healthOk ? '✅' : '❌'}`);
  console.log(`   Resolve: ${resolvePassed}/${TEST_URLS.length} passed`);
  console.log(`   Proxy: ${proxyPassed}/${TEST_URLS.length} passed`);
  
  if (healthOk && resolvePassed > 0 && proxyPassed > 0) {
    console.log('\n🎉 Proxy system is working! You can now:');
    console.log('   1. Start the frontend: cd client && npm run dev');
    console.log('   2. Open DownloadCenterPage.tsx');
    console.log('   3. Test downloads through the proxy');
  } else {
    console.log('\n⚠️  Some tests failed. Check the proxy server configuration.');
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This test requires Node.js 18+ with native fetch support');
  console.log('   Or install node-fetch: npm install node-fetch');
  process.exit(1);
}

runTests().catch(console.error);
