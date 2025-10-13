export type ApiSource = 'local' | 'external';
export declare function getApiSource(): ApiSource;
export declare function getActiveEndpoint(): {
    source: ApiSource;
    baseUrl: string;
    apiKey?: string;
};
//# sourceMappingURL=apiConfig.d.ts.map