#!/usr/bin/env ts-node
/**
 * Conversational Dataset Merger (TypeScript)
 * Merges Google data with HuggingFace datasets into combined.jsonl
 *
 * If google_data.jsonl exists, merge it with HF JSONL
 * Otherwise, use HF JSONL as combined
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
 * Calculate SHA256 checksum of a file
 */
declare function calculateSHA256(filepath: string): string;
/**
 * Load JSONL file
 */
declare function loadJsonl(filepath: string): ConversationData[];
/**
 * Deduplicate conversations based on message content
 */
declare function deduplicateConversations(conversations: ConversationData[]): ConversationData[];
export { loadJsonl, deduplicateConversations, calculateSHA256 };
//# sourceMappingURL=prepare_conversational_merge.d.ts.map