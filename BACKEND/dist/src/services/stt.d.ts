/**
 * Speech-to-Text (STT) Service for Persian Language
 * Handles audio input and converts to Persian text
 */
import { z } from 'zod';
export declare const STTRequestSchema: z.ZodObject<{
    audio: z.ZodOptional<z.ZodString>;
    audioFile: z.ZodOptional<z.ZodString>;
    language: z.ZodDefault<z.ZodString>;
    format: z.ZodDefault<z.ZodEnum<["wav", "ogg", "mp3"]>>;
    sampleRate: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    language: string;
    format: "wav" | "ogg" | "mp3";
    sampleRate: number;
    audio?: string | undefined;
    audioFile?: string | undefined;
}, {
    audio?: string | undefined;
    language?: string | undefined;
    format?: "wav" | "ogg" | "mp3" | undefined;
    sampleRate?: number | undefined;
    audioFile?: string | undefined;
}>;
export declare const STTResponseSchema: z.ZodObject<{
    text: z.ZodString;
    confidence: z.ZodNumber;
    language: z.ZodString;
    duration: z.ZodOptional<z.ZodNumber>;
    words: z.ZodOptional<z.ZodArray<z.ZodObject<{
        word: z.ZodString;
        start: z.ZodNumber;
        end: z.ZodNumber;
        confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        end: number;
        confidence: number;
        word: string;
        start: number;
    }, {
        end: number;
        confidence: number;
        word: string;
        start: number;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    text: string;
    language: string;
    confidence: number;
    duration?: number | undefined;
    words?: {
        end: number;
        confidence: number;
        word: string;
        start: number;
    }[] | undefined;
}, {
    text: string;
    language: string;
    confidence: number;
    duration?: number | undefined;
    words?: {
        end: number;
        confidence: number;
        word: string;
        start: number;
    }[] | undefined;
}>;
export type STTRequest = z.infer<typeof STTRequestSchema>;
export type STTResponse = z.infer<typeof STTResponseSchema>;
interface STTConfig {
    modelPath: string;
    sampleRate: number;
    language: string;
    maxDuration: number;
}
declare class STTService {
    private config;
    private isInitialized;
    constructor();
    private initialize;
    /**
     * Convert audio to text using Persian STT model
     */
    transcribe(request: STTRequest): Promise<STTResponse>;
    /**
     * Load and validate audio data
     */
    private loadAudioData;
    /**
     * Estimate audio duration (simplified)
     */
    private estimateDuration;
    /**
     * Simulate Persian STT transcription
     */
    private simulateTranscription;
    /**
     * Get STT service status
     */
    getStatus(): {
        initialized: boolean;
        config: STTConfig;
    };
    /**
     * Get supported languages
     */
    getSupportedLanguages(): string[];
    /**
     * Get supported formats
     */
    getSupportedFormats(): string[];
}
export declare const sttService: STTService;
export default sttService;
//# sourceMappingURL=stt.d.ts.map