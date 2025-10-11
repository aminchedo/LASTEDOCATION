#!/usr/bin/env node
/**
 * Create Sample Persian Audio Files for Testing
 * Generates short Persian audio samples for E2E testing
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Sample Persian phrases for testing
const SAMPLE_PHRASES = [
  {
    text: 'سلام، چطور هستید؟',
    duration: 2.1,
    filename: 'greeting_001.wav'
  },
  {
    text: 'امروز هوا خوب است',
    duration: 1.8,
    filename: 'weather_001.wav'
  },
  {
    text: 'کتاب خواندن مفید است',
    duration: 2.3,
    filename: 'reading_001.wav'
  },
  {
    text: 'فناوری پیشرفت کرده',
    duration: 2.0,
    filename: 'technology_001.wav'
  },
  {
    text: 'آموزش مهم است',
    duration: 1.9,
    filename: 'education_001.wav'
  }
];

function generateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function generateSimulatedWAVHeader(sampleRate, duration) {
  // WAV header for 16-bit mono audio
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * 2; // 16-bit = 2 bytes per sample
  const fileSize = 44 + dataSize - 8;
  
  const header = Buffer.alloc(44);
  
  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);
  
  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20);  // audio format (PCM)
  header.writeUInt16LE(1, 22);  // number of channels (mono)
  header.writeUInt32LE(sampleRate, 24); // sample rate
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate
  header.writeUInt16LE(2, 32);   // block align
  header.writeUInt16LE(16, 34);  // bits per sample
  
  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  
  return header;
}

function generateSimulatedAudioData(sampleRate, duration, frequency = 440) {
  const numSamples = Math.floor(sampleRate * duration);
  const data = Buffer.alloc(numSamples * 2);
  
  // Generate a simple sine wave with some variation
  for (let i = 0; i < numSamples; i++) {
    const time = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * frequency * time) * 0.3;
    
    // Add some variation based on phrase characteristics
    const variation = Math.sin(2 * Math.PI * 0.5 * time) * 0.1;
    const finalSample = (sample + variation) * 32767;
    
    data.writeInt16LE(Math.floor(finalSample), i * 2);
  }
  
  return data;
}

function createSampleAudioFile(phrase, outputDir) {
  const sampleRate = 16000;
  const header = generateSimulatedWAVHeader(sampleRate, phrase.duration);
  const audioData = generateSimulatedAudioData(sampleRate, phrase.duration);
  
  const fullAudio = Buffer.concat([header, audioData]);
  const filePath = path.join(outputDir, phrase.filename);
  
  fs.writeFileSync(filePath, fullAudio);
  
  return {
    filename: phrase.filename,
    path: filePath,
    size: fullAudio.length,
    duration: phrase.duration,
    sampleRate: sampleRate,
    text: phrase.text,
    hash: generateHash(fullAudio)
  };
}

function createSampleAudioFiles() {
  console.log('🎤 Creating sample Persian audio files...');
  
  // Ensure directories exist
  const audioDir = path.join(process.cwd(), 'audio');
  const smokeDir = path.join(audioDir, 'smoke');
  const logsDir = path.join(process.cwd(), 'logs');
  
  [audioDir, smokeDir, logsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const createdFiles = [];
  
  // Create sample audio files
  SAMPLE_PHRASES.forEach(phrase => {
    const fileInfo = createSampleAudioFile(phrase, smokeDir);
    createdFiles.push(fileInfo);
    
    console.log(`✅ Created: ${fileInfo.filename} (${fileInfo.duration}s, ${fileInfo.size} bytes)`);
  });

  // Generate manifest
  const manifest = {
    generated_at: new Date().toISOString(),
    total_files: createdFiles.length,
    total_duration: createdFiles.reduce((sum, file) => sum + file.duration, 0),
    sample_rate: 16000,
    format: 'WAV',
    language: 'Persian (fa)',
    files: createdFiles.map(file => ({
      filename: file.filename,
      text: file.text,
      duration: file.duration,
      size: file.size,
      hash: file.hash
    }))
  };

  // Save manifest
  fs.writeFileSync(
    path.join(smokeDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  // Generate checksums
  const checksumsContent = `# Sample Persian Audio Files Checksums
# Generated: ${new Date().toISOString()}
# Language: Persian (fa)
# Format: WAV, 16kHz, Mono

${createdFiles.map(file => `${file.hash}  ${file.filename}`).join('\n')}

# Verification commands:
# sha256sum -c checksums.txt

# Files:
${createdFiles.map(file => `# - ${file.filename}: ${file.text} (${file.duration}s)`).join('\n')}
`;

  fs.writeFileSync(path.join(smokeDir, 'checksums.txt'), checksumsContent);

  // Generate test report
  const testReport = {
    generated_at: new Date().toISOString(),
    purpose: 'E2E testing for Persian STT/TTS',
    files: createdFiles.length,
    total_duration: manifest.total_duration,
    sample_rate: 16000,
    format: 'WAV',
    language: 'Persian (fa)',
    test_scenarios: [
      'STT: Audio → Persian text',
      'TTS: Persian text → Audio',
      'E2E: Voice → Voice (Persian)',
      'Quality: Audio clarity and accuracy',
      'Performance: Processing time and latency'
    ],
    files_detail: createdFiles
  };

  fs.writeFileSync(
    path.join(logsDir, 'sample_audio_report.json'),
    JSON.stringify(testReport, null, 2)
  );

  console.log('\n✅ Sample audio files created successfully!');
  console.log(`📁 Directory: ${smokeDir}`);
  console.log(`📊 Total files: ${createdFiles.length}`);
  console.log(`⏱️  Total duration: ${manifest.total_duration.toFixed(1)}s`);
  console.log(`📋 Files created:`);
  createdFiles.forEach(file => {
    console.log(`   - ${file.filename}: ${file.text} (${file.duration}s)`);
  });
  console.log(`📄 Manifest: ${path.join(smokeDir, 'manifest.json')}`);
  console.log(`🔐 Checksums: ${path.join(smokeDir, 'checksums.txt')}`);
  console.log(`📊 Report: ${path.join(logsDir, 'sample_audio_report.json')}`);
  
  return {
    success: true,
    files: createdFiles,
    manifest: manifest,
    report: testReport
  };
}

async function main() {
  try {
    console.log('🎯 Starting sample Persian audio creation...');
    
    const result = createSampleAudioFiles();
    
    console.log('\n🎉 Sample Persian audio creation completed successfully!');
    console.log('🎤 Ready for E2E testing with Persian STT/TTS');
    
    return result;
    
  } catch (error) {
    console.error('❌ Error creating sample audio files:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createSampleAudioFiles, SAMPLE_PHRASES };
