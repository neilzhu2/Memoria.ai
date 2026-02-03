# Recording Flow Navigation & Screen Transitions Design

## Overview

This document outlines the navigation flow and screen transition architecture for Memoria.ai Phase 2 recording flow, specifically optimized for elderly users with clear pathways, accessible transitions, and comprehensive error recovery.

## Navigation Principles for Elderly Users

### 1. Linear with Clear Back Navigation
- **Primary Flow**: Sequential screens with obvious "next" actions
- **Back Navigation**: Always available except during active recording
- **Progress Indication**: Clear visual progress through the flow
- **No Dead Ends**: Every screen has a clear exit strategy

### 2. Reduced Cognitive Load
- **One Primary Action**: Each screen focuses on one main task
- **Consistent Patterns**: Same navigation elements across screens
- **Clear Labels**: Text that explains what will happen next
- **Visual Hierarchy**: Important actions are visually prominent

### 3. Error Prevention & Recovery
- **Confirmation Dialogs**: For destructive actions
- **Auto-Save**: Progress saved at each step
- **Gentle Corrections**: Helpful guidance instead of harsh errors
- **Multiple Recovery Paths**: Various ways to get back on track

## Screen Flow Architecture

### 1. Primary Happy Path

```
[Home] → [Preparation] → [Permissions] → [Audio Test] → [Recording] → [Review] → [Save] → [Success]
   ↓         ↓             ↓              ↓            ↓          ↓        ↓        ↓
Cancel   Start Flow    Grant Access   Test Mic    Record    Listen    Save    Done
```

### 2. Alternative Flows

#### Skip Paths (for experienced users)
```
[Preparation] → [Recording] (skip permissions if granted, skip audio test if experienced)
[Audio Test] → [Recording] (immediate recording for confident users)
```

#### Error Recovery Paths
```
[Any Screen] → [Error Recovery] → [Previous Screen] or [Safe Screen]
[Recording] → [Interruption Handler] → [Pause Screen] or [Recovery]
```

#### Pause/Resume Flows
```
[Active Recording] → [Pause] → [Resume] or [Stop]
[Pause Screen] → [Resume Recording] or [Complete Recording]
```

## Detailed Screen Transitions

### 1. Preparation Screen

**Purpose**: Welcome user and set expectations
**Duration**: 15-30 seconds for first-time users, 5-10 seconds for experienced

#### Entry Points:
- From Home screen (topic selected)
- From floating record button
- From "Try Again" after error

#### Navigation Options:
```typescript
interface PreparationNavigation {
  onStart: () => void;           // → Permission Request or Audio Test
  onCancel: () => void;          // → Home
  onSelectTopic: () => void;     // → Topic Selection (optional)
  onSettings: () => void;        // → Settings overlay
}
```

#### Exit Conditions:
- User taps "Start Recording" → Check permissions
- User cancels → Return to Home
- Error occurs → Error Recovery screen

#### Visual Transition:
- Fade in from Home
- Slide up animation for elderly users (slower, clearer)
- Voice guidance begins immediately

### 2. Permission Request Screen

**Purpose**: Request microphone access with clear explanation
**Duration**: 30-60 seconds (includes reading time)

#### Entry Conditions:
- Microphone permission not granted
- First-time app usage
- Permission previously denied

#### Navigation Options:
```typescript
interface PermissionNavigation {
  onPermissionGranted: () => void;    // → Audio Test
  onPermissionDenied: () => void;     // → Error Recovery
  onOpenSettings: () => void;         // → Device Settings
  onSkip: () => void;                 // → Error state (no skip for permissions)
  onBack: () => void;                 // → Preparation
}
```

#### Skip Logic:
- If permissions already granted: Auto-skip to Audio Test
- Cannot skip if permissions denied
- Show helpful guidance for enabling permissions

#### Visual Transition:
- Slide in from right
- Large, clear permission dialog
- Animated microphone icon for context

### 3. Audio Test Screen

**Purpose**: Verify microphone works and user understands
**Duration**: 15-45 seconds

#### Entry Conditions:
- Permissions granted
- First recording session
- User requests audio test

#### Navigation Options:
```typescript
interface AudioTestNavigation {
  onTestComplete: () => void;         // → Recording Active
  onTestFailed: () => void;           // → Error Recovery
  onRetry: () => void;                // → Retry audio test
  onSkip: () => void;                 // → Recording (experienced users)
  onBack: () => void;                 // → Permission Request
}
```

#### Skip Logic:
- Available for experienced users (>3 successful recordings)
- Voice guidance explains skip option
- Auto-skip if recent successful test (<24 hours)

#### Test Process:
1. User taps "Test Microphone"
2. 3-second recording
3. Immediate playback
4. User confirms quality
5. Proceed or retry

### 4. Active Recording Screen

**Purpose**: Primary recording interface
**Duration**: Variable (30 seconds to 30 minutes)

#### Entry Conditions:
- Audio test passed or skipped
- User ready to record
- Topic selected (optional)

#### Navigation Options:
```typescript
interface ActiveRecordingNavigation {
  onPause: () => void;                // → Paused Recording
  onStop: () => void;                 // → Review Screen
  onCancel: () => void;               // → Confirmation → Home
  // No back button during active recording
}
```

#### Special Behaviors:
- **No Back Button**: Prevents accidental exits
- **Confirmation Required**: For stop/cancel actions
- **Auto-Save**: Continuous saving of progress
- **Interruption Handling**: Phone calls, backgrounding

#### Visual States:
- Large, pulsing record button
- Audio visualizer
- Clear duration timer
- Pause/stop controls

### 5. Paused Recording Screen

**Purpose**: Safe state during recording breaks
**Duration**: Unlimited (with gentle reminders)

#### Entry Conditions:
- User pauses active recording
- App backgrounded during recording
- Interruption occurred

#### Navigation Options:
```typescript
interface PausedRecordingNavigation {
  onResume: () => void;               // → Active Recording
  onStop: () => void;                 // → Review Screen
  onDiscard: () => void;              // → Confirmation → Home
}
```

#### Elderly-Specific Features:
- Gentle reminders every 5 minutes
- Large "Resume" button
- Clear status indication
- Voice guidance available

### 6. Review/Playback Screen

**Purpose**: Listen to recording and decide next steps
**Duration**: 1-5 minutes

#### Entry Conditions:
- Recording completed successfully
- User stopped recording

#### Navigation Options:
```typescript
interface ReviewNavigation {
  onSave: () => void;                 // → Title Edit or Completion
  onReRecord: () => void;             // → Confirmation → Active Recording
  onDiscard: () => void;              // → Confirmation → Home
  onEditTitle: () => void;            // → Title Edit Screen
  onBack: () => void;                 // → Active Recording (if resume possible)
}
```

#### Features:
- Play/pause controls
- Volume adjustment
- Playback speed control (elderly feature)
- Quality indicator
- Transcription preview (if available)

### 7. Title Edit Screen

**Purpose**: Add title and tags to memory
**Duration**: 30 seconds to 2 minutes

#### Entry Conditions:
- User chooses to edit title
- Auto-generated title needs refinement

#### Navigation Options:
```typescript
interface TitleEditNavigation {
  onSave: () => void;                 // → Completion Screen
  onSkip: () => void;                 // → Use auto-generated title → Completion
  onBack: () => void;                 // → Review Screen
}
```

#### Elderly Features:
- Large text input
- Voice-to-text option
- Suggested titles
- Simple tagging interface

### 8. Completion Screen

**Purpose**: Confirm save and show sharing options
**Duration**: 30-60 seconds

#### Entry Conditions:
- Recording processed successfully
- Title finalized
- Ready to save

#### Navigation Options:
```typescript
interface CompletionNavigation {
  onConfirmSave: () => void;          // → Success Screen
  onShareOptions: () => void;         // → Sharing overlay
  onBack: () => void;                 // → Title Edit
  onPreview: () => void;              // → Final preview
}
```

#### Save Process:
1. Show save progress
2. Confirm family sharing settings
3. Add to memory collection
4. Generate sharing links (optional)

### 9. Success Screen

**Purpose**: Celebrate completion and suggest next actions
**Duration**: 5-15 seconds (auto-advance available)

#### Entry Conditions:
- Memory saved successfully
- All processing complete

#### Navigation Options:
```typescript
interface SuccessNavigation {
  onRecordAnother: () => void;        // → Preparation (new session)
  onViewMemories: () => void;         // → Memory list
  onShare: () => void;                // → Sharing options
  onHome: () => void;                 // → Home screen
}
```

#### Features:
- Celebration animation
- Summary of what was saved
- Encouragement for next recording
- Family notification status

### 10. Error Recovery Screen

**Purpose**: Help users recover from errors gracefully
**Duration**: Variable (until issue resolved)

#### Entry Conditions:
- Any error during flow
- Permission denied
- Technical issues

#### Navigation Options:
```typescript
interface ErrorRecoveryNavigation {
  onRetry: () => void;                // → Previous screen
  onSkip: () => void;                 // → Alternative path
  onHelp: () => void;                 // → Help overlay
  onRestart: () => void;              // → Preparation
  onExit: () => void;                 // → Home
}
```

#### Error-Specific Paths:
- **Permission Error**: → Device Settings help
- **Audio Error**: → Audio troubleshooting
- **Storage Error**: → Storage management help
- **Network Error**: → Offline mode explanation

## Transition Animations

### 1. Elderly-Optimized Animations

#### Timing:
- **Duration**: 400-600ms (slower than standard)
- **Easing**: Ease-in-out (smooth, predictable)
- **Interruption**: Non-interruptible during transition

#### Types:
```typescript
interface ElderlyTransitions {
  slideRight: 'slide-in-right';     // Forward navigation
  slideLeft: 'slide-in-left';       // Back navigation
  fadeIn: 'fade-in';                // Error recovery, overlays
  slideUp: 'slide-up';              // Modals, confirmations
  scaleIn: 'scale-in';              // Success, celebrations
}
```

### 2. Reduced Motion Support

#### Alternative Animations:
- Fade transitions instead of slides
- Immediate transitions for motion-sensitive users
- Accessibility setting integration
- Voice announcements for transitions

### 3. Loading States

#### Between Screens:
```typescript
interface LoadingStates {
  preparation: 'Setting up your recording session...';
  permissions: 'Checking microphone access...';
  audioTest: 'Testing your microphone...';
  recording: 'Starting recording...';
  processing: 'Processing your memory...';
  saving: 'Saving your memory...';
}
```

## Navigation State Management

### 1. History Management

```typescript
interface NavigationHistory {
  screens: RecordingScreen[];
  canGoBack: boolean[];
  skipReasons: SkipReason[];
  entryTimes: Date[];
  exitReasons: ('next' | 'back' | 'skip' | 'error')[];
}
```

### 2. Progress Tracking

```typescript
interface FlowProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: RecordingScreen[];
  estimatedTimeRemaining: number;
  userExperienceLevel: 'beginner' | 'intermediate' | 'experienced';
}
```

### 3. Context Preservation

#### State Persistence:
- Audio settings preserved across screens
- Recording content saved continuously
- User preferences maintained
- Error context retained for recovery

## Accessibility Features

### 1. Screen Reader Support

```typescript
interface ScreenReaderAnnouncements {
  onScreenEnter: string;
  onScreenExit: string;
  onActionAvailable: string;
  onProgressUpdate: string;
  onError: string;
}
```

### 2. Keyboard Navigation

- Tab order optimized for screen readers
- Skip links for power users
- Arrow key navigation for lists
- Enter/Space for primary actions

### 3. Voice Commands (Optional)

```typescript
interface VoiceCommands {
  'start recording': () => void;
  'stop recording': () => void;
  'go back': () => void;
  'skip this step': () => void;
  'help me': () => void;
}
```

## Error Handling in Navigation

### 1. Graceful Degradation

```typescript
interface NavigationErrors {
  screenLoadFailed: 'fallback-to-previous' | 'show-error-recovery';
  transitionFailed: 'immediate-transition' | 'retry-with-fade';
  stateLost: 'restore-from-cache' | 'restart-flow';
}
```

### 2. Recovery Strategies

#### Automatic Recovery:
- Retry failed transitions (max 3 attempts)
- Fallback to simpler animations
- State restoration from local storage
- Graceful degradation to basic flow

#### User-Initiated Recovery:
- "Something went wrong" screen with options
- Restart flow with progress preservation
- Contact support with diagnostic info
- Safe exit to home screen

## Performance Considerations

### 1. Memory Management

```typescript
interface PerformanceOptimizations {
  preloadNextScreen: boolean;
  unloadPreviousScreen: boolean;
  cacheAudioData: boolean;
  backgroundProcessing: boolean;
}
```

### 2. Battery Optimization

- Reduce animations on low battery
- Pause non-essential monitoring
- Optimize audio processing
- Suspend background tasks

## Testing Strategy

### 1. User Flow Testing

#### Scenarios:
- Happy path (no issues)
- Error scenarios (each error type)
- Interruption scenarios (calls, backgrounding)
- Accessibility scenarios (screen readers, voice over)
- Performance scenarios (low memory, slow device)

### 2. Elderly User Testing

#### Focus Areas:
- Navigation clarity and predictability
- Button size and accessibility
- Voice guidance effectiveness
- Error recovery success rate
- Overall completion rate

## Implementation Priorities

### Phase 1: Core Navigation
- [ ] Basic screen transitions
- [ ] Happy path flow
- [ ] Back navigation
- [ ] Error recovery basics

### Phase 2: Elderly Optimizations
- [ ] Slower animations
- [ ] Voice guidance integration
- [ ] Confirmation dialogs
- [ ] Simplified error handling

### Phase 3: Advanced Features
- [ ] Skip logic
- [ ] Auto-save/restore
- [ ] Performance optimization
- [ ] Accessibility enhancements

This navigation design ensures that elderly users can confidently navigate through the recording flow while providing multiple safety nets and recovery options for when things don't go as expected.