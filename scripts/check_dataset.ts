#!/usr/bin/env node
/**
 * Dataset Validation Script
 * Validates JSONL schema, Persian normalization, and checksums
 * Exit 0 = pass, Exit 1 = fail
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DatasetEntry {
  messages: Message[];
}

class DatasetValidator {
  private errors: string[] = [];
  private warnings: string[] = [];

  /**
   * Main validation entry point
   */
  async validate(): Promise<boolean> {
    console.log('🔍 Starting Dataset Validation...\n');

    // Step 1: Check file existence
    const files = ['train.jsonl', 'test.jsonl', 'combined.jsonl'];
    for (const file of files) {
      const filePath = path.join(ROOT_DIR, 'datasets', file);
      if (!fs.existsSync(filePath)) {
        this.errors.push(`❌ Missing file: datasets/${file}`);
      } else {
        console.log(`✅ Found: datasets/${file}`);
      }
    }

    if (this.errors.length > 0) {
      this.printResults();
      return false;
    }

    // Step 2: Validate schema
    console.log('\n📋 Validating JSONL Schema...');
    for (const file of files) {
      await this.validateSchema(file);
    }

    // Step 3: Validate Persian normalization
    console.log('\n🔤 Validating Persian Normalization...');
    await this.validatePersianNormalization('train.jsonl');

    // Step 4: Check checksums
    console.log('\n🔐 Validating Checksums...');
    await this.validateChecksums();

    // Step 5: Validate line counts
    console.log('\n📊 Validating Line Counts...');
    await this.validateLineCounts();

    // Print results
    this.printResults();
    return this.errors.length === 0;
  }

  /**
   * Validate JSONL schema for a dataset file
   */
  private async validateSchema(filename: string): Promise<void> {
    const filePath = path.join(ROOT_DIR, 'datasets', filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');

    let validLines = 0;
    let invalidLines = 0;

    for (let i = 0; i < Math.min(lines.length, 100); i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const entry: DatasetEntry = JSON.parse(line);

        // Validate structure
        if (!entry.messages || !Array.isArray(entry.messages)) {
          this.errors.push(`${filename}:${i + 1} - Missing or invalid 'messages' array`);
          invalidLines++;
          continue;
        }

        // Validate messages
        for (const msg of entry.messages) {
          if (!['system', 'user', 'assistant'].includes(msg.role)) {
            this.errors.push(`${filename}:${i + 1} - Invalid role: ${msg.role}`);
            invalidLines++;
            continue;
          }
          if (typeof msg.content !== 'string' || msg.content.length === 0) {
            this.errors.push(`${filename}:${i + 1} - Invalid or empty content`);
            invalidLines++;
            continue;
          }
        }

        validLines++;
      } catch (err) {
        this.errors.push(`${filename}:${i + 1} - JSON parse error: ${(err as Error).message}`);
        invalidLines++;
      }
    }

    if (invalidLines === 0) {
      console.log(`  ✅ ${filename}: Schema valid (checked ${validLines} lines)`);
    } else {
      console.log(`  ❌ ${filename}: ${invalidLines} invalid lines found`);
    }
  }

  /**
   * Validate Persian text normalization (Arabic to Persian characters)
   */
  private async validatePersianNormalization(filename: string): Promise<void> {
    const filePath = path.join(ROOT_DIR, 'datasets', filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');

    let arabicCharsFound = 0;
    const arabicChars = ['ي', 'ك', '٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const persianEquivalents = ['ی', 'ک', '۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

    for (let i = 0; i < Math.min(lines.length, 1000); i++) {
      const line = lines[i];
      for (const char of arabicChars) {
        if (line.includes(char)) {
          arabicCharsFound++;
          this.warnings.push(`Line ${i + 1}: Found Arabic character '${char}' (should be Persian)`);
          break;
        }
      }
    }

    if (arabicCharsFound === 0) {
      console.log(`  ✅ ${filename}: No Arabic characters found (properly normalized)`);
    } else {
      console.log(`  ⚠️  ${filename}: ${arabicCharsFound} lines with Arabic characters (may need normalization)`);
    }
  }

  /**
   * Validate SHA256 checksums
   */
  private async validateChecksums(): Promise<void> {
    const files = ['train.jsonl', 'test.jsonl', 'combined.jsonl'];

    for (const file of files) {
      const filePath = path.join(ROOT_DIR, 'datasets', file);
      const checksumPath = `${filePath}.sha256`;

      if (!fs.existsSync(checksumPath)) {
        this.warnings.push(`Missing checksum file: ${file}.sha256`);
        continue;
      }

      // Calculate actual checksum
      const fileContent = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256');
      hash.update(fileContent);
      const actualChecksum = hash.digest('hex');

      // Read stored checksum
      const storedChecksum = fs.readFileSync(checksumPath, 'utf-8').trim().split(/\s+/)[0];

      if (actualChecksum === storedChecksum) {
        console.log(`  ✅ ${file}: Checksum valid`);
      } else {
        this.errors.push(`${file}: Checksum mismatch`);
        console.log(`  ❌ ${file}: Checksum mismatch`);
        console.log(`     Expected: ${storedChecksum}`);
        console.log(`     Actual:   ${actualChecksum}`);
      }
    }
  }

  /**
   * Validate line counts
   */
  private async validateLineCounts(): Promise<void> {
    const files = ['train.jsonl', 'test.jsonl', 'combined.jsonl'];
    const expectedMinimums = { 'train.jsonl': 100, 'test.jsonl': 100, 'combined.jsonl': 200 };

    for (const file of files) {
      const filePath = path.join(ROOT_DIR, 'datasets', file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lineCount = content.trim().split('\n').filter(line => line.trim()).length;

      const minimum = expectedMinimums[file as keyof typeof expectedMinimums];
      if (lineCount >= minimum) {
        console.log(`  ✅ ${file}: ${lineCount} lines (minimum: ${minimum})`);
      } else {
        this.errors.push(`${file}: Only ${lineCount} lines (minimum: ${minimum})`);
        console.log(`  ❌ ${file}: Only ${lineCount} lines (minimum: ${minimum})`);
      }
    }
  }

  /**
   * Print validation results
   */
  private printResults(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Validation Results');
    console.log('='.repeat(60));

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All validations passed!');
      console.log('\n✨ Datasets are ready for training.');
    } else {
      if (this.errors.length > 0) {
        console.log(`\n❌ Errors: ${this.errors.length}`);
        this.errors.forEach(err => console.log(`   - ${err}`));
      }
      if (this.warnings.length > 0) {
        console.log(`\n⚠️  Warnings: ${this.warnings.length}`);
        this.warnings.slice(0, 10).forEach(warn => console.log(`   - ${warn}`));
        if (this.warnings.length > 10) {
          console.log(`   ... and ${this.warnings.length - 10} more warnings`);
        }
      }
    }
    console.log('='.repeat(60) + '\n');
  }
}

// Main execution
async function main() {
  const validator = new DatasetValidator();
  const success = await validator.validate();
  process.exit(success ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

