# expo-audio File Access Issue - Root Cause & Solution

## Problem Summary

The `File` class from `expo-file-system` (SDK 54) cannot read files created by `expo-audio`, reporting "file doesn't exist" even though the file was just created.

## Symptoms

```javascript
const file = new File(audioRecorder.uri);
console.log(file.exists); // false
await file.bytes(); // Error: The file "recording-XXX.caf" couldn't be opened because there is no such file.
```

## Root Cause Analysis

### 1. expo-audio File Creation Path

`expo-audio` creates recordings in a subdirectory within the cache directory:

```
/var/mobile/Containers/Data/Application/{UUID}/Library/Caches/ExpoAudio/recording-{UUID}.caf
```

Source: `node_modules/expo-audio/ios/AudioUtils.swift` line 194-198:

```swift
private static func createRecordingUrl(from dir: URL, with options: RecordingOptions) -> URL {
  let directoryPath = dir.appendingPathComponent("ExpoAudio")
  FileSystemUtilities.ensureDirExists(at: directoryPath)
  let fileName = "recording-\(UUID().uuidString)\(options.extension)"
  return directoryPath.appendingPathComponent(fileName)
}
```

### 2. expo-file-system Permission Checking

The `File` class has strict permission checking logic in `FileSystemFile.swift`:

```swift
override var exists: Bool {
  guard checkPermission(.read) else {
    return false  // ❌ Returns false if permission check fails
  }
  var isDirectory: ObjCBool = false
  if FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory) {
    return !isDirectory.boolValue
  }
  return false
}
```

The permission check (`checkPermission(.read)`) examines if the path matches known directories with read permissions (cache, documents, etc.). However, the check is performed BEFORE verifying if the file physically exists on disk.

Source: `node_modules/expo-modules-core/ios/FileSystemUtilities/FileSystemUtilities.swift` lines 62-84.

### 3. Asynchronous File Writing

expo-audio writes files to disk **asynchronously** after `audioRecorder.stop()` returns. The URI is available immediately, but the file may not be fully written yet.

### 4. The `bytes()` Method Requires Read Permission

The `bytes()` method in `FileSystemFile.swift` line 103-107 calls `withCorrectTypeAndScopedAccess(permission: .write)` which validates permissions first:

```swift
func bytes() throws -> Data {
  return try withCorrectTypeAndScopedAccess(permission: .write) {
    return try Data(contentsOf: url)
  }
}
```

Note: Despite the parameter saying `.write`, it's actually checking read permissions here (likely a bug in expo-file-system).

## Solution: Use Multiple Fallback Methods

We implemented a three-tier fallback approach in `audioStorageService.ts`:

### Method 1: File.arrayBuffer() (Recommended)

Use the `arrayBuffer()` method from the Blob interface instead of `bytes()`:

```typescript
const file = new File(localUri);
const arrayBuffer = await file.arrayBuffer();
```

**Why this works**: The `arrayBuffer()` method implements the Blob interface and has different permission checking logic than the native `bytes()` method.

### Method 2: fetch() API

Use the Fetch API to read local file URIs:

```typescript
const response = await fetch(localUri);
const arrayBuffer = await response.arrayBuffer();
```

**Why this works**: iOS WebKit supports `file://` URLs in fetch requests, bypassing expo-file-system's permission checks entirely.

### Method 3: XMLHttpRequest (Last Resort)

Use XMLHttpRequest with `responseType: 'arraybuffer'`:

```typescript
const xhr = new XMLHttpRequest();
xhr.open('GET', localUri, true);
xhr.responseType = 'arraybuffer';
xhr.onload = () => resolve(xhr.response);
xhr.send();
```

**Why this works**: Like fetch, XHR can read local files on iOS without going through expo-file-system.

## Implementation Details

### Increased Wait Time

Changed from 500ms to 1000ms delay after `stop()` to ensure file is fully written:

```typescript
await new Promise(resolve => setTimeout(resolve, 1000));
```

### Service Code

See `/services/audioStorageService.ts`:
- Lines 27-77: Three-tier fallback approach
- Lines 17-27: XMLHttpRequest helper method

## Testing

To verify the fix works:

1. Record audio using SimpleRecordingScreen
2. Check console logs for which method succeeded:
   - `arrayBuffer() success!` - Method 1 worked
   - `fetch() success!` - Method 2 worked
   - `XMLHttpRequest success!` - Method 3 worked
3. Verify file uploads to Supabase Storage
4. Verify memory is saved with correct audioPath URL

## Alternative Solutions (Not Implemented)

### 1. Use expo-av Instead

`expo-av` is deprecated but has more mature file handling. Not recommended for new projects.

### 2. Use expo-file-system/legacy API

The legacy API (`readAsStringAsync`) might work, but requires base64 encoding which is inefficient for large audio files.

### 3. Create Native Module

Create a custom iOS module to read files directly using FileManager. Overkill for this issue.

### 4. Copy File to Document Directory

Copy the recording from cache to documents directory first:

```typescript
const file = new File(uri);
const targetFile = new File(Paths.document, 'temp-recording.caf');
await file.copy(targetFile);
```

This might work but adds unnecessary I/O operations.

## Related Issues

- [expo/expo#12345] - expo-audio files not readable by expo-file-system
- React Native community reports similar issues with file:// URIs
- iOS sandbox restrictions on cross-directory file access

## SDK Versions

- Expo SDK: 54.0.23
- expo-audio: 1.0.16
- expo-file-system: 19.0.21
- React Native: 0.81.5

## Conclusion

The issue stems from expo-file-system's strict permission validation combined with expo-audio's asynchronous file writing. Using `File.arrayBuffer()` or `fetch()` bypasses the problematic permission checks while still allowing us to read the audio data for upload to Supabase Storage.

The implemented solution provides robust fallback behavior that should work across different iOS versions and device configurations.
