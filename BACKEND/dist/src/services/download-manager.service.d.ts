import { EventEmitter } from 'events';
export interface DownloadJob {
    id: string;
    modelId: string;
    userId: string;
    status: 'pending' | 'downloading' | 'completed' | 'failed';
    progress: number;
    bytesDownloaded: number;
    bytesTotal: number;
    currentFile: string;
    errorMessage?: string;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
}
export declare class DownloadManager extends EventEmitter {
    private activeDownloads;
    private maxConcurrent;
    /**
     * Start a new download job
     */
    startDownload(modelId: string, repoId: string, userId: string, token?: string): Promise<string>;
    /**
     * Process download in background
     */
    private processDownload;
    /**
     * Get download status
     */
    getDownloadStatus(downloadId: string): Promise<DownloadJob | null>;
    /**
     * Get all downloads for a user
     */
    getUserDownloads(userId: string): Promise<DownloadJob[]>;
    /**
     * Get all active downloads
     */
    getActiveDownloads(): Promise<DownloadJob[]>;
    /**
     * Cancel a download
     */
    cancelDownload(downloadId: string): Promise<boolean>;
    /**
     * Infer model type from HuggingFace metadata
     */
    private inferModelType;
}
export declare const downloadManager: DownloadManager;
//# sourceMappingURL=download-manager.service.d.ts.map