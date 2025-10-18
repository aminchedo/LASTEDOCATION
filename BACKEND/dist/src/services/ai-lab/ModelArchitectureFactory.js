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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelArchitectureFactory = void 0;
const tf = __importStar(require("@tensorflow/tfjs-node-gpu"));
const logger_1 = require("../../config/logger");
class ModelArchitectureFactory {
    static async createModel(architecture, modelType, config) {
        logger_1.logger.info(`Creating model: ${architecture} for ${modelType}`);
        switch (architecture.toLowerCase()) {
            case 'transformer':
                return this.createTransformerModel(config);
            case 'lstm':
                return this.createLSTMModel(config);
            case 'cnn':
                return this.createCNNModel(config);
            case 'gru':
                return this.createGRUModel(config);
            case 'bert':
                return this.createBERTLikeModel(config);
            case 'custom':
                return this.createCustomModel(config);
            default:
                throw new Error(`Unsupported architecture: ${architecture}`);
        }
    }
    static createTransformerModel(config) {
        const { inputShape = [512], outputShape = [10], layers = 6, hiddenSize = 512, numHeads = 8, ffnSize = 2048, dropoutRate = 0.1 } = config;
        const input = tf.input({ shape: inputShape });
        // Embedding layer
        let x = tf.layers.dense({
            units: hiddenSize,
            activation: 'linear'
        }).apply(input);
        // Add positional encoding
        x = tf.layers.dropout({ rate: dropoutRate }).apply(x);
        // Transformer blocks
        for (let i = 0; i < layers; i++) {
            // Multi-head attention (simplified)
            const attentionOutput = tf.layers.dense({
                units: hiddenSize,
                activation: 'linear'
            }).apply(x);
            // Add & Norm
            x = tf.layers.add().apply([x, attentionOutput]);
            x = tf.layers.layerNormalization().apply(x);
            // Feed-forward network
            let ffn = tf.layers.dense({
                units: ffnSize,
                activation: 'relu'
            }).apply(x);
            ffn = tf.layers.dense({
                units: hiddenSize,
                activation: 'linear'
            }).apply(ffn);
            ffn = tf.layers.dropout({ rate: dropoutRate }).apply(ffn);
            // Add & Norm
            x = tf.layers.add().apply([x, ffn]);
            x = tf.layers.layerNormalization().apply(x);
        }
        // Output layer
        const output = tf.layers.dense({
            units: outputShape[0],
            activation: 'softmax'
        }).apply(x);
        return tf.model({ inputs: input, outputs: output });
    }
    static createLSTMModel(config) {
        const { inputShape = [100, 128], outputShape = [10], layers = 2, units = 128, dropoutRate = 0.2 } = config;
        const model = tf.sequential();
        // First LSTM layer
        model.add(tf.layers.lstm({
            units,
            returnSequences: layers > 1,
            inputShape
        }));
        model.add(tf.layers.dropout({ rate: dropoutRate }));
        // Additional LSTM layers
        for (let i = 1; i < layers; i++) {
            model.add(tf.layers.lstm({
                units,
                returnSequences: i < layers - 1
            }));
            model.add(tf.layers.dropout({ rate: dropoutRate }));
        }
        // Dense layers
        model.add(tf.layers.dense({
            units: units / 2,
            activation: 'relu'
        }));
        model.add(tf.layers.dropout({ rate: dropoutRate }));
        // Output layer
        model.add(tf.layers.dense({
            units: outputShape[0],
            activation: 'softmax'
        }));
        return model;
    }
    static createCNNModel(config) {
        const { inputShape = [224, 224, 3], outputShape = [10], layers = 4, filters = [32, 64, 128, 256], kernelSize = 3, dropoutRate = 0.25 } = config;
        const model = tf.sequential();
        // Convolutional layers
        for (let i = 0; i < layers; i++) {
            const numFilters = filters[i] || filters[filters.length - 1];
            model.add(tf.layers.conv2d({
                filters: numFilters,
                kernelSize,
                activation: 'relu',
                padding: 'same',
                inputShape: i === 0 ? inputShape : undefined
            }));
            model.add(tf.layers.batchNormalization());
            if (i % 2 === 1) {
                model.add(tf.layers.maxPooling2d({
                    poolSize: 2,
                    strides: 2
                }));
                model.add(tf.layers.dropout({ rate: dropoutRate }));
            }
        }
        // Flatten and dense layers
        model.add(tf.layers.globalAveragePooling2d({}));
        model.add(tf.layers.dense({
            units: 256,
            activation: 'relu'
        }));
        model.add(tf.layers.dropout({ rate: dropoutRate * 2 }));
        // Output layer
        model.add(tf.layers.dense({
            units: outputShape[0],
            activation: 'softmax'
        }));
        return model;
    }
    static createGRUModel(config) {
        const { inputShape = [100, 128], outputShape = [10], layers = 2, units = 128, dropoutRate = 0.2 } = config;
        const model = tf.sequential();
        // GRU layers
        for (let i = 0; i < layers; i++) {
            model.add(tf.layers.gru({
                units,
                returnSequences: i < layers - 1,
                inputShape: i === 0 ? inputShape : undefined,
                recurrentDropout: dropoutRate
            }));
            if (i < layers - 1) {
                model.add(tf.layers.dropout({ rate: dropoutRate }));
            }
        }
        // Dense layers
        model.add(tf.layers.dense({
            units: units / 2,
            activation: 'relu'
        }));
        model.add(tf.layers.dropout({ rate: dropoutRate }));
        // Output layer
        model.add(tf.layers.dense({
            units: outputShape[0],
            activation: 'softmax'
        }));
        return model;
    }
    static createBERTLikeModel(config) {
        const { vocabSize = 30000, maxLength = 512, embeddingSize = 768, numHeads = 12, numLayers = 12, hiddenSize = 3072, outputShape = [2], // For classification
        dropoutRate = 0.1 } = config;
        // Input layers
        const tokenInput = tf.input({ shape: [maxLength], dtype: 'int32' });
        const segmentInput = tf.input({ shape: [maxLength], dtype: 'int32' });
        const maskInput = tf.input({ shape: [maxLength], dtype: 'float32' });
        // Token embeddings
        const tokenEmbedding = tf.layers.embedding({
            inputDim: vocabSize,
            outputDim: embeddingSize,
            maskZero: true
        }).apply(tokenInput);
        // Segment embeddings
        const segmentEmbedding = tf.layers.embedding({
            inputDim: 2,
            outputDim: embeddingSize
        }).apply(segmentInput);
        // Position embeddings (learned)
        // Position embeddings are handled internally
        // Position embeddings would normally be added here
        // For simplicity, we'll skip them in this implementation
        // const positionEmbedding = tf.layers.embedding({
        //   inputDim: maxLength,
        //   outputDim: embeddingSize
        // });
        // Combine embeddings
        let embeddings = tf.layers.add().apply([
            tokenEmbedding,
            segmentEmbedding
        ]);
        embeddings = tf.layers.layerNormalization().apply(embeddings);
        embeddings = tf.layers.dropout({ rate: dropoutRate }).apply(embeddings);
        // Transformer encoder layers (simplified)
        let encoded = embeddings;
        for (let i = 0; i < numLayers; i++) {
            // Self-attention (simplified as dense layer)
            const attention = tf.layers.dense({
                units: embeddingSize
            }).apply(encoded);
            // Add & Norm
            encoded = tf.layers.add().apply([encoded, attention]);
            encoded = tf.layers.layerNormalization().apply(encoded);
            // Feed-forward
            let ffn = tf.layers.dense({
                units: hiddenSize,
                activation: 'gelu'
            }).apply(encoded);
            ffn = tf.layers.dense({
                units: embeddingSize
            }).apply(ffn);
            // Add & Norm
            encoded = tf.layers.add().apply([encoded, ffn]);
            encoded = tf.layers.layerNormalization().apply(encoded);
        }
        // Pooling (use global average pooling as a simpler alternative)
        const pooled = tf.layers.globalAveragePooling1d().apply(encoded);
        // Classification head
        const dense = tf.layers.dense({
            units: embeddingSize,
            activation: 'tanh'
        }).apply(pooled);
        const output = tf.layers.dense({
            units: outputShape[0],
            activation: 'softmax'
        }).apply(dense);
        return tf.model({
            inputs: [tokenInput, segmentInput, maskInput],
            outputs: output
        });
    }
    static createCustomModel(config) {
        const { layers: layerConfigs = [], inputShape = [10], outputShape = [1] } = config;
        if (layerConfigs.length === 0) {
            throw new Error('Custom model requires layer configurations');
        }
        const model = tf.sequential();
        layerConfigs.forEach((layerConfig, index) => {
            const { type, ...params } = layerConfig;
            // Add input shape to first layer
            if (index === 0 && !params.inputShape) {
                params.inputShape = inputShape;
            }
            switch (type) {
                case 'dense':
                    model.add(tf.layers.dense(params));
                    break;
                case 'conv2d':
                    model.add(tf.layers.conv2d(params));
                    break;
                case 'lstm':
                    model.add(tf.layers.lstm(params));
                    break;
                case 'dropout':
                    model.add(tf.layers.dropout(params));
                    break;
                case 'batchNormalization':
                    model.add(tf.layers.batchNormalization(params));
                    break;
                case 'flatten':
                    model.add(tf.layers.flatten(params));
                    break;
                case 'maxPooling2d':
                    model.add(tf.layers.maxPooling2d(params));
                    break;
                default:
                    throw new Error(`Unsupported layer type: ${type}`);
            }
        });
        // Add output layer if not already defined
        const lastLayer = layerConfigs[layerConfigs.length - 1];
        if (!lastLayer || lastLayer.type !== 'dense' || lastLayer.units !== outputShape[0]) {
            model.add(tf.layers.dense({
                units: outputShape[0],
                activation: 'softmax'
            }));
        }
        return model;
    }
}
exports.ModelArchitectureFactory = ModelArchitectureFactory;
//# sourceMappingURL=ModelArchitectureFactory.js.map