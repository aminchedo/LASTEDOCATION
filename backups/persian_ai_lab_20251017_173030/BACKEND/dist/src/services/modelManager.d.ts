/**
 * Model Management Service
 * Handles model storage, versioning, and metadata management
 */
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
declare class ModelManager {
    private modelsPath;
    private metadataPath;
    private downloadsPath;
    private models;
    private downloads;
    constructor();
    private initialize;
    private saveMetadata;
    private saveDownloads;
    private calculateChecksum;
    private getFileSize;
    addModel(filePath: string, metadata: Omit<ModelMetadata, 'id' | 'filePath' | 'checksum' | 'createdAt' | 'updatedAt' | 'size'>): Promise<ModelMetadata>;
    getModel(id: string): ModelMetadata | null;
    getAllModels(): ModelMetadata[];
    getModelsByType(type: ModelMetadata['type']): ModelMetadata[];
    getModelsByLanguage(language: string): ModelMetadata[];
    getModelsByFramework(framework: ModelMetadata['framework']): ModelMetadata[];
    searchModels(query: string): ModelMetadata[];
    updateModel(id: string, updates: Partial<ModelMetadata>): ModelMetadata | null;
    deleteModel(id: string): boolean;
    startDownload(modelId: string, source: string, url: string): Promise<ModelDownload>;
    private processDownload;
    getDownload(downloadId: string): ModelDownload | null;
    getAllDownloads(): ModelDownload[];
    cancelDownload(downloadId: string): boolean;
    createVersion(id: string, version: string, changes: string): ModelVersion | null;
    getStats(): {
        totalModels: number;
        totalSize: number;
        types: string[];
        frameworks: string[];
        languages: string[];
        tags: string[];
        activeDownloads: number;
    };
    exportModel(id: string, targetPath: string): boolean;
    validateModel(id: string): {
        valid: boolean;
        errors: string[];
    };
}
export declare const modelManager: ModelManager;
export default modelManager;
//# sourceMappingURL=modelManager.d.ts.map