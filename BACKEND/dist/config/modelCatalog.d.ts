export interface ModelEntry {
    id: string;
    name: string;
    provider: string;
    type: 'model' | 'tts' | 'dataset';
    repoType: 'model' | 'dataset';
    size: string;
    sizeBytes?: number;
    license: string;
    tags: string[];
    url: string;
    description: string;
    language: string[];
    defaultDest?: string;
}
export declare const MODEL_CATALOG: ModelEntry[];
export declare function getModelById(id: string): ModelEntry | undefined;
export declare function getModelsByType(type: 'model' | 'tts' | 'dataset'): ModelEntry[];
export declare function searchModels(query: string): ModelEntry[];
//# sourceMappingURL=modelCatalog.d.ts.map