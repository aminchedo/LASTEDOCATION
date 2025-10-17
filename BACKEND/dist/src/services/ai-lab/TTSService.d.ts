export declare class TTSService {
    private storageBasePath;
    private ttsModelsPath;
    private loadedModels;
    constructor();
    private initializeStorage;
    listTTSModels(): Promise<any[]>;
    generateSpeech(modelId: string, text: string, userId: string): Promise<any>;
    private generateWithPretrainedModel;
    private generateWithCustomModel;
    private normalizePersianText;
    private preprocessTextForTTS;
    private textToTensor;
    private melToAudio;
    private createPlaceholderAudio;
    private getAudioDuration;
    trainTTSModel(config: any): Promise<string>;
}
//# sourceMappingURL=TTSService.d.ts.map