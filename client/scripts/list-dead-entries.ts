#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

interface FileInfo {
  path: string;
  isReferenced: boolean;
  references: string[];
}

function getAllTsxFiles(dir: string, files: string[] = []): string[] {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      getAllTsxFiles(fullPath, files);
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  
  // Match various import patterns
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  
  let match;
  
  // Static imports
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  // Dynamic imports
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  // Require statements
  while ((match = requireRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

function resolveImportPath(importPath: string, fromFile: string, srcDir: string): string | null {
  // Handle relative imports
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    const resolved = path.resolve(path.dirname(fromFile), importPath);
    return resolved.startsWith(srcDir) ? resolved : null;
  }
  
  // Handle absolute imports (starting with @/ or similar)
  if (importPath.startsWith('@/')) {
    return path.join(srcDir, importPath.slice(2));
  }
  
  // Handle other absolute imports
  if (importPath.startsWith('/')) {
    return path.join(srcDir, importPath.slice(1));
  }
  
  return null;
}

function analyzeDeadEntries(srcDir: string): FileInfo[] {
  const allFiles = getAllTsxFiles(srcDir);
  const fileMap = new Map<string, FileInfo>();
  
  // Initialize all files as unreferenced
  for (const file of allFiles) {
    const relativePath = path.relative(srcDir, file);
    fileMap.set(file, {
      path: relativePath,
      isReferenced: false,
      references: []
    });
  }
  
  // Mark entry points as referenced
  const entryPoints = [
    'src/main.tsx',
    'src/App.tsx',
    'src/index.tsx'
  ];
  
  for (const entry of entryPoints) {
    const fullPath = path.join(process.cwd(), entry);
    if (fileMap.has(fullPath)) {
      fileMap.get(fullPath)!.isReferenced = true;
    }
  }
  
  // Process all files to find references
  for (const file of allFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const imports = extractImports(content);
      
      for (const importPath of imports) {
        const resolvedPath = resolveImportPath(importPath, file, srcDir);
        
        if (resolvedPath) {
          // Try different extensions
          const extensions = ['.tsx', '.ts', '/index.tsx', '/index.ts'];
          
          for (const ext of extensions) {
            const fullPath = resolvedPath + ext;
            if (fileMap.has(fullPath)) {
              const fileInfo = fileMap.get(fullPath)!;
              fileInfo.isReferenced = true;
              fileInfo.references.push(path.relative(srcDir, file));
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Error reading file ${file}:`, error);
    }
  }
  
  return Array.from(fileMap.values()).filter(file => !file.isReferenced);
}

function main() {
  const srcDir = path.join(process.cwd(), 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error('src directory not found');
    process.exit(1);
  }
  
  console.log('🔍 Scanning for unreferenced files...\n');
  
  const deadEntries = analyzeDeadEntries(srcDir);
  
  if (deadEntries.length === 0) {
    console.log('✅ No unreferenced files found!');
    return;
  }
  
  console.log(`⚠️  Found ${deadEntries.length} potentially unreferenced files:\n`);
  
  for (const file of deadEntries) {
    console.log(`📄 ${file.path}`);
    if (file.references.length > 0) {
      console.log(`   Referenced by: ${file.references.join(', ')}`);
    }
    console.log('');
  }
  
  console.log('💡 Manual review recommended before deletion.');
  console.log('💡 Consider moving to src/_deprecated/ if unsure.');
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
