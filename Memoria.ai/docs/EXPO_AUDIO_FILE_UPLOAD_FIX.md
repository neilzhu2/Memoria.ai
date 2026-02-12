# Expo SDK 54: Fixing expo-audio File Upload to Supabase Storage

## Problem Summary

When trying to upload audio recordings created by `expo-audio` to Supabase Storage in Expo SDK 54, multiple file reading approaches fail:

1. **expo-file-system new API** (`File` class): `file.exists` returns `false`
2. **expo-file-system readAsStringAsync**: `Cannot read property 'Base64' of undefined`
3. **expo-file-system/legacy readAsStringAsync**: `Calling the 'readAsStringAsync' function has failed`
4. **fetch(fileUri)**: `Network request failed` (fetch doesn't support `file://` URIs)
5. **XMLHttpRequest**: May work but not the recommended SDK 54 approach

Recording URI format: `file:///var/mobile/Containers/Data/Application/.../Library/Caches/ExpoAudio/recording-XXX.caf`

## Root Cause

The issue stems from how Expo SDK 54's new file system API works with files created by `expo-audio`:

1. **File path construction**: The `File` class constructor in SDK 54 expects either:
   - Multiple path segments: `new File(Paths.cache, "subdirectory", "file.caf")`
   - A properly formatted file URI: `new File("file:///full/path/to/file.caf")`

2. **expo-audio recording location**: expo-audio creates files in `Library/Caches/ExpoAudio/` which may not be properly recognized by the File class when passed as a raw URI string.

3. **API changes in SDK 54**: The file system API was completely rewritten in SDK 54 with new `File` and `Directory` classes that have different behavior than the legacy API.

## Solution

Use the **Expo SDK 54 `expo-file-system` File class** with its new `bytes()` method:

```typescript
import { File } from 'expo-file-system';

async function uploadAudio(localUri: string, userId: string) {
  // Create a File instance from the expo-audio recording URI
  const file = new File(localUri);

  // Check if file exists
  if (!file.exists) {
    throw new Error('Recording file not found');
  }

  // Read file as Uint8Array using SDK 54's new API
  const bytes = await file.bytes();

  // Convert to ArrayBuffer for Supabase upload
  const arrayBuffer = bytes.buffer;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('recordings')
    .upload(`${userId}/${timestamp}.caf`, arrayBuffer, {
      contentType: 'audio/x-caf',
      cacheControl: '3600',
      upsert: false,
    });

  return data;
}
```

## Implementation Steps

### Step 1: Update audioStorageService.ts

Replace the XMLHttpRequest approach with the File.bytes() API:

```typescript
import { File } from 'expo-file-system';

// Create File instance
const file = new File(localUri);

// Verify existence
if (!file.exists) {
  throw new Error('Recording file not found');
}

// Read as bytes (recommended for SDK 54)
const bytes = await file.bytes();
const arrayBuffer = bytes.buffer;

// Upload to Supabase
await supabase.storage.from(BUCKET_NAME).upload(fileName, arrayBuffer, {
  contentType: file.type || 'audio/x-caf',
  cacheControl: '3600',
  upsert: false,
});
```

### Step 2: Test the Implementation

Use the provided test script to verify all file reading methods:

```typescript
import { testAudioFileReading } from '@/scripts/testAudioFileRead';

// After recording completes
const uri = audioRecorder.uri;
if (uri) {
  const testResults = await testAudioFileReading(uri);
  console.log('Test results:', testResults);
}
```

## Alternative Approaches

### Approach 1: File.bytes() (Recommended)
**Pros**: Native SDK 54 API, proper file system integration
**Cons**: Requires expo-file-system to be installed

```typescript
const file = new File(localUri);
const bytes = await file.bytes();
const arrayBuffer = bytes.buffer;
```

### Approach 2: File as Blob (arrayBuffer)
**Pros**: Uses Blob interface, standard Web API
**Cons**: File class implements Blob but may not expose arrayBuffer() in TypeScript types

```typescript
const file = new File(localUri);
const arrayBuffer = await (file as any).arrayBuffer();
```

### Approach 3: XMLHttpRequest (Fallback)
**Pros**: Works with file:// URIs, battle-tested
**Cons**: Not the intended SDK 54 approach, may be deprecated

```typescript
const blob = await new Promise<Blob>((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.onload = () => resolve(xhr.response);
  xhr.onerror = () => reject(new Error('XHR failed'));
  xhr.responseType = 'blob';
  xhr.open('GET', localUri, true);
  xhr.send(null);
});
const arrayBuffer = await blob.arrayBuffer();
```

## Why NOT to Switch to expo-av

You asked about switching to `expo-av` (deprecated). **Don't do this because**:

1. **expo-av is deprecated** in favor of expo-audio/expo-video
2. **expo-audio is the modern replacement** with better API design
3. **The file reading issue is NOT caused by expo-audio** - it's a file system API understanding issue
4. **expo-av would have the same problem** - it also creates files that need to be read from the file system

## File System Changes in Expo SDK 54

Expo SDK 54 introduced major file system improvements:

### New Features
- **Object-oriented API**: `File` and `Directory` classes
- **Blob support**: File extends Blob interface
- **Stream support**: `readableStream()` and `writableStream()`
- **SAF support on Android**: Storage Access Framework URIs
- **Bundled assets**: Direct access to app bundle files

### Key Methods
- `file.exists`: Boolean property to check file existence
- `file.bytes()`: Read as Uint8Array (preferred for binary files)
- `file.base64()`: Read as base64 string
- `file.text()`: Read as UTF-8 text
- `file.arrayBuffer()`: Read as ArrayBuffer (Blob interface)

### Migration from Legacy API
- Old: `FileSystem.readAsStringAsync(uri, { encoding: 'base64' })`
- New: `const file = new File(uri); await file.base64()`

## Common Issues and Solutions

### Issue 1: "File does not exist"
**Cause**: Incorrect URI or file hasn't been fully written yet
**Solution**: Add a small delay after recording stops
```typescript
await audioRecorder.stop();
await new Promise(resolve => setTimeout(resolve, 500)); // Wait for file write
const uri = audioRecorder.uri;
```

### Issue 2: "Cannot read property 'Base64' of undefined"
**Cause**: Using legacy API that was removed in SDK 54
**Solution**: Use new File class API instead of FileSystem.readAsStringAsync

### Issue 3: Zero-byte file on Android
**Cause**: Known bug in expo-audio SDK 54 on Android (Issue #39646)
**Solution**: Check file.size before uploading:
```typescript
const file = new File(uri);
if (file.size === 0) {
  throw new Error('Recording file is empty');
}
```

## Performance Considerations

### Memory Usage
- `file.bytes()`: Loads entire file into memory as Uint8Array
- `file.base64()`: Loads and encodes (1.33x file size)
- `file.arrayBuffer()`: Loads entire file into memory as ArrayBuffer

For large audio files (>10MB), consider using streams:
```typescript
const file = new File(localUri);
const stream = file.readableStream();
// Process stream in chunks
```

### Recommended Approach
For typical audio recordings (<5 minutes, <10MB):
- Use `file.bytes()` - simplest and most reliable
- Convert to ArrayBuffer for upload
- Supabase accepts ArrayBuffer directly

## Testing Your Implementation

1. **Record a test audio** using expo-audio
2. **Run the test script** to verify all methods work
3. **Check file properties**: size, type, exists
4. **Attempt upload** to Supabase Storage
5. **Verify upload** by downloading and playing the file

## References

- [Expo SDK 54 File System Blog Post](https://expo.dev/blog/expo-file-system)
- [Expo FileSystem API Documentation](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [Expo Audio Documentation](https://docs.expo.dev/versions/latest/sdk/audio/)
- [Supabase Storage with React Native](https://supabase.com/blog/react-native-storage)
- [GitHub Issue #39646: Android zero-byte file bug](https://github.com/expo/expo/issues/39646)

## Summary

**The correct approach for Expo SDK 54**:
1. Use `expo-file-system`'s new `File` class
2. Read files with `file.bytes()` method
3. Convert Uint8Array to ArrayBuffer: `bytes.buffer`
4. Upload ArrayBuffer to Supabase Storage
5. Do NOT use legacy FileSystem.readAsStringAsync
6. Do NOT switch to deprecated expo-av
7. XMLHttpRequest is a fallback, not the primary solution

This approach leverages the new SDK 54 file system API properly and provides the best performance and maintainability.
