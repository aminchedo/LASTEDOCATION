"use strict";
/**
 * Dataset Management Service
 * Handles dataset storage, versioning, and metadata management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.datasetManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../middleware/logger");
class DatasetManager {
    constructor() {
        this.datasetsPath = path_1.default.join(process.cwd(), 'models', 'datasets');
        this.metadataPath = path_1.default.join(this.datasetsPath, 'metadata.json');
        this.datasets = new Map();
        this.initialize();
    }
    initialize() {
        try {
            // Ensure datasets directory exists
            if (!fs_1.default.existsSync(this.datasetsPath)) {
                fs_1.default.mkdirSync(this.datasetsPath, { recursive: true });
            }
            // Load existing metadata
            if (fs_1.default.existsSync(this.metadataPath)) {
                const rawData = fs_1.default.readFileSync(this.metadataPath, 'utf-8');
                const metadata = JSON.parse(rawData);
                metadata.forEach((dataset) => {
                    this.datasets.set(dataset.id, dataset);
                });
            }
            logger_1.logger.info({
                msg: 'dataset_manager_initialized',
                datasetsCount: this.datasets.size,
                path: this.datasetsPath
            });
        }
        catch (error) {
            logger_1.logger.error({ msg: 'dataset_manager_init_failed', error: error.message });
            throw error;
        }
    }
    saveMetadata() {
        try {
            const metadata = Array.from(this.datasets.values());
            fs_1.default.writeFileSync(this.metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
        }
        catch (error) {
            logger_1.logger.error({ msg: 'metadata_save_failed', error: error.message });
            throw error;
        }
    }
    calculateChecksum(filePath) {
        const crypto = require('crypto');
        const fileBuffer = fs_1.default.readFileSync(filePath);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        return hashSum.digest('hex');
    }
    analyzeDataset(filePath, format) {
        try {
            const content = fs_1.default.readFileSync(filePath, 'utf-8');
            let records = [];
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
                        const record = {};
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
        }
        catch (error) {
            logger_1.logger.error({ msg: 'dataset_analysis_failed', error: error.message });
            return {
                totalRecords: 0,
                avgLength: 0,
                languages: []
            };
        }
    }
    // Dataset Management Methods
    async addDataset(filePath, metadata) {
        try {
            if (!fs_1.default.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }
            const stats = fs_1.default.statSync(filePath);
            const checksum = this.calculateChecksum(filePath);
            const analysis = this.analyzeDataset(filePath, metadata.format);
            // Generate unique ID
            const id = `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            // Copy file to datasets directory
            const fileName = `${id}_${metadata.name.replace(/[^a-zA-Z0-9]/g, '_')}.${metadata.format}`;
            const targetPath = path_1.default.join(this.datasetsPath, fileName);
            fs_1.default.copyFileSync(filePath, targetPath);
            const dataset = {
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
            logger_1.logger.info({ msg: 'dataset_added', id, name: metadata.name });
            return dataset;
        }
        catch (error) {
            logger_1.logger.error({ msg: 'dataset_add_failed', error: error.message });
            throw error;
        }
    }
    getDataset(id) {
        return this.datasets.get(id) || null;
    }
    getAllDatasets() {
        return Array.from(this.datasets.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    getDatasetsByLanguage(language) {
        return Array.from(this.datasets.values())
            .filter(dataset => dataset.language === language)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    getDatasetsByTag(tag) {
        return Array.from(this.datasets.values())
            .filter(dataset => dataset.tags.includes(tag))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    searchDatasets(query) {
        const lowercaseQuery = query.toLowerCase();
        return Array.from(this.datasets.values())
            .filter(dataset => dataset.name.toLowerCase().includes(lowercaseQuery) ||
            dataset.description.toLowerCase().includes(lowercaseQuery) ||
            dataset.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    updateDataset(id, updates) {
        const dataset = this.datasets.get(id);
        if (!dataset)
            return null;
        const updatedDataset = {
            ...dataset,
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.datasets.set(id, updatedDataset);
        this.saveMetadata();
        logger_1.logger.info({ msg: 'dataset_updated', id });
        return updatedDataset;
    }
    deleteDataset(id) {
        const dataset = this.datasets.get(id);
        if (!dataset)
            return false;
        try {
            // Delete the file
            if (fs_1.default.existsSync(dataset.filePath)) {
                fs_1.default.unlinkSync(dataset.filePath);
            }
            // Remove from metadata
            this.datasets.delete(id);
            this.saveMetadata();
            logger_1.logger.info({ msg: 'dataset_deleted', id });
            return true;
        }
        catch (error) {
            logger_1.logger.error({ msg: 'dataset_delete_failed', error: error.message });
            return false;
        }
    }
    // Dataset Versioning
    createVersion(id, version, changes) {
        const dataset = this.datasets.get(id);
        if (!dataset)
            return null;
        try {
            const versionPath = path_1.default.join(this.datasetsPath, 'versions', `${id}_v${version}.${dataset.format}`);
            // Ensure versions directory exists
            const versionsDir = path_1.default.dirname(versionPath);
            if (!fs_1.default.existsSync(versionsDir)) {
                fs_1.default.mkdirSync(versionsDir, { recursive: true });
            }
            // Copy current file to version
            fs_1.default.copyFileSync(dataset.filePath, versionPath);
            const datasetVersion = {
                version,
                filePath: versionPath,
                size: fs_1.default.statSync(versionPath).size,
                checksum: this.calculateChecksum(versionPath),
                createdAt: new Date().toISOString(),
                changes
            };
            logger_1.logger.info({ msg: 'dataset_version_created', id, version });
            return datasetVersion;
        }
        catch (error) {
            logger_1.logger.error({ msg: 'dataset_version_failed', error: error.message });
            return null;
        }
    }
    // Statistics
    getStats() {
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
    exportDataset(id, targetPath) {
        const dataset = this.datasets.get(id);
        if (!dataset)
            return false;
        try {
            fs_1.default.copyFileSync(dataset.filePath, targetPath);
            logger_1.logger.info({ msg: 'dataset_exported', id, targetPath });
            return true;
        }
        catch (error) {
            logger_1.logger.error({ msg: 'dataset_export_failed', error: error.message });
            return false;
        }
    }
    // Validation
    validateDataset(id) {
        const dataset = this.datasets.get(id);
        if (!dataset) {
            return { valid: false, errors: ['Dataset not found'] };
        }
        const errors = [];
        // Check if file exists
        if (!fs_1.default.existsSync(dataset.filePath)) {
            errors.push('Dataset file not found');
        }
        // Check checksum
        if (fs_1.default.existsSync(dataset.filePath)) {
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
exports.datasetManager = new DatasetManager();
exports.default = exports.datasetManager;
//# sourceMappingURL=datasetManager.js.map