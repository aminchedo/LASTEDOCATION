/**
 * Model Management Service
 * Handles model storage, versioning, and metadata management
 */

import fs from 'fs';
import path from 'path';
import { logger } from '../middleware/logger';

export interface ModelMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  type: 'llm' | 'stt' | 'tts' | 'embedding' | 'classification';
  framework: 'pytorch' | 'tensorflow' | 'onnx' | 'huggingface' | 'custom';
  size: number;
  language: string;
  source: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  filePath: string;
  configPath?: string;
  vocabPath?: string;
  checksum: string;
  metrics: {
    accuracy?: number;
    loss?: number;
    perplexity?: number;
    bleu?: number;
    rouge?: number;
  };
  requirements: {
    python?: string;
    pytorch?: string;
    transformers?: string;
    dependencies: string[];
  };
}

export interface ModelVersion {
  version: string;
  filePath: string;
  size: number;
  checksum: string;
  createdAt: string;
  changes: string;
  metrics: ModelMetadata['metrics'];
}

export interface ModelDownload {
  id: string;
  modelId: string;
  source: string;
  url: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
  filePath?: string;
}

class ModelManager {
  private modelsPath: string;
  private metadataPath: string;
  private downloadsPath: string;
  private models: Map<string, ModelMetadata>;
  private downloads: Map<string, ModelDownload>;

  constructor() {
    this.modelsPath = path.join(process.cwd(), 'models', 'pretrained');
    this.metadataPath = path.join(this.modelsPath, 'metadata.json');
    this.downloadsPath = path.join(this.modelsPath, 'downloads.json');
    this.models = new Map();
    this.downloads = new Map();
    this.initialize();
  }

  private initialize(): void {
    try {
      // Ensure models directory exists
      if (!fs.existsSync(this.modelsPath)) {
        fs.mkdirSync(this.modelsPath, { recursive: true });
      }

      // Load existing metadata
      if (fs.existsSync(this.metadataPath)) {
        const rawData = fs.readFileSync(this.metadataPath, 'utf-8');
        const metadata = JSON.parse(rawData);
        metadata.forEach((model: ModelMetadata) => {
          this.models.set(model.id, model);
        });
      }

      // Load download history
      if (fs.existsSync(this.downloadsPath)) {
        const rawData = fs.readFileSync(this.downloadsPath, 'utf-8');
        const downloads = JSON.parse(rawData);
        downloads.forEach((download: ModelDownload) => {
          this.downloads.set(download.id, download);
        });
      }

      logger.info({ 
        msg: 'model_manager_initialized', 
        modelsCount: this.models.size,
        downloadsCount: this.downloads.size,
        path: this.modelsPath 
      });
    } catch (error: any) {
      logger.error({ msg: 'model_manager_init_failed', error: error.message });
      throw error;
    }
  }

  private saveMetadata(): void {
    try {
      const metadata = Array.from(this.models.values());
      fs.writeFileSync(this.metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    } catch (error: any) {
      logger.error({ msg: 'metadata_save_failed', error: error.message });
      throw error;
    }
  }

  private saveDownloads(): void {
    try {
      const downloads = Array.from(this.downloads.values());
      fs.writeFileSync(this.downloadsPath, JSON.stringify(downloads, null, 2), 'utf-8');
    } catch (error: any) {
      logger.error({ msg: 'downloads_save_failed', error: error.message });
      throw error;
    }
  }

  private calculateChecksum(filePath: string): string {
    const crypto = require('crypto');
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  private getFileSize(filePath: string): number {
    try {
      return fs.statSync(filePath).size;
    } catch {
      return 0;
    }
  }

  // Model Management Methods
  async addModel(
    filePath: string,
    metadata: Omit<ModelMetadata, 'id' | 'filePath' | 'checksum' | 'createdAt' | 'updatedAt' | 'size'>
  ): Promise<ModelMetadata> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const size = this.getFileSize(filePath);
      const checksum = this.calculateChecksum(filePath);

      // Generate unique ID
      const id = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Copy file to models directory
      const fileName = `${id}_${metadata.name.replace(/[^a-zA-Z0-9]/g, '_')}.${metadata.framework}`;
      const targetPath = path.join(this.modelsPath, fileName);
      fs.copyFileSync(filePath, targetPath);

      const model: ModelMetadata = {
        id,
        ...metadata,
        filePath: targetPath,
        checksum,
        size,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.models.set(id, model);
      this.saveMetadata();

      logger.info({ msg: 'model_added', id, name: metadata.name });
      return model;
    } catch (error: any) {
      logger.error({ msg: 'model_add_failed', error: error.message });
      throw error;
    }
  }

  getModel(id: string): ModelMetadata | null {
    return this.models.get(id) || null;
  }

  getAllModels(): ModelMetadata[] {
    return Array.from(this.models.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getModelsByType(type: ModelMetadata['type']): ModelMetadata[] {
    return Array.from(this.models.values())
      .filter(model => model.type === type)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getModelsByLanguage(language: string): ModelMetadata[] {
    return Array.from(this.models.values())
      .filter(model => model.language === language)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getModelsByFramework(framework: ModelMetadata['framework']): ModelMetadata[] {
    return Array.from(this.models.values())
      .filter(model => model.framework === framework)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  searchModels(query: string): ModelMetadata[] {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.models.values())
      .filter(model => 
        model.name.toLowerCase().includes(lowercaseQuery) ||
        model.description.toLowerCase().includes(lowercaseQuery) ||
        model.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  updateModel(id: string, updates: Partial<ModelMetadata>): ModelMetadata | null {
    const model = this.models.get(id);
    if (!model) return null;

    const updatedModel = {
      ...model,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.models.set(id, updatedModel);
    this.saveMetadata();

    logger.info({ msg: 'model_updated', id });
    return updatedModel;
  }

  deleteModel(id: string): boolean {
    const model = this.models.get(id);
    if (!model) return false;

    try {
      // Delete the file
      if (fs.existsSync(model.filePath)) {
        fs.unlinkSync(model.filePath);
      }

      // Delete config file if exists
      if (model.configPath && fs.existsSync(model.configPath)) {
        fs.unlinkSync(model.configPath);
      }

      // Delete vocab file if exists
      if (model.vocabPath && fs.existsSync(model.vocabPath)) {
        fs.unlinkSync(model.vocabPath);
      }

      // Remove from metadata
      this.models.delete(id);
      this.saveMetadata();

      logger.info({ msg: 'model_deleted', id });
      return true;
    } catch (error: any) {
      logger.error({ msg: 'model_delete_failed', error: error.message });
      return false;
    }
  }

  // Model Download Management
  async startDownload(
    modelId: string,
    source: string,
    url: string
  ): Promise<ModelDownload> {
    const downloadId = `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const download: ModelDownload = {
      id: downloadId,
      modelId,
      source,
      url,
      status: 'pending',
      progress: 0,
      startedAt: new Date().toISOString()
    };

    this.downloads.set(downloadId, download);
    this.saveDownloads();

    // Start download process (simulated)
    this.processDownload(downloadId);

    logger.info({ msg: 'download_started', downloadId, modelId });
    return download;
  }

  private async processDownload(downloadId: string): Promise<void> {
    const download = this.downloads.get(downloadId);
    if (!download) return;

    try {
      download.status = 'downloading';
      this.saveDownloads();

      // Simulate download progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        download.progress = progress;
        this.saveDownloads();
      }

      // Simulate successful download
      const fileName = `downloaded_${downloadId}.bin`;
      const filePath = path.join(this.modelsPath, fileName);
      
      // Create a dummy file for simulation
      fs.writeFileSync(filePath, `Downloaded model: ${download.modelId}`);

      download.status = 'completed';
      download.progress = 100;
      download.completedAt = new Date().toISOString();
      download.filePath = filePath;
      this.saveDownloads();

      logger.info({ msg: 'download_completed', downloadId });
    } catch (error: any) {
      download.status = 'failed';
      download.error = error.message;
      this.saveDownloads();

      logger.error({ msg: 'download_failed', downloadId, error: error.message });
    }
  }

  getDownload(downloadId: string): ModelDownload | null {
    return this.downloads.get(downloadId) || null;
  }

  getAllDownloads(): ModelDownload[] {
    return Array.from(this.downloads.values()).sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  cancelDownload(downloadId: string): boolean {
    const download = this.downloads.get(downloadId);
    if (!download || download.status === 'completed') return false;

    download.status = 'failed';
    download.error = 'Download cancelled by user';
    this.saveDownloads();

    logger.info({ msg: 'download_cancelled', downloadId });
    return true;
  }

  // Model Versioning
  createVersion(id: string, version: string, changes: string): ModelVersion | null {
    const model = this.models.get(id);
    if (!model) return null;

    try {
      const versionPath = path.join(this.modelsPath, 'versions', `${id}_v${version}.${model.framework}`);
      
      // Ensure versions directory exists
      const versionsDir = path.dirname(versionPath);
      if (!fs.existsSync(versionsDir)) {
        fs.mkdirSync(versionsDir, { recursive: true });
      }

      // Copy current file to version
      fs.copyFileSync(model.filePath, versionPath);

      const modelVersion: ModelVersion = {
        version,
        filePath: versionPath,
        size: this.getFileSize(versionPath),
        checksum: this.calculateChecksum(versionPath),
        createdAt: new Date().toISOString(),
        changes,
        metrics: model.metrics
      };

      logger.info({ msg: 'model_version_created', id, version });
      return modelVersion;
    } catch (error: any) {
      logger.error({ msg: 'model_version_failed', error: error.message });
      return null;
    }
  }

  // Statistics
  getStats(): {
    totalModels: number;
    totalSize: number;
    types: string[];
    frameworks: string[];
    languages: string[];
    tags: string[];
    activeDownloads: number;
  } {
    const models = Array.from(this.models.values());
    const downloads = Array.from(this.downloads.values());
    const totalSize = models.reduce((sum, model) => sum + model.size, 0);
    const types = [...new Set(models.map(m => m.type))];
    const frameworks = [...new Set(models.map(m => m.framework))];
    const languages = [...new Set(models.map(m => m.language))];
    const tags = [...new Set(models.flatMap(m => m.tags))];
    const activeDownloads = downloads.filter(d => d.status === 'downloading').length;

    return {
      totalModels: models.length,
      totalSize,
      types,
      frameworks,
      languages,
      tags,
      activeDownloads
    };
  }

  // Export/Import
  exportModel(id: string, targetPath: string): boolean {
    const model = this.models.get(id);
    if (!model) return false;

    try {
      fs.copyFileSync(model.filePath, targetPath);
      logger.info({ msg: 'model_exported', id, targetPath });
      return true;
    } catch (error: any) {
      logger.error({ msg: 'model_export_failed', error: error.message });
      return false;
    }
  }

  // Validation
  validateModel(id: string): { valid: boolean; errors: string[] } {
    const model = this.models.get(id);
    if (!model) {
      return { valid: false, errors: ['Model not found'] };
    }

    const errors: string[] = [];

    // Check if file exists
    if (!fs.existsSync(model.filePath)) {
      errors.push('Model file not found');
    }

    // Check checksum
    if (fs.existsSync(model.filePath)) {
      const currentChecksum = this.calculateChecksum(model.filePath);
      if (currentChecksum !== model.checksum) {
        errors.push('Model checksum mismatch');
      }
    }

    // Check metadata
    if (!model.name || model.name.trim() === '') {
      errors.push('Model name is required');
    }

    if (!model.type || !['llm', 'stt', 'tts', 'embedding', 'classification'].includes(model.type)) {
      errors.push('Invalid model type');
    }

    if (!model.framework || !['pytorch', 'tensorflow', 'onnx', 'huggingface', 'custom'].includes(model.framework)) {
      errors.push('Invalid model framework');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const modelManager = new ModelManager();
export default modelManager;
