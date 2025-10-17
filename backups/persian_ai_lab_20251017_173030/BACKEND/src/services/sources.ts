import fs from 'fs';
import path from 'path';
import { logger } from '../middleware/logger';

export interface InstalledItem {
  id: string;
  name: string;
  type: 'model' | 'dataset' | 'tts';
  path: string;
  size: number;
  fileCount: number;
  installed: boolean;
  provenance?: {
    source?: string;
    url?: string;
    license?: string;
  };
}

function getDirectorySize(dirPath: string): number {
  let size = 0;
  if (!fs.existsSync(dirPath)) return 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isFile()) {
        size += stat.size;
      } else if (stat.isDirectory()) {
        size += getDirectorySize(fullPath);
      }
    }
  } catch (err) {
    logger.error({ msg: 'Error reading directory', path: dirPath, err });
  }
  
  return size;
}

function countFiles(dirPath: string): number {
  let count = 0;
  if (!fs.existsSync(dirPath)) return 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isFile()) {
        count++;
      } else if (stat.isDirectory()) {
        count += countFiles(fullPath);
      }
    }
  } catch (err) {
    logger.error({ msg: 'Error counting files', path: dirPath, err });
  }
  
  return count;
}

function readProvenance(dirPath: string): InstalledItem['provenance'] | undefined {
  const readmePath = path.join(dirPath, 'README.source.md');
  if (!fs.existsSync(readmePath)) return undefined;
  
  try {
    const content = fs.readFileSync(readmePath, 'utf-8');
    const sourceMatch = content.match(/Source:\s*(.+)/);
    const urlMatch = content.match(/URL:\s*(.+)/);
    const licenseMatch = content.match(/License:\s*(.+)/);
    
    return {
      source: sourceMatch?.[1]?.trim(),
      url: urlMatch?.[1]?.trim(),
      license: licenseMatch?.[1]?.trim(),
    };
  } catch (err) {
    return undefined;
  }
}

export function getInstalledItems(): InstalledItem[] {
  const items: InstalledItem[] = [];
  const baseDirs = [
    { base: 'datasets/text', type: 'dataset' as const },
    { base: 'datasets/speech', type: 'dataset' as const },
    { base: 'datasets/tts', type: 'tts' as const },
    { base: 'models', type: 'model' as const },
  ];
  
  for (const { base, type } of baseDirs) {
    if (!fs.existsSync(base)) continue;
    
    try {
      const entries = fs.readdirSync(base);
      for (const entry of entries) {
        const fullPath = path.join(base, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          const size = getDirectorySize(fullPath);
          const fileCount = countFiles(fullPath);
          
          if (fileCount > 0) {
            items.push({
              id: `${type}-${entry}`,
              name: entry,
              type,
              path: fullPath,
              size,
              fileCount,
              installed: true,
              provenance: readProvenance(fullPath),
            });
          }
        }
      }
    } catch (err) {
      logger.error({ msg: 'Error scanning directory', base, err });
    }
  }
  
  logger.info({ msg: 'Scanned installed items', count: items.length });
  return items;
}

export function getInstalledItemById(id: string): InstalledItem | null {
  const items = getInstalledItems();
  return items.find(item => item.id === id) || null;
}
