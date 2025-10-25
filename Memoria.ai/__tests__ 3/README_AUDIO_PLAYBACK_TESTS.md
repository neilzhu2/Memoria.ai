# Audio Playback Tests - README

## Overview
This directory contains comprehensive test suites for the audio playback feature in Memoria.ai. The tests follow Test-Driven Development (TDD) principles and are designed to guide implementation while ensuring quality and accessibility for elderly users.

## Test Files Structure

```
__tests__/
├── components/
│   ├── RecordingsList.test.tsx          # 53 integration tests
│   └── AudioPlaybackControls.test.tsx   # 42 unit tests (skipped until implementation)
├── utils/
│   └── audioTestHelpers.ts              # Reusable test utilities
└── README_AUDIO_PLAYBACK_TESTS.md       # This file
```

## Quick Start

### 1. Run All Audio Tests
```bash
# Run RecordingsList playback tests
npm test RecordingsList.test.tsx

# Run in watch mode (recommended during development)
npm test -- --watch RecordingsList.test.tsx

# Run with coverage report
npm test -- --coverage RecordingsList.test.tsx
```

### 2. Expected Initial Results
**Before Implementation:**
```
FAIL  __tests__/components/RecordingsList.test.tsx
  ✕ All 53 tests should fail (features not implemented)
```

**After Implementation:**
```
PASS  __tests__/components/RecordingsList.test.tsx
  ✓ All 53 tests should pass
Coverage: >80% for all metrics
```

## Test Categories

### RecordingsList.test.tsx (53 tests)

#### 1. Initial State Tests (5 tests)
- Playback controls rendering
- Default "not playing" state
- Initial time display (00:00)
- Total duration display
- No controls for recordings without audio

#### 2. Play/Pause Functionality (6 tests)
- Start playback on play button press
- Icon changes (play ↔ pause)
- Pause functionality
- Toggle between states
- Haptic feedback
- Visual feedback

#### 3. Skip Controls (8 tests)
- Rewind/Forward button rendering
- Rewind 15 seconds functionality
- Forward 15 seconds functionality
- Boundary protection (0 to duration)
- Controls work during playback
- Haptic feedback

#### 4. Progress Display (6 tests)
- Progress bar rendering
- Real-time updates
- Time display in MM:SS format
- Single-digit second padding
- Tap to seek functionality
- Time updates on seeking

#### 5. Multiple Audio Management (4 tests)
- Stop current audio when new starts
- Only one audio plays at a time
- Resource cleanup
- Rapid switching handling

#### 6. Playback Completion (4 tests)
- Auto-stop at end
- UI reset to initial state
- Replay functionality
- Controls visibility after completion

#### 7. Error Handling (5 tests)
- Missing audio file alerts
- Corrupted file handling
- Component unmount cleanup
- Mid-stream error handling
- Modal close cleanup

#### 8. Accessibility (8 tests)
- Touch target sizes (44x44 minimum)
- Accessibility labels
- Accessibility hints
- Screen reader announcements
- Large readable text
- Visual feedback
- Navigation support
- High contrast colors

#### 9. Performance (3 tests)
- Render performance
- Smooth progress updates
- List efficiency with many recordings

#### 10. Edge Cases (4 tests)
- Very short audio (< 15s)
- Very long audio (> 1 hour)
- Zero duration handling
- Simultaneous actions

### AudioPlaybackControls.test.tsx (42 tests - currently skipped)

This file contains unit tests for a reusable AudioPlaybackControls component. Tests are marked with `.skip()` and will be enabled once you create the component.

**To enable these tests:**
1. Create `/components/AudioPlaybackControls.tsx`
2. Remove `.skip()` from test descriptions
3. Uncomment test implementations
4. Run tests to guide implementation

## Using Test Helpers

### Import Helpers
```typescript
import {
  createMockSound,
  createMockMemory,
  formatTime,
  progressHelpers,
  skipHelpers,
  accessibilityHelpers,
} from '../utils/audioTestHelpers';
```

### Create Mock Sound
```typescript
// Basic mock sound
const mockSound = createMockSound();

// Mock sound with custom config
const mockSound = createMockSound({
  duration: 180000,        // 3 minutes
  initialPosition: 30000,  // Start at 30 seconds
  shouldFail: false,       // No errors
});

// Mock sound that fails to load
const failingSound = createMockSound({
  shouldFail: true,
  failureType: 'load',
});
```

### Create Test Data
```typescript
// Single memory
const memory = createMockMemory({
  title: 'Test Recording',
  duration: 120,
  audioPath: 'file:///test.m4a',
});

// Multiple memories
const memories = createMockMemories(5);

// Edge case memories
import { edgeCaseMemories } from '../utils/audioTestHelpers';
const shortAudio = edgeCaseMemories.veryShort;
const longAudio = edgeCaseMemories.veryLong;
```

### Format Time
```typescript
import { formatTime } from '../utils/audioTestHelpers';

// Milliseconds to MM:SS
formatTime.toMMSS(90000);        // "01:30"
formatTime.toMMSS(3665000);      // "1:01:05"

// Seconds to MM:SS
formatTime.secondsToMMSS(90);    // "01:30"

// Parse time string to milliseconds
formatTime.parseToMillis("01:30"); // 90000
```

### Calculate Progress
```typescript
import { progressHelpers } from '../utils/audioTestHelpers';

// Get progress percentage
const progress = progressHelpers.calculateProgress(60000, 120000); // 0.5

// Get position from progress
const position = progressHelpers.calculatePosition(0.75, 120000); // 90000

// Get position from tap on progress bar
const position = progressHelpers.calculatePositionFromTap(300, 400, 120000); // 90000
```

### Skip Controls
```typescript
import { skipHelpers } from '../utils/audioTestHelpers';

// Calculate rewind position
const newPos = skipHelpers.calculateRewindPosition(30000); // 15000 (15s back)

// Calculate forward position
const newPos = skipHelpers.calculateForwardPosition(100000, 120000); // 115000 (15s ahead)

// Check if skip is available
skipHelpers.canRewind(0);           // false
skipHelpers.canForward(120000, 120000); // false
```

### Accessibility Helpers
```typescript
import { accessibilityHelpers } from '../utils/audioTestHelpers';

// Validate touch target
accessibilityHelpers.validateTouchTargetSize(60, 60, true); // true (elderly mode)

// Get accessibility labels
const label = accessibilityHelpers.getPlaybackLabel(true, "Memory");
// "Pause recording: Memory"

const hint = accessibilityHelpers.getPlaybackHint(false);
// "Double tap to start playback"

const announcement = accessibilityHelpers.getTimeAnnouncement(60000, 120000);
// "01:00 of 02:00"
```

## TDD Workflow

### Step 1: Run Tests (Red)
```bash
npm test RecordingsList.test.tsx
```
All tests should fail - this is expected!

### Step 2: Implement Features (Green)
Work through test categories in order:

1. **Start with Initial State**
   - Render basic playback controls
   - Display time and duration
   - Get first 5 tests passing

2. **Add Play/Pause**
   - Implement play/pause toggle
   - Add audio Sound instance management
   - Get next 6 tests passing

3. **Add Skip Controls**
   - Implement rewind/forward buttons
   - Add position seeking logic
   - Get next 8 tests passing

4. **Add Progress Bar**
   - Implement progress visualization
   - Add tap-to-seek functionality
   - Get next 6 tests passing

5. **Continue through remaining categories**
   - Multiple audio management
   - Playback completion
   - Error handling
   - Accessibility
   - Performance
   - Edge cases

### Step 3: Refactor
- Clean up code
- Extract reusable components
- Optimize performance
- Ensure tests still pass

## Implementation Guide

### Recommended Implementation Order

#### Phase 1: Basic Playback (MVP)
```typescript
// 1. Add state for playback
const [playingSound, setPlayingSound] = useState<Audio.Sound | null>(null);
const [playingMemoryId, setPlayingMemoryId] = useState<string | null>(null);
const [currentPosition, setCurrentPosition] = useState(0);

// 2. Implement play/pause
const togglePlayback = async (memory: MemoryItem) => {
  if (playingMemoryId === memory.id) {
    // Pause current
    await playingSound?.pauseAsync();
  } else {
    // Play new
    if (playingSound) await playingSound.unloadAsync();
    const { sound } = await Audio.Sound.createAsync({ uri: memory.audioPath });
    await sound.playAsync();
    setPlayingSound(sound);
    setPlayingMemoryId(memory.id);
  }
};

// 3. Add time display
const formatTime = (millis: number) => {
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
```

#### Phase 2: Enhanced Controls
```typescript
// 4. Add skip controls
const rewind15Seconds = async () => {
  if (!playingSound) return;
  const status = await playingSound.getStatusAsync();
  if (status.isLoaded) {
    const newPosition = Math.max(0, status.positionMillis - 15000);
    await playingSound.setPositionAsync(newPosition);
  }
};

// 5. Add progress bar
const handleSeek = async (progress: number) => {
  if (!playingSound) return;
  const status = await playingSound.getStatusAsync();
  if (status.isLoaded) {
    const newPosition = progress * status.durationMillis;
    await playingSound.setPositionAsync(newPosition);
  }
};

// 6. Listen for playback updates
useEffect(() => {
  if (playingSound) {
    playingSound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded) {
        setCurrentPosition(status.positionMillis);
        if (status.didJustFinish) {
          resetPlayback();
        }
      }
    });
  }
}, [playingSound]);
```

#### Phase 3: Error Handling & Accessibility
```typescript
// 7. Add error handling
const playRecording = async (memory: MemoryItem) => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // ... playback logic
  } catch (error) {
    console.error('Playback failed:', error);
    Alert.alert('Error', 'Failed to play recording.');
  }
};

// 8. Add accessibility
<TouchableOpacity
  accessibilityLabel={`${isPlaying ? 'Pause' : 'Play'} recording: ${memory.title}`}
  accessibilityHint={`Double tap to ${isPlaying ? 'pause' : 'start'} playback`}
  accessibilityRole="button"
  style={{ width: 60, height: 60 }} // Elderly-friendly size
>
  {/* Icon */}
</TouchableOpacity>
```

### Component Structure Options

#### Option A: Enhance RecordingsList Directly
**Pros:**
- Simpler to implement
- All state in one place
- Quick to get working

**Cons:**
- Less reusable
- Larger component file
- Harder to test in isolation

#### Option B: Extract AudioPlaybackControls Component
**Pros:**
- Reusable across app
- Better separation of concerns
- Easier to test
- Cleaner code organization

**Cons:**
- More files to manage
- Need to pass props
- Slightly more complex

**Recommended:** Start with Option A, refactor to Option B once working.

## Debugging Tests

### Common Issues

#### 1. Tests timeout
```typescript
// Add timeout to async operations
await waitFor(() => {
  expect(screen.getByText('01:30')).toBeTruthy();
}, { timeout: 3000 });
```

#### 2. Mock not working
```typescript
// Verify mock is set up correctly
beforeEach(() => {
  jest.clearAllMocks();
  (Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
    sound: createMockSound()
  });
});
```

#### 3. State not updating
```typescript
// Wrap state updates in act()
await act(async () => {
  fireEvent.press(playButton);
});
```

#### 4. Cleanup issues
```typescript
// Ensure cleanup in test
afterEach(() => {
  jest.clearAllTimers();
  cleanup();
});
```

### Debug Commands
```bash
# Run single test
npm test -t "starts playback when play button is pressed"

# Run with verbose output
npm test -- --verbose RecordingsList.test.tsx

# Update snapshots (if using)
npm test -- -u RecordingsList.test.tsx

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand RecordingsList.test.tsx
```

## Test Coverage Goals

### Minimum Requirements
- **Statements:** 80%
- **Branches:** 75%
- **Functions:** 80%
- **Lines:** 80%

### View Coverage
```bash
npm test -- --coverage RecordingsList.test.tsx

# Generate HTML report
npm test -- --coverage --coverageReporters=html

# Open in browser
open coverage/lcov-report/index.html
```

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: Audio Playback Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test RecordingsList.test.tsx -- --coverage
      - uses: codecov/codecov-action@v2
```

## Accessibility Testing Checklist

When implementing, verify:
- [ ] All controls have minimum 44x44 touch targets (60x60 for elderly)
- [ ] All interactive elements have accessibility labels
- [ ] All controls have accessibility hints
- [ ] State changes are announced to screen readers
- [ ] High contrast colors (4.5:1 ratio minimum)
- [ ] Text is minimum 16px, preferably 18px+
- [ ] Haptic feedback on all interactions
- [ ] Error states are clearly communicated
- [ ] Loading states have appropriate indicators

## Performance Optimization Tips

### 1. Memoize Expensive Calculations
```typescript
const progress = useMemo(() =>
  calculateProgress(currentPosition, duration),
  [currentPosition, duration]
);
```

### 2. Debounce Progress Updates
```typescript
const debouncedPosition = useDebounce(currentPosition, 100);
```

### 3. Optimize List Rendering
```typescript
<FlatList
  data={memories}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

### 4. Cleanup Resources
```typescript
useEffect(() => {
  return () => {
    if (playingSound) {
      playingSound.unloadAsync();
    }
  };
}, [playingSound]);
```

## Frequently Asked Questions

### Q: Why are AudioPlaybackControls tests skipped?
A: They're written for a component that doesn't exist yet. Once you extract the controls into a separate component, remove the `.skip()` to enable them.

### Q: Can I modify the tests?
A: Yes! These tests are a guide. Modify them to match your exact implementation approach, but maintain the same level of coverage.

### Q: How do I add new test cases?
A: Use the existing test structure as a template:
```typescript
it('should handle new scenario', async () => {
  renderRecordingsList();

  await act(async () => {
    // Perform actions
  });

  await waitFor(() => {
    // Assert results
  });
});
```

### Q: Tests are slow. How to speed up?
A:
1. Use `jest.useFakeTimers()` for time-based tests
2. Mock heavy operations
3. Run in parallel (default)
4. Use `--maxWorkers=4` flag

### Q: How to test on real device?
A: These are unit/integration tests. For E2E testing on real devices, use:
- Detox (recommended)
- Appium
- Manual testing with TestFlight/APK

## Support & Resources

### Documentation
- [Test Specification](/docs/AUDIO_PLAYBACK_TEST_SPECIFICATION.md)
- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [expo-av Documentation](https://docs.expo.dev/versions/latest/sdk/av/)

### Related Test Files
- `/jest.setup.js` - Global test configuration
- `/__tests__/components/RecordingButton.test.tsx` - Example test structure
- `/__tests__/utils/audioTestHelpers.ts` - Test utilities

### Getting Help
1. Check test error messages carefully
2. Review existing passing tests for patterns
3. Use `console.log()` in tests to debug
4. Check mock setup in `jest.setup.js`
5. Verify expo-av mock configuration

## Next Steps

1. **Run the tests** to see them fail (expected!)
2. **Start with Initial State tests** - get 5 passing
3. **Implement Play/Pause** - get 11 total passing
4. **Add Skip Controls** - get 19 total passing
5. **Continue incrementally** through all categories
6. **Achieve 100% test pass rate**
7. **Refactor and optimize** while keeping tests green

Good luck with your implementation! These tests will guide you to a robust, accessible audio playback feature that works great for elderly users. 🎵
