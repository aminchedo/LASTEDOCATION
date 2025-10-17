import * as tf from '@tensorflow/tfjs-node-gpu';
export declare class ModelArchitectureFactory {
    static createModel(architecture: string, modelType: string, config: any): Promise<tf.LayersModel>;
    private static createTransformerModel;
    private static createLSTMModel;
    private static createCNNModel;
    private static createGRUModel;
    private static createBERTLikeModel;
    private static createCustomModel;
}
//# sourceMappingURL=ModelArchitectureFactory.d.ts.map