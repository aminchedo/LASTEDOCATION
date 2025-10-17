export interface DetectedModel {
    id: string;
    name: string;
    type: 'model' | 'tts' | 'dataset' | 'unknown';
    modelFormat: 'onnx' | 'pytorch' | 'tensorflow' | 'safetensors' | 'ggml' | 'gguf' | 'bin' | 'unknown';
    path: string;
    size: number;
    files: string[];
    configFile?: string;
    description?: string;
    architecture?: string;
    language?: string[];
    lastModified: Date;
    metadata?: Record<string, any>;
    isTrainedModel: boolean;
    baseModel?: string;
    trainingInfo?: {
        epochs?: number;
        steps?: number;
        learningRate?: number;
        batchSize?: number;
        lossFunction?: string;
        optimizer?: string;
        trainedOn?: string[];
        trainingDate?: Date;
        checkpoints?: string[];
        bestCheckpoint?: string;
        metrics?: {
            finalLoss?: number;
            finalAccuracy?: number;
            bestLoss?: number;
            bestAccuracy?: number;
        };
    };
    tags?: string[];
    domain?: string;
    license?: string;
    compatibility?: string[];
}
export interface ModelScanOptions {
    folders: string[];
    maxDepth?: number;
    includeHidden?: boolean;
    minSizeBytes?: number;
}
export declare class ModelDetectionService {
    private readonly supportedModelExtensions;
    private readonly configFileNames;
    private readonly ttsIndicators;
    private readonly datasetIndicators;
    private readonly trainedModelIndicators;
    private readonly checkpointFiles;
    /**
     * Scan directories for models
     */
    scanForModels(options: ModelScanOptions): Promise<DetectedModel[]>;
    /**
     * Recursively scan a directory for models
     */
    private scanDirectory;
    /**
     * Analyze a directory to determine if it contains a model
     */
    private analyzeDirectory;
    /**
     * Check if a file is a model file
     */
    private isModelFile;
    /**
     * Check if a file is a configuration file
     */
    private isConfigFile;
    /**
     * Detect model type based on directory name and files
     */
    private detectModelType;
    /**
     * Detect model format based on file extensions
     */
    private detectModelFormat;
    /**
     * Extract metadata from configuration files
     */
    private extractMetadata;
    /**
     * Remove duplicate models based on path
     */
    private removeDuplicates;
    /**
     * Detect if a directory contains a trained model
     */
    private detectTrainedModel;
    /**
     * Extract training information from model directory
     */
    private extractTrainingInfo;
    /**
     * Extract tags from directory path and metadata
     */
    private extractTags;
    /**
     * Detect domain/category of the model
     */
    private detectDomain;
    /**
     * Detect model compatibility/framework support
     */
    private detectCompatibility;
    /**
     * Get default model directories to scan
     */
    static getDefaultModelDirectories(): string[];
}
//# sourceMappingURL=modelDetection.d.ts.map