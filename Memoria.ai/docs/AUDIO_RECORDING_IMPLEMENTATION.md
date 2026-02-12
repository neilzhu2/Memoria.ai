# Audio Recording Implementation - Struggles & Learnings

## Overview

This document captures the challenges, learnings, and solutions discovered while implementing audio recording persistence in Memoria.ai.

## The Core Problem

Audio recordings made with `expo-audio` are saved to a **temporary cache directory** (`Library/Caches/ExpoAudio/`) that iOS can clear at any time. For recordings to persist and be playable later, they must be copied to a **permanent location** (`documentDirectory`).

## Technology Stack

- **expo-audio** (v15.x) - Recording API using `useAudioRecorder` hook
- **expo-file-system** (v19.x) - File operations (new API with File/Directory classes)
- **Expo SDK 54** - Latest SDK with new architecture

## Timeline of Issues

### Issue 1: UUID Validation Error ✅ SOLVED

**Error**: `"invalid input syntax for type uuid: 'childhood-home'"`

**Cause**: ThemeSelectionModal used hardcoded string IDs while the database expected UUIDs.

**Solution**:
- Refactored ThemeSelectionModal to use `topicsService.getAllTopics()` from database
- Added UUID validation utility (`lib/uuid.ts`) before database insert
- Invalid IDs converted to `null` instead of crashing

### Issue 2: Supabase Connection Timeouts ✅ SOLVED

**Error**: `"Supabase insert timeout after 30 seconds"`

**Cause**:
1. Slow LTE + tunnel connection
2. Known React Native auth deadlock bug with Supabase's Web Locks API

**Solution**:
- Increased timeout from 30s to 60s
- Added `noOpLock` workaround for auth deadlock ([GitHub Issue #1594](https://github.com/supabase/supabase-js/issues/1594))

```typescript
const noOpLock = async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
  return await fn();
};

export const supabase = createClient(url, key, {
  auth: {
    lock: noOpLock, // Fix for auth deadlock on React Native
  },
});
```

### Issue 3: Audio Playback Fails ✅ DIAGNOSED, ❌ SOLVING

**Error**: `"Failed to load audio file"` / `"The file couldn't be opened"`

**Cause**: Recording saved to cache directory, file may be deleted by iOS before playback.

**Attempted Solutions**:

#### Attempt 1: New expo-file-system API (File/Directory classes)
```typescript
import { File, Directory, Paths } from 'expo-file-system';

const recordingsDir = new Directory(Paths.document, 'recordings');
if (!recordingsDir.exists) {
  recordingsDir.create();
}

const sourceFile = new File(uri);  // uri = "file:///var/mobile/.../recording.caf"
const destFile = new File(recordingsDir, fileName);
sourceFile.copy(destFile);  // ERROR: "file couldn't be opened"
```
**Result**: Failed - "The file couldn't be opened"

#### Attempt 2: Legacy expo-file-system API
```typescript
import * as FileSystem from 'expo-file-system';

await FileSystem.makeDirectoryAsync(recordingsDir, { intermediates: true });
await FileSystem.copyAsync({ from: uri, to: permanentPath });
```
**Result**: Failed - "Method copyAsync imported from expo-file-system is deprecated"

#### Attempt 3: Mixed approaches
- Checking directory existence with `getInfoAsync` - deprecated
- Using `await` on synchronous methods - API mismatch
- Different path formats - same errors

## Root Cause Analysis

### Why File Copy Fails

1. **API Transition**: Expo SDK 54 deprecated the legacy FileSystem API but the new File/Directory API has issues with `file://` URIs from expo-audio

2. **No Custom Output Path**: Neither `expo-audio` nor `expo-av` support specifying a custom recording output directory. Recordings always go to cache first.

3. **Possible File Handle Issue**: The recording file may still be locked or not fully flushed when copy is attempted

### Community Findings

From [expo/expo GitHub issues](https://github.com/expo/expo/issues):

- **Issue #25842**: "Recording files from Expo AV get corrupted" when moving to documentDirectory
- **Issue #39646**: "expo-audio recorder returns URI for zero-byte audio file" (SDK 54, Android)
- **Issue #38447**: Documentation gaps between expo-file-system and expo-file-system/next

## Alternative Approaches to Consider

### Option A: Use expo-av (Legacy)
The deprecated `expo-av` may have better compatibility with file operations:
```typescript
import { Audio } from 'expo-av';
const recording = new Audio.Recording();
await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
await recording.startAsync();
// ...
await recording.stopAndUnloadAsync();
const uri = recording.getURI();
```

### Option B: @siteed/expo-audio-studio
Third-party library with advanced features:
- Dual-stream recording (raw PCM + compressed)
- Better file management
- [GitHub](https://github.com/deeeed/expo-audio-stream)

### Option C: Strip file:// Prefix
The File class may expect paths without the `file://` prefix:
```typescript
const pathWithoutPrefix = uri.replace('file://', '');
const sourceFile = new File(pathWithoutPrefix);
```

### Option D: Add Delay Before Copy
File may not be fully written immediately:
```typescript
await audioRecorder.stop();
await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
// Then copy
```

### Option E: Cloud Storage
Upload directly to Supabase Storage instead of local persistence, eliminating file system issues.

## Learnings

1. **SDK Transitions Are Painful**: Expo SDK 54's file system API transition broke many existing patterns
2. **Documentation Gaps**: New APIs aren't always fully documented for edge cases
3. **Cache vs Document Directory**: Critical distinction for data persistence on iOS
4. **Test on Device Early**: Many file system issues only appear on real devices, not simulators
5. **Community Issues Are Valuable**: GitHub issues often reveal problems before documentation is updated

## Current Status

- **Recording**: Working (saves to database) ✅
- **Topic System**: Working (unified backend with UUIDs) ✅
- **Free-Style Recording**: Working ✅
- **Audio Persistence**: ✅ Using Supabase Storage with File.bytes() API
- **Playback**: ✅ Cloud URLs (testing)

## Supabase Storage Upload Attempts (All Failed)

### Attempt 1: expo-file-system readAsStringAsync (new API)
```typescript
import * as FileSystem from 'expo-file-system';
const base64Data = await FileSystem.readAsStringAsync(localUri, {
  encoding: FileSystem.EncodingType.Base64,
});
```
**Error**: `Cannot read property 'Base64' of undefined`
**Cause**: SDK 54's new expo-file-system doesn't export EncodingType

### Attempt 2: expo-file-system/legacy readAsStringAsync
```typescript
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
const base64Data = await readAsStringAsync(localUri, {
  encoding: EncodingType.Base64,
});
```
**Error**: `Calling the 'readAsStringAsync' function has failed. Caused by: File '/var/mobile/...'`
**Cause**: Same incompatibility - expo-file-system (even legacy) cannot access expo-audio files

### Attempt 3: fetch() to read local file
```typescript
const response = await fetch(localUri);
const blob = await response.blob();
const arrayBuffer = await blob.arrayBuffer();
```
**Error**: `Network request failed`
**Cause**: fetch() in React Native doesn't support file:// URIs - it's for network requests only

### Attempt 4: XMLHttpRequest with file:// URI
```typescript
const xhr = new XMLHttpRequest();
xhr.responseType = 'blob';
xhr.open('GET', localUri, true);
xhr.send(null);
```
**Result**: Testing...

### Attempt 5: SDK 54 File.bytes() API ❌ FAILED
```typescript
import { File } from 'expo-file-system';

const file = new File(localUri);
if (!file.exists) { throw new Error('File not found'); }
const bytes = await file.bytes();
```
**Error**: `Recording file not found` - `file.exists` still returns `false`
**Cause**: The File class fundamentally cannot see expo-audio files, regardless of which method we use

### Attempt 6: Skip existence check, try bytes() directly
Testing if `file.bytes()` works even when `file.exists` returns false...

## Root Cause Confirmed

The `expo-file-system` File class (SDK 54) **cannot access files created by `expo-audio`**:
- `new File(uri).exists` returns `false` for expo-audio recordings
- Both with and without `file://` prefix fail
- 500ms delay doesn't help

This appears to be a compatibility issue between expo-file-system v19 and expo-audio in SDK 54.

## Solution: Supabase Storage

Instead of fighting the local file system issues, we bypass them entirely by uploading directly to Supabase Storage:

```typescript
// services/audioStorageService.ts
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

// Read file as base64 (this works even when File class doesn't)
const base64Data = await FileSystem.readAsStringAsync(localUri, {
  encoding: FileSystem.EncodingType.Base64,
});

// Convert and upload to Supabase Storage
const arrayBuffer = decode(base64Data);
const { data, error } = await supabase.storage
  .from('recordings')
  .upload(fileName, arrayBuffer, { contentType: 'audio/x-caf' });

// Get public URL for playback
const { data: urlData } = supabase.storage
  .from('recordings')
  .getPublicUrl(fileName);
```

**Benefits:**
- ✅ Bypasses expo-file-system File class issues
- ✅ Audio files persist permanently in cloud
- ✅ Files survive app reinstalls
- ✅ URLs work for playback across devices
- ✅ No iOS cache cleanup concerns

**Requirements:**
- Supabase project with Storage enabled
- "recordings" bucket created in Supabase Dashboard
- Bucket configured for public access (or use signed URLs)

## Supabase Storage Setup

1. Go to Supabase Dashboard → Storage
2. Create bucket named "recordings"
3. Set bucket to public (for easy playback) or configure RLS policies
4. Ensure your Supabase URL and anon key are in `.env`

## Previous Workaround (Deprecated)

Used cache path directly as fallback - no longer needed with cloud storage.

## References

- [Expo Audio Documentation](https://docs.expo.dev/versions/latest/sdk/audio/)
- [Expo FileSystem Documentation](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [Expo FileSystem Legacy](https://docs.expo.dev/versions/latest/sdk/filesystem-legacy/)
- [Supabase Auth Deadlock Issue #1594](https://github.com/supabase/supabase-js/issues/1594)
- [Expo File System SDK 54 Blog](https://expo.dev/blog/expo-file-system)
