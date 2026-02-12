/**
 * Audio Storage Service
 * Uploads audio recordings to Supabase Storage for permanent, reliable access
 */

import { supabase } from '@/lib/supabase';
import { File } from 'expo-file-system';

const BUCKET_NAME = 'audio-recordings';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

class AudioStorageService {
  /**
   * Read file using XMLHttpRequest as a fallback method
   * @param uri - File URI to read
   * @returns ArrayBuffer of file contents
   */
  private readFileViaXHR(uri: string): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', uri, true);
      xhr.responseType = 'arraybuffer';

      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(xhr.response as ArrayBuffer);
        } else {
          reject(new Error(`XHR failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('XHR network error'));
      };

      xhr.send();
    });
  }

  /**
   * Upload audio file to Supabase Storage
   * @param localUri - Local file URI (file:///...)
   * @param userId - User ID for organizing files
   * @returns Public URL of uploaded file
   */
  async uploadAudio(localUri: string, userId: string): Promise<UploadResult> {
    try {
      console.log('[AudioStorage] Starting upload for:', localUri.substring(0, 80));

      // Generate unique filename
      const timestamp = Date.now();
      const extension = localUri.split('.').pop() || 'caf';
      const fileName = `${userId}/${timestamp}.${extension}`;

      console.log('[AudioStorage] Target path:', fileName);

      // SOLUTION: expo-audio writes files asynchronously to disk
      // The File class exists check returns false even though the file is being written
      // We need to use arrayBuffer() from the Blob interface instead of bytes()

      let arrayBuffer: ArrayBuffer;

      // Multi-method read with retries.
      // IMPORTANT: fetch() is the PRIMARY method — proven to work on ExpoAudio cache URIs.
      // The Nitro File API CANNOT read cache files (see RECORDING_FEATURE_FINDINGS.md).
      console.log('[AudioStorage] Attempting to read file contents...');

      const tryRead = async (): Promise<ArrayBuffer | null> => {
        // Approach 1 (PRIMARY): fetch() — works on cache URIs
        try {
          const response = await fetch(localUri);
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            if (buffer && buffer.byteLength > 0) {
              console.log('[AudioStorage] fetch() read success! Size:', buffer.byteLength);
              return buffer;
            }
          }
        } catch (e) {
          console.log('[AudioStorage] fetch() failed, trying next...');
        }

        // Approach 2: XMLHttpRequest
        try {
          const buffer = await this.readFileViaXHR(localUri);
          if (buffer && buffer.byteLength > 0) {
            console.log('[AudioStorage] XHR read success! Size:', buffer.byteLength);
            return buffer;
          }
        } catch (e) {
          console.log('[AudioStorage] XHR failed, trying next...');
        }

        // Approach 3 (FALLBACK): Nitro File API — only works on document dir files
        try {
          const file = new File(localUri);
          if (file.exists) {
            const buffer = await file.arrayBuffer();
            if (buffer && buffer.byteLength > 0) {
              console.log('[AudioStorage] Nitro read success! Size:', buffer.byteLength);
              return buffer;
            }
          }
        } catch (e) { /* ignore */ }

        return null;
      };

      // Retry up to 5 times with 500ms delay (total ~2.5s wait)
      let readRetries = 5;
      arrayBuffer = null as any;

      while (readRetries > 0) {
        const result = await tryRead();
        if (result) {
          arrayBuffer = result;
          break;
        }
        readRetries--;
        if (readRetries > 0) {
          console.log(`[AudioStorage] All read methods failed, retrying in 500ms... (${readRetries} left)`);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (!arrayBuffer) {
        console.error('[AudioStorage] All read methods failed after retries for:', localUri);
        return {
          success: false,
          error: `Cannot read recording file after retries. Path: ${localUri}`,
        };
      }

      // Determine content type from extension
      const contentType = extension === 'caf' ? 'audio/x-caf' :
        extension === 'm4a' ? 'audio/mp4' :
          'audio/mpeg';

      console.log('[AudioStorage] Content type:', contentType);
      console.log('[AudioStorage] ArrayBuffer size:', arrayBuffer.byteLength);

      // Upload to Supabase Storage
      console.log('[AudioStorage] Uploading to Supabase...');
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, arrayBuffer, {
          contentType,
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('[AudioStorage] Upload error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('[AudioStorage] Upload successful:', data.path);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      console.log('[AudioStorage] Public URL:', urlData.publicUrl);

      return {
        success: true,
        url: urlData.publicUrl,
      };
    } catch (error) {
      console.error('[AudioStorage] Exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete audio file from Supabase Storage
   * @param url - Public URL of the file
   */
  async deleteAudio(url: string): Promise<boolean> {
    try {
      // Extract path from URL
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.indexOf(BUCKET_NAME);
      if (bucketIndex === -1) return false;

      const filePath = pathParts.slice(bucketIndex + 1).join('/');

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('[AudioStorage] Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[AudioStorage] Delete exception:', error);
      return false;
    }
  }

  /**
   * Extract file path from a Supabase Storage URL
   * Works with both public URLs and signed URLs
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

  /**
   * Get a signed URL for secure audio playback.
   * Signed URLs expire after 1 hour — generate fresh ones before each playback.
   * Works with private buckets (no public access needed).
   */
  async getSignedPlaybackUrl(storedUrl: string): Promise<string | null> {
    try {
      const filePath = this.extractFilePath(storedUrl);
      if (!filePath) {
        console.warn('[AudioStorage] Could not extract file path from URL:', storedUrl);
        return null;
      }

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        console.error('[AudioStorage] Signed URL error:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('[AudioStorage] Signed URL exception:', error);
      return null;
    }
  }

  /**
   * Check if a URL is a Supabase Storage URL
   */
  isSupabaseUrl(url: string): boolean {
    return url.includes('supabase') && url.includes(BUCKET_NAME);
  }
}

export const audioStorageService = new AudioStorageService();
export default audioStorageService;
