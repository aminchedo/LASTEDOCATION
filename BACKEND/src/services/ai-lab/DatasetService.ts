import path from 'path';
import fs from 'fs-extra';
import csv from 'csv-parse';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../config/logger';
import { Dataset, DatasetInfo } from '../../types/ai-lab';

export class DatasetService {
  private storageBasePath: string;
  private datasets: Map<string, Dataset> = new Map();

  constructor() {
    this.storageBasePath = path.join(process.cwd(), 'storage', 'ai-lab', 'datasets');
    this.initializeStorage();
  }

  private async initializeStorage() {
    await fs.ensureDir(this.storageBasePath);
  }

  async processDataset(info: DatasetInfo): Promise<Dataset> {
    const datasetId = uuidv4();
    
    try {
      // Parse file based on type
      let data: any;
      let stats: any = {
        rows: 0,
        columns: 0,
        size: info.size
      };

      const ext = path.extname(info.originalName).toLowerCase();
      
      switch (ext) {
        case '.csv':
          data = await this.parseCSV(info.filePath);
          stats.rows = data.length;
          stats.columns = data.length > 0 ? Object.keys(data[0]).length : 0;
          break;
          
        case '.json':
        case '.jsonl':
          data = await this.parseJSON(info.filePath, ext === '.jsonl');
          stats.rows = Array.isArray(data) ? data.length : 1;
          break;
          
        case '.txt':
          data = await this.parseText(info.filePath);
          stats.rows = data.length;
          stats.tokens = data.reduce((sum: number, text: string) => 
            sum + text.split(/\s+/).length, 0);
          break;
          
        default:
          throw new Error('Unsupported file format');
      }

      // Validate and clean data
      const cleanedData = await this.validateAndCleanData(data, info.type);
      
      // Save processed dataset
      const datasetPath = path.join(this.storageBasePath, info.userId, datasetId);
      await fs.ensureDir(datasetPath);
      
      // Save data
      await fs.writeJson(path.join(datasetPath, 'data.json'), cleanedData, { spaces: 2 });
      
      // Create dataset object
      const dataset: Dataset = {
        id: datasetId,
        userId: info.userId,
        name: info.name,
        type: info.type,
        description: info.description || '',
        originalFile: info.originalName,
        path: datasetPath,
        stats,
        createdAt: new Date(),
        status: 'ready',
        data: cleanedData
      };
      
      // Save metadata
      await fs.writeJson(path.join(datasetPath, 'metadata.json'), {
        ...dataset,
        data: undefined // Don't duplicate data in metadata
      }, { spaces: 2 });
      
      // Cache dataset
      this.datasets.set(datasetId, dataset);
      
      // Clean up original upload
      await fs.unlink(info.filePath);
      
      logger.info(`Dataset ${datasetId} processed successfully`);
      return dataset;
      
    } catch (error: any) {
      logger.error('Failed to process dataset:', error);
      // Clean up on error
      await fs.unlink(info.filePath).catch(() => {});
      throw new Error(`Failed to process dataset: ${error.message}`);
    }
  }

  private async parseCSV(filePath: string): Promise<any[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    
    return new Promise((resolve, reject) => {
      csv.parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  private async parseJSON(filePath: string, isJsonLines: boolean): Promise<any> {
    const content = await fs.readFile(filePath, 'utf-8');
    
    if (isJsonLines) {
      return content
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
    }
    
    return JSON.parse(content);
  }

  private async parseText(filePath: string): Promise<string[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.trim());
  }

  private async validateAndCleanData(data: any, type: string): Promise<any> {
    switch (type) {
      case 'text':
        // Clean text data
        if (Array.isArray(data)) {
          return data.map(item => {
            if (typeof item === 'string') {
              return this.cleanText(item);
            } else if (item.text) {
              return { ...item, text: this.cleanText(item.text) };
            }
            return item;
          });
        }
        break;
        
      case 'structured':
        // Validate structured data
        if (!Array.isArray(data)) {
          throw new Error('Structured data must be an array');
        }
        
        // Ensure all items have consistent structure
        if (data.length > 0) {
          const keys = Object.keys(data[0]);
          const valid = data.every(item => 
            keys.every(key => key in item)
          );
          
          if (!valid) {
            throw new Error('Inconsistent data structure');
          }
        }
        break;
        
      case 'audio':
        // Audio datasets would contain paths/metadata
        // Validate that paths exist or data is base64
        break;
    }
    
    return data;
  }

  private cleanText(text: string): string {
    // Basic Persian text cleaning
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\w\d.!?،؛:؟]/g, ' '); // Keep Persian, English, numbers and basic punctuation
  }

  async loadDataset(datasetId: string): Promise<Dataset | null> {
    // Check cache first
    if (this.datasets.has(datasetId)) {
      return this.datasets.get(datasetId)!;
    }
    
    // Load from disk
    try {
      const metadataPath = path.join(this.storageBasePath, '*', datasetId, 'metadata.json');
      // Use a simple approach to find the metadata file
      const userDirs = await fs.readdir(this.storageBasePath);
      let foundPath: string | null = null;
      
      for (const userDir of userDirs) {
        const possiblePath = path.join(this.storageBasePath, userDir, datasetId, 'metadata.json');
        if (await fs.pathExists(possiblePath)) {
          foundPath = possiblePath;
          break;
        }
      }
      
      const files = foundPath ? [foundPath] : [];
      
      if (files.length === 0) {
        return null;
      }
      
      const metadata = await fs.readJson(files[0]);
      const dataPath = path.join(path.dirname(files[0]), 'data.json');
      const data = await fs.readJson(dataPath);
      
      const dataset: Dataset = {
        ...metadata,
        data
      };
      
      // Cache it
      this.datasets.set(datasetId, dataset);
      
      return dataset;
    } catch (error) {
      logger.error(`Failed to load dataset ${datasetId}:`, error);
      return null;
    }
  }

  async listDatasets(userId: string): Promise<Dataset[]> {
    const userDatasetsPath = path.join(this.storageBasePath, userId);
    
    try {
      if (!await fs.pathExists(userDatasetsPath)) {
        return [];
      }
      
      const datasetDirs = await fs.readdir(userDatasetsPath);
      const datasets: Dataset[] = [];
      
      for (const dir of datasetDirs) {
        const metadataPath = path.join(userDatasetsPath, dir, 'metadata.json');
        if (await fs.pathExists(metadataPath)) {
          const metadata = await fs.readJson(metadataPath);
          datasets.push(metadata);
        }
      }
      
      return datasets.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      logger.error('Failed to list datasets:', error);
      return [];
    }
  }

  async deleteDataset(datasetId: string, userId: string): Promise<boolean> {
    try {
      const datasetPath = path.join(this.storageBasePath, userId, datasetId);
      
      if (await fs.pathExists(datasetPath)) {
        await fs.remove(datasetPath);
        this.datasets.delete(datasetId);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error(`Failed to delete dataset ${datasetId}:`, error);
      return false;
    }
  }

  async getDatasetStats(datasetId: string): Promise<any> {
    const dataset = await this.loadDataset(datasetId);
    if (!dataset) {
      throw new Error('Dataset not found');
    }
    
    const stats = { ...dataset.stats };
    
    // Calculate additional statistics based on type
    if (dataset.type === 'text' && Array.isArray(dataset.data)) {
      const allText = dataset.data
        .map(item => typeof item === 'string' ? item : item.text || '')
        .join(' ');
      
      const words = allText.split(/\s+/);
      const uniqueWords = new Set(words);
      
      stats.totalWords = words.length;
      stats.uniqueWords = uniqueWords.size;
      stats.avgWordsPerRow = Math.round(words.length / dataset.data.length);
    }
    
    return stats;
  }
}