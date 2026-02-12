# Testing Checklist - expo-audio File Access Fix

## Pre-Testing Setup

- [ ] Clean rebuild completed: `rm -rf node_modules && npm install && cd ios && pod install`
- [ ] Metro bundler running: `npx expo start --dev-client`
- [ ] iOS device connected and app installed
- [ ] Supabase Storage "recordings" bucket exists and is public
- [ ] Test user is logged in

## Test Cases

### Test 1: Basic Recording with Topic Prompt

**Steps**:
1. Open app
2. Navigate to Home tab
3. Tap any daily prompt card
4. Wait for recording to auto-start
5. Speak for 5-10 seconds
6. Tap "Done" button

**Expected Results**:
- [ ] Recording stops successfully
- [ ] Console shows: `[AudioStorage] Trying File.arrayBuffer() method...`
- [ ] Console shows: `[AudioStorage] arrayBuffer() success! Size: [number]`
- [ ] Console shows: `[AudioStorage] Upload successful: [path]`
- [ ] Toast message: "Memory saved successfully"
- [ ] Edit modal appears with recording details
- [ ] Audio URL starts with Supabase domain

**Console Output Should Include**:
```
[saveRecording] START - Called with: file:///var/mobile/.../recording-XXX.caf
[saveRecording] Uploading audio to Supabase Storage...
[AudioStorage] Starting upload for: file:///var/mobile/...
[AudioStorage] Trying File.arrayBuffer() method...
[AudioStorage] arrayBuffer() success! Size: 123456
[AudioStorage] Upload successful: user-id/timestamp.caf
```

### Test 2: Free-Style Recording

**Steps**:
1. Open app
2. Navigate to Record tab
3. Tap "Free Recording" button
4. Speak for 5-10 seconds
5. Tap "Done" button

**Expected Results**:
- [ ] Same as Test 1
- [ ] Title shows "Free Recording - [date]"

### Test 3: Longer Recording (Stress Test)

**Steps**:
1. Start any recording
2. Speak for 2-3 minutes
3. Tap "Done" button
4. Wait for upload to complete

**Expected Results**:
- [ ] Upload completes successfully
- [ ] File size in console is ~20-30MB
- [ ] No memory errors or app crashes
- [ ] Audio plays back correctly in edit modal

### Test 4: Quick Recording (Edge Case)

**Steps**:
1. Start recording
2. Immediately tap "Done" (<1 second)
3. Check if app handles short recording

**Expected Results**:
- [ ] Either saves successfully or shows appropriate error
- [ ] No app crash
- [ ] If file is too small, appropriate error message shown

### Test 5: Network Interruption Test

**Steps**:
1. Enable Airplane Mode
2. Record audio
3. Tap "Done"
4. Observe error handling
5. Disable Airplane Mode
6. Check if auto-retry or manual retry works

**Expected Results**:
- [ ] File read succeeds (arrayBuffer works offline)
- [ ] Upload fails with network error
- [ ] Error message shown to user
- [ ] Can retry when back online

## Fallback Method Testing

### Test 6: Force fetch() Fallback (Optional)

**Only if arrayBuffer() fails naturally**

Look for console output:
```
[AudioStorage] arrayBuffer() failed: [Error: ...]
[AudioStorage] Trying fetch() method...
[AudioStorage] fetch() success! Size: 123456
```

### Test 7: Force XMLHttpRequest Fallback (Optional)

**Only if both arrayBuffer() and fetch() fail**

Look for console output:
```
[AudioStorage] fetch() failed: [Error: ...]
[AudioStorage] Trying XMLHttpRequest...
[AudioStorage] XMLHttpRequest success! Size: 123456
```

## Verification in Supabase Dashboard

After each successful upload:

- [ ] Go to Supabase Dashboard
- [ ] Navigate to Storage → recordings bucket
- [ ] Find file at `{userId}/{timestamp}.caf`
- [ ] Download file
- [ ] Open in QuickTime Player or VLC
- [ ] Verify audio plays correctly
- [ ] Check file size matches console output

## Performance Checks

- [ ] Recording stops within 1-2 seconds of tapping "Done"
- [ ] Upload completes within 5-10 seconds for 30-second recording
- [ ] App remains responsive during upload
- [ ] No visible memory leaks (check Xcode Instruments)
- [ ] Battery usage is reasonable

## Error Scenarios

### Test 8: No Microphone Permission

**Steps**:
1. Settings → Privacy → Microphone → Disable for app
2. Try to record

**Expected Results**:
- [ ] Permission denied alert shown
- [ ] Recording screen closes gracefully

### Test 9: Storage Full

**Steps**:
1. Fill device storage to near capacity
2. Try to record

**Expected Results**:
- [ ] Recording may fail or save with error
- [ ] Appropriate error message shown
- [ ] No app crash

### Test 10: Supabase Bucket Full or Quota Exceeded

**Steps**:
1. Exceed Supabase storage quota
2. Try to upload

**Expected Results**:
- [ ] Upload fails with quota error
- [ ] Error message shown to user
- [ ] Local file handling is graceful

## Regression Tests

Ensure existing functionality still works:

- [ ] Audio playback in memory list
- [ ] Audio playback in edit modal
- [ ] Memory deletion (including audio file)
- [ ] Transcription still works
- [ ] Search by transcription still works
- [ ] Memory export includes audio

## Device-Specific Tests

Test on multiple devices if available:

- [ ] iPhone with iOS 15
- [ ] iPhone with iOS 16
- [ ] iPhone with iOS 17
- [ ] iPhone with iOS 18
- [ ] iPad (different screen size)
- [ ] Simulator (may have different behavior)

## Known Issues / Expected Behaviors

1. **First recording might take longer**: iOS needs to initialize audio session
2. **Simulator might behave differently**: File system APIs may differ
3. **VoiceOver might affect recording**: Test with accessibility features
4. **Background app might stop recording**: Test app lifecycle

## If Tests Fail

### All uploads fail with "no such file" error

**Debug Steps**:
1. Check console for which methods failed
2. Verify audioRecorder.uri in logs
3. Increase wait time to 2000ms in SimpleRecordingScreen.tsx
4. Check native logs in Xcode for file system errors

**File to modify**: `/components/SimpleRecordingScreen.tsx` line 381
```typescript
await new Promise(resolve => setTimeout(resolve, 2000)); // Try 2 seconds
```

### arrayBuffer() always fails

**Debug Steps**:
1. Check if fetch() succeeds as fallback
2. Verify expo-file-system version: `npm list expo-file-system`
3. Try reinstalling: `npm install expo-file-system@latest`
4. Check for any TypeScript errors in audioStorageService.ts

### Upload succeeds but file is corrupt

**Debug Steps**:
1. Check ArrayBuffer size in console (should be >1000 bytes)
2. Verify Content-Type header is correct
3. Download file from Supabase and check file type
4. Test recording settings (sampleRate, bitRate, etc.)

### Memory saved but audioPath is wrong

**Debug Steps**:
1. Check Supabase public URL generation
2. Verify bucket name matches BUCKET_NAME constant
3. Check if Supabase bucket is set to public
4. Test direct URL access in browser

## Sign-Off

Once all tests pass:

- [ ] All critical tests (1-5) passed
- [ ] At least one successful upload verified in Supabase
- [ ] No app crashes or memory leaks
- [ ] Console logs show expected output
- [ ] Ready for production use

**Tester Name**: _________________

**Date**: _________________

**Device(s) Tested**: _________________

**iOS Version(s)**: _________________

**Notes**: _________________
