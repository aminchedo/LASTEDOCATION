export interface InstalledItem {
    id: string;
    name: string;
    type: 'model' | 'dataset' | 'tts';
    path: string;
    size: number;
    fileCount: number;
    installed: boolean;
    provenance?: {
        source?: string;
        url?: string;
        license?: string;
    };
}
export declare function getInstalledItems(): InstalledItem[];
export declare function getInstalledItemById(id: string): InstalledItem | null;
//# sourceMappingURL=sources.d.ts.map