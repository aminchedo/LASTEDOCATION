import { Dataset, DatasetInfo } from '../../types/ai-lab';
export declare class DatasetService {
    private storageBasePath;
    private datasets;
    constructor();
    private initializeStorage;
    processDataset(info: DatasetInfo): Promise<Dataset>;
    private parseCSV;
    private parseJSON;
    private parseText;
    private validateAndCleanData;
    private cleanText;
    loadDataset(datasetId: string): Promise<Dataset | null>;
    listDatasets(userId: string): Promise<Dataset[]>;
    deleteDataset(datasetId: string, userId: string): Promise<boolean>;
    getDatasetStats(datasetId: string): Promise<any>;
}
//# sourceMappingURL=DatasetService.d.ts.map