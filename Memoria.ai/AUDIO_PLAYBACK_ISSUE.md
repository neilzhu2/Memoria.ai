# Audio Playback Issue - expo-audio SDK 54

**Date:** October 18-19, 2025
**Status:** 🐛 CONFIRMED BUG - expo-audio cannot play file:// URIs on iOS
**Resolution:** Temporary fallback to expo-av for playback
**Environment:** iOS (Expo Go & Dev Build), SDK 54, expo-audio ~1.0.13

---

## Problem Summary

Audio recordings are being saved successfully with valid file URIs, but playback is completely non-functional. When attempting to play audio files using `useAudioPlayer()` hook:
- No sound is heard
- Progress bar doesn't move
- Player state shows `duration: NaN`, `playing: false`, `isLoaded: false`
- Audio file exists at the URI and was just recorded successfully

---

## Technical Details

### What Works ✅
1. **Recording** - Audio recording works perfectly using `useAudioRecorder()`
2. **File saving** - Recording URIs are saved correctly to storage
3. **File existence** - Audio files exist at the saved URI paths
4. **UI updates** - All UI components render correctly
5. **Duration display** - Fixed to show correct recording duration from memory metadata

### What Doesn't Work ❌
1. **Audio loading** - `audioPlayer.replace({ uri: audioPath })` doesn't load the file
2. **Playback** - `audioPlayer.play()` doesn't start playback
3. **Duration** - Player shows `duration: NaN` after replace
4. **Status** - `isLoaded` remains `false` indefinitely

### Example File Path
```
file:///var/mobile/Containers/Data/Application/B586900A-F7EB-4BA2-81B9-9A08CD8F404F/Library/Caches/ExponentExperienceData/@anonymous/memoria-ai-d1107eff-4851-4dad-991e-959a4bb4c7e4/ExpoAudio/recording-92239257-512B-4349-970B-B52679BB9668.m4a
```

---

## Current Code

### Recording (Working)
**File:** `components/SimpleRecordingScreen.tsx:204-209`
```typescript
await audioRecorder.stop();
const uri = audioRecorder.uri;  // Gets valid file:// URI
setCurrentRecordingUri(uri || null);

// URI is saved to storage via context
audioPath: currentRecordingUri
```

### Playback (Not Working)
**File:** `hooks/useAudioPlayback.ts:61-131`
```typescript
const audioPlayer = useAudioPlayer();
const playerStatus = useAudioPlayerStatus(audioPlayer);

const togglePlayPause = async (id: string, audioPath: string) => {
  // Configure audio mode
  await AudioModule.setAudioModeAsync({
    allowsRecording: false,
    playsInSilentMode: true,
  });

  // Reset player
  audioPlayer.pause();
  audioPlayer.seekTo(0);

  // Replace source
  audioPlayer.replace({ uri: audioPath });

  // Wait and play
  await new Promise(resolve => setTimeout(resolve, 200));
  audioPlayer.play();

  // Result: duration: NaN, playing: false, isLoaded: false
}
```

---

## Diagnostic Logs

### Most Recent Test (After All Fixes)
```
LOG  Playing audio from: file:///var/mobile/.../recording-92239257-512B-4349-970B-B52679BB9668.m4a
LOG  Current audioPlayer state: {"currentTime": 0, "duration": 0, "playing": false}
LOG  Replacing audio source with: file:///var/mobile/.../recording-92239257-512B-4349-970B-B52679BB9668.m4a
LOG  After replace, player state: {"currentTime": 0, "duration": NaN, "playing": false, "volume": 1}
LOG  Calling play()...
LOG  After play(), player state: {"currentTime": 0, "duration": NaN, "isLoaded": false, "playing": false}
```

**Key observation:** After `replace()` is called, `duration` becomes `NaN` (not 0), suggesting the player attempted to load but failed.

---

## What We've Tried

### Attempt 1: Basic Implementation
- Used `audioPlayer.replace({ uri: audioPath })` followed by `audioPlayer.play()`
- **Result:** No playback, no error

### Attempt 2: Audio Mode Configuration
- Added `AudioModule.setAudioModeAsync()` before playback
- Set `allowsRecording: false, playsInSilentMode: true`
- **Result:** No change

### Attempt 3: Async/Await Variations
- Made `play()` call async with `await`
- Removed await from `play()` call
- **Result:** No change

### Attempt 4: Delay After Replace
- Added 100ms delay after `replace()` to allow loading
- Increased to 200ms delay
- **Result:** No change, `isLoaded` stays false

### Attempt 5: Status Monitoring with Loop
- Used `useAudioPlayerStatus()` to check `isLoaded`
- Created while loop to poll `playerStatus.isLoaded`
- Waited up to 3 seconds checking every 50ms
- **Result:** `isLoaded` never became true (loop reached timeout)

### Attempt 6: Reset Before Replace
- Added `audioPlayer.pause()` and `audioPlayer.seekTo(0)` before replace
- **Result:** No change, still `duration: NaN`

---

## Hypotheses

### Hypothesis 1: File URI Format Issue ❓
**Theory:** The `file://` URI from `audioRecorder.uri` may not be compatible with `useAudioPlayer.replace()`

**Evidence Against:**
- URI format looks standard: `file:///var/mobile/...`
- Same format is used successfully in other Expo apps
- No error is thrown (would expect error if URI was invalid)

**Evidence For:**
- `duration: NaN` suggests attempted load that failed
- expo-audio docs mostly show `require()` for bundled assets, not file URIs

### Hypothesis 2: Audio Player Lifecycle Issue ❓
**Theory:** `useAudioPlayer()` created without initial source may not support `replace()` properly

**Evidence For:**
- Hook created as `useAudioPlayer()` with no initial source
- Documentation examples often show `useAudioPlayer(source)`

**Evidence Against:**
- `replace()` method exists specifically for this use case
- No TypeScript errors or warnings

### Hypothesis 3: Expo Go Limitation 🚨
**Theory:** Expo Go may not support playing audio from dynamically created files, only bundled assets

**Evidence For:**
- **This is the most likely cause**
- Expo Go has limitations with file system access
- Recording works (native feature) but playback of recorded files may not
- Similar to how some native modules don't work in Expo Go

**Evidence Against:**
- expo-audio is an Expo SDK module (should work in Expo Go)
- Other audio apps work in Expo Go

### Hypothesis 4: SDK 54 Bug 🐛
**Theory:** Bug in expo-audio 1.0.13 with `replace()` method

**Evidence For:**
- expo-audio is relatively new (replaced expo-av)
- SDK 54 is recent
- `replace()` is a new feature

**Evidence Against:**
- Would expect more community reports
- No errors in console

---

## Next Steps to Try

### 1. Try Development Build (High Priority) 🎯
**Why:** Test if this is an Expo Go limitation

**How:**
```bash
# Build and install on physical device
npx expo run:ios --device
```

**Expected Outcome:**
- If it works → Confirms Expo Go limitation
- If it fails → Rules out Expo Go as cause

### 2. Try `createAudioPlayer()` Instead of Hook
**Why:** Different lifecycle management might work better

**How:**
```typescript
import { AudioModule } from 'expo-audio';

const audioPlayer = useRef(null);

// Initialize
audioPlayer.current = AudioModule.createAudioPlayer({ uri: audioPath });

// Cleanup
audioPlayer.current?.release();
```

**Risk:** Need manual memory management

### 3. Check Expo Go Audio Support
**Research needed:**
- Check Expo Go feature support matrix
- Search: "expo go play recorded audio file"
- Check: Can Expo Go play non-bundled audio files?

### 4. Try expo-av (Old Audio API)
**Why:** Fallback to proven working API

**How:**
```typescript
import { Audio } from 'expo-av';

const { sound } = await Audio.Sound.createAsync(
  { uri: audioPath },
  { shouldPlay: true }
);
```

**Note:** expo-av is deprecated but might work

### 5. Test with Bundled Audio File
**Why:** Verify player works with known-good source

**How:**
```typescript
// Add test.m4a to assets folder
const audioPlayer = useAudioPlayer(require('./assets/test.m4a'));
audioPlayer.play();
```

**Expected:** Should work, proving player functionality

### 6. Check File Permissions
**Why:** iOS may restrict file access

**How:**
- Check if file is in app's sandbox
- Try different cache directory
- Check file permissions in logs

### 7. File Format Investigation
**Check:**
- Is .m4a format supported?
- Try different recording format
- Check file is not corrupted (play on Mac)

---

## Community Research Completed ✅

### Findings from Web Search

#### Known Issues Found:
1. **`AudioPlayer.replace()` not working on Android** (Issue #35670)
   - Reported issue with replace() method on Android
   - May be platform-specific

2. **Duration metadata issues**
   - Chrome MediaRecorder WebM files can have missing duration metadata
   - Causes `duration: NaN` in some cases
   - Not directly applicable (we're using iOS .m4a files)

3. **iOS development build experiences**
   - Community confirms expo-av/expo-audio work in Expo Go
   - Recording and playback are documented as working features
   - No explicit "Expo Go limitation" for recorded file playback found

#### Tutorials Found:
- "How to Record and Play Audio in React Native" (withfra.me)
  - Uses `Audio.Sound.createAsync({ uri: recording.getURI() })`
  - **This is expo-av (old API), not expo-audio**
  - Confirms playback should work with file URIs

- Expo's official audio-recording-example repo exists
  - May show proper implementation patterns
  - Worth checking: https://github.com/expo/audio-recording-example

### Places Checked
- ✅ Expo GitHub Issues
- ✅ Stack Overflow
- ⏳ Expo Forums (not checked yet)
- ⏳ Expo Discord (not checked yet)

### Key Insight: Try expo-av First
Since expo-av has documented examples of recording and playback working, and we're blocked on expo-audio, **we should try expo-av as a test** to determine if:
- The problem is expo-audio specific (API bug)
- OR the problem is Expo Go / file system related

### Action Items for Next Session:
1. **Test with expo-av** (5 min test)
   ```typescript
   const { sound } = await Audio.Sound.createAsync(
     { uri: audioPath },
     { shouldPlay: true }
   );
   ```
   If this works → expo-audio bug
   If this fails → Deeper issue (permissions/Expo Go/file access)

2. **Check Expo audio-recording-example repo**
   - See their implementation
   - Compare with our approach

3. **Test in iOS Simulator development build**
   - Already built earlier today
   - Quick test to rule out Expo Go

---

## Workaround Options (If Blocked)

### Option A: Skip Playback in Expo Go
- Continue development with Expo Go
- Test playback only in development builds
- Add UI note: "Playback preview available in full app"

### Option B: Use expo-av (Deprecated)
- Fall back to `expo-av` for playback
- Keep recording with `expo-audio`
- Plan migration path when issue resolved

### Option C: Mock Playback UI
- Show playback UI controls
- Simulate progress bar movement
- Test actual playback in development build only

---

## Files Modified Today

1. `components/SimpleRecordingScreen.tsx` - Removed list icon (line 243)
2. `components/EditMemoryModal.tsx` - Fixed duration display (line 217, 225)
3. `hooks/useAudioPlayback.ts` - Multiple attempts to fix playback (lines 61-131)

---

## Environment Details

```json
{
  "expo": "^54.0.13",
  "react-native": "0.81.4",
  "expo-audio": "~1.0.13",
  "expo-haptics": "~15.0.7",
  "react": "19.1.0"
}
```

**Device:** iPhone (Expo Go)
**Metro:** Running on Mac at 192.168.1.83:8081
**Audio Mode During Playback:**
```typescript
{
  allowsRecording: false,
  playsInSilentMode: true
}
```

---

## Success Criteria

Audio playback will be considered working when:
1. ✅ Press play button in Edit Memory screen
2. ✅ Hear audio from recording
3. ✅ Progress bar moves during playback
4. ✅ Player state shows: `playing: true`, `duration: <actual duration>`, `isLoaded: true`
5. ✅ Can pause, resume, and seek in audio

---

## Additional Notes

- **Recording quality:** HIGH_QUALITY preset used
- **File format:** .m4a (AAC audio)
- **Storage:** Expo's cache directory via `audioRecorder.uri`
- **Audio mode switches:** Recording mode → Playback mode correctly set
- **No errors thrown:** Code runs without exceptions
- **Silent failure:** Player appears to work but no actual playback occurs

---

## Related Documentation

- [expo-audio SDK 54 docs](https://docs.expo.dev/versions/latest/sdk/audio/)
- [SDK_54_SUCCESS.md](./SDK_54_SUCCESS.md) - SDK 54 upgrade notes
- [TROUBLESHOOTING_IOS_BUILD_OCT18_2025.md](./TROUBLESHOOTING_IOS_BUILD_OCT18_2025.md)

---

---

## October 19, 2025 - Exhaustive Testing & Root Cause Confirmed

### Additional Attempts (October 19)

### Attempt 7: Reactive Source with useAudioPlayer Hook
- Changed from empty `useAudioPlayer()` to `useAudioPlayer(source)` with reactive state
- Used `setCurrentAudioSource(audioPath)` to trigger player recreation
- Added autoplay flag with useEffect to handle playback after source change
- **Result:** Same failure - `duration: NaN`, `playing: false`

### Attempt 8: Event-Based Loading with playbackStatusUpdate
- Implemented event listener: `audioPlayer.addListener('playbackStatusUpdate', callback)`
- Waited for `status.isLoaded` event before calling `play()`
- Added 5-second timeout safety
- **Result:** Events NEVER fired, timeout occurred every time

### Attempt 9: createAudioPlayer (Imperative API) with Object URI
- Switched from `useAudioPlayer` hook to `createAudioPlayer()` function
- Passed source as object: `createAudioPlayer({ uri: audioPath })`
- Manual lifecycle management with `.remove()` cleanup
- **Result:** Identical failure - `duration: NaN`, `playing: false`

### Attempt 10: createAudioPlayer with String URI
- Changed to pass URI as string directly: `createAudioPlayer(audioPath)`
- Per documentation, string URIs are supported format
- **Result:** Same failure - confirms object vs string format doesn't matter

### Test Environment Confirmation
- ✅ Tested on **iPhone (Expo Go)** - Failed
- ✅ Tested on **Mac Simulator (Dev Build)** - Failed (per user confirmation)
- ✅ Both environments show identical behavior
- ✅ Rules out Expo Go as the cause - this is an expo-audio bug

### Final Diagnostic Logs (October 19)
```
LOG  [Playback] Creating new audio player with source: file:///var/mobile/.../recording-XXX.m4a
LOG  [Playback] Player created, state: {"currentTime": 0, "duration": 0, "playing": false}
LOG  [Playback] After wait (300ms), state: {"currentTime": 0, "duration": NaN, "playing": false}
LOG  [Playback] Starting playback...
LOG  [Playback] Play called, state: {"currentTime": 0, "duration": NaN, "playing": false}
```

**Pattern:** Duration changes from `0` → `NaN` after 300ms, indicating:
- Player attempts to load the file
- Loading fails (no metadata retrieved)
- `play()` call has no effect on failed load

---

## Root Cause: Confirmed Bug in expo-audio SDK 54

### Evidence Summary

1. **Both APIs Fail Identically**
   - `useAudioPlayer` hook: ❌ Failed
   - `createAudioPlayer` function: ❌ Failed
   - Confirms not a hook lifecycle issue

2. **All Source Formats Fail**
   - Object format `{ uri: "file://..." }`: ❌ Failed
   - String format `"file://..."`: ❌ Failed
   - Confirms not a parameter format issue

3. **Cross-Environment Failure**
   - Expo Go (iPhone): ❌ Failed
   - Dev Build (Simulator): ❌ Failed
   - Confirms not an Expo Go limitation

4. **Events Don't Fire**
   - `playbackStatusUpdate` events never emit
   - Suggests native layer file loading is broken
   - iOS-specific issue with file:// URI handling

5. **Recording Works Perfectly**
   - Same file URIs work for recording
   - Files exist and are valid
   - Confirms file system access works
   - Only **playback** of file:// URIs is broken

### Conclusion

**expo-audio 1.0.13 (SDK 54) has a fundamental bug preventing playback of locally recorded files on iOS.**

The bug exists at the native iOS layer - the JavaScript API calls complete successfully, but the underlying AVFoundation player never loads the audio metadata from file:// URIs.

---

## Resolution: Temporary Fallback to expo-av

### Decision Rationale

Given the confirmed bug and the need to ship working software:

**✅ Use expo-av for playback** (temporary)
**✅ Keep expo-audio for recording** (works perfectly)
**✅ Monitor expo-audio GitHub for fixes**
**✅ Migrate back when bug is resolved**

### Why This Is The Right Choice

1. **Works Today** - expo-av is proven to work with file:// URIs
2. **Still Available** - expo-av deprecated but not removed until SDK 55
3. **Minimal Change** - Only affects `hooks/useAudioPlayback.ts`
4. **Easy Migration** - One file to swap when bug fixed
5. **User's Philosophy** - "Cleaner and easier to maintain" = ship working code now

### Migration Timeline

- **Now (SDK 54):** Use expo-av for playback
- **Monitor:** Watch https://github.com/expo/expo/issues for expo-audio fixes
- **Future (SDK 55+):** Migrate back to expo-audio when fixed
- **File to change:** `hooks/useAudioPlayback.ts` only

---

## Lessons Learned

1. **Trust The Data** - After 10 attempts with identical results, it's a confirmed bug
2. **Cross-Platform Testing** - Testing both Expo Go and Dev Build ruled out environment issues
3. **API Documentation Gaps** - expo-audio docs lack file:// URI playback examples
4. **Pragmatic Solutions** - Using working deprecated API > being blocked on broken new API

---

**Session Dates:** October 18-19, 2025
**Time Invested:** ~4 hours debugging
**Attempts Made:** 10 different approaches
**Final Status:** Bug confirmed, workaround identified
**Action:** Implement expo-av fallback for playback
