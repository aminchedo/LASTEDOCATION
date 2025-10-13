/**
 * Dataset Management Service
 * Handles dataset storage, versioning, and metadata management
 */
export interface DatasetMetadata {
    id: string;
    name: string;
    description: string;
    version: string;
    size: number;
    format: 'json' | 'jsonl' | 'csv' | 'txt' | 'parquet';
    language: string;
    source: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    filePath: string;
    checksum: string;
    stats: {
        totalRecords: number;
        avgLength: number;
        languages: string[];
    };
}
export interface DatasetVersion {
    version: string;
    filePath: string;
    size: number;
    checksum: string;
    createdAt: string;
    changes: string;
}
declare class DatasetManager {
    private datasetsPath;
    private metadataPath;
    private datasets;
    constructor();
    private initialize;
    private saveMetadata;
    private calculateChecksum;
    private analyzeDataset;
    addDataset(filePath: string, metadata: Omit<DatasetMetadata, 'id' | 'filePath' | 'checksum' | 'createdAt' | 'updatedAt' | 'stats'>): Promise<DatasetMetadata>;
    getDataset(id: string): DatasetMetadata | null;
    getAllDatasets(): DatasetMetadata[];
    getDatasetsByLanguage(language: string): DatasetMetadata[];
    getDatasetsByTag(tag: string): DatasetMetadata[];
    searchDatasets(query: string): DatasetMetadata[];
    updateDataset(id: string, updates: Partial<DatasetMetadata>): DatasetMetadata | null;
    deleteDataset(id: string): boolean;
    createVersion(id: string, version: string, changes: string): DatasetVersion | null;
    getStats(): {
        totalDatasets: number;
        totalSize: number;
        languages: string[];
        formats: string[];
        tags: string[];
    };
    exportDataset(id: string, targetPath: string): boolean;
    validateDataset(id: string): {
        valid: boolean;
        errors: string[];
    };
}
export declare const datasetManager: DatasetManager;
export default datasetManager;
//# sourceMappingURL=datasetManager.d.ts.map