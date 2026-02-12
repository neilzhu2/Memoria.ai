# Audio Recording — Findings & Lessons Learned

This document tracks all the issues, failed attempts, and learnings related to the audio recording flow in Memoria. **Always check this file before debugging audio issues.**

---

## Round 1: iOS Audio Playback Deadlock (Feb 2026)

**Problem:** After recording with `expo-audio`, playback via `expo-av` would deadlock on iOS.

**Root Cause:** `expo-audio` saves recordings to an _isolated_ cache directory (`Library/Caches/ExpoAudio/`) that `expo-av` cannot access directly on iOS.

**Solution:** Created `FileSafeService` to relocate files from the cache to `FileSystem.documentDirectory`. Also implemented a dual-path strategy (`audioPath` for Supabase URL, `localAudioPath` for local file).

**Status:** ✅ Playback deadlock resolved.

---

## Round 2: FileSystem Deprecation Error (Feb 2026)

**Problem:** Console error "Method getInfoAsync is deprecated" appearing in SDK 54 dev builds.

**Root Cause:** `fileSafeService.ts` was using the legacy `expo-file-system` API (`getInfoAsync`, `copyAsync`, etc.) which are deprecated in SDK 54.

**Solution:** Migrated to the new Nitro `File` and `Directory` classes (`Paths.document`, `new Directory(...)`, `new File(...)`).

**What we learned:**
- `Paths.document` is the correct way to get the document directory (not `Directory.documentDirectory` which doesn't exist)
- `new Directory(parentDir, name)` creates a subdirectory reference
- `new File(parentDir, name)` creates a file reference within a directory
- `File.copy()` accepts `File | Directory`, not a string URI

**Status:** ✅ Deprecation error resolved.

---

## Round 3: "Source file does not exist" after recording (Feb 2026)

**Problem:** After migrating to the Nitro API, `fileSafeService.makeFileAccessible()` fails with "Source file does not exist after retries" for the cache path `Library/Caches/ExpoAudio/recording-*.caf`.

**Failed attempts:**
1. ❌ **Retry loop with `File.exists`** (5 retries × 500ms) — `File.exists` consistently returns `false` for expo-audio cache files
2. ❌ **Increasing retry count** — More retries don't help; the Nitro `File.exists` simply cannot detect files in this cache directory
3. ❌ **`File.arrayBuffer()`** — Also fails on cache URIs (requires `exists` to be true first)

**What we learned:**
- **The Nitro `File` class CANNOT reliably detect/read files in the `ExpoAudio` cache directory.** This is a known limitation.
- **`fetch(cacheUri)` CAN read these files.** The standard `fetch()` API works on `file://` URIs in React Native on iOS.
- **`XMLHttpRequest` also works** as a fallback for reading cache files.
- The file IS there — it's just that the new Nitro filesystem API doesn't have permission/visibility into that specific cache.

**New approach:** Skip file relocation entirely. Upload directly from the cache URI using `fetch()`.

**Status:** 🔄 In progress — implementing new approach.

---

## Round 4: Upload also fails from cache URI (Feb 2026)

**Problem:** `audioStorageService.uploadAudio()` also fails because it was also trying to use `new File(localUri).arrayBuffer()` which has the same Nitro API limitation.

**Root Cause:** Same as Round 3 — the Nitro `File` API cannot read expo-audio cache files. The upload service's `tryRead()` function tries Nitro first, then `fetch()`, then XHR — but the `fetch()` and XHR also seem to fail in this context.

**Key insight:** The issue might be that the `fileSafeService` returns the **original cache URI as a fallback** when relocation fails, but by that time the file handle may have been invalidated by the failed Nitro operations.

**Next steps:**
- Skip `FileSafeService` entirely in the recording save flow
- Upload directly from the original cache URI using `fetch()` FIRST (before any Nitro File operations touch the handle)
- Add a brief delay (500ms–1s) after `audioRecorder.stop()` to ensure file is fully flushed to disk

**Status:** 🔄 In progress.

---

## Round 5: Root Cause — Missing `prepareToRecordAsync()` (Feb 2026)

**Problem:** Even with `fetch()` as primary read method, the file still cannot be read from the cache URI.

**Root Cause:** The recording was **never producing a valid file** because we were skipping a required initialization step. The official expo-audio docs require:
```typescript
await recorder.prepareToRecordAsync();  // REQUIRED — initializes the file
recorder.record();
```
Our code was calling only `record()` without `prepareToRecordAsync()`.

**Additional issue:** We were using a custom `CAF_RECORDING_PRESET` (LINEARPCM) instead of the official `RecordingPresets.HIGH_QUALITY` (.m4a, MPEG4AAC) which is the documented and tested format.

**Fix:**
1. Added `await audioRecorder.prepareToRecordAsync()` before `audioRecorder.record()`
2. Switched to `RecordingPresets.HIGH_QUALITY`

**What we learned:**
- **Always check the official docs first** for the correct API usage before debugging filesystem issues
- The `useAudioRecorder` hook does NOT auto-prepare — you must call `prepareToRecordAsync()` yourself
- `record()` is NOT async (it returns void, not a Promise), only `prepareToRecordAsync()` is

**Status:** ✅ Fixed.

---

## Round 6: Bucket Name + Schema Mismatch (Feb 2026)

**Problem 1:** "Bucket not found" — recording and file read work, but upload fails.
**Cause:** Code used bucket name `recordings`, but Supabase has `audio-recordings`.
**Fix:** Changed `BUCKET_NAME` in `audioStorageService.ts`.

**Problem 2:** "Could not find the 'local_audio_path' column" (PGRST204).
**Cause:** `RecordingContext.tsx` tried to insert `local_audio_path` into the `memories` table, but that column doesn't exist.
**Fix:** Removed from insert. `localAudioPath` is now in-memory only.

**Status:** ✅ Fixed.

---

## Round 7: Edit Modal Spinner + Permission Timing (Feb 2026)

**Problem 1:** Save button in Edit Modal spins forever with no error.
**Cause:** `updateMemory()` in RecordingContext had no timeout. Over tunnel connections, the Supabase `.update()` call can hang indefinitely.
**Fix:** Added 30-second timeout (same pattern as `addMemory`).

**Problem 2:** iOS Speech Recognition permission popup appears during Edit Modal.
**Cause:** `transcribeRecording()` is called in `saveRecording` after insert. `ExpoSpeechProvider.startTranscription()` calls `requestPermissionsAsync()` — triggering iOS's "Allow speech recognition?" dialog.
**Recommendation:** Move permission request to when the recording screen first opens, alongside the microphone permission. Users expect permissions up front, not mid-save.

**Status:** ✅ Fixed.

---

## Round 8: Signed URLs + Permission Timing (Feb 2026)

**Problem 1:** Audio playback fails after app reload — error -1008 (NSURLErrorDomain).
**Cause:** `getPublicUrl()` returns a URL that only works with public buckets. The `audio-recordings` bucket was private.
**Quick fix:** User made bucket public (Option A). 
**Proper fix:** Implemented signed URLs (Option B) for security:
- Added `getSignedPlaybackUrl()` to `audioStorageService.ts` — generates 1-hour signed URLs
- Updated `useAudioPlayback.ts` to resolve signed URLs before loading Supabase audio
- User should switch bucket back to **private** for security

**Problem 2:** iOS Speech Recognition permission popup during Edit Modal save.
**Cause:** `ExpoSpeechProvider.startTranscription()` called `requestPermissionsAsync()` during transcription.
**Fix:** Moved to `requestPermissionsAndStart()` in `SimpleRecordingScreen.tsx`, alongside mic permission.
- Non-blocking: if denied, recording still works (transcription skipped)
- Works on both iOS and Android

**Architecture decision:** Signed URLs provide security for private family recordings while being invisible to users (~50ms generation time). URLs expire after 1 hour, requiring fresh ones for each playback session.

**Status:** 🔄 Testing.

---

## Architecture Notes

### Dual Path Strategy
- `localAudioPath`: Local file URI (cache or document directory) — used for immediate playback and transcription
- `audioPath`: Supabase Storage URL — used for persistent, reliable access

### Transcription Flow
- Transcription uses `memory.localAudioPath || memory.audioPath`
- Cache URIs work for transcription via `expo-speech-recognition` (native module reads files directly)
- If cache is cleared, falls back to Supabase URL

### Key Compatibility Matrix
| Operation | Nitro `File` API | `fetch()` | `XMLHttpRequest` | Native module |
|-----------|:---:|:---:|:---:|:---:|
| Read document dir files | ✅ | ✅ | ✅ | ✅ |
| Read ExpoAudio cache files | ❌ | ✅ | ✅ | ✅ |
| Read Supabase URLs | ❌ | ✅ | ✅ | ❌ |
