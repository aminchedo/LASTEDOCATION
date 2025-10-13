#!/usr/bin/env ts-node
/**
 * Build Verification Script
 * Verifies build process for backend and client
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

interface BuildResult {
  project: string;
  status: 'pass' | 'fail' | 'skipped';
  message: string;
  size?: string;
  duration?: number;
  warnings?: string[];
  errors?: string[];
}

const results: BuildResult[] = [];

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get directory size
 */
function getDirectorySize(dirPath: string): number {
  let totalSize = 0;

  if (!fs.existsSync(dirPath)) {
    return 0;
  }

  const files = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dirPath, file.name);
    
    if (file.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    } else {
      totalSize += fs.statSync(filePath).size;
    }
  }

  return totalSize;
}

/**
 * Clean build directory
 */
function cleanBuildDir(projectName: string, buildDir: string): void {
  if (fs.existsSync(buildDir)) {
    console.log(`🧹 Cleaning ${projectName} build directory...`);
    fs.rmSync(buildDir, { recursive: true, force: true });
  }
}

/**
 * Build project
 */
function buildProject(
  projectName: string,
  projectDir: string,
  buildDir: string,
  buildCommand: string
): BuildResult {
  const startTime = Date.now();

  try {
    // Check if package.json exists
    const packageJsonPath = path.join(projectDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return {
        project: projectName,
        status: 'skipped',
        message: 'package.json not found'
      };
    }

    console.log(`\n🔨 Building ${projectName}...`);

    // Run build command
    const output = execSync(buildCommand, {
      cwd: projectDir,
      encoding: 'utf-8',
      stdio: 'pipe'
    });

    const duration = Date.now() - startTime;

    // Check if build directory was created
    if (!fs.existsSync(buildDir)) {
      return {
        project: projectName,
        status: 'fail',
        message: 'Build directory not created',
        duration
      };
    }

    // Get build size
    const buildSize = getDirectorySize(buildDir);

    // Parse warnings from output
    const lines = output.toString().split('\n');
    const warnings = lines.filter(line => 
      line.toLowerCase().includes('warning') && 
      !line.includes('warnings in')
    ).slice(0, 5); // Limit to first 5 warnings

    return {
      project: projectName,
      status: 'pass',
      message: 'Build successful',
      size: formatBytes(buildSize),
      duration,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errorOutput = error.stdout || error.stderr || error.message;
    
    // Parse errors
    const lines = errorOutput.toString().split('\n').filter((line: string) => line.trim());
    const errors = lines.filter((line: string) => 
      line.toLowerCase().includes('error') ||
      line.includes('ERROR in')
    ).slice(0, 10); // Limit to first 10 errors

    return {
      project: projectName,
      status: 'fail',
      message: 'Build failed',
      duration,
      errors
    };
  }
}

/**
 * Verify build artifacts
 */
function verifyBuildArtifacts(
  projectName: string,
  buildDir: string,
  expectedFiles: string[]
): BuildResult {
  console.log(`\n🔍 Verifying ${projectName} build artifacts...`);

  const missingFiles: string[] = [];

  for (const file of expectedFiles) {
    const filePath = path.join(buildDir, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length === 0) {
    return {
      project: projectName,
      status: 'pass',
      message: `All ${expectedFiles.length} expected files present`
    };
  } else {
    return {
      project: projectName,
      status: 'fail',
      message: `Missing ${missingFiles.length} files`,
      errors: missingFiles.map(f => `Missing: ${f}`)
    };
  }
}

/**
 * Check for build warnings
 */
function checkBuildWarnings(buildResult: BuildResult): void {
  if (buildResult.warnings && buildResult.warnings.length > 0) {
    console.log(`\n⚠️  ${buildResult.project} has ${buildResult.warnings.length} warnings`);
    
    if (process.argv.includes('--verbose')) {
      buildResult.warnings.forEach(warning => {
        console.log(`   ${warning}`);
      });
    }
  }
}

/**
 * Print results
 */
function printResults(): void {
  console.log('\n' + '='.repeat(70));
  console.log('BUILD VERIFICATION REPORT');
  console.log('='.repeat(70) + '\n');

  let passCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  let totalDuration = 0;

  for (const result of results) {
    let icon = '❓';
    if (result.status === 'pass') {
      icon = '✅';
      passCount++;
    } else if (result.status === 'fail') {
      icon = '❌';
      failCount++;
    } else {
      icon = '⊝';
      skippedCount++;
    }

    const time = result.duration ? `${(result.duration / 1000).toFixed(1)}s` : '';
    const size = result.size ? `- ${result.size}` : '';
    
    console.log(`${icon} ${result.project}: ${result.message}`);
    console.log(`   Time: ${time} ${size}`);

    if (result.errors && result.errors.length > 0) {
      console.log('\n   Errors:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }

    if (result.warnings && result.warnings.length > 0 && process.argv.includes('--verbose')) {
      console.log('\n   Warnings:');
      result.warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    if (result.duration) {
      totalDuration += result.duration;
    }

    console.log();
  }

  console.log('='.repeat(70));
  console.log(`SUMMARY: ${passCount} passed, ${failCount} failed, ${skippedCount} skipped`);
  console.log(`Total build time: ${(totalDuration / 1000).toFixed(1)}s`);
  console.log('='.repeat(70) + '\n');

  if (failCount > 0) {
    console.log('💡 Run with --verbose flag for detailed information\n');
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('\n🚀 Starting Build Verification...\n');

  const rootDir = path.resolve(__dirname, '../..');
  const backendDir = path.join(rootDir, 'BACKEND');
  const clientDir = path.join(rootDir, 'client');

  // Build backend
  if (fs.existsSync(backendDir)) {
    const backendBuildDir = path.join(backendDir, 'dist');
    
    // Clean first
    if (!process.argv.includes('--no-clean')) {
      cleanBuildDir('Backend', backendBuildDir);
    }

    // Build
    const backendResult = buildProject(
      'Backend',
      backendDir,
      backendBuildDir,
      'npm run build'
    );
    results.push(backendResult);

    // Verify artifacts if build succeeded
    if (backendResult.status === 'pass') {
      const verifyResult = verifyBuildArtifacts(
        'Backend Artifacts',
        path.join(backendBuildDir, 'src'),
        ['server.js', 'config/env.js', 'database/connection.js']
      );
      results.push(verifyResult);
      
      checkBuildWarnings(backendResult);
    }
  } else {
    console.log('⚠️  Backend directory not found');
  }

  // Build client
  if (fs.existsSync(clientDir)) {
    const clientBuildDir = path.join(clientDir, 'dist');
    
    // Clean first
    if (!process.argv.includes('--no-clean')) {
      cleanBuildDir('Client', clientBuildDir);
    }

    // Build
    const clientResult = buildProject(
      'Client',
      clientDir,
      clientBuildDir,
      'npm run build'
    );
    results.push(clientResult);

    // Verify artifacts if build succeeded
    if (clientResult.status === 'pass') {
      const verifyResult = verifyBuildArtifacts(
        'Client Artifacts',
        clientBuildDir,
        ['index.html', 'assets']
      );
      results.push(verifyResult);
      
      checkBuildWarnings(clientResult);
    }
  } else {
    console.log('⚠️  Client directory not found');
  }

  // Print results
  printResults();

  // Exit with error code if any checks failed
  const hasFailures = results.some(r => r.status === 'fail');
  process.exit(hasFailures ? 1 : 0);
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { main as verifyBuild };
