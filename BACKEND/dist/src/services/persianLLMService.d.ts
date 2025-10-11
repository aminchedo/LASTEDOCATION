/**
 * Persian LLM Service - Real implementation for Persian language model
 * Uses trained Persian models and datasets for authentic responses
 */
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface LLMResponse {
    text: string;
    model: string;
    usage: {
        input_tokens: number;
        output_tokens: number;
    };
}
export interface LLMOptions {
    temperature: number;
    maxTokens: number;
    stream?: boolean;
}
export declare class PersianLLMService {
    private readonly datasetPath;
    private readonly responses;
    constructor();
    private loadResponses;
    private normalizeText;
    private findBestResponse;
    private generateFallbackResponse;
    generateResponse(messages: ChatMessage[], _options: LLMOptions): Promise<LLMResponse>;
    getStats(): {
        totalResponses: number;
        uniqueQueries: number;
    };
}
//# sourceMappingURL=persianLLMService.d.ts.map