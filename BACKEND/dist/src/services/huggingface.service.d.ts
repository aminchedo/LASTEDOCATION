export interface HFModel {
    id: string;
    modelId: string;
    author: string;
    sha: string;
    lastModified: string;
    private: boolean;
    downloads: number;
    tags: string[];
    pipeline_tag?: string;
    library_name?: string;
    siblings?: HFFile[];
}
export interface HFFile {
    rfilename: string;
    size: number;
    blob_id: string;
    lfs?: {
        oid: string;
        size: number;
        pointer_size: number;
    };
}
export interface HFWhoAmI {
    type: string;
    name: string;
    fullname: string;
    email?: string;
    emailVerified?: boolean;
    avatarUrl?: string;
    orgs?: Array<{
        name: string;
    }>;
}
export declare class HuggingFaceService {
    private baseUrl;
    private apiUrl;
    /**
     * Validate HuggingFace token
     */
    validateToken(token: string): Promise<{
        valid: boolean;
        username?: string;
        type?: string;
        data?: HFWhoAmI;
    }>;
    /**
     * Search models on HuggingFace Hub
     */
    searchModels(query: string, filter?: {
        task?: string;
        library?: string;
        language?: string;
        sort?: 'downloads' | 'likes' | 'trending';
    }, token?: string): Promise<HFModel[]>;
    /**
     * Get model information
     */
    getModelInfo(repoId: string, token?: string): Promise<HFModel | null>;
    /**
     * Get list of files in a model repository
     */
    getModelFiles(repoId: string, token?: string): Promise<HFFile[]>;
    /**
     * Download a single file from HuggingFace
     */
    downloadFile(repoId: string, filename: string, destination: string, token?: string, onProgress?: (downloaded: number, total: number) => void): Promise<void>;
    /**
     * Download entire model repository
     */
    downloadModel(repoId: string, destDir: string, token?: string, onProgress?: (file: string, downloaded: number, total: number, fileIndex: number, totalFiles: number) => void): Promise<void>;
    /**
     * Search for Persian TTS models
     */
    searchPersianTTS(token?: string): Promise<HFModel[]>;
    /**
     * Search for Persian STT models
     */
    searchPersianSTT(token?: string): Promise<HFModel[]>;
    /**
     * Search for Persian LLM models
     */
    searchPersianLLM(token?: string): Promise<HFModel[]>;
    /**
     * Get dataset information
     */
    getDatasetInfo(datasetId: string, token?: string): Promise<any>;
    /**
     * Search datasets
     */
    searchDatasets(query: string, token?: string): Promise<any[]>;
}
export declare const hfService: HuggingFaceService;
//# sourceMappingURL=huggingface.service.d.ts.map