import * as tf from '@tensorflow/tfjs-node-gpu';
import { Model, ModelInfo } from '../../types/ai-lab';
export declare class ModelService {
    private storageBasePath;
    private models;
    private loadedModels;
    constructor();
    private initializeStorage;
    exportModel(modelId: string, userId: string): Promise<string>;
    importModel(info: ModelInfo): Promise<Model>;
    listModels(userId: string): Promise<Model[]>;
    loadModel(modelId: string, userId: string): Promise<tf.LayersModel>;
    runInference(modelId: string, input: any, userId: string): Promise<any>;
    deleteModel(modelId: string, userId: string): Promise<boolean>;
    getModelInfo(modelId: string, userId: string): Promise<Model | null>;
    unloadModel(modelId: string): Promise<void>;
    unloadAllModels(): Promise<void>;
}
//# sourceMappingURL=ModelService.d.ts.map