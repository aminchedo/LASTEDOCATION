import { OptimizationJob, HyperparameterConfig, ModelComparison, PruningConfig, QuantizationConfig, OptimizationMetrics } from '../types/optimization';
export declare function startOptimizationJob(name: string, baseModelPath: string, datasetPath: string, outputDir: string, config: HyperparameterConfig, strategy?: 'grid' | 'random' | 'bayesian', maxTrials?: number): Promise<OptimizationJob>;
export declare function getOptimizationJob(jobId: string): OptimizationJob | null;
export declare function getAllOptimizationJobs(): OptimizationJob[];
export declare function cancelOptimizationJob(jobId: string): boolean;
export declare function createModelComparison(name: string, modelPaths: string[], testDataset: string, comparisonMetrics: string[]): Promise<ModelComparison>;
export declare function pruneModel(modelPath: string, outputPath: string, config: PruningConfig): Promise<{
    success: boolean;
    message: string;
    newSize?: number;
}>;
export declare function quantizeModel(modelPath: string, outputPath: string, config: QuantizationConfig): Promise<{
    success: boolean;
    message: string;
    newSize?: number;
}>;
export declare function getOptimizationMetrics(): OptimizationMetrics;
//# sourceMappingURL=optimization.d.ts.map