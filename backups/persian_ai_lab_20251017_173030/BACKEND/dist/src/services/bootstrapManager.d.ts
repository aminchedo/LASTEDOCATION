type Phase = 'idle' | 'running' | 'done' | 'error';
type AssetId = 'text' | 'asr' | 'tts';
type AssetStatus = {
    id: AssetId;
    title: string;
    status: 'not_installed' | 'installing' | 'installed' | 'error';
    bytes?: number;
    progress?: number;
    error?: string;
    selectedId?: string;
};
type BootstrapState = {
    phase: Phase;
    totalBytes?: number;
    startedAt?: string;
    finishedAt?: string;
    assets: Record<AssetId, AssetStatus>;
};
export declare function startBootstrap(): Promise<BootstrapState>;
export declare function getBootstrapStatus(): BootstrapState;
export declare function getProvenance(): any;
export {};
//# sourceMappingURL=bootstrapManager.d.ts.map