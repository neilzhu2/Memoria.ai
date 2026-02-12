/**
 * Test Script: Debug expo-audio file reading in Expo SDK 54
 *
 * This script tests all available methods to read audio files created by expo-audio
 * Run this in your React Native app to diagnose file reading issues
 */

import { File } from 'expo-file-system';

interface TestResult {
  method: string;
  success: boolean;
  error?: string;
  fileSize?: number;
  fileType?: string;
  details?: any;
}

export async function testAudioFileReading(recordingUri: string): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log('\n========================================');
  console.log('TESTING AUDIO FILE READING');
  console.log('URI:', recordingUri);
  console.log('========================================\n');

  // TEST 1: expo-file-system File class - exists property
  try {
    console.log('[TEST 1] Checking if file exists using File.exists...');
    const file = new File(recordingUri);
    const exists = file.exists;
    const size = file.size;
    const type = file.type;

    results.push({
      method: 'File.exists',
      success: exists,
      fileSize: size,
      fileType: type,
      details: { exists, size, type, uri: file.uri },
    });

    console.log('[TEST 1] Result:', exists ? 'EXISTS' : 'NOT FOUND');
    console.log('[TEST 1] Size:', size, 'bytes');
    console.log('[TEST 1] Type:', type);
  } catch (error) {
    console.error('[TEST 1] Error:', error);
    results.push({
      method: 'File.exists',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // TEST 2: expo-file-system File.bytes()
  try {
    console.log('\n[TEST 2] Reading file using File.bytes()...');
    const file = new File(recordingUri);
    const bytes = await file.bytes();

    results.push({
      method: 'File.bytes()',
      success: true,
      fileSize: bytes.length,
      details: { bytesLength: bytes.length, bufferByteLength: bytes.buffer.byteLength },
    });

    console.log('[TEST 2] Success! Read', bytes.length, 'bytes');
  } catch (error) {
    console.error('[TEST 2] Error:', error);
    results.push({
      method: 'File.bytes()',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // TEST 3: expo-file-system File.base64()
  try {
    console.log('\n[TEST 3] Reading file using File.base64()...');
    const file = new File(recordingUri);
    const base64 = await file.base64();

    results.push({
      method: 'File.base64()',
      success: true,
      fileSize: base64.length,
      details: { base64Length: base64.length },
    });

    console.log('[TEST 3] Success! Read', base64.length, 'base64 characters');
  } catch (error) {
    console.error('[TEST 3] Error:', error);
    results.push({
      method: 'File.base64()',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // TEST 4: expo-file-system File.text()
  try {
    console.log('\n[TEST 4] Reading file using File.text()...');
    const file = new File(recordingUri);
    const text = await file.text();

    results.push({
      method: 'File.text()',
      success: true,
      fileSize: text.length,
      details: { textLength: text.length },
    });

    console.log('[TEST 4] Success! Read', text.length, 'characters (note: binary data as text)');
  } catch (error) {
    console.error('[TEST 4] Error:', error);
    results.push({
      method: 'File.text()',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // TEST 5: File as Blob with arrayBuffer()
  try {
    console.log('\n[TEST 5] Reading file using File as Blob (arrayBuffer)...');
    const file = new File(recordingUri) as any;
    const arrayBuffer = await file.arrayBuffer();

    results.push({
      method: 'File.arrayBuffer() (as Blob)',
      success: true,
      fileSize: arrayBuffer.byteLength,
      details: { bufferByteLength: arrayBuffer.byteLength },
    });

    console.log('[TEST 5] Success! ArrayBuffer size:', arrayBuffer.byteLength, 'bytes');
  } catch (error) {
    console.error('[TEST 5] Error:', error);
    results.push({
      method: 'File.arrayBuffer() (as Blob)',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // TEST 6: XMLHttpRequest
  try {
    console.log('\n[TEST 6] Reading file using XMLHttpRequest...');
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
      xhr.open('GET', recordingUri, true);
      xhr.send(null);
    });

    results.push({
      method: 'XMLHttpRequest',
      success: true,
      fileSize: blob.size,
      fileType: blob.type,
      details: { blobSize: blob.size, blobType: blob.type },
    });

    console.log('[TEST 6] Success! Blob size:', blob.size, 'bytes');
  } catch (error) {
    console.error('[TEST 6] Error:', error);
    results.push({
      method: 'XMLHttpRequest',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // TEST 7: Direct fetch (expected to fail but let's try)
  try {
    console.log('\n[TEST 7] Reading file using fetch()...');
    const response = await fetch(recordingUri);
    const blob = await response.blob();

    results.push({
      method: 'fetch()',
      success: true,
      fileSize: blob.size,
      details: { blobSize: blob.size },
    });

    console.log('[TEST 7] Success! Blob size:', blob.size, 'bytes');
  } catch (error) {
    console.error('[TEST 7] Error (expected):', error);
    results.push({
      method: 'fetch()',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  console.log('\n========================================');
  console.log('TEST RESULTS SUMMARY');
  console.log('========================================');
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.method}:`);
    console.log('   Success:', result.success);
    if (result.success) {
      console.log('   File size:', result.fileSize, 'bytes');
      if (result.fileType) console.log('   File type:', result.fileType);
    } else {
      console.log('   Error:', result.error);
    }
  });

  const successfulMethods = results.filter(r => r.success);
  console.log('\n========================================');
  console.log('SUCCESSFUL METHODS:', successfulMethods.length, '/', results.length);
  console.log('========================================\n');

  return results;
}

// Helper function to add to your recording screen for quick testing
export function addTestButton(recordingUri: string) {
  console.log('To test file reading, call: testAudioFileReading("' + recordingUri + '")');
}
