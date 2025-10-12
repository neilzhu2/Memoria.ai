# Audio Playback UI Specification

## Visual Design Requirements

This document describes the expected UI/UX for the audio playback feature based on the test specifications and elderly-friendly design principles.

## Recording List Item - Idle State

```
┌─────────────────────────────────────────────────────────┐
│  ┌───┐                                          ┌───┐   │
│  │ ▶ │  Family Dinner Story                     │ 🗑 │   │
│  └───┘  2:00 • Today, 2:30 PM                   └───┘   │
│  Play                                            Delete  │
└─────────────────────────────────────────────────────────┘
```

**Elements:**
- ✓ Play button (40x40px minimum, 60x60px recommended)
- ✓ Recording title (16px font, bold)
- ✓ Duration in MM:SS format
- ✓ Timestamp
- ✓ Delete button (40x40px minimum)

**Accessibility:**
- Label: "Play recording: Family Dinner Story"
- Hint: "Double tap to start playback"
- Role: button

## Recording List Item - Playing State

```
┌─────────────────────────────────────────────────────────┐
│  ┌───┐                                          ┌───┐   │
│  │ ⏸ │  Family Dinner Story                     │ 🗑 │   │
│  └───┘  00:45 / 2:00                            └───┘   │
│  Pause                                           Delete  │
│                                                          │
│  ┌────┐                                    ┌────┐       │
│  │ ⏮ │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ ⏭ │       │
│  └────┘  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ └────┘       │
│  -15s    [=====>-----------------]  37%    +15s         │
└─────────────────────────────────────────────────────────┘
```

**Additional Elements (when playing):**
- ✓ Pause button (replaces play)
- ✓ Current time / Total duration (18px font)
- ✓ Rewind 15s button (44x44px minimum)
- ✓ Progress bar with thumb (minimum 44px height for touch)
- ✓ Forward 15s button (44x44px minimum)

**Progress Bar:**
- Width: Full width minus padding
- Height: 44px (touch-friendly)
- Track color: Light gray (#E0E0E0)
- Fill color: Primary blue (#007AFF)
- Thumb: 20px circle, white with shadow

**Accessibility:**
- Pause label: "Pause recording: Family Dinner Story"
- Rewind label: "Rewind 15 seconds"
- Forward label: "Forward 15 seconds"
- Progress bar role: "adjustable"
- Time announcement: "45 seconds of 2 minutes"

## Recording List Item - Paused State

```
┌─────────────────────────────────────────────────────────┐
│  ┌───┐                                          ┌───┐   │
│  │ ▶ │  Family Dinner Story                     │ 🗑 │   │
│  └───┘  00:45 / 2:00                            └───┘   │
│  Resume                                          Delete  │
│                                                          │
│  ┌────┐                                    ┌────┐       │
│  │ ⏮ │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ ⏭ │       │
│  └────┘  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ └────┘       │
│  -15s    [=====>-----------------]  37%    +15s         │
└─────────────────────────────────────────────────────────┘
```

**Similar to playing state but:**
- ✓ Play icon shown instead of pause
- ✓ Progress bar remains visible
- ✓ Skip controls remain visible
- ✓ Time shows paused position

## Color Scheme

### Light Mode
```css
--background: #FFFFFF
--text-primary: #000000
--text-secondary: #666666
--play-button: #007AFF
--pause-button: #007AFF
--delete-button: #FF3B30
--progress-track: #E0E0E0
--progress-fill: #007AFF
--border: #D1D1D6
```

### Dark Mode
```css
--background: #1C1C1E
--text-primary: #FFFFFF
--text-secondary: #8E8E93
--play-button: #0A84FF
--pause-button: #0A84FF
--delete-button: #FF453A
--progress-track: #3A3A3C
--progress-fill: #0A84FF
--border: #38383A
```

## Touch Target Sizes

### Minimum (Accessibility Standards)
- iOS: 44x44 points
- Android: 48x48 dp

### Recommended (Elderly-Friendly)
- Primary controls: 60x60 points
- Secondary controls: 50x50 points
- Progress bar: Full width × 44 points minimum

### Implementation
```typescript
const TOUCH_SIZES = {
  elderly: {
    primary: 60,
    secondary: 50,
    progressHeight: 44,
  },
  standard: {
    primary: 44,
    secondary: 44,
    progressHeight: 44,
  },
};
```

## Typography

### Font Sizes (Elderly-Friendly)
```typescript
const FONT_SIZES = {
  title: 18,           // Recording title
  time: 16,            // Current/total time
  duration: 14,        // Duration badge
  metadata: 14,        // Date/timestamp
};

const FONT_WEIGHTS = {
  title: '600',        // Semibold
  time: '500',         // Medium
  duration: '500',     // Medium
  metadata: '400',     // Regular
};
```

## Spacing & Layout

```typescript
const SPACING = {
  itemPadding: 16,          // Padding inside item
  itemMargin: 12,           // Margin between items
  controlSpacing: 12,       // Space between controls
  progressMarginTop: 12,    // Space above progress bar
  iconTextGap: 12,          // Gap between icon and text
};
```

## Component Hierarchy

```
RecordingsList (Modal)
├── Header
│   ├── Close Button
│   ├── Title "Voice Memos"
│   └── Spacer
│
└── FlatList
    └── MemoryItem (for each recording)
        ├── PlayPauseButton
        │   ├── Icon (Play/Pause)
        │   └── Touch Ripple
        │
        ├── MemoryInfo
        │   ├── Title
        │   └── Metadata (Duration • Date)
        │
        ├── DeleteButton
        │   └── Trash Icon
        │
        └── PlaybackControls (conditional: if playing/paused)
            ├── TimeDisplay
            │   ├── CurrentTime
            │   ├── Separator "/"
            │   └── TotalTime
            │
            └── ProgressSection
                ├── RewindButton (-15s)
                ├── ProgressBar
                │   ├── Track
                │   ├── Fill
                │   └── Thumb
                └── ForwardButton (+15s)
```

## Animation Specifications

### Play/Pause Button Press
```typescript
Animated.spring(scaleValue, {
  toValue: 0.95,
  useNativeDriver: true,
}).start();
```

### Progress Bar Update
```typescript
// Smooth interpolation
Animated.timing(progressValue, {
  toValue: newProgress,
  duration: 100,
  easing: Easing.linear,
  useNativeDriver: false, // width cannot use native driver
}).start();
```

### State Transition
```typescript
// Fade in controls
Animated.timing(opacityValue, {
  toValue: 1,
  duration: 200,
  easing: Easing.ease,
  useNativeDriver: true,
}).start();
```

## Interaction States

### Button States
1. **Default** - Normal appearance
2. **Pressed** - Scale to 0.95, slight opacity change
3. **Disabled** - 50% opacity, no interaction
4. **Loading** - Spinner indicator

### Progress Bar States
1. **Idle** - Not visible
2. **Buffering** - Indeterminate progress
3. **Playing** - Animated fill
4. **Seeking** - Thumb follows touch
5. **Error** - Red tint

## Error States

### Missing Audio File
```
┌─────────────────────────────────────────────────────────┐
│  ┌───┐                                          ┌───┐   │
│  │ ⚠️ │  Family Dinner Story                     │ 🗑 │   │
│  └───┘  Audio unavailable                       └───┘   │
│  Error                                           Delete  │
│                                                          │
│  ⚠️  This recording's audio file is missing or damaged  │
└─────────────────────────────────────────────────────────┘
```

### Playback Error Alert
```
┌─────────────────────────────────┐
│           Error                 │
├─────────────────────────────────┤
│                                 │
│  Failed to play recording.      │
│                                 │
│  The audio file may be          │
│  corrupted or missing.          │
│                                 │
├─────────────────────────────────┤
│             [OK]                │
└─────────────────────────────────┘
```

## Loading States

### Initial Load
```
┌─────────────────────────────────────────────────────────┐
│  ┌───┐                                          ┌───┐   │
│  │ ⏳ │  Loading...                             │    │   │
│  └───┘                                          └───┘   │
└─────────────────────────────────────────────────────────┘
```

### Buffering During Playback
```
┌─────────────────────────────────────────────────────────┐
│  ┌───┐                                          ┌───┐   │
│  │ ⏸ │  Family Dinner Story                     │ 🗑 │   │
│  └───┘  00:45 / 2:00 • Buffering...            └───┘   │
│                                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━       │
│  [=====>--...--...--...--] 37%                          │
│         (animated dots)                                 │
└─────────────────────────────────────────────────────────┘
```

## Responsive Behavior

### Portrait Mode (Default)
- Full-width layout
- Stacked controls
- Large touch targets

### Landscape Mode
- Compact layout
- Inline controls
- Optimized for thumb reach

### Tablet/Large Screen
- Maximum width: 600px
- Centered content
- Increased padding

## Haptic Feedback Patterns

```typescript
const HAPTIC_PATTERNS = {
  playPause: Haptics.ImpactFeedbackStyle.Light,
  skip: Haptics.ImpactFeedbackStyle.Light,
  seek: Haptics.ImpactFeedbackStyle.Light,
  delete: Haptics.ImpactFeedbackStyle.Medium,
  error: Haptics.NotificationFeedbackType.Error,
  complete: Haptics.NotificationFeedbackType.Success,
};
```

## Implementation Checklist

### Visual Design
- [ ] Play/Pause button with correct icons
- [ ] Time display in MM:SS format
- [ ] Progress bar with touch-friendly height
- [ ] Skip controls (-15s, +15s)
- [ ] High contrast colors
- [ ] Large, readable fonts
- [ ] Proper spacing between elements

### Interactions
- [ ] Tap play to start
- [ ] Tap pause to pause
- [ ] Tap skip buttons to seek
- [ ] Tap/drag progress bar to seek
- [ ] Haptic feedback on all interactions
- [ ] Visual press states

### States
- [ ] Idle (not playing)
- [ ] Playing
- [ ] Paused
- [ ] Loading/Buffering
- [ ] Error
- [ ] Completed

### Accessibility
- [ ] All controls labeled
- [ ] All controls have hints
- [ ] Minimum 44x44 touch targets
- [ ] Screen reader announcements
- [ ] Keyboard navigation support
- [ ] High contrast mode support

### Responsive
- [ ] Works on small screens (iPhone SE)
- [ ] Works on large screens (iPad)
- [ ] Adapts to orientation changes
- [ ] Safe area handling

## Code Example

```typescript
// Recording Item with Playback Controls
<View style={styles.memoryItem}>
  {/* Play/Pause Button */}
  <TouchableOpacity
    style={[styles.playButton, { backgroundColor: isPlaying ? tintColor : tintColor }]}
    onPress={() => togglePlayback(memory)}
    accessibilityLabel={`${isPlaying ? 'Pause' : 'Play'} recording: ${memory.title}`}
    accessibilityHint={`Double tap to ${isPlaying ? 'pause' : 'start'} playback`}
    accessibilityRole="button"
  >
    <IconSymbol
      name={isPlaying ? "pause.fill" : "play.fill"}
      size={24}
      color="white"
    />
  </TouchableOpacity>

  {/* Memory Info */}
  <View style={styles.memoryInfo}>
    <Text style={styles.memoryTitle}>{memory.title}</Text>
    <Text style={styles.memoryTime}>
      {isPlaying ? `${formatTime(currentPosition)} / ` : ''}
      {formatTime(memory.duration * 1000)}
      {' • '}
      {formatDate(memory.date)}
    </Text>
  </View>

  {/* Delete Button */}
  <TouchableOpacity
    style={styles.deleteButton}
    onPress={() => deleteRecording(memory)}
    accessibilityLabel={`Delete recording: ${memory.title}`}
  >
    <IconSymbol name="trash" size={20} color="#FF3B30" />
  </TouchableOpacity>

  {/* Playback Controls (shown when playing/paused) */}
  {(isPlaying || isPaused) && (
    <View style={styles.playbackControls}>
      {/* Skip Controls */}
      <View style={styles.skipControls}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={rewind15Seconds}
          accessibilityLabel="Rewind 15 seconds"
          accessibilityRole="button"
        >
          <IconSymbol name="gobackward.15" size={24} color={tintColor} />
        </TouchableOpacity>

        {/* Progress Bar */}
        <Slider
          style={styles.progressBar}
          value={progress}
          onValueChange={handleSeek}
          minimumValue={0}
          maximumValue={1}
          minimumTrackTintColor={tintColor}
          maximumTrackTintColor="#E0E0E0"
          thumbTintColor={tintColor}
          accessibilityRole="adjustable"
          accessibilityLabel={`Playback progress: ${Math.round(progress * 100)}%`}
        />

        <TouchableOpacity
          style={styles.skipButton}
          onPress={forward15Seconds}
          accessibilityLabel="Forward 15 seconds"
          accessibilityRole="button"
        >
          <IconSymbol name="goforward.15" size={24} color={tintColor} />
        </TouchableOpacity>
      </View>
    </View>
  )}
</View>

const styles = StyleSheet.create({
  memoryItem: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: backgroundColor,
    borderWidth: 1,
    borderColor: borderColor,
    marginBottom: 12,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: textColor,
    marginBottom: 4,
  },
  memoryTime: {
    fontSize: 16,
    color: secondaryTextColor,
  },
  deleteButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playbackControls: {
    marginTop: 12,
  },
  skipControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    flex: 1,
    marginHorizontal: 8,
    height: 44,
  },
});
```

## Testing the UI

When implementing, test:
1. Tap targets are large enough (use your thumb)
2. Colors have sufficient contrast
3. Text is readable without glasses
4. Controls respond immediately
5. Progress updates smoothly
6. Errors are clearly communicated
7. Works in both light and dark mode
8. Accessible with VoiceOver/TalkBack

---

**Reference Wireframe:** `/Product&Design/Wireframe_Momories Experience.pdf`

This UI specification ensures the audio playback feature is both functional and accessible for elderly users.
