/**
 * Gemini Transcription Provider
 *
 * Uses Google's Gemini API to transcribe audio files.
 * Sends audio as base64 to Gemini Flash for cost-effective transcription.
 * Free tier: 15 requests/min, 1500 requests/day.
 *
 * Uses Expo SDK 54 File class for file access.
 */

import { File, Paths } from 'expo-file-system';
import {
    ITranscriptionProvider,
    TranscriptionResult,
    TranscriptionOptions,
} from './ITranscriptionProvider';
import { supabase } from '../../lib/supabase';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 35000; // 35 seconds (API suggests 32s)

// Supabase Storage bucket name
const BUCKET_NAME = 'audio-recordings';

export class GeminiTranscriptionProvider implements ITranscriptionProvider {
    private resultCallback: ((result: TranscriptionResult) => void) | null = null;
    private errorCallback: ((error: Error) => void) | null = null;
    private _lastResult: TranscriptionResult = {
        transcript: '',
        confidence: 0,
        isFinal: true,
    };

    async isAvailable(): Promise<boolean> {
        return !!GEMINI_API_KEY;
    }

    async requestPermissions(): Promise<boolean> {
        // No special permissions needed for cloud transcription
        return true;
    }

    /**
     * Transcribe audio by downloading, base64 encoding, and sending to Gemini.
     * Supports both local file URIs and Supabase Storage URLs.
     */
    async startTranscription(
        audioUri: string,
        options: TranscriptionOptions = {}
    ): Promise<void> {
        try {
            if (!GEMINI_API_KEY) {
                throw new Error('Gemini API key not configured. Set EXPO_PUBLIC_GEMINI_API_KEY in .env.local');
            }

            console.log('[Gemini] Starting transcription for:', audioUri.substring(0, 60) + '...');

            // Step 1: Get the audio data as base64
            const base64Audio = await this.getAudioBase64(audioUri);
            if (!base64Audio) {
                throw new Error('Failed to read audio file');
            }

            console.log('[Gemini] Audio encoded, size:', Math.round(base64Audio.length / 1024), 'KB base64');

            // Step 2: Determine language instruction
            const language = options.language || 'en-US';
            const languageHint = language.startsWith('zh') ? 'Chinese'
                : language.startsWith('en') ? 'English'
                    : language;

            // Step 3: Call Gemini API
            const prompt = `Transcribe this audio recording accurately in the ORIGINAL language spoken. Do NOT translate. If the speaker speaks Chinese, transcribe in Chinese. If they speak English, transcribe in English. The speaker may be elderly and speak slowly with pauses. Return ONLY the transcribed text, no timestamps, no labels, no explanations. If you cannot understand the audio or it's silent, return an empty string.`;

            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    inline_data: {
                                        mime_type: 'audio/mp4', // .m4a is MP4 container with AAC
                                        data: base64Audio,
                                    },
                                },
                                {
                                    text: prompt,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.1, // Low temperature for accurate transcription
                        maxOutputTokens: 4096,
                    },
                }),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error('[Gemini] API error:', response.status, errorBody);

                // Handle rate limiting with retry
                if (response.status === 429) {
                    throw new Error(`RATE_LIMITED:${errorBody.substring(0, 200)}`);
                }
                throw new Error(`Gemini API error: ${response.status} — ${errorBody.substring(0, 200)}`);
            }

            const data = await response.json();

            // Extract transcript from response
            const transcript = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

            console.log('[Gemini] Transcription result:', transcript.substring(0, 100) + (transcript.length > 100 ? '...' : ''));

            // Store the result
            this._lastResult = {
                transcript,
                confidence: transcript.length > 0 ? 0.9 : 0, // Gemini doesn't return confidence
                isFinal: true,
            };

            // Notify callback if registered
            this.resultCallback?.(this._lastResult);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown transcription error';

            // Auto-retry on rate limit
            if (errorMessage.startsWith('RATE_LIMITED:')) {
                console.log(`[Gemini] Rate limited. Retrying in ${RETRY_DELAY_MS / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));

                // Retry once by calling startTranscription again
                try {
                    console.log('[Gemini] Retrying transcription...');
                    // Re-call with a direct fetch (avoid infinite recursion by not calling startTranscription)
                    const base64Audio = await this.getAudioBase64(audioUri);
                    if (!base64Audio) throw new Error('Failed to read audio on retry');

                    const language = options.language || 'en-US';
                    const languageHint = language.startsWith('zh') ? 'Chinese'
                        : language.startsWith('en') ? 'English' : language;
                    const prompt = `Transcribe this audio recording accurately. The speaker may be elderly and speak slowly with pauses. Language hint: ${languageHint}. Return ONLY the transcribed text, no timestamps, no labels, no explanations. If you cannot understand the audio or it's silent, return an empty string.`;

                    const retryResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ inline_data: { mime_type: 'audio/mp4', data: base64Audio } }, { text: prompt }] }],
                            generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
                        }),
                    });

                    if (!retryResponse.ok) {
                        throw new Error(`Gemini retry failed: ${retryResponse.status}`);
                    }

                    const retryData = await retryResponse.json();
                    const transcript = retryData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
                    console.log('[Gemini] Retry succeeded:', transcript.substring(0, 80));

                    this._lastResult = { transcript, confidence: transcript.length > 0 ? 0.9 : 0, isFinal: true };
                    this.resultCallback?.(this._lastResult);
                    return;
                } catch (retryError) {
                    console.error('[Gemini] Retry also failed:', retryError);
                }
            }

            console.error('[Gemini] Transcription failed:', error);
            this.errorCallback?.(new Error(`Transcription failed: ${errorMessage}`));

            this._lastResult = {
                transcript: '',
                confidence: 0,
                isFinal: true,
            };

            throw error;
        }
    }

    async stopTranscription(): Promise<TranscriptionResult> {
        return this._lastResult;
    }

    onResult(callback: (result: TranscriptionResult) => void): void {
        this.resultCallback = callback;
    }

    onError(callback: (error: Error) => void): void {
        this.errorCallback = callback;
    }

    async cleanup(): Promise<void> {
        this.resultCallback = null;
        this.errorCallback = null;
        this._lastResult = { transcript: '', confidence: 0, isFinal: true };
    }

    async getSupportedLanguages(): Promise<string[]> {
        return ['en-US', 'zh-CN', 'zh-TW', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR'];
    }

    getProviderName(): string {
        return 'gemini-flash';
    }

    // ── Private Helpers ──────────────────────────────────────────────

    /**
     * Get base64 audio data from either a local file or Supabase Storage URL.
     */
    private async getAudioBase64(audioUri: string): Promise<string | null> {
        try {
            // Case 1: Local file — use SDK 54 File.base64()
            if (audioUri.startsWith('file://')) {
                console.log('[Gemini] Reading local file...');
                const file = new File(audioUri);
                if (!file.exists) {
                    console.warn('[Gemini] Local file does not exist:', audioUri);
                    return null;
                }
                const base64 = await file.base64();
                return base64;
            }

            // Case 2: Supabase Storage URL — download via signed URL
            if (audioUri.includes('supabase') && audioUri.includes(BUCKET_NAME)) {
                console.log('[Gemini] Downloading from Supabase Storage...');
                return await this.downloadFromSupabase(audioUri);
            }

            // Case 3: Generic HTTP URL — fetch as blob then convert
            if (audioUri.startsWith('http')) {
                console.log('[Gemini] Downloading from URL...');
                return await this.downloadFromUrl(audioUri);
            }

            console.warn('[Gemini] Unsupported URI scheme:', audioUri.substring(0, 30));
            return null;
        } catch (error) {
            console.error('[Gemini] Failed to read audio:', error);
            return null;
        }
    }

    /**
     * Download audio from a URL, save to temp file, then read as base64.
     */
    private async downloadFromUrl(url: string): Promise<string | null> {
        try {
            const tempFile = new File(Paths.cache, `temp_transcribe_${Date.now()}.m4a`);
            const response = await fetch(url);
            const blob = await response.blob();

            // Convert blob to base64 via reader
            return new Promise<string | null>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result as string;
                    // Strip the data URL prefix (e.g., "data:audio/mp4;base64,")
                    const base64 = result.split(',')[1] || result;
                    resolve(base64);
                };
                reader.onerror = () => {
                    console.error('[Gemini] FileReader error');
                    resolve(null);
                };
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('[Gemini] URL download failed:', error);
            return null;
        }
    }

    /**
     * Download audio from Supabase Storage using a signed URL,
     * then convert to base64.
     */
    private async downloadFromSupabase(storedUrl: string): Promise<string | null> {
        try {
            // Extract the file path from the URL
            const filePath = this.extractFilePath(storedUrl);
            if (!filePath) {
                console.warn('[Gemini] Could not extract file path from URL');
                return null;
            }

            // Generate a signed URL for downloading
            const { data: signedData, error: signedError } = await supabase.storage
                .from(BUCKET_NAME)
                .createSignedUrl(filePath, 300); // 5 min expiry

            if (signedError || !signedData?.signedUrl) {
                console.error('[Gemini] Signed URL error:', signedError);
                return null;
            }

            // Download via the signed URL
            return await this.downloadFromUrl(signedData.signedUrl);
        } catch (error) {
            console.error('[Gemini] Supabase download failed:', error);
            return null;
        }
    }

    /**
     * Extract the file path from a Supabase Storage URL.
     */
    private extractFilePath(url: string): string | null {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            const bucketIndex = pathParts.indexOf(BUCKET_NAME);
            if (bucketIndex === -1) return null;
            return pathParts.slice(bucketIndex + 1).join('/');
        } catch {
            return null;
        }
    }
}
