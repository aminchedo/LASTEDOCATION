#!/usr/bin/env ts-node
/**
 * Google Data Ingestion Script (TypeScript)
 * Fetches Persian domain-specific data from Google sources
 * Outputs: /datasets/raw/google_data.jsonl
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
 * Create sample Google-sourced data
 * In production, this would use Google APIs (Drive, Sheets, Custom Search, etc.)
 */
declare function createGoogleSourcedData(): ConversationData[];
/**
 * Calculate SHA256 checksum
 */
declare function calculateSHA256(filepath: string): string;
export { normalizePersian, createGoogleSourcedData, calculateSHA256 };
//# sourceMappingURL=fetch_google_data.d.ts.map