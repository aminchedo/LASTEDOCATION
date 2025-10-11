// Quick test script for the download proxy
const fetch = require('node-fetch');

async function testProxy() {
  const testUrls = [
    'https://huggingface.co/datasets/mozilla-foundation/common_voice_19_0/resolve/main/transcript/fa/train/train.tar.gz',
    'https://raw.githubusercontent.com/PasyanAI/Persian-G2P-Datasets/main/persian_g2p_dataset.json',
    'https://huggingface.co/datasets/MahtaFetrat/ManaTTS/resolve/main/audio_files.tar.gz'
  ];

  console.log('Testing proxy endpoints...\n');

  for (const url of testUrls) {
    try {
      console.log(`Testing resolve for: ${url}`);
      const resolveResponse = await fetch(`http://localhost:3001/api/v1/sources/resolve?url=${encodeURIComponent(url)}`);
      const resolveData = await resolveResponse.json();
      console.log(`✅ Resolve result:`, resolveData);
      
      if (resolveData.ok) {
        console.log(`Testing proxy for: ${url}`);
        const proxyResponse = await fetch(`http://localhost:3001/api/v1/sources/proxy?url=${encodeURIComponent(url)}`);
        console.log(`✅ Proxy response status: ${proxyResponse.status}`);
        console.log(`✅ Content-Type: ${proxyResponse.headers.get('content-type')}`);
        console.log(`✅ Content-Disposition: ${proxyResponse.headers.get('content-disposition')}`);
      } else {
        console.log(`❌ URL not accessible: ${resolveData.error || 'Unknown error'}`);
      }
      console.log('---\n');
    } catch (error) {
      console.log(`❌ Error testing ${url}:`, error.message);
      console.log('---\n');
    }
  }
}

testProxy().catch(console.error);
