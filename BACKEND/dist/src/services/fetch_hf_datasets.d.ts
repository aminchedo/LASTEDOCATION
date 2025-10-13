#!/usr/bin/env ts-node
/**
 * Hugging Face Dataset Fetcher (TypeScript)
 * Downloads real Persian datasets from Hugging Face and converts to conversational JSONL format
 *
 * Supported datasets:
 * - ParsBERT-Fa-Sentiment-Twitter
 * - PersianMind-v1.0
 * - hooshvarelab/hamshahri (optional)
 */
interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
interface ConversationData {
    messages: Message[];
    source?: string;
}
/**
 * Normalize Persian text (Arabic to Persian conversion)
 */
declare function normalizePersian(text: string): string;
/**
 * Convert sentiment dataset to conversational format
 */
declare function convertSentimentToConversational(items: any[], sourceName: string): ConversationData[];
/**
 * Convert general text dataset to conversational format
 */
declare function convertGeneralTextToConversational(items: any[], sourceName: string): ConversationData[];
export { normalizePersian, convertSentimentToConversational, convertGeneralTextToConversational };
//# sourceMappingURL=fetch_hf_datasets.d.ts.map