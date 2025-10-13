/**
 * Text-to-Speech (TTS) Service for Persian Language
 * Converts Persian text to audio output
 */
import { z } from 'zod';
export declare const TTSRequestSchema: z.ZodObject<{
    text: z.ZodString;
    language: z.ZodDefault<z.ZodString>;
    voice: z.ZodDefault<z.ZodString>;
    speed: z.ZodDefault<z.ZodNumber>;
    pitch: z.ZodDefault<z.ZodNumber>;
    format: z.ZodDefault<z.ZodEnum<["wav", "ogg", "mp3"]>>;
    sampleRate: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    text: string;
    language: string;
    voice: string;
    speed: number;
    pitch: number;
    format: "wav" | "ogg" | "mp3";
    sampleRate: number;
}, {
    text: string;
    language?: string | undefined;
    voice?: string | undefined;
    speed?: number | undefined;
    pitch?: number | undefined;
    format?: "wav" | "ogg" | "mp3" | undefined;
    sampleRate?: number | undefined;
}>;
export declare const TTSResponseSchema: z.ZodObject<{
    audio: z.ZodString;
    duration: z.ZodNumber;
    language: z.ZodString;
    voice: z.ZodString;
    format: z.ZodString;
    sampleRate: z.ZodNumber;
    text: z.ZodString;
    metadata: z.ZodObject<{
        wordCount: z.ZodNumber;
        characterCount: z.ZodNumber;
        processingTime: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        wordCount: number;
        characterCount: number;
        processingTime: number;
    }, {
        wordCount: number;
        characterCount: number;
        processingTime: number;
    }>;
}, "strip", z.ZodTypeAny, {
    text: string;
    audio: string;
    language: string;
    voice: string;
    format: string;
    sampleRate: number;
    duration: number;
    metadata: {
        wordCount: number;
        characterCount: number;
        processingTime: number;
    };
}, {
    text: string;
    audio: string;
    language: string;
    voice: string;
    format: string;
    sampleRate: number;
    duration: number;
    metadata: {
        wordCount: number;
        characterCount: number;
        processingTime: number;
    };
}>;
export type TTSRequest = z.infer<typeof TTSRequestSchema>;
export type TTSResponse = z.infer<typeof TTSResponseSchema>;
interface TTSConfig {
    modelPath: string;
    voicesPath: string;
    outputPath: string;
    sampleRate: number;
    maxTextLength: number;
}
interface VoiceConfig {
    name: string;
    gender: 'male' | 'female';
    age: 'young' | 'middle' | 'old';
    accent: 'tehran' | 'isfahan' | 'shiraz' | 'mashhad';
    quality: 'high' | 'medium' | 'low';
}
declare class TTSService {
    private config;
    private voices;
    private isInitialized;
    constructor();
    private initialize;
    /**
     * Initialize available voices
     */
    private initializeVoices;
    /**
     * Convert text to speech using Persian TTS model
     */
    synthesize(request: TTSRequest): Promise<TTSResponse>;
    /**
       * Simulate Persian TTS synthesis
       */
    private simulateSynthesis;
    /**
     * Estimate audio duration based on text and speed
     */
    private estimateDuration;
    /**
     * Estimate audio data length
     */
    private estimateAudioLength;
    /**
     * Generate simulated audio data
     */
    private generateSimulatedAudio;
    /**
     * Get TTS service status
     */
    getStatus(): {
        initialized: boolean;
        config: TTSConfig;
        voicesCount: number;
    };
    /**
     * Get available voices
     */
    getVoices(): VoiceConfig[];
    /**
     * Get supported languages
     */
    getSupportedLanguages(): string[];
    /**
     * Get supported formats
     */
    getSupportedFormats(): string[];
    /**
     * Validate Persian text
     */
    validatePersianText(text: string): {
        valid: boolean;
        issues: string[];
    };
}
export declare const ttsService: TTSService;
export default ttsService;
//# sourceMappingURL=tts.d.ts.map