export declare function ensureDir(dir: string): Promise<void>;
export declare function sha256(filePath: string): Promise<string>;
export declare function downloadFile(url: string, targetPath: string, onProgress?: (pct: number) => void, byteLimit?: number): Promise<{
    bytes: number;
}>;
export declare function readableSize(bytes: number): string;
//# sourceMappingURL=downloader.d.ts.map