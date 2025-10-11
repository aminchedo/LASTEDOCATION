#!/usr/bin/env tsx

import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';

interface DatasetMetadata {
  text_persian_conversation_files: number;
  speech_commonvoice_fa_files: number;
  speech_fleurs_fa_files: number;
  tts_female_files: number;
  tts_male_files: number;
}

interface VerificationResult {
  success: boolean;
  errors: string[];
  counts: Partial<DatasetMetadata>;
}

function countFiles(dirPath: string): number {
  if (!existsSync(dirPath)) {
    return 0;
  }
  
  let count = 0;
  const items = require('fs').readdirSync(dirPath, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = join(dirPath, item.name);
    if (item.isDirectory()) {
      count += countFiles(fullPath);
    } else if (item.isFile() && statSync(fullPath).size > 0) {
      count++;
    }
  }
  
  return count;
}

function verifyDatasets(): VerificationResult {
  const errors: string[] = [];
  const counts: Partial<DatasetMetadata> = {};
  
  // Define expected directories
  const directories = {
    text_persian_conversation: 'datasets/text/persian_conversation/data',
    speech_commonvoice_fa: 'datasets/speech/commonvoice_fa/data',
    speech_fleurs_fa: 'datasets/speech/fleurs_fa/data',
    tts_female: 'datasets/tts/kamtera_vits_female/model',
    tts_male: 'datasets/tts/kamtera_vits_male/model'
  };
  
  // Count files in each directory
  for (const [key, dirPath] of Object.entries(directories)) {
    const count = countFiles(dirPath);
    counts[key as keyof DatasetMetadata] = count;
    
    if (count === 0) {
      errors.push(`Directory ${dirPath} contains no files`);
    }
  }
  
  // Check for required files
  const requiredFiles = [
    'checksums/datasets.sha256.txt',
    'logs/dataset_sources.json'
  ];
  
  for (const filePath of requiredFiles) {
    if (!existsSync(filePath)) {
      errors.push(`Required file ${filePath} does not exist`);
    }
  }
  
  // Check README.source.md files
  const readmeFiles = [
    'datasets/text/persian_conversation/README.source.md',
    'datasets/speech/commonvoice_fa/README.source.md',
    'datasets/speech/fleurs_fa/README.source.md',
    'datasets/tts/kamtera_vits_female/README.source.md',
    'datasets/tts/kamtera_vits_male/README.source.md'
  ];
  
  for (const readmePath of readmeFiles) {
    if (!existsSync(readmePath)) {
      errors.push(`Provenance file ${readmePath} does not exist`);
    }
  }
  
  return {
    success: errors.length === 0,
    errors,
    counts
  };
}

function main() {
  console.log('🔍 Verifying Persian dataset acquisition...\n');
  
  const result = verifyDatasets();
  
  console.log('📊 File counts:');
  for (const [key, count] of Object.entries(result.counts)) {
    console.log(`  ${key}: ${count} files`);
  }
  
  console.log('\n✅ Verification results:');
  
  if (result.success) {
    console.log('🎉 All datasets verified successfully!');
    console.log('✓ All directories contain files');
    console.log('✓ Checksums file exists');
    console.log('✓ Dataset sources file exists');
    console.log('✓ All provenance README files exist');
    process.exit(0);
  } else {
    console.log('❌ Verification failed with errors:');
    for (const error of result.errors) {
      console.log(`  • ${error}`);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { verifyDatasets, DatasetMetadata, VerificationResult };
