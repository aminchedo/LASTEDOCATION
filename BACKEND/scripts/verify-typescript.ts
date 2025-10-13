#!/usr/bin/env ts-node
/**
 * TypeScript Compilation Check Script
 * Verifies TypeScript compilation for backend and client
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

interface CompilationResult {
  project: string;
  status: 'pass' | 'fail';
  message: string;
  errors?: string[];
  warnings?: string[];
  duration?: number;
}

const results: CompilationResult[] = [];

/**
 * Check if TypeScript compiler is available
 */
function checkTypeScriptInstalled(): boolean {
  try {
    execSync('npx tsc --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.error('❌ TypeScript compiler not found');
    console.error('Run: npm install -D typescript');
    return false;
  }
}

/**
 * Run TypeScript compilation check for a project
 */
function checkTypeScriptCompilation(
  projectName: string,
  projectDir: string
): CompilationResult {
  const startTime = Date.now();

  try {
    // Check if tsconfig.json exists
    const tsconfigPath = path.join(projectDir, 'tsconfig.json');
    if (!fs.existsSync(tsconfigPath)) {
      return {
        project: projectName,
        status: 'fail',
        message: 'tsconfig.json not found'
      };
    }

    // Run TypeScript compiler in no-emit mode
    console.log(`\n🔍 Checking ${projectName}...`);
    
    const output = execSync('npx tsc --noEmit', {
      cwd: projectDir,
      encoding: 'utf-8',
      stdio: 'pipe'
    });

    const duration = Date.now() - startTime;

    return {
      project: projectName,
      status: 'pass',
      message: `No type errors found`,
      duration
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errorOutput = error.stdout || error.stderr || error.message;
    
    // Parse TypeScript errors
    const lines = errorOutput.toString().split('\n').filter((line: string) => line.trim());
    const errors = lines.filter((line: string) => 
      line.includes('error TS') || line.includes('✖')
    );
    const warnings = lines.filter((line: string) => 
      line.includes('warning')
    );

    return {
      project: projectName,
      status: 'fail',
      message: `Found ${errors.length} type errors`,
      errors: errors.slice(0, 10), // Limit to first 10 errors
      warnings,
      duration
    };
  }
}

/**
 * Check import resolution
 */
function checkImports(projectName: string, projectDir: string): CompilationResult {
  console.log(`\n🔗 Checking imports for ${projectName}...`);

  try {
    // Use tsc to check module resolution
    const output = execSync('npx tsc --noEmit --listFiles', {
      cwd: projectDir,
      encoding: 'utf-8',
      stdio: 'pipe'
    });

    const fileCount = output.split('\n').filter(line => line.trim().endsWith('.ts')).length;

    return {
      project: projectName,
      status: 'pass',
      message: `All imports resolved (${fileCount} files)`,
    };
  } catch (error: any) {
    const errorOutput = error.stdout || error.stderr || error.message;
    const unresolved = errorOutput.toString()
      .split('\n')
      .filter((line: string) => line.includes('Cannot find module'));

    return {
      project: projectName,
      status: 'fail',
      message: `Unresolved imports found`,
      errors: unresolved.slice(0, 5)
    };
  }
}

/**
 * Print results
 */
function printResults(): void {
  console.log('\n' + '='.repeat(70));
  console.log('TYPESCRIPT VERIFICATION REPORT');
  console.log('='.repeat(70) + '\n');

  let passCount = 0;
  let failCount = 0;

  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : '❌';
    const time = result.duration ? `(${result.duration}ms)` : '';
    
    console.log(`${icon} ${result.project}: ${result.message} ${time}`);

    if (result.errors && result.errors.length > 0 && process.argv.includes('--verbose')) {
      console.log('\n   Errors:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }

    if (result.warnings && result.warnings.length > 0 && process.argv.includes('--verbose')) {
      console.log('\n   Warnings:');
      result.warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    if (result.status === 'pass') {
      passCount++;
    } else {
      failCount++;
    }

    console.log();
  }

  console.log('='.repeat(70));
  console.log(`SUMMARY: ${passCount} passed, ${failCount} failed`);
  console.log('='.repeat(70) + '\n');

  if (failCount > 0) {
    console.log('💡 Run with --verbose flag for detailed error information\n');
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('\n🚀 Starting TypeScript Verification...\n');

  // Check if TypeScript is installed
  if (!checkTypeScriptInstalled()) {
    process.exit(1);
  }

  const rootDir = path.resolve(__dirname, '../..');
  const backendDir = path.join(rootDir, 'BACKEND');
  const clientDir = path.join(rootDir, 'client');

  // Check backend
  if (fs.existsSync(backendDir)) {
    const backendResult = checkTypeScriptCompilation('Backend', backendDir);
    results.push(backendResult);

    // Check imports only if compilation passed
    if (backendResult.status === 'pass') {
      const importsResult = checkImports('Backend Imports', backendDir);
      results.push(importsResult);
    }
  } else {
    console.log('⚠️  Backend directory not found');
  }

  // Check client
  if (fs.existsSync(clientDir)) {
    const clientResult = checkTypeScriptCompilation('Client', clientDir);
    results.push(clientResult);

    // Check imports only if compilation passed
    if (clientResult.status === 'pass') {
      const importsResult = checkImports('Client Imports', clientDir);
      results.push(importsResult);
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

export { main as verifyTypeScript };
