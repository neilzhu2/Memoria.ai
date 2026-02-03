/**
 * Transcription Service for Memoria.ai
 * Handles audio-to-text conversion with bilingual support (English/Chinese)
 * Optimized for elderly users with accuracy and error handling
 */

import {
  TranscriptionResult,
  TranscriptionSegment,
  TranscriptionWord,
  AudioError,
  TranscriptionError,
  RealtimeTranscriptionConfig,
  RealtimeTranscriptionState,
  ChineseLanguageSupport,
  CulturalSpeechPatterns,
  LanguageDetectionConfig,
  ElderlyTranscriptionSettings
} from '../types';

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

  // Real-time transcription properties
  private realtimeConfig: RealtimeTranscriptionConfig;
  private realtimeState: RealtimeTranscriptionState;
  private chineseSupport: ChineseLanguageSupport;
  private culturalPatterns: CulturalSpeechPatterns;
  private languageDetection: LanguageDetectionConfig;
  private elderlySettings: ElderlyTranscriptionSettings;

  // Event listeners for real-time updates
  private listeners: Map<string, (data: any) => void>;
  private transcriptionStream: any; // Stream instance
  private realtimeTimer: NodeJS.Timeout | null;

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

    // Initialize real-time transcription configuration
    this.realtimeConfig = {
      language: 'auto',
      enableLanguageDetection: true,
      enableCodeSwitching: true,
      confidenceThreshold: 0.6, // Lower for real-time
      updateInterval: 500, // 500ms updates for elderly users
      bufferSize: 10, // Buffer 10 words
      enableElderlyOptimizations: true,
      fontSize: 18,
      highContrast: false,
      enableVoiceConfirmation: true,
    };

    // Initialize real-time state
    this.realtimeState = {
      isActive: false,
      currentText: '',
      pendingText: '',
      finalizedText: '',
      confidence: 0,
      detectedLanguage: null,
      isLanguageSwitching: false,
      wordCount: 0,
      sessionDuration: 0,
      lastUpdateTime: 0,
    };

    // Initialize Chinese language support
    this.chineseSupport = {
      characterSet: 'both',
      dialectSupport: 'mandarin',
      toneRecognition: true,
      culturalTermsEnabled: true,
      familyRelationshipTerms: true,
      honorificsRecognition: true,
      dateFormatPreference: 'both',
    };

    // Initialize cultural speech patterns
    this.culturalPatterns = {
      enableFillerWordRemoval: true,
      recognizeRepetitivePatterns: true,
      honorificsNormalization: true,
      familyTermCorrection: true,
      culturalExpressionPreservation: true,
      idiomRecognition: true,
    };

    // Initialize language detection
    this.languageDetection = {
      autoDetectionEnabled: true,
      codeSwitchingEnabled: true,
      confidenceThreshold: 0.8,
      minimumSegmentLength: 5,
      switchingIndicators: true,
      fallbackLanguage: 'en',
    };

    // Initialize elderly-specific settings
    this.elderlySettings = {
      speechRate: 0.7,
      pauseDuration: 1000,
      enableVoiceGuidance: true,
      voiceGuidanceLanguage: 'en',
      simplifiedControls: true,
      largeTextMode: true,
      highContrastMode: false,
      enableHapticFeedback: true,
      autoSaveInterval: 30000, // 30 seconds
    };

    // Initialize event system
    this.listeners = new Map();
    this.transcriptionStream = null;
    this.realtimeTimer = null;
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
   * Start real-time transcription for elderly users
   */
  async startRealtimeTranscription(
    audioStream: any,
    customConfig?: Partial<RealtimeTranscriptionConfig>
  ): Promise<void> {
    try {
      if (this.realtimeState.isActive) {
        throw new Error('Real-time transcription already active');
      }

      // Update configuration
      this.realtimeConfig = { ...this.realtimeConfig, ...customConfig };

      // Initialize state
      this.realtimeState = {
        isActive: true,
        currentText: '',
        pendingText: '',
        finalizedText: '',
        confidence: 0,
        detectedLanguage: null,
        isLanguageSwitching: false,
        wordCount: 0,
        sessionDuration: 0,
        lastUpdateTime: Date.now(),
      };

      // Start the transcription stream
      this.transcriptionStream = await this.initializeTranscriptionStream(audioStream);

      // Start processing timer for elderly-friendly updates
      this.startRealtimeProcessing();

      // Notify listeners
      this.notifyListeners('transcription:started', {
        config: this.realtimeConfig,
        state: this.realtimeState,
      });

      console.log('Real-time transcription started with elderly optimizations');
    } catch (error) {
      throw this.createTranscriptionError(
        'REALTIME_START_FAILED',
        'Failed to start real-time transcription',
        error
      );
    }
  }

  /**
   * Stop real-time transcription
   */
  async stopRealtimeTranscription(): Promise<TranscriptionResult> {
    try {
      if (!this.realtimeState.isActive) {
        throw new Error('Real-time transcription not active');
      }

      // Stop processing
      this.stopRealtimeProcessing();

      // Finalize any pending text
      await this.finalizePendingText();

      // Create final result
      const result: TranscriptionResult = {
        text: this.realtimeState.finalizedText,
        confidence: this.realtimeState.confidence,
        language: this.realtimeState.detectedLanguage || 'en',
        segments: await this.createSegmentsFromRealtimeText(),
        processingTime: this.realtimeState.sessionDuration,
        isRealtime: true,
        detectedLanguage: this.realtimeState.detectedLanguage,
        hasCodeSwitching: this.realtimeState.isLanguageSwitching,
      };

      // Reset state
      this.realtimeState.isActive = false;

      // Notify listeners
      this.notifyListeners('transcription:stopped', { result });

      console.log('Real-time transcription stopped');
      return result;
    } catch (error) {
      throw this.createTranscriptionError(
        'REALTIME_STOP_FAILED',
        'Failed to stop real-time transcription',
        error
      );
    }
  }

  /**
   * Get current real-time transcription state
   */
  getRealtimeState(): RealtimeTranscriptionState {
    return { ...this.realtimeState };
  }

  /**
   * Update real-time configuration
   */
  updateRealtimeConfig(config: Partial<RealtimeTranscriptionConfig>): void {
    this.realtimeConfig = { ...this.realtimeConfig, ...config };

    // Apply elderly-specific optimizations
    if (config.enableElderlyOptimizations) {
      this.realtimeConfig.updateInterval = Math.max(500, this.realtimeConfig.updateInterval);
      this.realtimeConfig.confidenceThreshold = Math.min(0.7, this.realtimeConfig.confidenceThreshold);
    }

    console.log('Real-time config updated:', this.realtimeConfig);
  }

  /**
   * Add event listener for real-time updates
   */
  addEventListener(event: string, callback: (data: any) => void): void {
    this.listeners.set(event, callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: string): void {
    this.listeners.delete(event);
  }

  /**
   * Initialize transcription stream
   */
  private async initializeTranscriptionStream(audioStream: any): Promise<any> {
    // In real implementation, this would initialize speech recognition stream
    // Using Expo Speech API or external service
    console.log('Initializing transcription stream');

    // Mock stream setup
    return {
      onResult: (callback: (result: any) => void) => {
        // Simulate real-time results
        const mockInterval = setInterval(() => {
          if (!this.realtimeState.isActive) {
            clearInterval(mockInterval);
            return;
          }

          const mockResult = this.generateMockRealtimeResult();
          callback(mockResult);
        }, this.realtimeConfig.updateInterval);
      },
      stop: () => {
        console.log('Stopping transcription stream');
      },
    };
  }

  /**
   * Start real-time processing timer
   */
  private startRealtimeProcessing(): void {
    this.realtimeTimer = setInterval(async () => {
      if (!this.realtimeState.isActive) return;

      try {
        await this.processRealtimeUpdate();
      } catch (error) {
        console.error('Real-time processing error:', error);
      }
    }, this.realtimeConfig.updateInterval);
  }

  /**
   * Stop real-time processing
   */
  private stopRealtimeProcessing(): void {
    if (this.realtimeTimer) {
      clearInterval(this.realtimeTimer);
      this.realtimeTimer = null;
    }

    if (this.transcriptionStream) {
      this.transcriptionStream.stop();
      this.transcriptionStream = null;
    }
  }

  /**
   * Process real-time transcription update
   */
  private async processRealtimeUpdate(): Promise<void> {
    try {
      // Update session duration
      this.realtimeState.sessionDuration = Date.now() - this.realtimeState.lastUpdateTime;

      // Apply elderly-specific text processing
      if (this.realtimeConfig.enableElderlyOptimizations) {
        await this.applyElderlyOptimizations();
      }

      // Detect language switching for bilingual users
      if (this.realtimeConfig.enableCodeSwitching) {
        await this.detectLanguageSwitching();
      }

      // Apply cultural speech patterns
      if (this.culturalPatterns.enableFillerWordRemoval) {
        this.removeCulturalFillers();
      }

      // Notify listeners of update
      this.notifyListeners('transcription:update', {
        state: this.realtimeState,
        text: this.realtimeState.currentText,
        confidence: this.realtimeState.confidence,
      });
    } catch (error) {
      console.error('Real-time update processing failed:', error);
    }
  }

  /**
   * Apply elderly-specific optimizations
   */
  private async applyElderlyOptimizations(): Promise<void> {
    // Slower processing for better accuracy
    if (this.elderlySettings.speechRate < 1.0) {
      // Add processing delay for better recognition
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Enhanced confidence scoring for elderly speech patterns
    if (this.realtimeState.confidence < this.realtimeConfig.confidenceThreshold) {
      // Apply additional processing for low-confidence text
      this.realtimeState.currentText = await this.enhanceTextForElderly(
        this.realtimeState.currentText
      );
    }
  }

  /**
   * Detect language switching for bilingual users
   */
  private async detectLanguageSwitching(): Promise<void> {
    if (!this.languageDetection.autoDetectionEnabled) return;

    const currentText = this.realtimeState.currentText;
    if (currentText.length < this.languageDetection.minimumSegmentLength) return;

    // Detect language of current text
    const detectedLanguage = await this.detectLanguageInText(currentText);

    // Check for language switch
    if (this.realtimeState.detectedLanguage &&
        this.realtimeState.detectedLanguage !== detectedLanguage) {
      this.realtimeState.isLanguageSwitching = true;

      // Notify listeners of language switch
      this.notifyListeners('language:switched', {
        from: this.realtimeState.detectedLanguage,
        to: detectedLanguage,
        text: currentText,
      });
    }

    this.realtimeState.detectedLanguage = detectedLanguage;
  }

  /**
   * Remove cultural filler words
   */
  private removeCulturalFillers(): void {
    if (!this.realtimeState.currentText) return;

    let processedText = this.realtimeState.currentText;

    // English fillers
    if (this.realtimeState.detectedLanguage === 'en' || !this.realtimeState.detectedLanguage) {
      processedText = processedText.replace(/\b(um+|uh+|like|you know)\b/gi, '').trim();
    }

    // Chinese fillers
    if (this.realtimeState.detectedLanguage === 'zh') {
      processedText = processedText.replace(/(呃+|嗯+|那个那个|就是说)/g, '').trim();
    }

    // Normalize spaces
    processedText = processedText.replace(/\s+/g, ' ').trim();

    this.realtimeState.currentText = processedText;
  }

  /**
   * Finalize pending text
   */
  private async finalizePendingText(): Promise<void> {
    if (this.realtimeState.pendingText) {
      // Apply final processing
      const finalText = await this.postProcessForElderly({
        text: this.realtimeState.pendingText,
        confidence: this.realtimeState.confidence,
        language: this.realtimeState.detectedLanguage || 'en',
        segments: [],
        processingTime: 0,
      });

      // Add to finalized text
      this.realtimeState.finalizedText += ' ' + finalText.text;
      this.realtimeState.pendingText = '';
    }
  }

  /**
   * Create segments from real-time text
   */
  private async createSegmentsFromRealtimeText(): Promise<TranscriptionSegment[]> {
    // Split text into sentences and create segments
    const sentences = this.realtimeState.finalizedText.split(/[.。!！?？]/).filter(s => s.trim());
    let currentTime = 0;

    return sentences.map(sentence => {
      const duration = sentence.length * 0.05 + Math.random() * 1;
      const segment: TranscriptionSegment = {
        start: currentTime,
        end: currentTime + duration,
        text: sentence.trim(),
        confidence: this.realtimeState.confidence,
        isFinal: true,
        language: this.realtimeState.detectedLanguage || 'en',
      };
      currentTime += duration + 0.3;
      return segment;
    });
  }

  /**
   * Generate mock real-time result for testing
   */
  private generateMockRealtimeResult(): any {
    const mockTexts = {
      en: [
        'Hello, how are you today?',
        'I would like to share a memory',
        'When I was young, we used to',
        'My family always gathered for dinner',
        'The weather is beautiful today',
      ],
      zh: [
        '你好，今天怎么样？',
        '我想分享一个回忆',
        '当我年轻的时候，我们经常',
        '我的家人总是聚在一起吃饭',
        '今天天气很好',
      ],
    };

    const language = this.realtimeState.detectedLanguage ||
      (Math.random() > 0.5 ? 'en' : 'zh');

    const texts = mockTexts[language];
    const randomText = texts[Math.floor(Math.random() * texts.length)];

    return {
      text: randomText,
      confidence: 0.7 + Math.random() * 0.3,
      isFinal: Math.random() > 0.7,
      language,
    };
  }

  /**
   * Detect language in text
   */
  private async detectLanguageInText(text: string): Promise<'en' | 'zh'> {
    // Simple detection based on character patterns
    const chineseChars = /[\u4e00-\u9fff]/.test(text);
    const englishChars = /[a-zA-Z]/.test(text);

    if (chineseChars && !englishChars) return 'zh';
    if (englishChars && !chineseChars) return 'en';

    // Mixed language - determine majority
    const chineseCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishCount = (text.match(/[a-zA-Z]/g) || []).length;

    return chineseCount > englishCount ? 'zh' : 'en';
  }

  /**
   * Enhance text for elderly users
   */
  private async enhanceTextForElderly(text: string): Promise<string> {
    // Apply text enhancement specific to elderly speech patterns
    let enhanced = text;

    // Normalize repeated words
    enhanced = enhanced.replace(/(\b\w+\b)\s+\1+/gi, '$1');

    // Fix common elderly speech patterns
    if (this.realtimeState.detectedLanguage === 'zh') {
      // Chinese-specific enhancements
      enhanced = enhanced.replace(/那个+/g, '那个');
      enhanced = enhanced.replace(/就是+/g, '就是');
    } else {
      // English-specific enhancements
      enhanced = enhanced.replace(/\b(the the|and and|is is)\b/gi, (match) =>
        match.split(' ')[0]);
    }

    return enhanced.trim();
  }

  /**
   * Notify event listeners
   */
  private notifyListeners(event: string, data: any): void {
    const callback = this.listeners.get(event);
    if (callback) {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
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
   * Get real-time configuration
   */
  getRealtimeConfig(): RealtimeTranscriptionConfig {
    return { ...this.realtimeConfig };
  }

  /**
   * Get Chinese language support settings
   */
  getChineseSupport(): ChineseLanguageSupport {
    return { ...this.chineseSupport };
  }

  /**
   * Update Chinese language support
   */
  updateChineseSupport(config: Partial<ChineseLanguageSupport>): void {
    this.chineseSupport = { ...this.chineseSupport, ...config };
  }

  /**
   * Get cultural speech patterns settings
   */
  getCulturalPatterns(): CulturalSpeechPatterns {
    return { ...this.culturalPatterns };
  }

  /**
   * Update cultural speech patterns
   */
  updateCulturalPatterns(config: Partial<CulturalSpeechPatterns>): void {
    this.culturalPatterns = { ...this.culturalPatterns, ...config };
  }

  /**
   * Get elderly-specific settings
   */
  getElderlySettings(): ElderlyTranscriptionSettings {
    return { ...this.elderlySettings };
  }

  /**
   * Update elderly-specific settings
   */
  updateElderlySettings(config: Partial<ElderlyTranscriptionSettings>): void {
    this.elderlySettings = { ...this.elderlySettings, ...config };

    // Apply changes to real-time config if needed
    if (this.realtimeState.isActive) {
      this.updateRealtimeConfig({
        updateInterval: Math.max(500, this.elderlySettings.speechRate * 1000),
        enableVoiceConfirmation: this.elderlySettings.enableVoiceGuidance,
        fontSize: this.elderlySettings.largeTextMode ? 20 : 16,
        highContrast: this.elderlySettings.highContrastMode,
      });
    }
  }

  /**
   * Get language detection settings
   */
  getLanguageDetection(): LanguageDetectionConfig {
    return { ...this.languageDetection };
  }

  /**
   * Update language detection settings
   */
  updateLanguageDetection(config: Partial<LanguageDetectionConfig>): void {
    this.languageDetection = { ...this.languageDetection, ...config };
  }

  /**
   * Check if real-time transcription is supported
   */
  isRealtimeSupported(): boolean {
    // Check if the current provider supports real-time transcription
    return this.activeProvider === 'google' || this.activeProvider === 'whisper';
  }

  /**
   * Get transcription capabilities for current provider
   */
  getCapabilities(): {
    realtimeSupport: boolean;
    languageDetection: boolean;
    chineseSupport: boolean;
    elderlyOptimizations: boolean;
  } {
    return {
      realtimeSupport: this.isRealtimeSupported(),
      languageDetection: true,
      chineseSupport: true,
      elderlyOptimizations: true,
    };
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