/**
 * Transcription Service for Memoria.ai
 * Handles audio-to-text conversion with bilingual support (English/Chinese)
 * Optimized for elderly users with accuracy and error handling
 */

import { TranscriptionResult, TranscriptionSegment, AudioError } from '../types';

export interface TranscriptionConfig {
  language: 'en' | 'zh' | 'auto';
  enablePunctuation: boolean;
  enableDiarization: boolean; // Speaker identification
  enhanceForElderly: boolean; // Special processing for elderly speech patterns
  confidenceThreshold: number; // Minimum confidence to accept results
}

export interface TranscriptionProvider {
  name: string;
  supportedLanguages: string[];
  maxFileSizeBytes: number;
  maxDurationSeconds: number;
}

export class TranscriptionService {
  private config: TranscriptionConfig;
  private providers: TranscriptionProvider[];
  private activeProvider: string;

  constructor() {
    this.config = {
      language: 'auto',
      enablePunctuation: true,
      enableDiarization: false,
      enhanceForElderly: true,
      confidenceThreshold: 0.7,
    };

    this.providers = [
      {
        name: 'whisper',
        supportedLanguages: ['en', 'zh'],
        maxFileSizeBytes: 25 * 1024 * 1024, // 25MB
        maxDurationSeconds: 600, // 10 minutes
      },
      {
        name: 'google',
        supportedLanguages: ['en', 'zh'],
        maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
        maxDurationSeconds: 480, // 8 minutes
      },
    ];

    this.activeProvider = 'whisper'; // Default to Whisper for better accuracy
  }

  /**
   * Transcribe audio file with optimizations for elderly users
   */
  async transcribeAudio(
    audioFilePath: string,
    language: 'en' | 'zh' | 'auto' = 'auto',
    customConfig?: Partial<TranscriptionConfig>
  ): Promise<TranscriptionResult> {
    try {
      const finalConfig = { ...this.config, language, ...customConfig };

      // Validate file before transcription
      await this.validateAudioFile(audioFilePath);

      // Pre-process audio if needed for elderly speech patterns
      let processedAudioPath = audioFilePath;
      if (finalConfig.enhanceForElderly) {
        processedAudioPath = await this.enhanceAudioForElderly(audioFilePath);
      }

      // Determine language if auto-detection is enabled
      let detectedLanguage = language;
      if (language === 'auto') {
        detectedLanguage = await this.detectLanguage(processedAudioPath);
      }

      // Perform transcription based on active provider
      let result: TranscriptionResult;
      switch (this.activeProvider) {
        case 'whisper':
          result = await this.transcribeWithWhisper(processedAudioPath, detectedLanguage, finalConfig);
          break;
        case 'google':
          result = await this.transcribeWithGoogle(processedAudioPath, detectedLanguage, finalConfig);
          break;
        default:
          throw new Error(`Unknown transcription provider: ${this.activeProvider}`);
      }

      // Post-process result for elderly users
      if (finalConfig.enhanceForElderly) {
        result = await this.postProcessForElderly(result);
      }

      // Validate confidence threshold
      if (result.confidence < finalConfig.confidenceThreshold) {
        console.warn(`Transcription confidence ${result.confidence} below threshold ${finalConfig.confidenceThreshold}`);
      }

      return result;
    } catch (error) {
      throw this.createTranscriptionError('TRANSCRIPTION_FAILED', 'Failed to transcribe audio', error);
    }
  }

  /**
   * Transcribe using OpenAI Whisper (offline or API)
   */
  private async transcribeWithWhisper(
    audioPath: string,
    language: 'en' | 'zh',
    config: TranscriptionConfig
  ): Promise<TranscriptionResult> {
    try {
      // In a real implementation, this would call Whisper API or local model
      console.log('Transcribing with Whisper:', { audioPath, language, config });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock transcription result
      const mockResult: TranscriptionResult = {
        text: this.getMockTranscription(language),
        confidence: 0.85 + Math.random() * 0.1, // 0.85-0.95
        language,
        segments: this.getMockSegments(language),
        processingTime: 2000,
      };

      return mockResult;
    } catch (error) {
      throw this.createTranscriptionError('WHISPER_FAILED', 'Whisper transcription failed', error);
    }
  }

  /**
   * Transcribe using Google Speech-to-Text
   */
  private async transcribeWithGoogle(
    audioPath: string,
    language: 'en' | 'zh',
    config: TranscriptionConfig
  ): Promise<TranscriptionResult> {
    try {
      console.log('Transcribing with Google:', { audioPath, language, config });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockResult: TranscriptionResult = {
        text: this.getMockTranscription(language),
        confidence: 0.80 + Math.random() * 0.15, // 0.80-0.95
        language,
        segments: this.getMockSegments(language),
        processingTime: 1500,
      };

      return mockResult;
    } catch (error) {
      throw this.createTranscriptionError('GOOGLE_FAILED', 'Google transcription failed', error);
    }
  }

  /**
   * Detect language from audio file
   */
  private async detectLanguage(audioPath: string): Promise<'en' | 'zh'> {
    try {
      // In real implementation, use language detection service
      console.log('Detecting language for:', audioPath);

      // Mock language detection - randomly return en or zh
      return Math.random() > 0.5 ? 'en' : 'zh';
    } catch (error) {
      console.warn('Language detection failed, defaulting to English');
      return 'en';
    }
  }

  /**
   * Enhance audio for elderly speech patterns
   */
  private async enhanceAudioForElderly(audioPath: string): Promise<string> {
    try {
      // In real implementation, apply audio processing:
      // - Noise reduction
      // - Volume normalization
      // - Speech enhancement
      // - Frequency adjustment for age-related hearing changes

      console.log('Enhancing audio for elderly users:', audioPath);

      // For now, return original path (no actual processing)
      return audioPath;
    } catch (error) {
      console.warn('Audio enhancement failed, using original:', error);
      return audioPath;
    }
  }

  /**
   * Post-process transcription results for elderly users
   */
  private async postProcessForElderly(result: TranscriptionResult): Promise<TranscriptionResult> {
    try {
      let processedText = result.text;

      // Common elderly speech pattern corrections
      const corrections = {
        en: [
          // Common mispronunciations or unclear speech patterns
          { pattern: /\buh+\b/gi, replacement: '' }, // Remove filler words
          { pattern: /\bum+\b/gi, replacement: '' },
          { pattern: /\s+/g, replacement: ' ' }, // Normalize spaces
        ],
        zh: [
          // Chinese-specific corrections
          { pattern: /呃+/g, replacement: '' }, // Remove Chinese filler
          { pattern: /那个+/g, replacement: '那个' }, // Normalize repeated words
        ],
      };

      const langCorrections = corrections[result.language] || corrections.en;
      for (const correction of langCorrections) {
        processedText = processedText.replace(correction.pattern, correction.replacement);
      }

      // Clean up the text
      processedText = processedText.trim();

      // Apply punctuation if not present and config enabled
      if (!this.hasPunctuation(processedText)) {
        processedText = await this.addPunctuation(processedText, result.language);
      }

      return {
        ...result,
        text: processedText,
      };
    } catch (error) {
      console.warn('Post-processing failed, returning original result:', error);
      return result;
    }
  }

  /**
   * Add punctuation to text
   */
  private async addPunctuation(text: string, language: 'en' | 'zh'): Promise<string> {
    try {
      // In real implementation, use punctuation restoration service
      // For now, add basic sentence endings
      let punctuatedText = text;

      // Basic punctuation rules
      if (language === 'en') {
        // Add periods at natural sentence boundaries
        punctuatedText = punctuatedText.replace(/\b(and|but|so|then|also)\s+/gi, (match, word) => {
          return `. ${word.charAt(0).toUpperCase() + word.slice(1)} `;
        });
      } else if (language === 'zh') {
        // Add Chinese punctuation
        punctuatedText = punctuatedText.replace(/(然后|接着|还有|而且)/g, '。$1');
      }

      // Ensure text ends with punctuation
      if (!/[.!?。！？]$/.test(punctuatedText)) {
        punctuatedText += language === 'zh' ? '。' : '.';
      }

      return punctuatedText;
    } catch (error) {
      console.warn('Punctuation addition failed:', error);
      return text;
    }
  }

  /**
   * Check if text already has punctuation
   */
  private hasPunctuation(text: string): boolean {
    return /[.!?;:。！？；：]/.test(text);
  }

  /**
   * Validate audio file before transcription
   */
  private async validateAudioFile(audioPath: string): Promise<void> {
    // In real implementation, check:
    // - File exists
    // - File size within limits
    // - Audio format is supported
    // - Duration within limits

    console.log('Validating audio file:', audioPath);
  }

  /**
   * Update transcription configuration
   */
  updateConfig(config: Partial<TranscriptionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Switch transcription provider
   */
  setProvider(providerName: string): void {
    const provider = this.providers.find(p => p.name === providerName);
    if (!provider) {
      throw new Error(`Unknown provider: ${providerName}`);
    }
    this.activeProvider = providerName;
  }

  /**
   * Get available providers
   */
  getProviders(): TranscriptionProvider[] {
    return [...this.providers];
  }

  /**
   * Get current configuration
   */
  getConfig(): TranscriptionConfig {
    return { ...this.config };
  }

  /**
   * Create mock transcription for testing
   */
  private getMockTranscription(language: 'en' | 'zh'): string {
    const samples = {
      en: [
        "Today was a wonderful day. I spent time with my family and we had a lovely dinner together. The weather was perfect for a walk in the garden.",
        "I remember when I was young, we used to visit my grandmother every Sunday. She would always have fresh cookies waiting for us.",
        "The doctor said my health is improving. I'm grateful for all the care I've been receiving from my family and friends.",
      ],
      zh: [
        "今天是美好的一天。我和家人一起度过了愉快的时光，我们一起吃了丰盛的晚餐。天气很适合在花园里散步。",
        "我记得年轻的时候，我们每个星期天都会去看望奶奶。她总是为我们准备新鲜的饼干。",
        "医生说我的健康状况在好转。我很感激家人和朋友给我的照顾。",
      ],
    };

    const languageSamples = samples[language];
    return languageSamples[Math.floor(Math.random() * languageSamples.length)];
  }

  /**
   * Create mock segments for testing
   */
  private getMockSegments(language: 'en' | 'zh'): TranscriptionSegment[] {
    const text = this.getMockTranscription(language);
    const sentences = text.split(/[.。]/);
    let currentTime = 0;

    return sentences.filter(s => s.trim()).map(sentence => {
      const duration = sentence.length * 0.05 + Math.random() * 2; // Rough estimate
      const segment: TranscriptionSegment = {
        start: currentTime,
        end: currentTime + duration,
        text: sentence.trim(),
        confidence: 0.8 + Math.random() * 0.2,
      };
      currentTime += duration + 0.5; // Add pause between sentences
      return segment;
    });
  }

  /**
   * Create standardized transcription error
   */
  private createTranscriptionError(code: string, message: string, originalError?: any): AudioError {
    return {
      code,
      message,
      details: originalError?.message || originalError?.toString(),
      timestamp: new Date(),
    };
  }
}

// Export singleton instance
export const transcriptionService = new TranscriptionService();