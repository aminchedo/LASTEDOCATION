"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatasetService = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const csv_parse_1 = __importDefault(require("csv-parse"));
const uuid_1 = require("uuid");
const logger_1 = require("../../config/logger");
class DatasetService {
    constructor() {
        this.datasets = new Map();
        this.storageBasePath = path_1.default.join(process.cwd(), 'storage', 'ai-lab', 'datasets');
        this.initializeStorage();
    }
    async initializeStorage() {
        await fs_extra_1.default.ensureDir(this.storageBasePath);
    }
    async processDataset(info) {
        const datasetId = (0, uuid_1.v4)();
        try {
            // Parse file based on type
            let data;
            let stats = {
                rows: 0,
                columns: 0,
                size: info.size
            };
            const ext = path_1.default.extname(info.originalName).toLowerCase();
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
                    stats.tokens = data.reduce((sum, text) => sum + text.split(/\s+/).length, 0);
                    break;
                default:
                    throw new Error('Unsupported file format');
            }
            // Validate and clean data
            const cleanedData = await this.validateAndCleanData(data, info.type);
            // Save processed dataset
            const datasetPath = path_1.default.join(this.storageBasePath, info.userId, datasetId);
            await fs_extra_1.default.ensureDir(datasetPath);
            // Save data
            await fs_extra_1.default.writeJson(path_1.default.join(datasetPath, 'data.json'), cleanedData, { spaces: 2 });
            // Create dataset object
            const dataset = {
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
            await fs_extra_1.default.writeJson(path_1.default.join(datasetPath, 'metadata.json'), {
                ...dataset,
                data: undefined // Don't duplicate data in metadata
            }, { spaces: 2 });
            // Cache dataset
            this.datasets.set(datasetId, dataset);
            // Clean up original upload
            await fs_extra_1.default.unlink(info.filePath);
            logger_1.logger.info(`Dataset ${datasetId} processed successfully`);
            return dataset;
        }
        catch (error) {
            logger_1.logger.error('Failed to process dataset:', error);
            // Clean up on error
            await fs_extra_1.default.unlink(info.filePath).catch(() => { });
            throw new Error(`Failed to process dataset: ${error.message}`);
        }
    }
    async parseCSV(filePath) {
        const content = await fs_extra_1.default.readFile(filePath, 'utf-8');
        return new Promise((resolve, reject) => {
            csv_parse_1.default.parse(content, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            }, (err, data) => {
                if (err)
                    reject(err);
                else
                    resolve(data);
            });
        });
    }
    async parseJSON(filePath, isJsonLines) {
        const content = await fs_extra_1.default.readFile(filePath, 'utf-8');
        if (isJsonLines) {
            return content
                .split('\n')
                .filter(line => line.trim())
                .map(line => JSON.parse(line));
        }
        return JSON.parse(content);
    }
    async parseText(filePath) {
        const content = await fs_extra_1.default.readFile(filePath, 'utf-8');
        return content
            .split('\n')
            .filter(line => line.trim())
            .map(line => line.trim());
    }
    async validateAndCleanData(data, type) {
        switch (type) {
            case 'text':
                // Clean text data
                if (Array.isArray(data)) {
                    return data.map(item => {
                        if (typeof item === 'string') {
                            return this.cleanText(item);
                        }
                        else if (item.text) {
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
                    const valid = data.every(item => keys.every(key => key in item));
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
    cleanText(text) {
        // Basic Persian text cleaning
        return text
            .trim()
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
            .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\w\d.!?،؛:؟]/g, ' '); // Keep Persian, English, numbers and basic punctuation
    }
    async loadDataset(datasetId) {
        // Check cache first
        if (this.datasets.has(datasetId)) {
            return this.datasets.get(datasetId);
        }
        // Load from disk
        try {
            const metadataPath = path_1.default.join(this.storageBasePath, '*', datasetId, 'metadata.json');
            // Use a simple approach to find the metadata file
            const userDirs = await fs_extra_1.default.readdir(this.storageBasePath);
            let foundPath = null;
            for (const userDir of userDirs) {
                const possiblePath = path_1.default.join(this.storageBasePath, userDir, datasetId, 'metadata.json');
                if (await fs_extra_1.default.pathExists(possiblePath)) {
                    foundPath = possiblePath;
                    break;
                }
            }
            const files = foundPath ? [foundPath] : [];
            if (files.length === 0) {
                return null;
            }
            const metadata = await fs_extra_1.default.readJson(files[0]);
            const dataPath = path_1.default.join(path_1.default.dirname(files[0]), 'data.json');
            const data = await fs_extra_1.default.readJson(dataPath);
            const dataset = {
                ...metadata,
                data
            };
            // Cache it
            this.datasets.set(datasetId, dataset);
            return dataset;
        }
        catch (error) {
            logger_1.logger.error(`Failed to load dataset ${datasetId}:`, error);
            return null;
        }
    }
    async listDatasets(userId) {
        const userDatasetsPath = path_1.default.join(this.storageBasePath, userId);
        try {
            if (!await fs_extra_1.default.pathExists(userDatasetsPath)) {
                return [];
            }
            const datasetDirs = await fs_extra_1.default.readdir(userDatasetsPath);
            const datasets = [];
            for (const dir of datasetDirs) {
                const metadataPath = path_1.default.join(userDatasetsPath, dir, 'metadata.json');
                if (await fs_extra_1.default.pathExists(metadataPath)) {
                    const metadata = await fs_extra_1.default.readJson(metadataPath);
                    datasets.push(metadata);
                }
            }
            return datasets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        catch (error) {
            logger_1.logger.error('Failed to list datasets:', error);
            return [];
        }
    }
    async deleteDataset(datasetId, userId) {
        try {
            const datasetPath = path_1.default.join(this.storageBasePath, userId, datasetId);
            if (await fs_extra_1.default.pathExists(datasetPath)) {
                await fs_extra_1.default.remove(datasetPath);
                this.datasets.delete(datasetId);
                return true;
            }
            return false;
        }
        catch (error) {
            logger_1.logger.error(`Failed to delete dataset ${datasetId}:`, error);
            return false;
        }
    }
    async getDatasetStats(datasetId) {
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
exports.DatasetService = DatasetService;
//# sourceMappingURL=DatasetService.js.map