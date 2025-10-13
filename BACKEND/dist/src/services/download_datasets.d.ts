#!/usr/bin/env ts-node
/**
 * Download and prepare Persian datasets from Hugging Face.
 * TypeScript version of download_datasets.py
 * Uses real Persian datasets for chatbot training.
 */
interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
interface Conversation {
    messages: Message[];
}
/**
 * Normalize Persian/Arabic characters to standard Persian.
 */
declare function normalizePersian(text: string): string;
/**
 * Create sample Persian conversational datasets.
 */
declare function createSamplePersianDatasets(): {
    train: Conversation[];
    test: Conversation[];
};
export { normalizePersian, createSamplePersianDatasets };
//# sourceMappingURL=download_datasets.d.ts.map