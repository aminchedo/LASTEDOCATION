export interface DownloadJob {
    id: string;
    kind: 'model' | 'tts' | 'dataset';
    repoId: string;
    repoType: 'model' | 'dataset';
    dest: string;
    status: 'pending' | 'downloading' | 'completed' | 'error';
    progress: number;
    bytesDownloaded?: number;
    bytesTotal?: number;
    speed?: number;
    eta?: number;
    currentFile?: string;
    completedFiles: string[];
    error?: string;
    startedAt?: string;
    finishedAt?: string;
}
/**
 * Start a new download job
 */
export declare function startDownload(kind: 'model' | 'tts' | 'dataset', repoId: string, repoType: 'model' | 'dataset', dest: string): Promise<DownloadJob>;
export declare function getDownloadJob(jobId: string): DownloadJob | null;
export declare function getAllDownloadJobs(): DownloadJob[];
export declare function cancelDownload(jobId: string): boolean;
//# sourceMappingURL=downloads.d.ts.map