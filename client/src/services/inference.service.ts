import * as tf from '@tensorflow/tfjs';

export interface InferenceResult {
  text?: string;
  audioUrl?: string;
  predictions?: number[];
  confidence?: number;
  duration?: number;
}

export interface ModelInfo {
  path: string;
  inputShape: number[];
  outputShape: number[];
  type: 'classification' | 'regression' | 'tts' | 'stt';
}

export class InferenceService {
  private models = new Map<string, tf.GraphModel | tf.LayersModel>();
  private modelInfo = new Map<string, ModelInfo>();

  /**
   * Load a model from URL or path
   */
  async loadModel(
    modelPath: string,
    info?: ModelInfo
  ): Promise<void> {
    try {
      console.log(`Loading model: ${modelPath}`);
      
      let model: tf.GraphModel | tf.LayersModel;

      // Try to load as GraphModel first (TensorFlow SavedModel format)
      try {
        model = await tf.loadGraphModel(modelPath);
      } catch {
        // Fallback to LayersModel (Keras format)
        model = await tf.loadLayersModel(modelPath);
      }

      this.models.set(modelPath, model);

      if (info) {
        this.modelInfo.set(modelPath, info);
      }
      
      console.log(`✅ Model loaded successfully: ${modelPath}`);

      // Log model details
      if ('summary' in model) {
        console.log('Model summary:');
        model.summary();
      }
    } catch (error) {
      console.error(`❌ Failed to load model:`, error);
      throw error;
    }
  }

  /**
   * Run inference on input data
   */
  async runInference(
    modelPath: string,
    input: tf.Tensor | number[] | number[][]
  ): Promise<InferenceResult> {
    try {
      const model = this.models.get(modelPath);
      
      if (!model) {
        throw new Error(`Model not loaded: ${modelPath}`);
      }

      const startTime = performance.now();

      // Convert input to tensor if needed
      let inputTensor: tf.Tensor;
      if (input instanceof tf.Tensor) {
        inputTensor = input;
      } else {
        inputTensor = Array.isArray(input[0])
          ? tf.tensor2d(input as number[][])
          : tf.tensor1d(input as number[]);
      }

      // Add batch dimension if needed
      let processedInput = inputTensor;
      if (inputTensor.shape.length === 1) {
        processedInput = inputTensor.expandDims(0);
      }

      // Run prediction
      let output: tf.Tensor;
      if ('predict' in model) {
        output = model.predict(processedInput) as tf.Tensor;
      } else {
        output = model.execute(processedInput) as tf.Tensor;
      }

      // Get results
      const predictions = await output.data();
      const duration = performance.now() - startTime;

      // Calculate confidence (max probability for classification)
      const predArray = Array.from(predictions);
      const confidence = Math.max(...predArray);

      // Clean up tensors
      if (!(input instanceof tf.Tensor)) {
        inputTensor.dispose();
      }
      if (processedInput !== inputTensor) {
        processedInput.dispose();
      }
      output.dispose();

      return {
        predictions: predArray,
        confidence,
        duration
      };
    } catch (error) {
      console.error('Inference failed:', error);
      throw error;
    }
  }

  /**
   * Run batch inference
   */
  async runBatchInference(
    modelPath: string,
    inputs: number[][]
  ): Promise<InferenceResult[]> {
    try {
      const model = this.models.get(modelPath);
      
      if (!model) {
        throw new Error(`Model not loaded: ${modelPath}`);
      }

      const inputTensor = tf.tensor2d(inputs);
      
      let output: tf.Tensor;
      if ('predict' in model) {
        output = model.predict(inputTensor) as tf.Tensor;
      } else {
        output = model.execute(inputTensor) as tf.Tensor;
      }

      const predictions = await output.array() as number[][];

      inputTensor.dispose();
      output.dispose();

      return predictions.map(pred => ({
        predictions: pred,
        confidence: Math.max(...pred)
      }));
    } catch (error) {
      console.error('Batch inference failed:', error);
      throw error;
    }
  }

  /**
   * Get class prediction from probabilities
   */
  getClassPrediction(predictions: number[]): {
    class: number;
    confidence: number;
    probabilities: number[];
  } {
    const maxIndex = predictions.indexOf(Math.max(...predictions));
    return {
      class: maxIndex,
      confidence: predictions[maxIndex],
      probabilities: predictions
    };
  }

  /**
   * Preprocess image for model input
   */
  async preprocessImage(
    imageElement: HTMLImageElement | HTMLCanvasElement,
    targetSize: [number, number] = [224, 224]
  ): Promise<tf.Tensor3D> {
    return tf.tidy(() => {
      // Convert to tensor
      let tensor = tf.browser.fromPixels(imageElement);

      // Resize
      const resized = tf.image.resizeBilinear(tensor, targetSize);

      // Normalize to [0, 1]
      const normalized = resized.div(255.0);

      return normalized as tf.Tensor3D;
    });
  }

  /**
   * Preprocess audio for model input
   */
  async preprocessAudio(
    audioData: Float32Array,
    sampleRate: number = 16000,
    duration: number = 1.0
  ): Promise<tf.Tensor> {
    const targetLength = Math.floor(sampleRate * duration);
    
    return tf.tidy(() => {
      let tensor = tf.tensor1d(Array.from(audioData));

      // Pad or trim to target length
      if (tensor.shape[0] < targetLength) {
        const padding = tf.zeros([targetLength - tensor.shape[0]]);
        tensor = tf.concat([tensor, padding]);
      } else if (tensor.shape[0] > targetLength) {
        tensor = tensor.slice(0, targetLength);
      }

      // Normalize
      const mean = tensor.mean();
      const std = tf.moments(tensor).variance.sqrt();
      const normalized = tensor.sub(mean).div(std.add(1e-8));

      return normalized;
    });
  }

  /**
   * Get model metadata
   */
  getModelInfo(modelPath: string): ModelInfo | undefined {
    return this.modelInfo.get(modelPath);
  }

  /**
   * Check if model is loaded
   */
  isModelLoaded(modelPath: string): boolean {
    return this.models.has(modelPath);
  }

  /**
   * Get list of loaded models
   */
  getLoadedModels(): string[] {
    return Array.from(this.models.keys());
  }

  /**
   * Unload a model to free memory
   */
  unloadModel(modelPath: string): void {
    const model = this.models.get(modelPath);
    if (model) {
      model.dispose();
      this.models.delete(modelPath);
      this.modelInfo.delete(modelPath);
      console.log(`Model unloaded: ${modelPath}`);
    }
  }

  /**
   * Unload all models
   */
  unloadAllModels(): void {
    for (const modelPath of this.models.keys()) {
      this.unloadModel(modelPath);
    }
    console.log('All models unloaded');
  }

  /**
   * Get memory usage information
   */
  getMemoryInfo(): {
    numTensors: number;
    numBytes: number;
    numBytesInGPU?: number;
  } {
    return tf.memory();
  }

  /**
   * Warm up model (run dummy inference)
   */
  async warmUpModel(
    modelPath: string,
    inputShape: number[]
  ): Promise<void> {
    console.log(`Warming up model: ${modelPath}`);
    
    const dummyInput = tf.zeros(inputShape);
    
    try {
      await this.runInference(modelPath, dummyInput);
      console.log(`Model warmed up: ${modelPath}`);
    } finally {
      dummyInput.dispose();
    }
  }
}

// Export singleton instance
export const inferenceService = new InferenceService();
