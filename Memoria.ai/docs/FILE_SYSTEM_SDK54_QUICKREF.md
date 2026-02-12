# Expo SDK 54 File System - Quick Reference

## Import

```typescript
import { File, Directory, Paths } from 'expo-file-system';
```

## Common Operations

### Check if File Exists
```typescript
const file = new File(uri);
if (file.exists) {
  console.log('File exists, size:', file.size, 'bytes');
}
```

### Read File

```typescript
// Binary data (recommended for audio, images)
const bytes = await file.bytes();          // Uint8Array
const arrayBuffer = bytes.buffer;          // ArrayBuffer

// Base64 string
const base64 = await file.base64();

// Text content
const text = await file.text();

// As Blob (File extends Blob)
const blob = file;  // File IS a Blob
const arrayBuffer = await file.arrayBuffer();
```

### Write File

```typescript
const file = new File(Paths.cache, 'myfile.txt');

// Write text
file.write('Hello World');

// Write bytes
const bytes = new Uint8Array([1, 2, 3, 4]);
file.write(bytes);

// Write with options
file.write(content, { encoding: 'utf8' });
```

### Delete File

```typescript
const file = new File(uri);
if (file.exists) {
  file.delete();
}
```

### Copy/Move File

```typescript
const source = new File(Paths.cache, 'source.txt');
const dest = new File(Paths.document, 'dest.txt');

source.copy(dest);  // Copy
source.move(dest);  // Move (updates source.uri)
```

### File Properties

```typescript
const file = new File(uri);

console.log(file.uri);                // File URI
console.log(file.name);               // File name with extension
console.log(file.extension);          // Extension (e.g., '.txt')
console.log(file.size);               // Size in bytes
console.log(file.type);               // MIME type
console.log(file.exists);             // Boolean
console.log(file.modificationTime);   // Timestamp
console.log(file.creationTime);       // Timestamp
console.log(file.md5);                // MD5 hash
```

## Directory Operations

### Create Directory

```typescript
const dir = new Directory(Paths.cache, 'mydir');
dir.create({ intermediates: true, idempotent: true });
```

### List Directory Contents

```typescript
const dir = new Directory(Paths.cache);
const items = dir.list();  // Returns (File | Directory)[]

items.forEach(item => {
  if (item instanceof File) {
    console.log('File:', item.name, item.size);
  } else {
    console.log('Directory:', item.name);
  }
});
```

### Delete Directory

```typescript
const dir = new Directory(uri);
if (dir.exists) {
  dir.delete();  // Deletes directory and all contents
}
```

## Standard Paths

```typescript
// Cache directory (can be deleted by system)
Paths.cache

// Document directory (persistent)
Paths.document

// Bundle directory (app assets)
Paths.bundle

// Check disk space
Paths.totalDiskSpace     // Total space in bytes
Paths.availableDiskSpace // Available space in bytes
```

## Migration from Legacy API

### OLD (SDK <54)
```typescript
import * as FileSystem from 'expo-file-system';

// Check existence
const info = await FileSystem.getInfoAsync(uri);
if (info.exists) { /* ... */ }

// Read
const content = await FileSystem.readAsStringAsync(uri);
const base64 = await FileSystem.readAsStringAsync(uri, {
  encoding: FileSystem.EncodingType.Base64
});

// Write
await FileSystem.writeAsStringAsync(uri, content);

// Delete
await FileSystem.deleteAsync(uri);
```

### NEW (SDK 54)
```typescript
import { File } from 'expo-file-system';

// Check existence
const file = new File(uri);
if (file.exists) { /* ... */ }

// Read
const content = await file.text();
const base64 = await file.base64();
const bytes = await file.bytes();

// Write
file.write(content);

// Delete
file.delete();
```

## Common Patterns

### Upload File to Server

```typescript
const file = new File(localUri);
const bytes = await file.bytes();
const arrayBuffer = bytes.buffer;

// Upload ArrayBuffer to server
await fetch('https://api.example.com/upload', {
  method: 'POST',
  headers: { 'Content-Type': file.type },
  body: arrayBuffer,
});
```

### Download File

```typescript
const url = 'https://example.com/file.pdf';
const destination = new Directory(Paths.document);
const file = await File.downloadFileAsync(url, destination);
console.log('Downloaded to:', file.uri);
```

### Process Large Files with Streams

```typescript
const file = new File(uri);
const stream = file.readableStream();

const reader = stream.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  // Process chunk (value is Uint8Array)
  console.log('Chunk size:', value.length);
}
```

### Create Temporary File

```typescript
const tempFile = new File(Paths.cache, `temp-${Date.now()}.dat`);
tempFile.create();
tempFile.write(data);

// Use the file...

// Clean up
tempFile.delete();
```

## expo-audio Integration

### Upload Recording to Supabase

```typescript
import { useAudioRecorder } from 'expo-audio';
import { File } from 'expo-file-system';

// After recording
await audioRecorder.stop();
const uri = audioRecorder.uri;

if (uri) {
  // Read file
  const file = new File(uri);
  const bytes = await file.bytes();

  // Upload to Supabase
  await supabase.storage
    .from('recordings')
    .upload(fileName, bytes.buffer, {
      contentType: 'audio/x-caf',
    });
}
```

## Common Issues

### Issue: File doesn't exist immediately after creation
**Solution**: Add a small delay
```typescript
await audioRecorder.stop();
await new Promise(r => setTimeout(r, 500));
const file = new File(audioRecorder.uri);
```

### Issue: TypeScript doesn't recognize arrayBuffer()
**Solution**: File extends Blob, use type assertion
```typescript
const file = new File(uri);
const arrayBuffer = await (file as any).arrayBuffer();
// or use bytes() instead
const bytes = await file.bytes();
const arrayBuffer = bytes.buffer;
```

### Issue: Zero-byte file on Android
**Solution**: Check file size before processing
```typescript
const file = new File(uri);
if (file.size === 0) {
  throw new Error('Recording file is empty');
}
```

## Performance Tips

1. **Use bytes() for binary files** (audio, images)
2. **Use text() for text files** (JSON, logs)
3. **Use streams for large files** (>10MB)
4. **Cache file.exists checks** if checking repeatedly
5. **Batch operations** when processing multiple files

## Resources

- [Official Documentation](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [Blog Post: SDK 54 File System Update](https://expo.dev/blog/expo-file-system)
- [Migration Guide](https://docs.expo.dev/versions/latest/sdk/filesystem-legacy/)
