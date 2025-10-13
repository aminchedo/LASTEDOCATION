"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hfService = exports.HuggingFaceService = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const promises_1 = require("stream/promises");
const logger_1 = require("../middleware/logger");
class HuggingFaceService {
    constructor() {
        this.baseUrl = 'https://huggingface.co';
        this.apiUrl = 'https://huggingface.co/api';
    }
    /**
     * Validate HuggingFace token
     */
    async validateToken(token) {
        try {
            const response = await (0, node_fetch_1.default)(`${this.apiUrl}/whoami`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                return {
                    valid: true,
                    username: data.name,
                    type: data.type,
                    data
                };
            }
            return { valid: false };
        }
        catch (error) {
            logger_1.logger.error({ msg: 'token_validation_failed', error: error.message });
            return { valid: false };
        }
    }
    /**
     * Search models on HuggingFace Hub
     */
    async searchModels(query, filter, token) {
        try {
            let url = `${this.apiUrl}/models?search=${encodeURIComponent(query)}&limit=50`;
            if (filter?.task) {
                url += `&filter=pipeline_tag:${filter.task}`;
            }
            if (filter?.library) {
                url += `&filter=library:${filter.library}`;
            }
            if (filter?.language) {
                url += `&filter=language:${filter.language}`;
            }
            if (filter?.sort) {
                url += `&sort=${filter.sort}`;
            }
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await (0, node_fetch_1.default)(url, { headers });
            if (!response.ok) {
                throw new Error(`HF API error: ${response.status} ${response.statusText}`);
            }
            const models = await response.json();
            logger_1.logger.info({
                msg: 'models_searched',
                query,
                count: models.length
            });
            return models;
        }
        catch (error) {
            logger_1.logger.error({
                msg: 'model_search_failed',
                query,
                error: error.message
            });
            throw error;
        }
    }
    /**
     * Get model information
     */
    async getModelInfo(repoId, token) {
        try {
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await (0, node_fetch_1.default)(`${this.apiUrl}/models/${repoId}`, { headers });
            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`Failed to get model info: ${response.status}`);
            }
            const model = await response.json();
            return model;
        }
        catch (error) {
            logger_1.logger.error({
                msg: 'get_model_info_failed',
                repoId,
                error: error.message
            });
            throw error;
        }
    }
    /**
     * Get list of files in a model repository
     */
    async getModelFiles(repoId, token) {
        try {
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await (0, node_fetch_1.default)(`${this.apiUrl}/models/${repoId}`, { headers });
            if (!response.ok) {
                throw new Error(`Failed to get model files: ${response.status}`);
            }
            const model = await response.json();
            const files = model.siblings || [];
            // Filter for relevant model files
            const relevantFiles = files.filter((f) => f.rfilename.match(/\.(bin|safetensors|json|txt|md|onnx|pb|h5|pt|pth)$/));
            logger_1.logger.info({
                msg: 'model_files_retrieved',
                repoId,
                totalFiles: files.length,
                relevantFiles: relevantFiles.length
            });
            return relevantFiles;
        }
        catch (error) {
            logger_1.logger.error({
                msg: 'get_model_files_failed',
                repoId,
                error: error.message
            });
            throw error;
        }
    }
    /**
     * Download a single file from HuggingFace
     */
    async downloadFile(repoId, filename, destination, token, onProgress) {
        try {
            const url = `${this.baseUrl}/${repoId}/resolve/main/${filename}`;
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            logger_1.logger.info({
                msg: 'starting_file_download',
                repoId,
                filename,
                destination
            });
            const response = await (0, node_fetch_1.default)(url, { headers });
            if (!response.ok) {
                throw new Error(`Download failed: ${response.status} ${response.statusText}`);
            }
            const totalSize = parseInt(response.headers.get('content-length') || '0');
            let downloadedSize = 0;
            await fs_extra_1.default.ensureDir(path_1.default.dirname(destination));
            const fileStream = (0, fs_1.createWriteStream)(destination);
            if (response.body) {
                response.body.on('data', (chunk) => {
                    downloadedSize += chunk.length;
                    if (onProgress && totalSize > 0) {
                        onProgress(downloadedSize, totalSize);
                    }
                });
                await (0, promises_1.pipeline)(response.body, fileStream);
            }
            logger_1.logger.info({
                msg: 'file_downloaded',
                filename,
                size: totalSize,
                sizeM: (totalSize / 1024 / 1024).toFixed(2)
            });
        }
        catch (error) {
            logger_1.logger.error({
                msg: 'file_download_failed',
                filename,
                error: error.message
            });
            throw error;
        }
    }
    /**
     * Download entire model repository
     */
    async downloadModel(repoId, destDir, token, onProgress) {
        try {
            logger_1.logger.info({
                msg: 'starting_model_download',
                repoId,
                destDir
            });
            // Get list of files
            const files = await this.getModelFiles(repoId, token);
            if (files.length === 0) {
                throw new Error('No files found in model repository');
            }
            logger_1.logger.info({
                msg: 'files_to_download',
                count: files.length,
                files: files.map(f => ({ name: f.rfilename, size: f.size }))
            });
            // Download each file
            let fileIndex = 0;
            for (const file of files) {
                fileIndex++;
                const destPath = path_1.default.join(destDir, file.rfilename);
                logger_1.logger.info({
                    msg: 'downloading_file',
                    file: file.rfilename,
                    index: fileIndex,
                    total: files.length
                });
                await this.downloadFile(repoId, file.rfilename, destPath, token, (downloaded, total) => {
                    if (onProgress) {
                        onProgress(file.rfilename, downloaded, total, fileIndex, files.length);
                    }
                });
            }
            logger_1.logger.info({
                msg: 'model_download_completed',
                repoId,
                filesDownloaded: files.length
            });
        }
        catch (error) {
            logger_1.logger.error({
                msg: 'model_download_failed',
                repoId,
                error: error.message
            });
            throw error;
        }
    }
    /**
     * Search for Persian TTS models
     */
    async searchPersianTTS(token) {
        return this.searchModels('persian tts', {
            task: 'text-to-speech',
            sort: 'downloads'
        }, token);
    }
    /**
     * Search for Persian STT models
     */
    async searchPersianSTT(token) {
        return this.searchModels('persian speech', {
            task: 'automatic-speech-recognition',
            sort: 'downloads'
        }, token);
    }
    /**
     * Search for Persian LLM models
     */
    async searchPersianLLM(token) {
        return this.searchModels('persian llm', {
            task: 'text-generation',
            sort: 'downloads'
        }, token);
    }
    /**
     * Get dataset information
     */
    async getDatasetInfo(datasetId, token) {
        try {
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await (0, node_fetch_1.default)(`${this.apiUrl}/datasets/${datasetId}`, { headers });
            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`Failed to get dataset info: ${response.status}`);
            }
            return await response.json();
        }
        catch (error) {
            logger_1.logger.error({
                msg: 'get_dataset_info_failed',
                datasetId,
                error: error.message
            });
            throw error;
        }
    }
    /**
     * Search datasets
     */
    async searchDatasets(query, token) {
        try {
            const url = `${this.apiUrl}/datasets?search=${encodeURIComponent(query)}&limit=50`;
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await (0, node_fetch_1.default)(url, { headers });
            if (!response.ok) {
                throw new Error(`HF API error: ${response.status}`);
            }
            const datasets = await response.json();
            return datasets;
        }
        catch (error) {
            logger_1.logger.error({
                msg: 'dataset_search_failed',
                query,
                error: error.message
            });
            throw error;
        }
    }
}
exports.HuggingFaceService = HuggingFaceService;
// Export singleton instance
exports.hfService = new HuggingFaceService();
//# sourceMappingURL=huggingface.service.js.map