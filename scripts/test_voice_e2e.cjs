#!/usr/bin/env node
/**
 * Voice E2E Tests for Persian Chat Application
 * Tests STT → LLM → TTS pipeline with real Persian audio
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Test configuration
const TEST_CONFIG = {
  backendUrl: 'http://localhost:3001',
  timeout: 10000,
  maxRetries: 3,
  retryDelay: 1000
};

// Sample Persian phrases for testing
const TEST_PHRASES = [
  {
    text: 'سلام، چطور هستید؟',
    audioFile: 'audio/smoke/greeting_001.wav',
    expectedKeywords: ['سلام', 'چطور', 'هستید']
  },
  {
    text: 'امروز هوا خوب است',
    audioFile: 'audio/smoke/weather_001.wav',
    expectedKeywords: ['امروز', 'هوا', 'خوب']
  },
  {
    text: 'کتاب خواندن مفید است',
    audioFile: 'audio/smoke/reading_001.wav',
    expectedKeywords: ['کتاب', 'خواندن', 'مفید']
  }
];

function generateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function hasPersianText(text) {
  const persianRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return persianRegex.test(text);
}

function containsKeywords(text, keywords) {
  const lowerText = text.toLowerCase();
  return keywords.every(keyword => lowerText.includes(keyword.toLowerCase()));
}

async function testSTT(audioFile) {
  console.log(`🎤 Testing STT with: ${path.basename(audioFile)}`);
  
  try {
    // Read audio file
    const audioData = fs.readFileSync(audioFile);
    const base64Audio = audioData.toString('base64');
    
    // Make STT request
    const response = await fetch(`${TEST_CONFIG.backendUrl}/api/stt/base64`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio: base64Audio,
        language: 'fa',
        format: 'wav',
        sampleRate: 16000
      })
    });
    
    if (!response.ok) {
      throw new Error(`STT request failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(`STT error: ${result.message}`);
    }
    
    // Validate Persian text
    if (!hasPersianText(result.data.text)) {
      throw new Error(`STT result does not contain Persian text: ${result.data.text}`);
    }
    
    console.log(`✅ STT Success: "${result.data.text}" (confidence: ${result.data.confidence})`);
    
    return {
      success: true,
      text: result.data.text,
      confidence: result.data.confidence,
      processingTime: result.processingTime
    };
    
  } catch (error) {
    console.log(`❌ STT Failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

async function testTTS(text) {
  console.log(`🔊 Testing TTS with: "${text}"`);
  
  try {
    // Make TTS request
    const response = await fetch(`${TEST_CONFIG.backendUrl}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        language: 'fa',
        voice: 'persian_female',
        speed: 1.0,
        pitch: 1.0,
        format: 'wav',
        sampleRate: 16000
      })
    });
    
    if (!response.ok) {
      throw new Error(`TTS request failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(`TTS error: ${result.message}`);
    }
    
    // Validate audio data
    if (!result.data.audio || result.data.audio.length === 0) {
      throw new Error('TTS returned empty audio data');
    }
    
    // Validate metadata
    if (result.data.duration <= 0) {
      throw new Error(`Invalid duration: ${result.data.duration}`);
    }
    
    console.log(`✅ TTS Success: ${result.data.duration}s audio generated`);
    
    return {
      success: true,
      audio: result.data.audio,
      duration: result.data.duration,
      processingTime: result.processingTime
    };
    
  } catch (error) {
    console.log(`❌ TTS Failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

async function testChat(text) {
  console.log(`💬 Testing Chat with: "${text}"`);
  
  try {
    // Make chat request
    const response = await fetch(`${TEST_CONFIG.backendUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: text }
        ],
        options: {
          temperature: 0.7,
          maxTokens: 100
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Chat request failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(`Chat error: ${result.message}`);
    }
    
    // Validate Persian response
    if (!hasPersianText(result.data.text)) {
      throw new Error(`Chat response does not contain Persian text: ${result.data.text}`);
    }
    
    console.log(`✅ Chat Success: "${result.data.text}"`);
    
    return {
      success: true,
      text: result.data.text,
      model: result.data.model,
      processingTime: result.processingTime
    };
    
  } catch (error) {
    console.log(`❌ Chat Failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

async function testVoiceE2E(phrase) {
  console.log(`\n🔄 Testing E2E Voice Pipeline: ${phrase.text}`);
  
  const results = {
    phrase: phrase,
    stt: null,
    chat: null,
    tts: null,
    overall: { success: false, errors: [] }
  };
  
  try {
    // Step 1: STT (Audio → Text)
    results.stt = await testSTT(phrase.audioFile);
    if (!results.stt.success) {
      results.overall.errors.push(`STT failed: ${results.stt.error}`);
      return results;
    }
    
    // Step 2: Chat (Text → Response)
    results.chat = await testChat(results.stt.text);
    if (!results.chat.success) {
      results.overall.errors.push(`Chat failed: ${results.chat.error}`);
      return results;
    }
    
    // Step 3: TTS (Response → Audio)
    results.tts = await testTTS(results.chat.text);
    if (!results.tts.success) {
      results.overall.errors.push(`TTS failed: ${results.tts.error}`);
      return results;
    }
    
    // Validate overall pipeline
    if (results.stt.success && results.chat.success && results.tts.success) {
      results.overall.success = true;
      console.log(`🎉 E2E Success: Audio → "${results.stt.text}" → "${results.chat.text}" → Audio`);
    }
    
  } catch (error) {
    results.overall.errors.push(`E2E pipeline error: ${error.message}`);
  }
  
  return results;
}

async function testBackendHealth() {
  console.log('🏥 Testing backend health...');
  
  try {
    const response = await fetch(`${TEST_CONFIG.backendUrl}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.ok) {
      throw new Error('Backend health check failed');
    }
    
    console.log('✅ Backend is healthy');
    return true;
    
  } catch (error) {
    console.log(`❌ Backend health check failed: ${error.message}`);
    return false;
  }
}

async function testAPIRoutes() {
  console.log('🔍 Testing API routes...');
  
  const routes = [
    { name: 'STT', url: '/api/stt/health' },
    { name: 'TTS', url: '/api/tts/health' },
    { name: 'Search', url: '/api/search/health' },
    { name: 'Monitoring', url: '/api/monitoring/metrics' }
  ];
  
  const results = [];
  
  for (const route of routes) {
    try {
      const response = await fetch(`${TEST_CONFIG.backendUrl}${route.url}`);
      
      if (response.ok) {
        console.log(`✅ ${route.name} route is accessible`);
        results.push({ name: route.name, success: true });
      } else {
        console.log(`⚠️  ${route.name} route returned ${response.status}`);
        results.push({ name: route.name, success: false, status: response.status });
      }
      
    } catch (error) {
      console.log(`❌ ${route.name} route failed: ${error.message}`);
      results.push({ name: route.name, success: false, error: error.message });
    }
  }
  
  return results;
}

async function runAllTests() {
  console.log('🎯 Starting Persian Voice E2E Tests...');
  console.log(`🔗 Backend URL: ${TEST_CONFIG.backendUrl}`);
  
  const testResults = {
    startTime: new Date().toISOString(),
    backendHealth: false,
    apiRoutes: [],
    e2eTests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    }
  };
  
  try {
    // Test backend health
    testResults.backendHealth = await testBackendHealth();
    
    if (!testResults.backendHealth) {
      throw new Error('Backend is not healthy, skipping tests');
    }
    
    // Test API routes
    testResults.apiRoutes = await testAPIRoutes();
    
    // Run E2E tests
    console.log('\n🚀 Running E2E Voice Tests...');
    
    for (const phrase of TEST_PHRASES) {
      const result = await testVoiceE2E(phrase);
      testResults.e2eTests.push(result);
      
      testResults.summary.total++;
      if (result.overall.success) {
        testResults.summary.passed++;
      } else {
        testResults.summary.failed++;
        testResults.summary.errors.push(...result.overall.errors);
      }
    }
    
    // Generate report
    testResults.endTime = new Date().toISOString();
    testResults.duration = new Date(testResults.endTime) - new Date(testResults.startTime);
    
    console.log('\n📊 Test Summary:');
    console.log(`✅ Passed: ${testResults.summary.passed}/${testResults.summary.total}`);
    console.log(`❌ Failed: ${testResults.summary.failed}/${testResults.summary.total}`);
    console.log(`⏱️  Duration: ${testResults.duration}ms`);
    
    if (testResults.summary.errors.length > 0) {
      console.log('\n❌ Errors:');
      testResults.summary.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    // Save detailed report
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(logsDir, 'voice_e2e_test_report.json'),
      JSON.stringify(testResults, null, 2)
    );
    
    console.log(`📄 Detailed report saved to: logs/voice_e2e_test_report.json`);
    
    return testResults;
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    testResults.summary.errors.push(error.message);
    return testResults;
  }
}

async function main() {
  try {
    const results = await runAllTests();
    
    if (results.summary.failed === 0) {
      console.log('\n🎉 All tests passed! Persian Voice E2E is working correctly.');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed. Check the report for details.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { runAllTests, testVoiceE2E, TEST_PHRASES };
