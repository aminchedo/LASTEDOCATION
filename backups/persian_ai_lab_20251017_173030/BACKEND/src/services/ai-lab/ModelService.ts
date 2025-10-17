import * as tf from '@tensorflow/tfjs-node-gpu';
import path from 'path';
import fs from 'fs-extra';
import archiver from 'archiver';
import unzipper from 'unzipper';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../config/logger';
import { Model, ModelInfo } from '../../types/ai-lab';

export class ModelService {
  private storageBasePath: string;
  private models: Map<string, Model> = new Map();
  private loadedModels: Map<string, tf.LayersModel> = new Map();

  constructor() {
    this.storageBasePath = path.join(process.cwd(), 'storage', 'ai-lab', 'models');
    this.initializeStorage();
  }

  private async initializeStorage() {
    await fs.ensureDir(this.storageBasePath);
  }

  async exportModel(modelId: string, userId: string): Promise<string> {
    try {
      const modelPath = path.join(this.storageBasePath, userId, modelId);
      
      if (!await fs.pathExists(modelPath)) {
        throw new Error('Model not found');
      }

      // Create temporary zip file
      const zipPath = path.join(process.cwd(), 'temp', `${modelId}-export.zip`);
      await fs.ensureDir(path.dirname(zipPath));

      // Create zip archive
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      return new Promise((resolve, reject) => {
        output.on('close', () => {
          logger.info(`Model ${modelId} exported: ${archive.pointer()} bytes`);
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
    } catch (error: any) {
      logger.error(`Failed to export model ${modelId}:`, error);
      throw error;
    }
  }

  async importModel(info: ModelInfo): Promise<Model> {
    const modelId = uuidv4();
    const tempPath = info.filePath;

    try {
      const modelPath = path.join(this.storageBasePath, info.userId, modelId);
      await fs.ensureDir(modelPath);

      // Extract zip file
      await fs.createReadStream(tempPath)
        .pipe(unzipper.Extract({ path: modelPath }))
        .promise();

      // Verify model files exist
      const modelJsonPath = path.join(modelPath, 'model.json');
      if (!await fs.pathExists(modelJsonPath)) {
        throw new Error('Invalid model archive: model.json not found');
      }

      // Load metadata if exists
      let metadata: any = {
        id: modelId,
        userId: info.userId,
        name: info.name,
        type: info.type,
        createdAt: new Date()
      };

      const metadataPath = path.join(modelPath, 'metadata.json');
      if (await fs.pathExists(metadataPath)) {
        const savedMetadata = await fs.readJson(metadataPath);
        metadata = { ...savedMetadata, ...metadata };
      } else {
        // Save new metadata
        await fs.writeJson(metadataPath, metadata, { spaces: 2 });
      }

      // Create model object
      const model: Model = {
        ...metadata,
        path: modelPath,
        status: 'ready'
      };

      // Cache model
      this.models.set(modelId, model);

      // Clean up temp file
      await fs.unlink(tempPath);

      logger.info(`Model ${modelId} imported successfully`);
      return model;

    } catch (error: any) {
      logger.error('Failed to import model:', error);
      // Clean up on error
      await fs.unlink(tempPath).catch(() => {});
      throw new Error(`Failed to import model: ${error.message}`);
    }
  }

  async listModels(userId: string): Promise<Model[]> {
    const userModelsPath = path.join(this.storageBasePath, userId);

    try {
      if (!await fs.pathExists(userModelsPath)) {
        return [];
      }

      const modelDirs = await fs.readdir(userModelsPath);
      const models: Model[] = [];

      for (const dir of modelDirs) {
        const metadataPath = path.join(userModelsPath, dir, 'metadata.json');
        if (await fs.pathExists(metadataPath)) {
          const metadata = await fs.readJson(metadataPath);
          models.push({
            ...metadata,
            path: path.join(userModelsPath, dir),
            status: 'ready'
          });
        }
      }

      return models.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      logger.error('Failed to list models:', error);
      return [];
    }
  }

  async loadModel(modelId: string, userId: string): Promise<tf.LayersModel> {
    // Check if already loaded
    if (this.loadedModels.has(modelId)) {
      return this.loadedModels.get(modelId)!;
    }

    try {
      const modelPath = path.join(this.storageBasePath, userId, modelId, 'model.json');
      
      if (!await fs.pathExists(modelPath)) {
        throw new Error('Model not found');
      }

      // Load the model
      const model = await tf.loadLayersModel(`file://${path.dirname(modelPath)}/model.json`);
      
      // Cache loaded model
      this.loadedModels.set(modelId, model);

      logger.info(`Model ${modelId} loaded successfully`);
      return model;

    } catch (error: any) {
      logger.error(`Failed to load model ${modelId}:`, error);
      throw new Error(`Failed to load model: ${error.message}`);
    }
  }

  async runInference(modelId: string, input: any, userId: string): Promise<any> {
    try {
      // Load model
      const model = await this.loadModel(modelId, userId);
      
      // Prepare input based on model type
      let inputTensor: tf.Tensor;
      
      if (typeof input === 'string') {
        // For text models, tokenize and convert to tensor
        // This is a simplified example - real implementation would use proper tokenization
        const tokens = input.split(' ').map(word => word.charCodeAt(0) % 1000);
        inputTensor = tf.tensor2d([tokens], [1, tokens.length]);
      } else if (Array.isArray(input)) {
        inputTensor = tf.tensor2d([input]);
      } else {
        inputTensor = tf.tensor(input);
      }

      // Run inference
      const prediction = model.predict(inputTensor) as tf.Tensor;
      
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

    } catch (error: any) {
      logger.error(`Failed to run inference on model ${modelId}:`, error);
      throw new Error(`Inference failed: ${error.message}`);
    }
  }

  async deleteModel(modelId: string, userId: string): Promise<boolean> {
    try {
      const modelPath = path.join(this.storageBasePath, userId, modelId);
      
      if (await fs.pathExists(modelPath)) {
        // Remove from cache
        this.models.delete(modelId);
        this.loadedModels.delete(modelId);
        
        // Delete files
        await fs.remove(modelPath);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error(`Failed to delete model ${modelId}:`, error);
      return false;
    }
  }

  async getModelInfo(modelId: string, userId: string): Promise<Model | null> {
    // Check cache first
    if (this.models.has(modelId)) {
      return this.models.get(modelId)!;
    }

    try {
      const metadataPath = path.join(this.storageBasePath, userId, modelId, 'metadata.json');
      
      if (await fs.pathExists(metadataPath)) {
        const metadata = await fs.readJson(metadataPath);
        const model: Model = {
          ...metadata,
          path: path.join(this.storageBasePath, userId, modelId),
          status: 'ready'
        };
        
        // Cache it
        this.models.set(modelId, model);
        
        return model;
      }
      
      return null;
    } catch (error) {
      logger.error(`Failed to get model info for ${modelId}:`, error);
      return null;
    }
  }

  async unloadModel(modelId: string): Promise<void> {
    if (this.loadedModels.has(modelId)) {
      const model = this.loadedModels.get(modelId)!;
      model.dispose();
      this.loadedModels.delete(modelId);
      logger.info(`Model ${modelId} unloaded`);
    }
  }

  async unloadAllModels(): Promise<void> {
    for (const [modelId, model] of this.loadedModels) {
      model.dispose();
      logger.info(`Model ${modelId} unloaded`);
    }
    this.loadedModels.clear();
  }
}