#!/usr/bin/env ts-node
/**
 * TypeScript Evaluation Script for Persian Chat Model
 * Evaluates model on test set and reports metrics: eval_loss, perplexity, error analysis
 */
interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
interface ConversationData {
    messages: Message[];
}
interface EvaluationMetrics {
    eval_loss: number;
    perplexity: number;
    total_samples: number;
    num_errors: number;
    evaluated_at: string;
    model_path: string;
    dataset_path: string;
}
interface ErrorExample {
    index: number;
    loss?: number;
    error?: string;
    text: string;
    messages?: Message[];
}
/**
 * Load JSONL dataset
 */
declare function loadJsonlDataset(filepath: string): ConversationData[];
/**
 * Simulate model evaluation
 * In production, this would use the actual trained model
 */
declare function evaluateModel(dataset: ConversationData[], modelPath: string): {
    metrics: EvaluationMetrics;
    errors: ErrorExample[];
};
export { loadJsonlDataset, evaluateModel };
export type { EvaluationMetrics, ErrorExample };
//# sourceMappingURL=eval_cpu.d.ts.map