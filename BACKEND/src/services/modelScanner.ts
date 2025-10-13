/**
 * Model Scanner Service
 * Scans filesystem for downloaded models and datasets
 */

import fs from 'fs';
import path from 'path';
import { logger } from '../middleware/logger';
import { getModelById } from '../config/modelCatalog';

export interface ScannedModel {
  id: string;
  name: string;
  type: 'model' | 'tts' | 'dataset';
  size: string;
  sizeBytes: number;
  path: string;
  downloadedAt: string;
  files: string[];
  hasConfig: boolean;
  hasModel: boolean;
  isComplete: boolean;
}

/**
 * Recursively scan a directory for model files
 */
function scanDirectory(dirPath: string, baseDir: string = dirPath): string[] {
  const files: string[] = [];
  
  if (!fs.existsSync(dirPath)) {
    return files;
  }

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(baseDir, fullPath);
      
      if (entry.isDirectory()) {
        // Skip hidden directories and common non-model directories
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          files.push(...scanDirectory(fullPath, baseDir));
        }
      } else if (entry.isFile()) {
        files.push(relativePath);
      }
    }
  } catch (error: any) {
    logger.error({ msg: 'Error scanning directory', dirPath, error: error.message });
  }
  
  return files;
}

/**
 * Get file size in bytes
 */
function getFileSize(filePath: string): number {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

/**
 * Get directory size in bytes (sum of all files)
 */
function getDirectorySize(dirPath: string): number {
  let totalSize = 0;
  
  if (!fs.existsSync(dirPath)) {
    return 0;
  }

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.')) {
          totalSize += getDirectorySize(fullPath);
        }
      } else if (entry.isFile()) {
        totalSize += getFileSize(fullPath);
      }
    }
  } catch (error: any) {
    logger.error({ msg: 'Error calculating directory size', dirPath, error: error.message });
  }
  
  return totalSize;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Get the most recent modification time from a directory
 */
function getLatestModificationTime(dirPath: string): Date {
  let latestTime = new Date(0);
  
  if (!fs.existsSync(dirPath)) {
    return latestTime;
  }

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isFile()) {
        const stats = fs.statSync(fullPath);
        if (stats.mtime > latestTime) {
          latestTime = stats.mtime;
        }
      } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const dirTime = getLatestModificationTime(fullPath);
        if (dirTime > latestTime) {
          latestTime = dirTime;
        }
      }
    }
  } catch (error: any) {
    logger.error({ msg: 'Error getting modification time', dirPath, error: error.message });
  }
  
  return latestTime;
}

/**
 * Check if a directory contains model files
 */
function isModelDirectory(dirPath: string, files: string[]): boolean {
  // Check for common model file patterns
  const modelFilePatterns = [
    /\.bin$/i,
    /\.pth$/i,
    /\.pt$/i,
    /\.safetensors$/i,
    /pytorch_model\.bin$/i,
    /model\.safetensors$/i,
    /config\.json$/i,
    /\.onnx$/i,
    /\.pb$/i
  ];
  
  return files.some(file => 
    modelFilePatterns.some(pattern => pattern.test(file))
  );
}

/**
 * Extract model ID from directory path
 * Examples:
 *   models/bert_fa_base -> HooshvareLab/bert-fa-base-uncased
 *   models/tts/male -> Kamtera/persian-tts-male-vits
 */
function guessModelIdFromPath(dirPath: string, files: string[]): string | null {
  const dirName = path.basename(dirPath);
  
  // Try to match with catalog entries based on defaultDest
  // This is a simple heuristic - could be improved
  
  // Check if any files contain model info
  const configFile = files.find(f => f === 'config.json' || f.endsWith('/config.json'));
  if (configFile) {
    try {
      const configPath = path.join(dirPath, configFile);
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      
      // Some HuggingFace models include _name_or_path
      if (configData._name_or_path) {
        return configData._name_or_path;
      }
      
      if (configData.model_name) {
        return configData.model_name;
      }
    } catch (error) {
      // Ignore JSON parsing errors
    }
  }
  
  // Fallback: return directory name
  return dirName;
}

/**
 * Scan models directory for downloaded models
 */
export function scanModelsDirectory(modelsDir: string = 'models'): ScannedModel[] {
  const scannedModels: ScannedModel[] = [];
  
  const absoluteModelsDir = path.resolve(process.cwd(), modelsDir);
  
  if (!fs.existsSync(absoluteModelsDir)) {
    logger.info({ msg: 'Models directory does not exist', path: absoluteModelsDir });
    return scannedModels;
  }

  try {
    // Get all subdirectories in models/
    const entries = fs.readdirSync(absoluteModelsDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) {
        continue;
      }
      
      const modelPath = path.join(absoluteModelsDir, entry.name);
      
      // Check for nested directories (e.g., models/tts/male)
      const subEntries = fs.readdirSync(modelPath, { withFileTypes: true });
      const hasSubdirs = subEntries.some(e => e.isDirectory() && !e.name.startsWith('.'));
      
      if (hasSubdirs) {
        // Scan subdirectories
        for (const subEntry of subEntries) {
          if (!subEntry.isDirectory() || subEntry.name.startsWith('.')) {
            continue;
          }
          
          const subModelPath = path.join(modelPath, subEntry.name);
          const scannedModel = scanModelDirectory(subModelPath, modelsDir);
          if (scannedModel) {
            scannedModels.push(scannedModel);
          }
        }
      } else {
        // Scan this directory directly
        const scannedModel = scanModelDirectory(modelPath, modelsDir);
        if (scannedModel) {
          scannedModels.push(scannedModel);
        }
      }
    }
  } catch (error: any) {
    logger.error({ msg: 'Error scanning models directory', path: absoluteModelsDir, error: error.message });
  }
  
  return scannedModels;
}

/**
 * Scan datasets directory for downloaded datasets
 */
export function scanDatasetsDirectory(datasetsDir: string = 'datasets'): ScannedModel[] {
  const scannedDatasets: ScannedModel[] = [];
  
  const absoluteDatasetsDir = path.resolve(process.cwd(), datasetsDir);
  
  if (!fs.existsSync(absoluteDatasetsDir)) {
    logger.info({ msg: 'Datasets directory does not exist', path: absoluteDatasetsDir });
    return scannedDatasets;
  }

  try {
    // Recursively scan all subdirectories
    const scanRecursive = (currentDir: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) {
          continue;
        }
        
        const dirPath = path.join(currentDir, entry.name);
        
        // Check if this directory contains dataset files
        const files = scanDirectory(dirPath, dirPath);
        const hasDatasetFiles = files.some(f => 
          /\.(json|csv|txt|parquet|arrow|jsonl)$/i.test(f)
        );
        
        if (hasDatasetFiles && files.length > 0) {
          const scannedDataset = scanModelDirectory(dirPath, datasetsDir, 'dataset');
          if (scannedDataset) {
            scannedDatasets.push(scannedDataset);
          }
        } else {
          // Continue scanning subdirectories
          scanRecursive(dirPath);
        }
      }
    };
    
    scanRecursive(absoluteDatasetsDir);
  } catch (error: any) {
    logger.error({ msg: 'Error scanning datasets directory', path: absoluteDatasetsDir, error: error.message });
  }
  
  return scannedDatasets;
}

/**
 * Scan a single model/dataset directory
 */
function scanModelDirectory(
  dirPath: string, 
  baseDir: string,
  forceType?: 'model' | 'tts' | 'dataset'
): ScannedModel | null {
  const files = scanDirectory(dirPath, dirPath);
  
  if (files.length === 0) {
    return null;
  }
  
  // Check if it's a model directory
  if (!forceType && !isModelDirectory(dirPath, files)) {
    return null;
  }
  
  const modelId = guessModelIdFromPath(dirPath, files) || path.basename(dirPath);
  const sizeBytes = getDirectorySize(dirPath);
  const downloadedAt = getLatestModificationTime(dirPath);
  
  // Check for important files
  const hasConfig = files.some(f => f === 'config.json' || f.endsWith('/config.json'));
  const hasModel = files.some(f => 
    /\.(bin|pth|pt|safetensors|onnx)$/i.test(f)
  );
  
  // Try to get metadata from catalog
  const catalogEntry = getModelById(modelId);
  
  const scannedModel: ScannedModel = {
    id: modelId,
    name: catalogEntry?.name || modelId,
    type: forceType || catalogEntry?.type || 'model',
    size: formatBytes(sizeBytes),
    sizeBytes,
    path: path.relative(process.cwd(), dirPath),
    downloadedAt: downloadedAt.toISOString(),
    files,
    hasConfig,
    hasModel,
    isComplete: hasConfig && hasModel
  };
  
  return scannedModel;
}

/**
 * Scan all directories for models and datasets
 */
export function scanAllSources(): {
  models: ScannedModel[];
  datasets: ScannedModel[];
  all: ScannedModel[];
} {
  const models = scanModelsDirectory('models');
  const datasets = scanDatasetsDirectory('datasets');
  
  logger.info({ 
    msg: 'Filesystem scan complete', 
    modelsFound: models.length, 
    datasetsFound: datasets.length 
  });
  
  return {
    models,
    datasets,
    all: [...models, ...datasets]
  };
}
