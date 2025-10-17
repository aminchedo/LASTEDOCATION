/**
 * Text-to-Speech (TTS) Service for Persian Language
 * Converts Persian text to audio output
 */

import fs from 'fs';
import path from 'path';
import { logger } from '../middleware/logger';
import { z } from 'zod';

// TTS request validation schema
export const TTSRequestSchema = z.object({
  text: z.string().min(1).max(1000),
  language: z.string().default('fa'),
  voice: z.string().default('persian_female'),
  speed: z.number().min(0.5).max(2.0).default(1.0),
  pitch: z.number().min(0.5).max(2.0).default(1.0),
  format: z.enum(['wav', 'ogg', 'mp3']).default('wav'),
  sampleRate: z.number().default(16000)
});

export const TTSResponseSchema = z.object({
  audio: z.string(), // Base64 encoded audio
  duration: z.number(),
  language: z.string(),
  voice: z.string(),
  format: z.string(),
  sampleRate: z.number(),
  text: z.string(),
  metadata: z.object({
    wordCount: z.number(),
    characterCount: z.number(),
    processingTime: z.number()
  })
});

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

class TTSService {
  private config: TTSConfig;
  private voices: Map<string, VoiceConfig>;
  private isInitialized: boolean = false;

  constructor() {
    this.config = {
      modelPath: path.join(process.cwd(), 'models', 'tts'),
      voicesPath: path.join(process.cwd(), 'models', 'tts', 'voices'),
      outputPath: path.join(process.cwd(), 'audio', 'generated'),
      sampleRate: 16000,
      maxTextLength: 1000
    };
    
    this.voices = new Map();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Ensure output directory exists
      if (!fs.existsSync(this.config.outputPath)) {
        fs.mkdirSync(this.config.outputPath, { recursive: true });
      }

      // Initialize voices
      this.initializeVoices();

      logger.info({ 
        msg: 'tts_service_initializing',
        config: this.config,
        voicesCount: this.voices.size
      });

      // Simulate model loading time
      await new Promise(resolve => setTimeout(resolve, 1500));

      this.isInitialized = true;
      logger.info({ msg: 'tts_service_initialized' });
    } catch (error: any) {
      logger.error({ 
        msg: 'tts_service_init_failed', 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Initialize available voices
   */
  private initializeVoices(): void {
    const voiceConfigs: VoiceConfig[] = [
      {
        name: 'persian_female',
        gender: 'female',
        age: 'young',
        accent: 'tehran',
        quality: 'high'
      },
      {
        name: 'persian_male',
        gender: 'male',
        age: 'middle',
        accent: 'tehran',
        quality: 'high'
      },
      {
        name: 'persian_female_isfahan',
        gender: 'female',
        age: 'young',
        accent: 'isfahan',
        quality: 'medium'
      },
      {
        name: 'persian_male_shiraz',
        gender: 'male',
        age: 'old',
        accent: 'shiraz',
        quality: 'medium'
      }
    ];

    voiceConfigs.forEach(voice => {
      this.voices.set(voice.name, voice);
    });
  }

  /**
   * Convert text to speech using Persian TTS model
   */
  async synthesize(request: TTSRequest): Promise<TTSResponse> {
    if (!this.isInitialized) {
      throw new Error('TTS service not initialized');
    }

    const startTime = Date.now();
    
    try {
      // Validate request
      const validatedRequest = TTSRequestSchema.parse(request);
      
      // Check text length
      if (validatedRequest.text.length > this.config.maxTextLength) {
        throw new Error(`Text length ${validatedRequest.text.length} exceeds maximum ${this.config.maxTextLength}`);
      }

      // Validate voice
      if (!this.voices.has(validatedRequest.voice)) {
        throw new Error(`Voice '${validatedRequest.voice}' not supported`);
      }

      logger.info({ 
        msg: 'tts_synthesis_started',
        text: validatedRequest.text.substring(0, 50) + '...',
        language: validatedRequest.language,
        voice: validatedRequest.voice,
        speed: validatedRequest.speed,
        pitch: validatedRequest.pitch
      });

      // Simulate TTS processing
      const audioData = await this.simulateSynthesis(validatedRequest);
      const duration = this.estimateDuration(validatedRequest.text, validatedRequest.speed);
      
      const processingTime = Date.now() - startTime;
      
      logger.info({ 
        msg: 'tts_synthesis_completed',
        duration: duration,
        processingTime: processingTime,
        voice: validatedRequest.voice
      });

      return {
        audio: audioData,
        duration: duration,
        language: validatedRequest.language,
        voice: validatedRequest.voice,
        format: validatedRequest.format,
        sampleRate: validatedRequest.sampleRate,
        text: validatedRequest.text,
        metadata: {
          wordCount: validatedRequest.text.split(' ').length,
          characterCount: validatedRequest.text.length,
          processingTime: processingTime
        }
      };

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      
      logger.error({ 
        msg: 'tts_synthesis_failed', 
        error: error.message,
        processingTime: processingTime
      });

    throw error;
  }
}

/**
   * Simulate Persian TTS synthesis
   */
  private async simulateSynthesis(request: TTSRequest): Promise<string> {
    // Simulate processing time based on text length
    const processingTime = Math.min(1000 + request.text.length * 10, 5000);
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Generate simulated audio data based on text characteristics
    const audioLength = this.estimateAudioLength(request.text, request.speed);
    const audioData = this.generateSimulatedAudio(audioLength, request.sampleRate);
    
    // Convert to base64
    return audioData.toString('base64');
  }

  /**
   * Estimate audio duration based on text and speed
   */
  private estimateDuration(text: string, speed: number): number {
    // Persian text typically has ~3-4 characters per second at normal speed
    const baseDuration = text.length / 3.5;
    return baseDuration / speed;
  }

  /**
   * Estimate audio data length
   */
  private estimateAudioLength(text: string, speed: number): number {
    const duration = this.estimateDuration(text, speed);
    // 16-bit samples, mono channel
    return Math.floor(duration * this.config.sampleRate * 2);
  }

  /**
   * Generate simulated audio data
   */
  private generateSimulatedAudio(length: number, sampleRate: number): Buffer {
    // Generate a simple sine wave as placeholder audio
    const buffer = Buffer.alloc(length);
    const frequency = 440; // A4 note
    
    for (let i = 0; i < length; i += 2) {
      const sample = Math.sin(2 * Math.PI * frequency * (i / 2) / sampleRate) * 32767;
      buffer.writeInt16LE(Math.floor(sample), i);
    }
    
    return buffer;
  }

  /**
   * Get TTS service status
   */
  getStatus(): { initialized: boolean; config: TTSConfig; voicesCount: number } {
    return {
      initialized: this.isInitialized,
      config: this.config,
      voicesCount: this.voices.size
    };
  }

  /**
   * Get available voices
   */
  getVoices(): VoiceConfig[] {
    return Array.from(this.voices.values());
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return ['fa', 'fa-IR', 'en']; // Persian and English
  }

  /**
   * Get supported formats
   */
  getSupportedFormats(): string[] {
    return ['wav', 'ogg', 'mp3'];
  }

  /**
   * Validate Persian text
   */
  validatePersianText(text: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for Persian characters
    const persianRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    if (!persianRegex.test(text)) {
      issues.push('Text does not contain Persian characters');
    }
    
    // Check for mixed scripts
    const mixedScripts = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF].*[a-zA-Z]|[a-zA-Z].*[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    if (mixedScripts.test(text)) {
      issues.push('Text contains mixed scripts (Persian and Latin)');
    }

    return {
      valid: issues.length === 0,
      issues: issues
    };
  }
}

// Export singleton instance
export const ttsService = new TTSService();
export default ttsService;