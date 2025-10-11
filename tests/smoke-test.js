#!/usr/bin/env node

/**
 * Cross-platform smoke test for proxy system
 * Prerequisites: Node 18+, proxy running on http://localhost:3001
 */

const BASE = 'http://localhost:3001/api/v1';

const urls = [
  'https://huggingface.co/datasets/mozilla-foundation/common_voice_19_0/resolve/main/transcript/fa/train/train.tar.gz',
  'https://huggingface.co/datasets/mozilla-foundation/common_voice_19_0/resolve/main/transcript/fa/validation/validation.tar.gz',
  'https://huggingface.co/datasets/MahtaFetrat/Mana-TTS/resolve/main/dataset/dataset_part_001.parquet',
  'https://github.com/MahtaFetrat/ManaTTS-Persian-Tacotron2-Model/archive/refs/heads/main.zip',
  'https://github.com/mansourehk/ShEMO/raw/master/female.zip',
  'https://github.com/mansourehk/ShEMO/raw/master/male.zip',
  'https://github.com/mansourehk/ShEMO/raw/master/transcript.zip',
  'http://download.tensorflow.org/data/speech_commands_v0.02.tar.gz'
];

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

function pad(str, width) {
  return str.toString().padEnd(width);
}

function hbar() {
  console.log('--------------------------------------------------------------------------');
}

async function testHealthEndpoint() {
  console.log(colorize('cyan', '==> Health check'));
  try {
    const response = await fetch(`${BASE}/health`);
    const data = await response.json();
    if (data.ok) {
      console.log(`  ${colorize('green', 'OK')} ${BASE}/health => ${JSON.stringify(data)}`);
      return true;
    } else {
      console.log(`  ${colorize('red', 'FAIL')} ${BASE}/health => ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    console.log(`  ${colorize('red', 'FAIL')} ${BASE}/health => ${error.message}`);
    return false;
  }
}

async function testUrl(idx, url) {
  const enc = encodeURIComponent(url);
  
  try {
    // 1) Resolve
    const resolveResponse = await fetch(`${BASE}/sources/resolve?url=${enc}`);
    const resolveData = await resolveResponse.json();
    
    const ok = resolveData.ok;
    const status = resolveData.status || '';
    const size = resolveData.sizeBytes || 0;
    const fname = resolveData.filename || '';
    const final = resolveData.finalUrl || '';
    
    if (!ok) {
      console.log(`${pad(idx, 6)} | ${colorize('red', pad('NO', 4))} | ${pad(status, 7)} | ${pad(size, 10)} | ${fname || '-'}  ${url}`);
      return false;
    }
    
    // 2) Proxy HEAD (just headers)
    try {
      const proxyResponse = await fetch(`${BASE}/sources/proxy?url=${enc}`, { method: 'HEAD' });
      const headStatus = proxyResponse.status;
      
      if (headStatus === 200 || headStatus === 206) {
        console.log(`${pad(idx, 6)} | ${colorize('green', pad('YES', 4))} | ${pad(status, 7)} | ${pad(size, 10)} | ${fname || '-'}  ${final || url}`);
      } else {
        console.log(`${pad(idx, 6)} | ${colorize('yellow', pad('HEAD', 4))} | ${pad(headStatus, 7)} | ${pad(size, 10)} | ${fname || '-'}  ${final || url}`);
      }
    } catch (headError) {
      console.log(`${pad(idx, 6)} | ${colorize('yellow', pad('HEAD', 4))} | ${pad('ERR', 7)} | ${pad(size, 10)} | ${fname || '-'}  ${final || url}`);
    }
    
    return true;
  } catch (error) {
    console.log(`${pad(idx, 6)} | ${colorize('red', pad('NO', 4))} | ${pad('ERR', 7)} | ${pad(0, 10)} | ${url}`);
    return false;
  }
}

async function runTests() {
  // Test health endpoint
  const healthOk = await testHealthEndpoint();
  if (!healthOk) {
    console.log(colorize('red', '\nHealth test failed. Make sure the proxy server is running:'));
    console.log('   cd backend && npm run dev:proxy');
    process.exit(1);
  }
  
  console.log('');
  hbar();
  console.log(`${pad('IDX', 6)} | ${pad('OK', 4)} | ${pad('STATUS', 7)} | ${pad('SIZE(B)', 10)} | FILENAME / FINAL URL`);
  hbar();
  
  let failCount = 0;
  
  for (let i = 0; i < urls.length; i++) {
    const success = await testUrl(i + 1, urls[i]);
    if (!success) {
      failCount++;
    }
  }
  
  hbar();
  
  if (failCount > 0) {
    console.log(colorize('red', `RESULT: ${failCount} link(s) failed resolve. Fix URLs or set HF_TOKEN for private/limited HF assets.`));
    process.exit(2);
  } else {
    console.log(colorize('green', 'RESULT: all links resolved successfully. Proxy responds.'));
  }
  
  console.log('');
  console.log(colorize('cyan', 'Quick manual check:'));
  console.log('  1) Open frontend Download Center.');
  console.log('  2) Click Download on any dataset.');
  console.log('  3) In DevTools → Network, you should ONLY see requests to /api/v1/sources/proxy?... (no direct cross-origin).');
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.log(colorize('red', 'This test requires Node.js 18+ with native fetch support'));
  console.log('   Or install node-fetch: npm install node-fetch');
  process.exit(1);
}

runTests().catch(error => {
  console.error(colorize('red', 'Test failed:'), error.message);
  process.exit(1);
});
