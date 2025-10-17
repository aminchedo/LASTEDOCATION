import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../middleware/logger';

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
  // Training-specific fields
  isTrainedModel: boolean;
  baseModel?: string;
  trainingInfo?: {
    epochs?: number;
    steps?: number;
    learningRate?: number;
    batchSize?: number;
    lossFunction?: string;
    optimizer?: string;
    trainedOn?: string[];  // datasets used for training
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
  // Dataset tags and labels
  tags?: string[];
  domain?: string;
  license?: string;
  compatibility?: string[];  // compatible model formats/frameworks
}

export interface ModelScanOptions {
    folders: string[];
    maxDepth?: number;
    includeHidden?: boolean;
    minSizeBytes?: number;
}

export class ModelDetectionService {
    private readonly supportedModelExtensions = [
        '.bin', '.pt', '.pth', '.onnx', '.pb', '.h5', '.tflite',
        '.safetensors', '.ggml', '.gguf', '.pickle', '.pkl'
    ];

    private readonly configFileNames = [
        'config.json', 'model_config.json', 'config.yaml', 'config.yml',
        'tokenizer_config.json', 'special_tokens_map.json',
        'vocab.txt', 'merges.txt', 'tokenizer.json'
    ];

    private readonly ttsIndicators = [
        'vits', 'tacotron', 'waveglow', 'melgan', 'hifigan',
        'tts', 'speech', 'voice', 'acoustic'
    ];

  private readonly datasetIndicators = [
    'dataset', 'data', 'corpus', 'train', 'test', 'val',
    'common_voice', 'librispeech'
  ];

  private readonly trainedModelIndicators = [
    'finetuned', 'trained', 'checkpoint', 'epoch', 'step',
    'fine-tuned', 'adapter', 'lora', 'output'
  ];

  private readonly checkpointFiles = [
    'pytorch_model.bin', 'model.safetensors', 'adapter_model.bin',
    'training_args.json', 'trainer_state.json', 'optimizer.pt',
    'scheduler.pt', 'rng_state.pth'
  ];

    /**
     * Scan directories for models
     */
    async scanForModels(options: ModelScanOptions): Promise<DetectedModel[]> {
        const models: DetectedModel[] = [];
        const maxDepth = options.maxDepth || 3;

        for (const folder of options.folders) {
            try {
                if (!fs.existsSync(folder)) {
                    logger.warn(`Model folder does not exist: ${folder}`);
                    continue;
                }

                const foundModels = await this.scanDirectory(
                    folder,
                    0,
                    maxDepth,
                    options.includeHidden || false,
                    options.minSizeBytes || 1024 * 1024 // 1MB minimum
                );

                models.push(...foundModels);
            } catch (error) {
                logger.error(`Error scanning folder ${folder}: ${error}`);
            }
        }

        // Remove duplicates and sort by name
        const uniqueModels = this.removeDuplicates(models);
        return uniqueModels.sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Recursively scan a directory for models
     */
    private async scanDirectory(
        dirPath: string,
        currentDepth: number,
        maxDepth: number,
        includeHidden: boolean,
        minSizeBytes: number
    ): Promise<DetectedModel[]> {
        const models: DetectedModel[] = [];

        if (currentDepth >= maxDepth) {
            return models;
        }

        try {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });

            // First, check if current directory is a model directory
            const currentDirModel = await this.analyzeDirectory(dirPath, includeHidden, minSizeBytes);
            if (currentDirModel) {
                models.push(currentDirModel);
                return models; // Don't scan subdirectories if parent is a model
            }

            // Scan subdirectories
            for (const entry of entries) {
                if (!entry.isDirectory()) continue;
                if (!includeHidden && entry.name.startsWith('.')) continue;

                const subPath = path.join(dirPath, entry.name);
                try {
                    const subModels = await this.scanDirectory(
                        subPath,
                        currentDepth + 1,
                        maxDepth,
                        includeHidden,
                        minSizeBytes
                    );
                    models.push(...subModels);
                } catch (error) {
                    logger.debug(`Error scanning subdirectory ${subPath}: ${error}`);
                }
            }
        } catch (error) {
            logger.debug(`Error reading directory ${dirPath}: ${error}`);
        }

        return models;
    }

    /**
     * Analyze a directory to determine if it contains a model
     */
    private async analyzeDirectory(
        dirPath: string,
        includeHidden: boolean,
        minSizeBytes: number
    ): Promise<DetectedModel | null> {
        try {
            const files = fs.readdirSync(dirPath);
            const modelFiles: string[] = [];
            const configFiles: string[] = [];
            let totalSize = 0;

            // Analyze files
            for (const file of files) {
                if (!includeHidden && file.startsWith('.')) continue;

                const filePath = path.join(dirPath, file);
                const stat = fs.statSync(filePath);

                if (stat.isFile()) {
                    totalSize += stat.size;

                    // Check for model files
                    if (this.isModelFile(file)) {
                        modelFiles.push(file);
                    }

                    // Check for config files
                    if (this.isConfigFile(file)) {
                        configFiles.push(file);
                    }
                }
            }

            // Require at least one model file and meet minimum size
            if (modelFiles.length === 0 || totalSize < minSizeBytes) {
                return null;
            }

      // Determine model type and format
      const modelType = this.detectModelType(dirPath, modelFiles, configFiles);
      const modelFormat = this.detectModelFormat(modelFiles);
      
      // Get metadata
      const metadata = await this.extractMetadata(dirPath, configFiles);
      
      // Detect if this is a trained model
      const isTrainedModel = this.detectTrainedModel(dirPath, files);
      const trainingInfo = isTrainedModel ? await this.extractTrainingInfo(dirPath) : undefined;
      
      // Extract tags and domain info
      const tags = this.extractTags(dirPath, metadata);
      const domain = this.detectDomain(dirPath, metadata);
      
      const dirName = path.basename(dirPath);
      const stat = fs.statSync(dirPath);

      return {
        id: `custom-${path.resolve(dirPath).replace(/[/\\]/g, '-')}`,
        name: metadata.name || dirName,
        type: modelType,
        modelFormat,
        path: dirPath,
        size: totalSize,
        files: [...modelFiles, ...configFiles],
        configFile: configFiles[0],
        description: metadata.description,
        architecture: metadata.architecture,
        language: metadata.language,
        lastModified: stat.mtime,
        metadata,
        isTrainedModel,
        baseModel: metadata.base_model || metadata._name_or_path,
        trainingInfo,
        tags,
        domain,
        license: metadata.license,
        compatibility: this.detectCompatibility(modelFormat, metadata)
      };
        } catch (error) {
            logger.debug(`Error analyzing directory ${dirPath}: ${error}`);
            return null;
        }
    }

    /**
     * Check if a file is a model file
     */
    private isModelFile(filename: string): boolean {
        const ext = path.extname(filename).toLowerCase();
        return this.supportedModelExtensions.includes(ext);
    }

    /**
     * Check if a file is a configuration file
     */
    private isConfigFile(filename: string): boolean {
        return this.configFileNames.some(name =>
            filename.toLowerCase().includes(name.toLowerCase())
        );
    }

    /**
     * Detect model type based on directory name and files
     */
    private detectModelType(dirPath: string, modelFiles: string[], configFiles: string[]): DetectedModel['type'] {
        const dirName = path.basename(dirPath).toLowerCase();
        const allFiles = [...modelFiles, ...configFiles].map(f => f.toLowerCase());

        // Check for TTS indicators
        if (this.ttsIndicators.some(indicator =>
            dirName.includes(indicator) ||
            allFiles.some(file => file.includes(indicator))
        )) {
            return 'tts';
        }

        // Check for dataset indicators  
        if (this.datasetIndicators.some(indicator =>
            dirName.includes(indicator) ||
            allFiles.some(file => file.includes(indicator))
        )) {
            return 'dataset';
        }

        // Default to model if we have model files
        if (modelFiles.length > 0) {
            return 'model';
        }

        return 'unknown';
    }

    /**
     * Detect model format based on file extensions
     */
    private detectModelFormat(modelFiles: string[]): DetectedModel['modelFormat'] {
        const extensions = modelFiles.map(f => path.extname(f).toLowerCase());

        if (extensions.includes('.onnx')) return 'onnx';
        if (extensions.includes('.safetensors')) return 'safetensors';
        if (extensions.some(ext => ['.pt', '.pth'].includes(ext))) return 'pytorch';
        if (extensions.some(ext => ['.pb', '.h5'].includes(ext))) return 'tensorflow';
        if (extensions.includes('.gguf')) return 'gguf';
        if (extensions.includes('.ggml')) return 'ggml';
        if (extensions.includes('.bin')) return 'bin';

        return 'unknown';
    }

    /**
     * Extract metadata from configuration files
     */
    private async extractMetadata(dirPath: string, configFiles: string[]): Promise<Record<string, any>> {
        const metadata: Record<string, any> = {};

        for (const configFile of configFiles) {
            try {
                const configPath = path.join(dirPath, configFile);
                const content = fs.readFileSync(configPath, 'utf8');

                if (configFile.endsWith('.json')) {
                    const json = JSON.parse(content);
                    Object.assign(metadata, json);
                }
                // Could add YAML parsing here if needed
            } catch (error) {
                logger.debug(`Error reading config file ${configFile}: ${error}`);
            }
        }

        return metadata;
    }

    /**
     * Remove duplicate models based on path
     */
    private removeDuplicates(models: DetectedModel[]): DetectedModel[] {
        const seen = new Set<string>();
        return models.filter(model => {
            if (seen.has(model.path)) {
                return false;
            }
            seen.add(model.path);
            return true;
        });
    }

  /**
   * Detect if a directory contains a trained model
   */
  private detectTrainedModel(dirPath: string, files: string[]): boolean {
    const dirName = path.basename(dirPath).toLowerCase();
    
    // Check directory name for training indicators
    const hasTrainingDirName = this.trainedModelIndicators.some(indicator => 
      dirName.includes(indicator)
    );
    
    // Check for checkpoint files
    const hasCheckpointFiles = files.some(file => 
      this.checkpointFiles.includes(file.toLowerCase())
    );
    
    // Check for training-related files
    const hasTrainingFiles = files.some(file => 
      file.toLowerCase().includes('training') || 
      file.toLowerCase().includes('checkpoint') ||
      file.toLowerCase().includes('epoch') ||
      file.toLowerCase().includes('step')
    );
    
    return hasTrainingDirName || hasCheckpointFiles || hasTrainingFiles;
  }

  /**
   * Extract training information from model directory
   */
  private async extractTrainingInfo(dirPath: string): Promise<DetectedModel['trainingInfo']> {
    const trainingInfo: NonNullable<DetectedModel['trainingInfo']> = {};
    
    try {
      // Look for training_args.json
      const trainingArgsPath = path.join(dirPath, 'training_args.json');
      if (fs.existsSync(trainingArgsPath)) {
        const trainingArgs = JSON.parse(fs.readFileSync(trainingArgsPath, 'utf8'));
        trainingInfo.epochs = trainingArgs.num_train_epochs;
        trainingInfo.learningRate = trainingArgs.learning_rate;
        trainingInfo.batchSize = trainingArgs.per_device_train_batch_size;
        trainingInfo.optimizer = trainingArgs.optim;
      }
      
      // Look for trainer_state.json
      const trainerStatePath = path.join(dirPath, 'trainer_state.json');
      if (fs.existsSync(trainerStatePath)) {
        const trainerState = JSON.parse(fs.readFileSync(trainerStatePath, 'utf8'));
        trainingInfo.steps = trainerState.global_step;
        trainingInfo.bestCheckpoint = trainerState.best_model_checkpoint;
        
        if (trainerState.log_history && trainerState.log_history.length > 0) {
          const logs = trainerState.log_history;
          const finalLog = logs[logs.length - 1];
          trainingInfo.metrics = {
            finalLoss: finalLog.train_loss,
            finalAccuracy: finalLog.eval_accuracy,
            bestLoss: Math.min(...logs.map((l: { train_loss?: number }) => l.train_loss || Infinity).filter((v: number) => v !== Infinity)),
            bestAccuracy: Math.max(...logs.map((l: { eval_accuracy?: number }) => l.eval_accuracy || -Infinity).filter((v: number) => v !== -Infinity))
          };
        }
      }
      
      // Look for checkpoint directories
      const files = fs.readdirSync(dirPath);
      const checkpoints = files.filter(file => {
        const fullPath = path.join(dirPath, file);
        return fs.statSync(fullPath).isDirectory() && 
               (file.includes('checkpoint') || file.includes('epoch'));
      });
      
      if (checkpoints.length > 0) {
        trainingInfo.checkpoints = checkpoints.sort();
      }
      
      // Extract training date from directory modification time
      const stat = fs.statSync(dirPath);
      trainingInfo.trainingDate = stat.mtime;
      
      return trainingInfo;
    } catch (error) {
      logger.debug(`Error extracting training info from ${dirPath}: ${error}`);
      return trainingInfo;
    }
  }

  /**
   * Extract tags from directory path and metadata
   */
  private extractTags(dirPath: string, metadata: Record<string, any>): string[] {
    const tags: string[] = [];
    const dirName = path.basename(dirPath).toLowerCase();
    
    // Add tags based on directory structure
    const pathParts = dirPath.toLowerCase().split(path.sep);
    
    if (pathParts.includes('finetuned') || pathParts.includes('fine-tuned')) {
      tags.push('fine-tuned');
    }
    
    if (pathParts.includes('lora') || dirName.includes('lora')) {
      tags.push('lora');
    }
    
    if (pathParts.includes('checkpoint') || dirName.includes('checkpoint')) {
      tags.push('checkpoint');
    }
    
    if (pathParts.includes('persian') || pathParts.includes('fa')) {
      tags.push('persian');
    }
    
    // Add tags from metadata
    if (metadata.tags && Array.isArray(metadata.tags)) {
      tags.push(...metadata.tags);
    }
    
    if (metadata.pipeline_tag) {
      tags.push(metadata.pipeline_tag);
    }
    
    return Array.from(new Set(tags));
  }

  /**
   * Detect domain/category of the model
   */
  private detectDomain(dirPath: string, metadata: Record<string, any>): string {
    const dirName = path.basename(dirPath).toLowerCase();
    
    // Check metadata first
    if (metadata.domain) return metadata.domain;
    if (metadata.pipeline_tag) return metadata.pipeline_tag;
    
    // Detect from directory name
    if (dirName.includes('chat') || dirName.includes('instruct')) return 'conversational';
    if (dirName.includes('qa') || dirName.includes('question')) return 'question-answering';
    if (dirName.includes('sentiment')) return 'sentiment-analysis';
    if (dirName.includes('classification')) return 'text-classification';
    if (dirName.includes('ner') || dirName.includes('entity')) return 'token-classification';
    if (dirName.includes('summarization') || dirName.includes('summary')) return 'summarization';
    if (dirName.includes('translation')) return 'translation';
    if (dirName.includes('generation') || dirName.includes('gpt')) return 'text-generation';
    
    return 'general';
  }

  /**
   * Detect model compatibility/framework support
   */
  private detectCompatibility(modelFormat: string, metadata: Record<string, any>): string[] {
    const compatibility: string[] = [];
    
    // Add format-specific compatibility
    switch (modelFormat) {
      case 'pytorch':
        compatibility.push('transformers', 'pytorch', 'python');
        break;
      case 'onnx':
        compatibility.push('onnxruntime', 'javascript', 'python', 'c++');
        break;
      case 'safetensors':
        compatibility.push('transformers', 'safetensors', 'python');
        break;
      case 'tensorflow':
        compatibility.push('tensorflow', 'python');
        break;
      case 'gguf':
        compatibility.push('llama.cpp', 'c++', 'python');
        break;
    }
    
    // Add architecture-specific compatibility
    if (metadata.architectures) {
      const arch = metadata.architectures[0]?.toLowerCase();
      if (arch?.includes('bert')) compatibility.push('bert', 'sentence-transformers');
      if (arch?.includes('gpt')) compatibility.push('gpt', 'causal-lm');
      if (arch?.includes('t5')) compatibility.push('t5', 'seq2seq');
    }
    
    return Array.from(new Set(compatibility));
  }

  /**
   * Get default model directories to scan
   */
  static getDefaultModelDirectories(): string[] {
        return [
            path.resolve('./models'),
            path.resolve('./datasets'),
            path.resolve('../models'),
            path.join(process.cwd(), 'models'),
            path.join(process.cwd(), 'datasets'),
            // Common model directories
            path.join(require('os').homedir(), '.cache/huggingface/transformers'),
            path.join(require('os').homedir(), '.cache/huggingface/hub'),
        ].filter(dir => {
            try {
                return fs.existsSync(dir);
            } catch {
                return false;
            }
        });
    }
}
