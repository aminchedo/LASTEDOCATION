#!/usr/bin/env ts-node
/**
 * CPU-based fine-tuning script for Persian chat model.
 * TypeScript wrapper for Python-based training (PyTorch/Transformers)
 *
 * NOTE: Deep learning model training requires Python/PyTorch.
 * This TypeScript script provides a typed interface and delegates to Python.
 * For a pure TypeScript ML solution, consider TensorFlow.js or ONNX Runtime.
 */
interface TrainingArgs {
    epochs?: number;
    batch_size?: number;
    lr?: number;
    max_length?: number;
    seed?: number;
    model_name?: string;
    dataset?: string;
    data?: string;
    output_dir?: string;
    log_file?: string;
}
/**
 * Execute Python training script with TypeScript argument handling
 */
declare function trainModel(args: TrainingArgs): Promise<void>;
export { trainModel };
export type { TrainingArgs };
//# sourceMappingURL=train_cpu.d.ts.map