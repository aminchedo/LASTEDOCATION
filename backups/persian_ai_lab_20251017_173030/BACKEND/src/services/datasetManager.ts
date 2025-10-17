/**
 * Dataset Management Service
 * Handles dataset storage, versioning, and metadata management
 */

import fs from 'fs';
import path from 'path';
import { logger } from '../middleware/logger';

export interface DatasetMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  size: number;
  format: 'json' | 'jsonl' | 'csv' | 'txt' | 'parquet';
  language: string;
  source: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  filePath: string;
  checksum: string;
  stats: {
    totalRecords: number;
    avgLength: number;
    languages: string[];
  };
}

export interface DatasetVersion {
  version: string;
  filePath: string;
  size: number;
  checksum: string;
  createdAt: string;
  changes: string;
}

class DatasetManager {
  private datasetsPath: string;
  private metadataPath: string;
  private datasets: Map<string, DatasetMetadata>;

  constructor() {
    this.datasetsPath = path.join(process.cwd(), 'models', 'datasets');
    this.metadataPath = path.join(this.datasetsPath, 'metadata.json');
    this.datasets = new Map();
    this.initialize();
  }

  private initialize(): void {
    try {
      // Ensure datasets directory exists
      if (!fs.existsSync(this.datasetsPath)) {
        fs.mkdirSync(this.datasetsPath, { recursive: true });
      }

      // Load existing metadata
      if (fs.existsSync(this.metadataPath)) {
        const rawData = fs.readFileSync(this.metadataPath, 'utf-8');
        const metadata = JSON.parse(rawData);
        metadata.forEach((dataset: DatasetMetadata) => {
          this.datasets.set(dataset.id, dataset);
        });
      }

      logger.info({ 
        msg: 'dataset_manager_initialized', 
        datasetsCount: this.datasets.size,
        path: this.datasetsPath 
      });
    } catch (error: any) {
      logger.error({ msg: 'dataset_manager_init_failed', error: error.message });
      throw error;
    }
  }

  private saveMetadata(): void {
    try {
      const metadata = Array.from(this.datasets.values());
      fs.writeFileSync(this.metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    } catch (error: any) {
      logger.error({ msg: 'metadata_save_failed', error: error.message });
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

  private analyzeDataset(filePath: string, format: string): any {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      let records: any[] = [];

      switch (format) {
        case 'json':
          records = JSON.parse(content);
          break;
        case 'jsonl':
          records = content.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
          break;
        case 'csv':
          const lines = content.split('\n');
          const headers = lines[0].split(',');
          records = lines.slice(1).map(line => {
            const values = line.split(',');
            const record: any = {};
            headers.forEach((header, index) => {
              record[header.trim()] = values[index]?.trim();
            });
            return record;
          });
          break;
        case 'txt':
          records = content.split('\n').filter(line => line.trim()).map(line => ({ text: line }));
          break;
      }

      const totalRecords = records.length;
      const avgLength = totalRecords > 0 ? 
        records.reduce((sum, record) => {
          const text = typeof record === 'string' ? record : JSON.stringify(record);
          return sum + text.length;
        }, 0) / totalRecords : 0;

      return {
        totalRecords,
        avgLength: Math.round(avgLength),
        languages: ['fa', 'en'] // Default, could be enhanced with language detection
      };
    } catch (error: any) {
      logger.error({ msg: 'dataset_analysis_failed', error: error.message });
      return {
        totalRecords: 0,
        avgLength: 0,
        languages: []
      };
    }
  }

  // Dataset Management Methods
  async addDataset(
    filePath: string,
    metadata: Omit<DatasetMetadata, 'id' | 'filePath' | 'checksum' | 'createdAt' | 'updatedAt' | 'stats'>
  ): Promise<DatasetMetadata> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const stats = fs.statSync(filePath);
      const checksum = this.calculateChecksum(filePath);
      const analysis = this.analyzeDataset(filePath, metadata.format);

      // Generate unique ID
      const id = `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Copy file to datasets directory
      const fileName = `${id}_${metadata.name.replace(/[^a-zA-Z0-9]/g, '_')}.${metadata.format}`;
      const targetPath = path.join(this.datasetsPath, fileName);
      fs.copyFileSync(filePath, targetPath);

      const dataset: DatasetMetadata = {
        id,
        ...metadata,
        filePath: targetPath,
        checksum,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: analysis
      };

      this.datasets.set(id, dataset);
      this.saveMetadata();

      logger.info({ msg: 'dataset_added', id, name: metadata.name });
      return dataset;
    } catch (error: any) {
      logger.error({ msg: 'dataset_add_failed', error: error.message });
      throw error;
    }
  }

  getDataset(id: string): DatasetMetadata | null {
    return this.datasets.get(id) || null;
  }

  getAllDatasets(): DatasetMetadata[] {
    return Array.from(this.datasets.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getDatasetsByLanguage(language: string): DatasetMetadata[] {
    return Array.from(this.datasets.values())
      .filter(dataset => dataset.language === language)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getDatasetsByTag(tag: string): DatasetMetadata[] {
    return Array.from(this.datasets.values())
      .filter(dataset => dataset.tags.includes(tag))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  searchDatasets(query: string): DatasetMetadata[] {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.datasets.values())
      .filter(dataset => 
        dataset.name.toLowerCase().includes(lowercaseQuery) ||
        dataset.description.toLowerCase().includes(lowercaseQuery) ||
        dataset.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  updateDataset(id: string, updates: Partial<DatasetMetadata>): DatasetMetadata | null {
    const dataset = this.datasets.get(id);
    if (!dataset) return null;

    const updatedDataset = {
      ...dataset,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.datasets.set(id, updatedDataset);
    this.saveMetadata();

    logger.info({ msg: 'dataset_updated', id });
    return updatedDataset;
  }

  deleteDataset(id: string): boolean {
    const dataset = this.datasets.get(id);
    if (!dataset) return false;

    try {
      // Delete the file
      if (fs.existsSync(dataset.filePath)) {
        fs.unlinkSync(dataset.filePath);
      }

      // Remove from metadata
      this.datasets.delete(id);
      this.saveMetadata();

      logger.info({ msg: 'dataset_deleted', id });
      return true;
    } catch (error: any) {
      logger.error({ msg: 'dataset_delete_failed', error: error.message });
      return false;
    }
  }

  // Dataset Versioning
  createVersion(id: string, version: string, changes: string): DatasetVersion | null {
    const dataset = this.datasets.get(id);
    if (!dataset) return null;

    try {
      const versionPath = path.join(this.datasetsPath, 'versions', `${id}_v${version}.${dataset.format}`);
      
      // Ensure versions directory exists
      const versionsDir = path.dirname(versionPath);
      if (!fs.existsSync(versionsDir)) {
        fs.mkdirSync(versionsDir, { recursive: true });
      }

      // Copy current file to version
      fs.copyFileSync(dataset.filePath, versionPath);

      const datasetVersion: DatasetVersion = {
        version,
        filePath: versionPath,
        size: fs.statSync(versionPath).size,
        checksum: this.calculateChecksum(versionPath),
        createdAt: new Date().toISOString(),
        changes
      };

      logger.info({ msg: 'dataset_version_created', id, version });
      return datasetVersion;
    } catch (error: any) {
      logger.error({ msg: 'dataset_version_failed', error: error.message });
      return null;
    }
  }

  // Statistics
  getStats(): {
    totalDatasets: number;
    totalSize: number;
    languages: string[];
    formats: string[];
    tags: string[];
  } {
    const datasets = Array.from(this.datasets.values());
    const totalSize = datasets.reduce((sum, dataset) => sum + dataset.size, 0);
    const languages = [...new Set(datasets.map(d => d.language))];
    const formats = [...new Set(datasets.map(d => d.format))];
    const tags = [...new Set(datasets.flatMap(d => d.tags))];

    return {
      totalDatasets: datasets.length,
      totalSize,
      languages,
      formats,
      tags
    };
  }

  // Export/Import
  exportDataset(id: string, targetPath: string): boolean {
    const dataset = this.datasets.get(id);
    if (!dataset) return false;

    try {
      fs.copyFileSync(dataset.filePath, targetPath);
      logger.info({ msg: 'dataset_exported', id, targetPath });
      return true;
    } catch (error: any) {
      logger.error({ msg: 'dataset_export_failed', error: error.message });
      return false;
    }
  }

  // Validation
  validateDataset(id: string): { valid: boolean; errors: string[] } {
    const dataset = this.datasets.get(id);
    if (!dataset) {
      return { valid: false, errors: ['Dataset not found'] };
    }

    const errors: string[] = [];

    // Check if file exists
    if (!fs.existsSync(dataset.filePath)) {
      errors.push('Dataset file not found');
    }

    // Check checksum
    if (fs.existsSync(dataset.filePath)) {
      const currentChecksum = this.calculateChecksum(dataset.filePath);
      if (currentChecksum !== dataset.checksum) {
        errors.push('Dataset checksum mismatch');
      }
    }

    // Check metadata
    if (!dataset.name || dataset.name.trim() === '') {
      errors.push('Dataset name is required');
    }

    if (!dataset.format || !['json', 'jsonl', 'csv', 'txt', 'parquet'].includes(dataset.format)) {
      errors.push('Invalid dataset format');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const datasetManager = new DatasetManager();
export default datasetManager;
