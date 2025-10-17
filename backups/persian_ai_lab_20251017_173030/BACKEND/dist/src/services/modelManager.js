"use strict";
/**
 * Model Management Service
 * Handles model storage, versioning, and metadata management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../middleware/logger");
class ModelManager {
    constructor() {
        this.modelsPath = path_1.default.join(process.cwd(), 'models', 'pretrained');
        this.metadataPath = path_1.default.join(this.modelsPath, 'metadata.json');
        this.downloadsPath = path_1.default.join(this.modelsPath, 'downloads.json');
        this.models = new Map();
        this.downloads = new Map();
        this.initialize();
    }
    initialize() {
        try {
            // Ensure models directory exists
            if (!fs_1.default.existsSync(this.modelsPath)) {
                fs_1.default.mkdirSync(this.modelsPath, { recursive: true });
            }
            // Load existing metadata
            if (fs_1.default.existsSync(this.metadataPath)) {
                const rawData = fs_1.default.readFileSync(this.metadataPath, 'utf-8');
                const metadata = JSON.parse(rawData);
                metadata.forEach((model) => {
                    this.models.set(model.id, model);
                });
            }
            // Load download history
            if (fs_1.default.existsSync(this.downloadsPath)) {
                const rawData = fs_1.default.readFileSync(this.downloadsPath, 'utf-8');
                const downloads = JSON.parse(rawData);
                downloads.forEach((download) => {
                    this.downloads.set(download.id, download);
                });
            }
            logger_1.logger.info({
                msg: 'model_manager_initialized',
                modelsCount: this.models.size,
                downloadsCount: this.downloads.size,
                path: this.modelsPath
            });
        }
        catch (error) {
            logger_1.logger.error({ msg: 'model_manager_init_failed', error: error.message });
            throw error;
        }
    }
    saveMetadata() {
        try {
            const metadata = Array.from(this.models.values());
            fs_1.default.writeFileSync(this.metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
        }
        catch (error) {
            logger_1.logger.error({ msg: 'metadata_save_failed', error: error.message });
            throw error;
        }
    }
    saveDownloads() {
        try {
            const downloads = Array.from(this.downloads.values());
            fs_1.default.writeFileSync(this.downloadsPath, JSON.stringify(downloads, null, 2), 'utf-8');
        }
        catch (error) {
            logger_1.logger.error({ msg: 'downloads_save_failed', error: error.message });
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
    getFileSize(filePath) {
        try {
            return fs_1.default.statSync(filePath).size;
        }
        catch {
            return 0;
        }
    }
    // Model Management Methods
    async addModel(filePath, metadata) {
        try {
            if (!fs_1.default.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }
            const size = this.getFileSize(filePath);
            const checksum = this.calculateChecksum(filePath);
            // Generate unique ID
            const id = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            // Copy file to models directory
            const fileName = `${id}_${metadata.name.replace(/[^a-zA-Z0-9]/g, '_')}.${metadata.framework}`;
            const targetPath = path_1.default.join(this.modelsPath, fileName);
            fs_1.default.copyFileSync(filePath, targetPath);
            const model = {
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
            logger_1.logger.info({ msg: 'model_added', id, name: metadata.name });
            return model;
        }
        catch (error) {
            logger_1.logger.error({ msg: 'model_add_failed', error: error.message });
            throw error;
        }
    }
    getModel(id) {
        return this.models.get(id) || null;
    }
    getAllModels() {
        return Array.from(this.models.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    getModelsByType(type) {
        return Array.from(this.models.values())
            .filter(model => model.type === type)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    getModelsByLanguage(language) {
        return Array.from(this.models.values())
            .filter(model => model.language === language)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    getModelsByFramework(framework) {
        return Array.from(this.models.values())
            .filter(model => model.framework === framework)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    searchModels(query) {
        const lowercaseQuery = query.toLowerCase();
        return Array.from(this.models.values())
            .filter(model => model.name.toLowerCase().includes(lowercaseQuery) ||
            model.description.toLowerCase().includes(lowercaseQuery) ||
            model.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    updateModel(id, updates) {
        const model = this.models.get(id);
        if (!model)
            return null;
        const updatedModel = {
            ...model,
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.models.set(id, updatedModel);
        this.saveMetadata();
        logger_1.logger.info({ msg: 'model_updated', id });
        return updatedModel;
    }
    deleteModel(id) {
        const model = this.models.get(id);
        if (!model)
            return false;
        try {
            // Delete the file
            if (fs_1.default.existsSync(model.filePath)) {
                fs_1.default.unlinkSync(model.filePath);
            }
            // Delete config file if exists
            if (model.configPath && fs_1.default.existsSync(model.configPath)) {
                fs_1.default.unlinkSync(model.configPath);
            }
            // Delete vocab file if exists
            if (model.vocabPath && fs_1.default.existsSync(model.vocabPath)) {
                fs_1.default.unlinkSync(model.vocabPath);
            }
            // Remove from metadata
            this.models.delete(id);
            this.saveMetadata();
            logger_1.logger.info({ msg: 'model_deleted', id });
            return true;
        }
        catch (error) {
            logger_1.logger.error({ msg: 'model_delete_failed', error: error.message });
            return false;
        }
    }
    // Model Download Management
    async startDownload(modelId, source, url) {
        const downloadId = `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const download = {
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
        logger_1.logger.info({ msg: 'download_started', downloadId, modelId });
        return download;
    }
    async processDownload(downloadId) {
        const download = this.downloads.get(downloadId);
        if (!download)
            return;
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
            const filePath = path_1.default.join(this.modelsPath, fileName);
            // Create a dummy file for simulation
            fs_1.default.writeFileSync(filePath, `Downloaded model: ${download.modelId}`);
            download.status = 'completed';
            download.progress = 100;
            download.completedAt = new Date().toISOString();
            download.filePath = filePath;
            this.saveDownloads();
            logger_1.logger.info({ msg: 'download_completed', downloadId });
        }
        catch (error) {
            download.status = 'failed';
            download.error = error.message;
            this.saveDownloads();
            logger_1.logger.error({ msg: 'download_failed', downloadId, error: error.message });
        }
    }
    getDownload(downloadId) {
        return this.downloads.get(downloadId) || null;
    }
    getAllDownloads() {
        return Array.from(this.downloads.values()).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    }
    cancelDownload(downloadId) {
        const download = this.downloads.get(downloadId);
        if (!download || download.status === 'completed')
            return false;
        download.status = 'failed';
        download.error = 'Download cancelled by user';
        this.saveDownloads();
        logger_1.logger.info({ msg: 'download_cancelled', downloadId });
        return true;
    }
    // Model Versioning
    createVersion(id, version, changes) {
        const model = this.models.get(id);
        if (!model)
            return null;
        try {
            const versionPath = path_1.default.join(this.modelsPath, 'versions', `${id}_v${version}.${model.framework}`);
            // Ensure versions directory exists
            const versionsDir = path_1.default.dirname(versionPath);
            if (!fs_1.default.existsSync(versionsDir)) {
                fs_1.default.mkdirSync(versionsDir, { recursive: true });
            }
            // Copy current file to version
            fs_1.default.copyFileSync(model.filePath, versionPath);
            const modelVersion = {
                version,
                filePath: versionPath,
                size: this.getFileSize(versionPath),
                checksum: this.calculateChecksum(versionPath),
                createdAt: new Date().toISOString(),
                changes,
                metrics: model.metrics
            };
            logger_1.logger.info({ msg: 'model_version_created', id, version });
            return modelVersion;
        }
        catch (error) {
            logger_1.logger.error({ msg: 'model_version_failed', error: error.message });
            return null;
        }
    }
    // Statistics
    getStats() {
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
    exportModel(id, targetPath) {
        const model = this.models.get(id);
        if (!model)
            return false;
        try {
            fs_1.default.copyFileSync(model.filePath, targetPath);
            logger_1.logger.info({ msg: 'model_exported', id, targetPath });
            return true;
        }
        catch (error) {
            logger_1.logger.error({ msg: 'model_export_failed', error: error.message });
            return false;
        }
    }
    // Validation
    validateModel(id) {
        const model = this.models.get(id);
        if (!model) {
            return { valid: false, errors: ['Model not found'] };
        }
        const errors = [];
        // Check if file exists
        if (!fs_1.default.existsSync(model.filePath)) {
            errors.push('Model file not found');
        }
        // Check checksum
        if (fs_1.default.existsSync(model.filePath)) {
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
exports.modelManager = new ModelManager();
exports.default = exports.modelManager;
//# sourceMappingURL=modelManager.js.map