/**
 * Audio Storage Service - Alternative Implementation
 *
 * This version provides THREE different methods for uploading expo-audio recordings
 * to Supabase Storage in Expo SDK 54. Try them in order until one works.
 */

import { supabase } from '@/lib/supabase';
import { File } from 'expo-file-system';

const BUCKET_NAME = 'recordings';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

class AudioStorageServiceV2 {
  /**
   * METHOD 1: Use expo-file-system SDK 54's File.bytes() API
   * This is the recommended approach for SDK 54
   */
  async uploadAudioMethod1(localUri: string, userId: string): Promise<UploadResult> {
    try {
      console.log('[AudioStorage Method 1] Using File.bytes() API');
      console.log('[AudioStorage Method 1] Starting upload for:', localUri.substring(0, 80));

      const timestamp = Date.now();
      const extension = localUri.split('.').pop() || 'caf';
      const fileName = `${userId}/${timestamp}.${extension}`;

      // Create File instance
      const file = new File(localUri);

      if (!file.exists) {
        throw new Error('File does not exist');
      }

      console.log('[AudioStorage Method 1] File size:', file.size, 'bytes');

      // Read as Uint8Array
      const bytes = await file.bytes();
      const arrayBuffer = bytes.buffer;

      const contentType = file.type || (extension === 'caf' ? 'audio/x-caf' : 'audio/mp4');

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, arrayBuffer, {
          contentType,
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      console.error('[AudioStorage Method 1] Failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * METHOD 2: Use File class as Blob (it implements Blob interface)
   * The File class in SDK 54 extends Blob, so we can use it directly
   */
  async uploadAudioMethod2(localUri: string, userId: string): Promise<UploadResult> {
    try {
      console.log('[AudioStorage Method 2] Using File as Blob');
      console.log('[AudioStorage Method 2] Starting upload for:', localUri.substring(0, 80));

      const timestamp = Date.now();
      const extension = localUri.split('.').pop() || 'caf';
      const fileName = `${userId}/${timestamp}.${extension}`;

      // Create File instance (extends Blob)
      const file = new File(localUri);

      if (!file.exists) {
        throw new Error('File does not exist');
      }

      console.log('[AudioStorage Method 2] File size:', file.size, 'bytes');

      // File extends Blob, so it has arrayBuffer() method
      const arrayBuffer = await (file as any).arrayBuffer();

      const contentType = file.type || (extension === 'caf' ? 'audio/x-caf' : 'audio/mp4');

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, arrayBuffer, {
          contentType,
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      console.error('[AudioStorage Method 2] Failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * METHOD 3: Use XMLHttpRequest (fallback for compatibility)
   * This works with file:// URIs in React Native
   */
  async uploadAudioMethod3(localUri: string, userId: string): Promise<UploadResult> {
    try {
      console.log('[AudioStorage Method 3] Using XMLHttpRequest');
      console.log('[AudioStorage Method 3] Starting upload for:', localUri.substring(0, 80));

      const timestamp = Date.now();
      const extension = localUri.split('.').pop() || 'caf';
      const fileName = `${userId}/${timestamp}.${extension}`;

      // Read file using XMLHttpRequest
      const blob = await new Promise<Blob>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(xhr.response);
          } else {
            reject(new Error(`XHR failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('XHR request failed'));
        xhr.responseType = 'blob';
        xhr.open('GET', localUri, true);
        xhr.send(null);
      });

      console.log('[AudioStorage Method 3] Blob size:', blob.size, 'bytes');

      const arrayBuffer = await blob.arrayBuffer();

      const contentType = extension === 'caf' ? 'audio/x-caf' : 'audio/mp4';

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, arrayBuffer, {
          contentType,
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      console.error('[AudioStorage Method 3] Failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Main upload method - tries all methods in sequence
   */
  async uploadAudio(localUri: string, userId: string): Promise<UploadResult> {
    console.log('[AudioStorage] Attempting upload with multiple methods...');

    // Try Method 1: File.bytes() (recommended for SDK 54)
    let result = await this.uploadAudioMethod1(localUri, userId);
    if (result.success) {
      console.log('[AudioStorage] Method 1 succeeded');
      return result;
    }

    // Try Method 2: File as Blob
    console.log('[AudioStorage] Method 1 failed, trying Method 2...');
    result = await this.uploadAudioMethod2(localUri, userId);
    if (result.success) {
      console.log('[AudioStorage] Method 2 succeeded');
      return result;
    }

    // Try Method 3: XMLHttpRequest (fallback)
    console.log('[AudioStorage] Method 2 failed, trying Method 3...');
    result = await this.uploadAudioMethod3(localUri, userId);
    if (result.success) {
      console.log('[AudioStorage] Method 3 succeeded');
      return result;
    }

    console.error('[AudioStorage] All methods failed');
    return {
      success: false,
      error: 'All upload methods failed',
    };
  }

  /**
   * Delete audio file from Supabase Storage
   */
  async deleteAudio(url: string): Promise<boolean> {
    try {
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

  isSupabaseUrl(url: string): boolean {
    return url.includes('supabase') && url.includes(BUCKET_NAME);
  }
}

export const audioStorageServiceV2 = new AudioStorageServiceV2();
export default audioStorageServiceV2;
