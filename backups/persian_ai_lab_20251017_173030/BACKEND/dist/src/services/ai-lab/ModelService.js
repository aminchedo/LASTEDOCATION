"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelService = void 0;
const tf = __importStar(require("@tensorflow/tfjs-node-gpu"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const archiver_1 = __importDefault(require("archiver"));
const unzipper_1 = __importDefault(require("unzipper"));
const uuid_1 = require("uuid");
const logger_1 = require("../../config/logger");
class ModelService {
    constructor() {
        this.models = new Map();
        this.loadedModels = new Map();
        this.storageBasePath = path_1.default.join(process.cwd(), 'storage', 'ai-lab', 'models');
        this.initializeStorage();
    }
    async initializeStorage() {
        await fs_extra_1.default.ensureDir(this.storageBasePath);
    }
    async exportModel(modelId, userId) {
        try {
            const modelPath = path_1.default.join(this.storageBasePath, userId, modelId);
            if (!await fs_extra_1.default.pathExists(modelPath)) {
                throw new Error('Model not found');
            }
            // Create temporary zip file
            const zipPath = path_1.default.join(process.cwd(), 'temp', `${modelId}-export.zip`);
            await fs_extra_1.default.ensureDir(path_1.default.dirname(zipPath));
            // Create zip archive
            const output = fs_extra_1.default.createWriteStream(zipPath);
            const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
            return new Promise((resolve, reject) => {
                output.on('close', () => {
                    logger_1.logger.info(`Model ${modelId} exported: ${archive.pointer()} bytes`);
                    resolve(zipPath);
                });
                archive.on('error', (err) => {
                    reject(err);
                });
                archive.pipe(output);
                // Add model files to archive
                archive.directory(modelPath, false);
                archive.finalize();
            });
        }
        catch (error) {
            logger_1.logger.error(`Failed to export model ${modelId}:`, error);
            throw error;
        }
    }
    async importModel(info) {
        const modelId = (0, uuid_1.v4)();
        const tempPath = info.filePath;
        try {
            const modelPath = path_1.default.join(this.storageBasePath, info.userId, modelId);
            await fs_extra_1.default.ensureDir(modelPath);
            // Extract zip file
            await fs_extra_1.default.createReadStream(tempPath)
                .pipe(unzipper_1.default.Extract({ path: modelPath }))
                .promise();
            // Verify model files exist
            const modelJsonPath = path_1.default.join(modelPath, 'model.json');
            if (!await fs_extra_1.default.pathExists(modelJsonPath)) {
                throw new Error('Invalid model archive: model.json not found');
            }
            // Load metadata if exists
            let metadata = {
                id: modelId,
                userId: info.userId,
                name: info.name,
                type: info.type,
                createdAt: new Date()
            };
            const metadataPath = path_1.default.join(modelPath, 'metadata.json');
            if (await fs_extra_1.default.pathExists(metadataPath)) {
                const savedMetadata = await fs_extra_1.default.readJson(metadataPath);
                metadata = { ...savedMetadata, ...metadata };
            }
            else {
                // Save new metadata
                await fs_extra_1.default.writeJson(metadataPath, metadata, { spaces: 2 });
            }
            // Create model object
            const model = {
                ...metadata,
                path: modelPath,
                status: 'ready'
            };
            // Cache model
            this.models.set(modelId, model);
            // Clean up temp file
            await fs_extra_1.default.unlink(tempPath);
            logger_1.logger.info(`Model ${modelId} imported successfully`);
            return model;
        }
        catch (error) {
            logger_1.logger.error('Failed to import model:', error);
            // Clean up on error
            await fs_extra_1.default.unlink(tempPath).catch(() => { });
            throw new Error(`Failed to import model: ${error.message}`);
        }
    }
    async listModels(userId) {
        const userModelsPath = path_1.default.join(this.storageBasePath, userId);
        try {
            if (!await fs_extra_1.default.pathExists(userModelsPath)) {
                return [];
            }
            const modelDirs = await fs_extra_1.default.readdir(userModelsPath);
            const models = [];
            for (const dir of modelDirs) {
                const metadataPath = path_1.default.join(userModelsPath, dir, 'metadata.json');
                if (await fs_extra_1.default.pathExists(metadataPath)) {
                    const metadata = await fs_extra_1.default.readJson(metadataPath);
                    models.push({
                        ...metadata,
                        path: path_1.default.join(userModelsPath, dir),
                        status: 'ready'
                    });
                }
            }
            return models.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        catch (error) {
            logger_1.logger.error('Failed to list models:', error);
            return [];
        }
    }
    async loadModel(modelId, userId) {
        // Check if already loaded
        if (this.loadedModels.has(modelId)) {
            return this.loadedModels.get(modelId);
        }
        try {
            const modelPath = path_1.default.join(this.storageBasePath, userId, modelId, 'model.json');
            if (!await fs_extra_1.default.pathExists(modelPath)) {
                throw new Error('Model not found');
            }
            // Load the model
            const model = await tf.loadLayersModel(`file://${path_1.default.dirname(modelPath)}/model.json`);
            // Cache loaded model
            this.loadedModels.set(modelId, model);
            logger_1.logger.info(`Model ${modelId} loaded successfully`);
            return model;
        }
        catch (error) {
            logger_1.logger.error(`Failed to load model ${modelId}:`, error);
            throw new Error(`Failed to load model: ${error.message}`);
        }
    }
    async runInference(modelId, input, userId) {
        try {
            // Load model
            const model = await this.loadModel(modelId, userId);
            // Prepare input based on model type
            let inputTensor;
            if (typeof input === 'string') {
                // For text models, tokenize and convert to tensor
                // This is a simplified example - real implementation would use proper tokenization
                const tokens = input.split(' ').map(word => word.charCodeAt(0) % 1000);
                inputTensor = tf.tensor2d([tokens], [1, tokens.length]);
            }
            else if (Array.isArray(input)) {
                inputTensor = tf.tensor2d([input]);
            }
            else {
                inputTensor = tf.tensor(input);
            }
            // Run inference
            const prediction = model.predict(inputTensor);
            // Convert output to array
            const result = await prediction.array();
            // Clean up tensors
            inputTensor.dispose();
            prediction.dispose();
            return {
                prediction: result,
                shape: prediction.shape,
                dtype: prediction.dtype
            };
        }
        catch (error) {
            logger_1.logger.error(`Failed to run inference on model ${modelId}:`, error);
            throw new Error(`Inference failed: ${error.message}`);
        }
    }
    async deleteModel(modelId, userId) {
        try {
            const modelPath = path_1.default.join(this.storageBasePath, userId, modelId);
            if (await fs_extra_1.default.pathExists(modelPath)) {
                // Remove from cache
                this.models.delete(modelId);
                this.loadedModels.delete(modelId);
                // Delete files
                await fs_extra_1.default.remove(modelPath);
                return true;
            }
            return false;
        }
        catch (error) {
            logger_1.logger.error(`Failed to delete model ${modelId}:`, error);
            return false;
        }
    }
    async getModelInfo(modelId, userId) {
        // Check cache first
        if (this.models.has(modelId)) {
            return this.models.get(modelId);
        }
        try {
            const metadataPath = path_1.default.join(this.storageBasePath, userId, modelId, 'metadata.json');
            if (await fs_extra_1.default.pathExists(metadataPath)) {
                const metadata = await fs_extra_1.default.readJson(metadataPath);
                const model = {
                    ...metadata,
                    path: path_1.default.join(this.storageBasePath, userId, modelId),
                    status: 'ready'
                };
                // Cache it
                this.models.set(modelId, model);
                return model;
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error(`Failed to get model info for ${modelId}:`, error);
            return null;
        }
    }
    async unloadModel(modelId) {
        if (this.loadedModels.has(modelId)) {
            const model = this.loadedModels.get(modelId);
            model.dispose();
            this.loadedModels.delete(modelId);
            logger_1.logger.info(`Model ${modelId} unloaded`);
        }
    }
    async unloadAllModels() {
        for (const [modelId, model] of this.loadedModels) {
            model.dispose();
            logger_1.logger.info(`Model ${modelId} unloaded`);
        }
        this.loadedModels.clear();
    }
}
exports.ModelService = ModelService;
//# sourceMappingURL=ModelService.js.map