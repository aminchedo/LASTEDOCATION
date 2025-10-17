#!/usr/bin/env ts-node
/**
 * Dataset validation script for Persian chat dataset.
 * TypeScript version of check_dataset.py
 * Validates JSONL schema, Persian normalization, duplicate removal, and SHA256 checksums.
 */
interface Message {
    role: string;
    content: string;
}
interface ValidationStats {
    total_lines: number;
    valid_lines: number;
    invalid_lines: number;
    duplicates: number;
    normalized_entries: number;
    errors: string[];
}
/**
 * Normalize Persian/Arabic characters to standard Persian.
 */
declare function normalizePersian(text: string): string;
/**
 * Validate that messages follow the required format.
 */
declare function validateMessageFormat(messages: Message[]): boolean;
/**
 * Calculate SHA256 checksum of a file.
 */
declare function calculateSHA256(filepath: string): string;
/**
 * Validate a JSONL dataset file.
 */
declare function checkDataset(filepath: string): ValidationStats;
export { normalizePersian, validateMessageFormat, calculateSHA256, checkDataset };
//# sourceMappingURL=check_dataset.d.ts.map