export interface BootstrapJob {
    id: string;
    url: string;
    dest: string;
    kind: 'text' | 'asr' | 'tts' | 'generic' | 'model';
    bytesTotal?: number;
    bytesReceived: number;
    status: 'pending' | 'running' | 'downloading' | 'installed' | 'done' | 'error' | 'not_installed' | 'completed';
    error?: string | null;
    startedAt?: number | string | null;
    finishedAt?: number | string | null;
    percent?: number;
}
export interface StartBootstrapRequest {
    url: string;
    dest: string;
    kind: 'text' | 'asr' | 'tts' | 'generic' | 'model';
}
export interface StartBootstrapResponse {
    ok: boolean;
    id: string;
    error?: string;
}
export interface BootstrapStatusResponse {
    ok: boolean;
    job: BootstrapJob;
    error?: string;
}
export interface ProvenanceData {
    id: string;
    source: string;
    timestamp: string;
    metadata: Record<string, any>;
}
export interface BootstrapLog {
    timestamp: string;
    level: 'info' | 'error' | 'debug';
    message: string;
}
export declare function startBootstrap(params: StartBootstrapRequest): Promise<StartBootstrapResponse>;
export declare function getBootstrapStatus(jobId: string): Promise<BootstrapStatusResponse>;
export declare function getProvenance(jobId: string): Promise<ProvenanceData>;
export declare function getBootstrapLog(jobId: string): Promise<BootstrapLog[]>;
export declare function pollBootstrapStatus(jobId: string, interval?: number): Promise<BootstrapJob>;
declare const _default: {
    startBootstrap: typeof startBootstrap;
    getBootstrapStatus: typeof getBootstrapStatus;
    getProvenance: typeof getProvenance;
    getBootstrapLog: typeof getBootstrapLog;
    pollBootstrapStatus: typeof pollBootstrapStatus;
};
export default _default;
//# sourceMappingURL=bootstrapApi.d.ts.map