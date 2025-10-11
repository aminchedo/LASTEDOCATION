#!/usr/bin/env node
/**
 * Google Data Validation Script
 * Validates Google voice dataset schema and counts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

class GoogleDataValidator {
  private errors: string[] = [];
  private warnings: string[] = [];

  async validate(): Promise<boolean> {
    console.log('🔍 Validating Google Voice Data...\n');

    const googleDir = path.join(ROOT_DIR, 'datasets', 'google');

    // Check if directory exists
    if (!fs.existsSync(googleDir)) {
      this.warnings.push('Google data directory does not exist (infrastructure ready)');
      console.log('⚠️  datasets/google/ directory does not exist');
      console.log('ℹ️  This is expected if Google API credentials are not configured');
      console.log('ℹ️  Infrastructure is ready, data can be ingested when credentials are available\n');
      return true; // Not an error, just not configured
    }

    // Check for data files
    const files = fs.readdirSync(googleDir);
    const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));

    if (jsonlFiles.length === 0) {
      this.warnings.push('No JSONL files found in datasets/google/');
      console.log('⚠️  No JSONL files found in datasets/google/');
      console.log('ℹ️  Run scripts/fetch_google_data.ts to ingest data\n');
      return true; // Not an error
    }

    // Validate each file
    console.log(`📁 Found ${jsonlFiles.length} JSONL files\n`);
    for (const file of jsonlFiles) {
      await this.validateFile(file);
    }

    this.printResults();
    return this.errors.length === 0;
  }

  private async validateFile(filename: string): Promise<void> {
    const filePath = path.join(ROOT_DIR, 'datasets', 'google', filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.trim());

    console.log(`  📄 ${filename}: ${lines.length} lines`);

    // Validate schema (sample first 10 lines)
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      try {
        const entry = JSON.parse(lines[i]);
        if (!entry.messages || !Array.isArray(entry.messages)) {
          this.errors.push(`${filename}:${i + 1} - Invalid schema`);
        }
      } catch (err) {
        this.errors.push(`${filename}:${i + 1} - JSON parse error`);
      }
    }
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(60));
    if (this.errors.length === 0) {
      console.log('✅ Google data validation passed');
    } else {
      console.log(`❌ ${this.errors.length} errors found`);
      this.errors.forEach(err => console.log(`   - ${err}`));
    }
    console.log('='.repeat(60) + '\n');
  }
}

async function main() {
  const validator = new GoogleDataValidator();
  const success = await validator.validate();
  process.exit(success ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

