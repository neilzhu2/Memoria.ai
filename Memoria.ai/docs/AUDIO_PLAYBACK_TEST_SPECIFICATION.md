# Audio Playback Feature - Test Specification

## Overview
This document outlines the comprehensive test suite for the audio playback feature in Memoria.ai's RecordingsList component. The tests follow Test-Driven Development (TDD) principles and are designed to ensure a high-quality, accessible audio playback experience for elderly users.

## Test Files

### 1. `/Users/lihanzhu/Desktop/Memoria/Memoria.ai/__tests__/components/RecordingsList.test.tsx`
**Primary integration tests for audio playback in RecordingsList**

This test suite covers the complete audio playback functionality as it will be implemented in the RecordingsList component.

**Test Categories:**
- Initial State Tests (5 tests)
- Play/Pause Functionality (6 tests)
- Skip Controls (8 tests)
- Progress Display (6 tests)
- Multiple Audio Management (4 tests)
- Playback Completion (4 tests)
- Error Handling (5 tests)
- Accessibility for Elderly Users (8 tests)
- Performance (3 tests)
- Edge Cases (4 tests)

**Total: 53 comprehensive tests**

### 2. `/Users/lihanzhu/Desktop/Memoria/Memoria.ai/__tests__/components/AudioPlaybackControls.test.tsx`
**Unit tests for reusable AudioPlaybackControls component**

This test suite provides unit-level tests for a standalone AudioPlaybackControls component (to be created). Tests are currently skipped and will be enabled once the component is implemented.

**Test Categories:**
- Play/Pause Button (6 tests)
- Skip Controls (7 tests)
- Progress Bar (6 tests)
- Time Display (7 tests)
- Accessibility (6 tests)
- Visual Design (4 tests)
- Edge Cases (4 tests)
- Integration (2 tests)

**Total: 42 unit tests** (currently skipped)

## Feature Requirements

### 1. Play/Pause Toggle
- **Requirement:** Users should be able to play and pause audio recordings
- **Visual Feedback:** Icon changes from play ▶️ to pause ⏸️
- **Haptic Feedback:** Light impact on press
- **Accessibility:** Proper labels and hints for screen readers

### 2. Skip Controls
- **Rewind:** Move playback 15 seconds backward
- **Forward:** Move playback 15 seconds forward
- **Boundary Protection:**
  - Cannot rewind below 0:00
  - Cannot forward beyond duration
- **Touch Targets:** Minimum 44x44px for elderly users

### 3. Playback Progress
- **Visual Progress Bar:** Shows current position in audio
- **Seekable:** Users can tap/drag to seek to position
- **Time Display:** Shows current time in MM:SS format
- **Updates:** Real-time updates during playback

### 4. Audio State Management
- **Single Playback:** Only one recording plays at a time
- **Auto-stop:** Playing new audio stops current audio
- **Resource Cleanup:** Proper unloading of audio resources

### 5. Playback Completion
- **Auto-reset:** When audio finishes, UI resets to idle state
- **Replay:** Users can replay completed audio
- **Cleanup:** Resources are properly released

## Technical Implementation

### Required Dependencies
```json
{
  "expo-av": "Audio.Sound API for playback",
  "expo-haptics": "Tactile feedback",
  "@testing-library/react-native": "Testing framework",
  "jest": "Test runner"
}
```

### Audio API Usage
```typescript
// Creating sound instance
const { sound } = await Audio.Sound.createAsync(
  { uri: audioPath },
  { shouldPlay: true }
);

// Status updates
sound.setOnPlaybackStatusUpdate((status) => {
  if (status.isLoaded) {
    // Update UI with current position
    setCurrentPosition(status.positionMillis);

    // Handle completion
    if (status.didJustFinish) {
      resetPlaybackState();
    }
  }
});

// Skip controls
await sound.setPositionAsync(newPosition);

// Cleanup
await sound.unloadAsync();
```

### Component Structure (Recommended)

#### Option 1: Enhanced RecordingsList (In-place)
Add playback controls directly to the existing RecordingsList component:
- Simpler implementation
- All state managed in one place
- Good for this specific use case

#### Option 2: Extract AudioPlaybackControls (Reusable)
Create a separate AudioPlaybackControls component:
- More reusable across the app
- Better separation of concerns
- Easier to test in isolation
- Recommended for future features

## Test Execution

### Running Tests
```bash
# Run all audio playback tests
npm test RecordingsList.test.tsx

# Run in watch mode
npm test -- --watch RecordingsList.test.tsx

# Run with coverage
npm test -- --coverage RecordingsList.test.tsx

# Run unit tests (when AudioPlaybackControls is implemented)
npm test AudioPlaybackControls.test.tsx
```

### Current Status
- ✅ Test suite created (53 tests)
- ✅ Mock setup configured
- ✅ Accessibility requirements defined
- ⏳ Implementation pending (all tests will fail until features are implemented)

### TDD Workflow
1. **Red:** Run tests - they should all fail (not implemented yet)
2. **Green:** Implement features until tests pass
3. **Refactor:** Clean up implementation while keeping tests green

## Accessibility Requirements

### Touch Targets
- **Minimum Size:** 44x44px (iOS), 48x48px (Android)
- **Elderly-Friendly:** 60x60px or larger recommended
- **Spacing:** Minimum 8px between interactive elements

### Visual Design
- **Font Size:** Minimum 16px for time display, 18px+ recommended
- **Contrast Ratio:** Minimum 4.5:1 (WCAG AA)
- **Color Indicators:** Not solely relying on color
- **Icons:** Clear, universally recognized symbols

### Screen Reader Support
- **Labels:** All controls have descriptive accessibility labels
- **Hints:** Provide context for what each control does
- **Roles:** Proper semantic roles (button, adjustable, etc.)
- **State:** Announce playing/paused/buffering states

### Haptic Feedback
- **Play/Pause:** Light impact
- **Skip:** Light impact
- **Seek:** Selection feedback
- **Error:** Notification feedback

## Error Scenarios Covered

1. **Missing Audio File**
   - Alert shown to user
   - UI remains stable
   - No crash

2. **Corrupted Audio**
   - Graceful error handling
   - User-friendly message
   - Option to retry or delete

3. **Playback Interruption**
   - State resets properly
   - Resources cleaned up
   - User can retry

4. **Component Unmount**
   - Active playback stopped
   - Resources released
   - No memory leaks

5. **Network Issues** (future)
   - Offline playback support
   - Download state indication
   - Retry mechanism

## Performance Criteria

### Rendering Performance
- **Initial Render:** < 100ms
- **State Updates:** < 50ms per update
- **Progress Updates:** Smooth at 30fps minimum

### Memory Management
- **Resource Cleanup:** All Sound instances unloaded
- **No Leaks:** Proper useEffect cleanup
- **List Performance:** FlatList optimization for many recordings

### Audio Quality
- **Format:** M4A/AAC (iOS), MP3 (Android)
- **Bitrate:** 64kbps for speech (elderly-friendly file sizes)
- **Latency:** < 200ms from press to sound start

## Implementation Checklist

### Phase 1: Basic Playback (MVP)
- [ ] Play/Pause toggle functionality
- [ ] Time display (current/total)
- [ ] Basic progress bar
- [ ] Single audio playback management
- [ ] Playback completion handling

### Phase 2: Enhanced Controls
- [ ] Skip controls (rewind/forward 15s)
- [ ] Seekable progress bar
- [ ] Boundary protection
- [ ] Visual state indicators
- [ ] Haptic feedback

### Phase 3: Polish & Accessibility
- [ ] Accessibility labels and hints
- [ ] Touch target optimization
- [ ] Error handling and alerts
- [ ] Performance optimization
- [ ] Edge case handling

### Phase 4: Advanced Features (Future)
- [ ] Playback speed control (0.5x, 1x, 1.5x, 2x)
- [ ] Audio visualization/waveform
- [ ] A-B repeat for specific sections
- [ ] Sleep timer
- [ ] Share/export audio

## Testing Best Practices

### Writing New Tests
1. **Describe user behavior**, not implementation
2. **Use semantic queries** (getByLabelText, getByRole)
3. **Test accessibility** in every interaction
4. **Mock external dependencies** (expo-av, haptics)
5. **Clean up resources** in afterEach/beforeEach

### Maintaining Tests
1. **Keep tests isolated** - no shared state
2. **Use descriptive test names** - explain what and why
3. **Group related tests** - logical describe blocks
4. **Update tests first** when requirements change (TDD)
5. **Monitor coverage** - aim for >80% coverage

### Common Pitfalls to Avoid
1. ❌ Testing implementation details
2. ❌ Relying on setTimeout in tests
3. ❌ Not cleaning up async operations
4. ❌ Forgetting accessibility testing
5. ❌ Not testing error scenarios

## Integration with Existing Code

### RecordingContext Integration
The tests assume integration with the existing RecordingContext:
```typescript
import { useRecording } from '@/contexts/RecordingContext';

const { memories, removeMemory } = useRecording();
```

### MemoryItem Type
Tests use the existing MemoryItem interface:
```typescript
interface MemoryItem {
  id: string;
  title: string;
  audioPath?: string;
  duration: number;
  // ... other fields
}
```

### Audio Service
Consider creating an AudioService to centralize audio operations:
```typescript
class AudioService {
  async createSound(uri: string): Promise<Audio.Sound>;
  async playSound(sound: Audio.Sound): Promise<void>;
  async pauseSound(sound: Audio.Sound): Promise<void>;
  async seekTo(sound: Audio.Sound, position: number): Promise<void>;
  async unloadSound(sound: Audio.Sound): Promise<void>;
}
```

## Expected Test Results

### Before Implementation
```
Test Suites: 1 failed, 1 total
Tests:       53 failed, 53 total
```

### After Complete Implementation
```
Test Suites: 1 passed, 1 total
Tests:       53 passed, 53 total
Coverage:    Statements: >80%, Branches: >75%, Functions: >80%, Lines: >80%
```

## Related Documentation

- **Wireframes:** `/Product&Design/Wireframe_Momories Experience.pdf`
- **Recording Context:** `/contexts/RecordingContext.tsx`
- **Memory Types:** `/types/memory.ts`
- **Existing Tests:** `/__tests__/components/RecordingButton.test.tsx`
- **Jest Setup:** `/jest.setup.js`

## Questions & Clarifications

### Before Implementation, Clarify:
1. Should playback controls be visible on all recordings or only when playing?
2. Should users be able to play audio from Home screen or only in RecordingsList?
3. Do we need background audio playback support?
4. Should playback state persist between app sessions?
5. Do we need analytics tracking for playback events?

### Future Considerations:
- Cloud audio streaming vs local-only
- Audio transcription during playback
- Multi-language audio support
- Accessibility voice guidance
- Family member audio sharing

---

**Note:** This test specification follows TDD principles. Implement features incrementally, running tests frequently to ensure each piece works before moving to the next. The tests serve as both specification and verification of the audio playback feature.
