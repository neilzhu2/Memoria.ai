# Toast Notification System Design
## Memoria.ai - Voice Recording App for Elderly Users

**Document Version:** 1.0
**Last Updated:** 2025-10-08
**Target Audience:** Developers, UX Designers, Product Managers

---

## Table of Contents
1. [Overview](#overview)
2. [Design Principles for Elderly Users](#design-principles-for-elderly-users)
3. [Toast Types & Visual Specifications](#toast-types--visual-specifications)
4. [Complete Notification Cases](#complete-notification-cases)
5. [Implementation Guidelines](#implementation-guidelines)
6. [Accessibility Requirements](#accessibility-requirements)
7. [Testing Recommendations](#testing-recommendations)

---

## Overview

This document defines all toast notification cases for Memoria.ai, a voice recording application designed for elderly users (65+) to preserve their life memories. The notification system must provide clear, reassuring feedback while avoiding technical jargon and overwhelming users.

### Core Objectives
- Provide immediate, understandable feedback for all user actions
- Build user confidence through positive reinforcement
- Prevent confusion with clear error messages and recovery paths
- Maintain simplicity and readability for users with varying vision capabilities

---

## Design Principles for Elderly Users

### 1. **Clarity Over Brevity**
- Use complete sentences instead of abbreviated messages
- Avoid technical terms (e.g., "Your recording was saved" vs "Save successful")
- Explain what happened in plain language

### 2. **Reassurance & Positivity**
- Celebrate successes to build confidence
- Frame errors as solvable problems, not failures
- Use encouraging language

### 3. **Visual Accessibility**
- Minimum font size: 16px (18px preferred)
- High contrast ratios (WCAG AAA: 7:1 minimum)
- Large, recognizable icons
- Sufficient padding and touch targets

### 4. **Appropriate Timing**
- Longer display durations to accommodate slower reading speeds
- No auto-dismiss for critical errors
- Allow manual dismissal for all toasts

### 5. **Multimodal Feedback**
- Visual (toast message)
- Haptic feedback for important events
- Optional audio confirmation (future consideration)

---

## Toast Types & Visual Specifications

### Success Toast
- **Background Color:** Light green (#E8F5E9)
- **Border:** 2px solid green (#4CAF50)
- **Icon:** Checkmark circle (large, 32px)
- **Text Color:** Dark green (#1B5E20)
- **Font Size:** 18px
- **Haptic:** Light impact

### Error Toast
- **Background Color:** Light red (#FFEBEE)
- **Border:** 2px solid red (#F44336)
- **Icon:** Alert circle (large, 32px)
- **Text Color:** Dark red (#B71C1C)
- **Font Size:** 18px
- **Haptic:** Medium impact (2 pulses)

### Warning Toast
- **Background Color:** Light orange (#FFF3E0)
- **Border:** 2px solid orange (#FF9800)
- **Icon:** Warning triangle (large, 32px)
- **Text Color:** Dark orange (#E65100)
- **Font Size:** 18px
- **Haptic:** Light impact

### Info Toast
- **Background Color:** Light blue (#E3F2FD)
- **Border:** 2px solid blue (#2196F3)
- **Icon:** Information circle (large, 32px)
- **Text Color:** Dark blue (#0D47A1)
- **Font Size:** 18px
- **Haptic:** None (or very subtle)

### General Specifications
- **Minimum Height:** 80px
- **Padding:** 16px (top/bottom), 20px (left/right)
- **Border Radius:** 12px
- **Shadow:** Elevation 4 (Material Design)
- **Animation:** Gentle slide from top (300ms ease-out)
- **Position:** Top of screen, below status bar
- **Max Width:** 90% of screen width
- **Line Height:** 1.5x font size for readability

---

## Complete Notification Cases

### A. MEMORY MANAGEMENT

#### A1. Creating a New Memory/Recording

| Case ID | Trigger Event | Toast Type | Message Text | Duration | Priority | Additional UX |
|---------|---------------|------------|--------------|----------|----------|---------------|
| A1.1 | Memory successfully created | Success | "Your memory has been saved!" | 3s | High | Light haptic feedback, checkmark icon |
| A1.2 | Memory created with title | Success | "Your memory '[Title]' has been saved!" | 4s | High | Light haptic feedback, checkmark icon |
| A1.3 | Memory creation failed - storage | Error | "We couldn't save your memory. Your device storage is full. Please free up some space and try again." | No auto-dismiss | Critical | Medium haptic, alert icon, show "Settings" button |
| A1.4 | Memory creation failed - permissions | Error | "We need permission to save your memory. Please allow storage access in Settings." | No auto-dismiss | Critical | Medium haptic, show "Open Settings" button |
| A1.5 | Memory creation failed - generic | Error | "Something went wrong while saving your memory. Please try again." | 6s | Critical | Medium haptic, show "Try Again" button |

#### A2. Updating/Editing a Memory

| Case ID | Trigger Event | Toast Type | Message Text | Duration | Priority | Additional UX |
|---------|---------------|------------|--------------|----------|----------|---------------|
| A2.1 | Memory successfully updated | Success | "Your changes have been saved!" | 3s | High | Light haptic feedback |
| A2.2 | Memory title updated | Success | "Memory title updated to '[New Title]'" | 3s | High | Light haptic feedback |
| A2.3 | Memory description updated | Success | "Your description has been updated!" | 3s | Medium | Light haptic feedback |
| A2.4 | Memory update failed | Error | "We couldn't save your changes. Please try again." | 5s | High | Medium haptic, show "Try Again" button |
| A2.5 | Memory update - no changes detected | Info | "No changes were made to your memory." | 3s | Medium | No haptic |

#### A3. Deleting a Memory

| Case ID | Trigger Event | Toast Type | Message Text | Duration | Priority | Additional UX |
|---------|---------------|------------|--------------|----------|----------|---------------|
| A3.1 | Memory successfully deleted | Success | "Your memory has been deleted." | 3s | High | Light haptic feedback |
| A3.2 | Memory delete failed | Error | "We couldn't delete this memory. Please try again." | 5s | High | Medium haptic, show "Try Again" button |
| A3.3 | Undo delete (if implemented) | Info | "Memory deleted. Tap here to undo." | 5s | High | Show "Undo" button, light haptic |

#### A4. Transcription Operations

| Case ID | Trigger Event | Toast Type | Message Text | Duration | Priority | Additional UX |
|---------|---------------|------------|--------------|----------|----------|---------------|
| A4.1 | Transcription started | Info | "Creating text from your recording. This may take a moment..." | 3s | High | No haptic, show loading indicator |
| A4.2 | Transcription completed | Success | "Your recording has been converted to text!" | 4s | High | Light haptic, show "View" button |
| A4.3 | Transcription failed - network | Error | "We need an internet connection to create text from your recording. Please connect to Wi-Fi and try again." | No auto-dismiss | Critical | Medium haptic, show "Try Again" button |
| A4.4 | Transcription failed - audio quality | Error | "The audio quality is too low to create text. Try recording in a quieter place." | 6s | High | Medium haptic |
| A4.5 | Transcription failed - generic | Error | "We couldn't create text from your recording. Please try again later." | 6s | High | Medium haptic, show "Try Again" button |
| A4.6 | Transcription in progress (periodic) | Info | "Still working on your transcription..." | 2s | Medium | No haptic, appears every 10s during long transcriptions |

### B. AUDIO RECORDING OPERATIONS

#### B1. Recording Start/Stop

| Case ID | Trigger Event | Toast Type | Message Text | Duration | Priority | Additional UX |
|---------|---------------|------------|--------------|----------|----------|---------------|
| B1.1 | Recording started successfully | Success | "Recording started. Speak clearly into your device." | 3s | High | Light haptic feedback, microphone icon |
| B1.2 | Recording stopped by user | Info | "Recording stopped. Processing your memory..." | 2s | High | Light haptic |
| B1.3 | Recording failed to start - permission | Error | "We need permission to use your microphone. Please allow microphone access in Settings." | No auto-dismiss | Critical | Medium haptic, show "Open Settings" button |
| B1.4 | Recording failed to start - in use | Error | "Your microphone is being used by another app. Please close other apps and try again." | 6s | Critical | Medium haptic |
| B1.5 | Recording failed to start - generic | Error | "We couldn't start recording. Please try again." | 5s | Critical | Medium haptic, show "Try Again" button |

#### B2. Recording Save

| Case ID | Trigger Event | Toast Type | Message Text | Duration | Priority | Additional UX |
|---------|---------------|------------|--------------|----------|----------|---------------|
| B2.1 | Recording saved successfully | Success | "Your recording has been saved!" | 3s | Critical | Light haptic, checkmark icon |
| B2.2 | Recording saved with duration | Success | "Your [X minute/second] recording has been saved!" | 4s | Critical | Light haptic, checkmark icon |
| B2.3 | Recording failed to save - storage | Error | "Your device storage is full. Please free up space to save this recording." | No auto-dismiss | Critical | Medium haptic, show "Settings" button |
| B2.4 | Recording failed to save - corrupted | Error | "The recording file is damaged and cannot be saved. Please try recording again." | 6s | Critical | Medium haptic |
| B2.5 | Recording failed to save - generic | Error | "We couldn't save your recording. Please try again." | 6s | Critical | Medium haptic, show "Try Again" button |
| B2.6 | Auto-save successful (background) | Success | "Your recording was automatically saved." | 3s | High | Light haptic |

#### B3. Recording Quality & Duration

| Case ID | Trigger Event | Toast Type | Message Text | Duration | Priority | Additional UX |
|---------|---------------|------------|--------------|----------|----------|---------------|
| B3.1 | Recording too short | Warning | "Your recording is very short. Try speaking for at least 3 seconds." | 5s | High | Light haptic |
| B3.2 | Recording approaching max duration | Warning | "You have 1 minute of recording time remaining." | 4s | High | Light haptic |
| B3.3 | Recording max duration reached | Warning | "Maximum recording time reached. Your recording has been automatically saved." | 5s | Critical | Medium haptic |
| B3.4 | Low audio level detected | Warning | "We're having trouble hearing you. Please speak a bit louder or move closer to your device." | 5s | Medium | Light haptic |
| B3.5 | Background noise warning | Warning | "There's a lot of background noise. For best results, try recording in a quieter place." | 5s | Medium | Light haptic |

#### B4. Audio Playback

| Case ID | Trigger Event | Toast Type | Message Text | Duration | Priority | Additional UX |
|---------|---------------|------------|--------------|----------|----------|---------------|
| B4.1 | Playback started | Info | "Playing your recording..." | 2s | Medium | No haptic, show pause button |
| B4.2 | Playback completed | Info | "Recording finished playing." | 2s | Medium | Light haptic |
| B4.3 | Playback failed - corrupted file | Error | "This recording file is damaged and cannot be played." | 5s | High | Medium haptic |
| B4.4 | Playback failed - file not found | Error | "We couldn't find this recording. It may have been deleted." | 5s | High | Medium haptic |
| B4.5 | Playback failed - generic | Error | "We couldn't play this recording. Please try again." | 5s | High | Medium haptic, show "Try Again" button |
| B4.6 | Playback paused | Info | "Playback paused." | 2s | Low | Light haptic |
| B4.7 | Playback resumed | Info | "Playback resumed." | 2s | Low | No haptic |

### C. PERMISSIONS & SYSTEM ERRORS

#### C1. Permission Requests

| Case ID | Trigger Event | Toast Type | Message Text | Duration | Priority | Additional UX |
|---------|---------------|------------|--------------|----------|----------|---------------|
| C1.1 | Microphone permission denied | Error | "We need microphone permission to record your memories. Please go to Settings and allow microphone access." | No auto-dismiss | Critical | Medium haptic, show "Open Settings" button |
| C1.2 | Microphone permission granted | Success | "Thank you! You can now record your memories." | 3s | High | Light haptic |
| C1.3 | Storage permission denied | Error | "We need storage permission to save your memories. Please go to Settings and allow storage access." | No auto-dismiss | Critical | Medium haptic, show "Open Settings" button |
| C1.4 | Storage permission granted | Success | "Thank you! Your memories will now be saved." | 3s | High | Light haptic |
| C1.5 | Notification permission denied | Warning | "You won't receive reminders without notification permission. You can change this in Settings anytime." | 5s | Medium | No haptic, show "Settings" button |

#### C2. Storage Issues

| Case ID | Trigger Event | Toast Type | Message Text | Duration | Priority | Additional UX |
|---------|---------------|------------|--------------|----------|----------|---------------|
| C2.1 | Storage full (critical) | Error | "Your device storage is full. Please delete some files or photos to continue using the app." | No auto-dismiss | Critical | Medium haptic, show "Settings" button |
| C2.2 | Storage low warning (80%) | Warning | "Your device storage is getting low. Consider freeing up space soon." | 6s | High | Light haptic |
| C2.3 | Storage check failed | Error | "We couldn't check your storage space. The app may not work properly." | 5s | Medium | Light haptic |

#### C3. Network Errors

| Case ID | Trigger Event | Toast Type | Message Text | Duration | Priority | Additional UX |
|---------|---------------|------------|--------------|----------|----------|---------------|
| C3.1 | No internet connection | Error | "You're not connected to the internet. Some features won't work until you connect." | 5s | High | Medium haptic, show Wi-Fi icon |
| C3.2 | Internet connection restored | Success | "You're back online!" | 3s | Medium | Light haptic |
| C3.3 | Network timeout | Error | "The connection is taking too long. Please check your internet and try again." | 5s | High | Medium haptic, show "Try Again" button |
| C3.4 | Server unavailable | Error | "The service is temporarily unavailable. Please try again in a few minutes." | 6s | High | Medium haptic |

#### C4. Data & Validation Errors

| Case ID | Trigger Event | Toast Type | Message Text | Duration | Priority | Additional UX |
|---------|---------------|------------|--------------|----------|----------|---------------|
| C4.1 | Invalid file format | Error | "This file type is not supported. Please use a voice recording." | 5s | High | Medium haptic |
| C4.2 | Corrupted data detected | Error | "Some data is damaged and cannot be loaded. Your other memories are safe." | 6s | High | Medium haptic |
| C4.3 | Missing required field | Warning | "Please fill in all required information before saving." | 4s | Medium | Light haptic |
| C4.4 | Data sync conflict | Warning | "There's a conflict with your data. We've kept the most recent version." | 5s | Medium | Light haptic |

#### C5. Generic Errors

| Case ID | Trigger Event | Toast Type | Message Text | Duration | Priority | Additional UX |
|---------|---------------|------------|--------------|----------|----------|---------------|
| C5.1 | Unexpected error (app continues) | Error | "Something unexpected happened, but everything is okay. Please try again." | 5s | High | Medium haptic, show "Try Again" button |
| C5.2 | Unexpected error (feature blocked) | Error | "We're having technical difficulties. Please restart the app and try again." | No auto-dismiss | Critical | Medium haptic, show "Restart" button |
| C5.3 | Error recovered automatically | Success | "We fixed a problem automatically. Everything is working normally now." | 4s | Medium | Light haptic |

### D. EXPORT & SHARING OPERATIONS

#### D1. Export Memory

| Case ID | Trigger Event | Toast Type | Message Text | Duration | Priority | Additional UX |
|---------|---------------|------------|--------------|----------|----------|---------------|
| D1.1 | Export started | Info | "Preparing your memory for export. This may take a moment..." | 3s | High | No haptic, show loading indicator |
| D1.2 | Export completed successfully | Success | "Your memory has been exported! You can now share it." | 4s | High | Light haptic, show "Share" button |
| D1.3 | Export failed - storage | Error | "Not enough space to export. Please free up storage and try again." | 6s | High | Medium haptic, show "Settings" button |
| D1.4 | Export failed - generic | Error | "We couldn't export your memory. Please try again." | 5s | High | Medium haptic, show "Try Again" button |
| D1.5 | Multiple exports started | Info | "Preparing [X] memories for export..." | 4s | High | No haptic, show loading indicator |
| D1.6 | Multiple exports completed | Success | "All [X] memories have been exported!" | 4s | High | Light haptic, show "Share" button |

#### D2. Share Operations

| Case ID | Trigger Event | Toast Type | Message Text | Duration | Priority | Additional UX |
|---------|---------------|------------|--------------|----------|----------|---------------|
| D2.1 | Share initiated | Info | "Opening sharing options..." | 2s | Medium | No haptic |
| D2.2 | Share completed | Success | "Your memory has been shared!" | 3s | High | Light haptic |
| D2.3 | Share cancelled | Info | "Sharing cancelled." | 2s | Low | No haptic |
| D2.4 | Share failed | Error | "We couldn't share your memory. Please try again." | 5s | High | Medium haptic |

### E. SETTINGS & PREFERENCES

#### E1. Settings Changes

| Case ID | Trigger Event | Toast Type | Message Text | Duration | Priority | Additional UX |
|---------|---------------|------------|--------------|----------|----------|---------------|
| E1.1 | Settings saved successfully | Success | "Your settings have been saved!" | 3s | High | Light haptic |
| E1.2 | Audio quality changed | Success | "Recording quality changed to [Quality Level]." | 3s | Medium | Light haptic |
| E1.3 | Language/accessibility changed | Success | "Your preferences have been updated!" | 3s | High | Light haptic |
| E1.4 | Settings save failed | Error | "We couldn't save your settings. Please try again." | 5s | High | Medium haptic, show "Try Again" button |
| E1.5 | Settings reset to default | Warning | "All settings have been reset to default." | 4s | High | Light haptic |

#### E2. Account & Data Management

| Case ID | Trigger Event | Toast Type | Message Text | Duration | Priority | Additional UX |
|---------|---------------|------------|--------------|----------|----------|---------------|
| E2.1 | Data backup started | Info | "Backing up your memories. Please don't close the app..." | 4s | High | No haptic, show loading indicator |
| E2.2 | Data backup completed | Success | "All your memories have been backed up safely!" | 4s | High | Light haptic |
| E2.3 | Data backup failed | Error | "Backup failed. Please check your internet connection and try again." | 6s | High | Medium haptic, show "Try Again" button |
| E2.4 | Data restore started | Info | "Restoring your memories. This may take several minutes..." | 4s | High | No haptic, show loading indicator |
| E2.5 | Data restore completed | Success | "Your memories have been restored successfully!" | 4s | Critical | Light haptic |
| E2.6 | Data restore failed | Error | "We couldn't restore your memories. Please try again or contact support." | No auto-dismiss | Critical | Medium haptic, show "Contact Support" button |

### F. USER GUIDANCE & TIPS

#### F1. First-Time User Experience

| Case ID | Trigger Event | Toast Type | Message Text | Duration | Priority | Additional UX |
|---------|---------------|------------|--------------|----------|----------|---------------|
| F1.1 | Welcome message | Info | "Welcome to Memoria! Tap the big button to record your first memory." | 5s | High | No haptic, friendly icon |
| F1.2 | First recording completed | Success | "Wonderful! You've created your first memory. You can play it back anytime." | 5s | High | Light haptic, celebration icon |
| F1.3 | Feature discovery | Info | "Tip: You can add a title to your memory by tapping the edit button." | 5s | Medium | No haptic, light bulb icon |

#### F2. Helpful Reminders

| Case ID | Trigger Event | Toast Type | Message Text | Duration | Priority | Additional UX |
|---------|---------------|------------|--------------|----------|----------|---------------|
| F2.1 | Recording tip | Info | "Tip: For best quality, record in a quiet room and speak clearly." | 5s | Low | No haptic |
| F2.2 | Battery low during recording | Warning | "Your battery is low. Please charge your device to avoid losing your recording." | 6s | High | Light haptic |
| F2.3 | Long recording reminder | Info | "You've been recording for [X] minutes. Everything is being saved." | 3s | Medium | No haptic |

### G. BATCH OPERATIONS

#### G1. Multiple Item Operations

| Case ID | Trigger Event | Toast Type | Message Text | Duration | Priority | Additional UX |
|---------|---------------|------------|--------------|----------|----------|---------------|
| G1.1 | Multiple deletions started | Info | "Deleting [X] memories..." | 3s | High | No haptic, loading indicator |
| G1.2 | Multiple deletions completed | Success | "[X] memories have been deleted." | 3s | High | Light haptic |
| G1.3 | Multiple deletions failed | Error | "We couldn't delete some memories. Please try again." | 5s | High | Medium haptic, show "Try Again" button |
| G1.4 | Batch operation cancelled | Info | "Operation cancelled. No changes were made." | 3s | Medium | No haptic |

---

## Implementation Guidelines

### 1. Toast Queue Management

**Priority-Based Queuing:**
- Critical toasts interrupt and replace current toasts
- High priority toasts wait for current toast to finish
- Medium/Low priority toasts can be dropped if queue is full (>3 toasts)

**Deduplication:**
- Don't show the same toast twice within 5 seconds
- Combine similar toasts (e.g., "3 new memories saved" instead of showing 3 separate toasts)

**Maximum Queue Size:** 3 toasts

### 2. Animation & Transitions

**Entry Animation:**
```
- Slide from top (0 to final position)
- Duration: 300ms
- Easing: ease-out
- Opacity: 0 to 1
```

**Exit Animation:**
```
- Slide to top (final position to -100px)
- Duration: 250ms
- Easing: ease-in
- Opacity: 1 to 0
```

**Manual Dismiss:**
- Swipe up gesture
- Tap on close button (X icon)
- Immediate dismissal with exit animation

### 3. Timing Configuration

**Base Durations:**
- Brief: 2000ms (2 seconds)
- Normal: 3000-4000ms (3-4 seconds)
- Long: 5000-6000ms (5-6 seconds)
- No auto-dismiss: User must manually dismiss

**Reading Speed Adjustment:**
- Calculate based on message length: baseTime + (characterCount * 50ms)
- Minimum: 2000ms
- Maximum: 8000ms for auto-dismiss toasts

### 4. Action Buttons

**Primary Action Button:**
- Minimum height: 44px (touch target)
- Bold text, 16px font size
- High contrast color
- Positioned on the right side of toast

**Button Types:**
- "Try Again" - Retry the failed action
- "Open Settings" - Deep link to device/app settings
- "Undo" - Reverse the action (5-second window)
- "View" - Navigate to related content
- "Contact Support" - Open support channel

**Maximum Buttons per Toast:** 2 (one primary, one secondary)

### 5. Haptic Feedback Patterns

**Light Impact:**
- Used for: Success messages, info toasts
- Pattern: Single light tap
- Duration: 10ms

**Medium Impact:**
- Used for: Errors, warnings
- Pattern: Two medium taps, 100ms apart
- Duration: 15ms per tap

**Heavy Impact:**
- Used for: Critical errors (use sparingly)
- Pattern: Single strong tap
- Duration: 20ms

**Implementation Note:** Always check if haptics are enabled in device settings before triggering.

### 6. Internationalization (i18n)

**Text Keys:**
- Use descriptive keys: `toast.recording.started` instead of `t1`
- Include context in keys for translators
- Support variable interpolation: `"Recording saved: {duration} minutes"`

**RTL Support:**
- Mirror icon positions for right-to-left languages
- Adjust text alignment automatically
- Test with Arabic, Hebrew interfaces

**Character Length Considerations:**
- Some languages (German, Russian) are ~30% longer than English
- Design toast width to accommodate expansion
- Test with longest expected translations

### 7. Accessibility Features

**Screen Reader Support:**
- Announce toast messages via accessibility API
- Include role="alert" for error/warning toasts
- Use aria-live="polite" for info/success toasts
- Read icon meaning aloud: "Success: Your recording has been saved"

**High Contrast Mode:**
- Increase border width to 3px
- Boost color contrast to WCAG AAA (7:1)
- Use solid colors instead of gradients

**Reduced Motion:**
- Disable slide animations
- Use simple fade in/out
- Respect `prefers-reduced-motion` system setting

**Font Scaling:**
- Support Dynamic Type (iOS) and Font Scale (Android)
- Test at 200% font size
- Ensure toast doesn't exceed screen bounds
- Adjust padding dynamically

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

**1. Color Contrast**
- Text to background: Minimum 4.5:1 (aim for 7:1)
- Icon to background: Minimum 3:1
- Test with color blindness simulators (Deuteranopia, Protanopia, Tritanopia)

**2. Focus Management**
- Toasts with action buttons must be keyboard accessible
- Tab order: Message → Primary button → Secondary button → Close button
- Visible focus indicators (3px outline)

**3. Timing Adjustable**
- Allow users to pause/extend toast display
- Provide setting to increase default duration by 50%
- Critical toasts never auto-dismiss

**4. Error Identification**
- Clearly state what went wrong
- Suggest recovery action
- Use color + icon + text (not color alone)

**5. Help Text**
- Include context-sensitive help
- Link to relevant documentation for complex errors
- Provide "Learn More" option for warnings

### Cognitive Accessibility

**Simple Language:**
- 6th-grade reading level or below
- Short sentences (15 words max)
- Active voice ("We saved your recording" vs "Your recording was saved")

**Consistent Patterns:**
- Use same phrasing for similar actions
- Keep button labels predictable
- Maintain visual hierarchy

**Avoid Jargon:**
- No: "Failed to initialize audio codec"
- Yes: "We couldn't start recording. Please try again."

---

## Testing Recommendations

### Unit Testing

**Test Cases:**
1. Toast appears with correct message, type, and duration
2. Multiple toasts queue correctly based on priority
3. Duplicate toasts are suppressed
4. Manual dismissal works (swipe + button)
5. Auto-dismiss timing is accurate
6. Action buttons trigger correct callbacks
7. Haptic feedback fires appropriately

**Mock Scenarios:**
- Rapid-fire toast triggers (queue overflow)
- Conflicting priority toasts
- Toast during screen transition
- Toast during app backgrounding

### Integration Testing

**User Flows:**
1. Complete recording flow from start to save (verify all expected toasts appear)
2. Trigger error → dismiss → retry → success (verify toast sequence)
3. Delete memory → undo → verify (test undo functionality)
4. Export → share → complete (multi-step operation toasts)

**Edge Cases:**
- Device orientation change during toast display
- App interrupted by phone call during toast
- Low memory conditions
- Extremely long memory titles in toast messages

### Usability Testing with Elderly Users

**Test Protocol:**
1. **Comprehension Test:** Show toast, ask user to explain what happened
2. **Readability Test:** Measure time to read message, ask if text was clear
3. **Action Test:** Can user find and tap action button within 3 seconds?
4. **Emotional Response:** Does the message feel reassuring or confusing?

**Key Metrics:**
- Message comprehension rate: Target 95%+
- Action button tap success rate: Target 90%+
- Average time to read message: Should be < duration - 1s
- User confidence score (1-5 scale): Target 4+

**Participant Profile:**
- Age: 65-85 years old
- Tech experience: Low to moderate
- Vision: With corrective lenses if needed
- Sample size: Minimum 10 participants

### Accessibility Audit

**Checklist:**
- [ ] Screen reader announces all toasts correctly
- [ ] Color contrast meets WCAG AAA (7:1)
- [ ] Font scales correctly at 200%
- [ ] Reduced motion mode works
- [ ] Keyboard navigation functions properly
- [ ] High contrast mode is supported
- [ ] All icons have text alternatives
- [ ] Focus indicators are visible
- [ ] RTL languages display correctly
- [ ] No color-only information

### Performance Testing

**Metrics to Monitor:**
- Toast render time: < 16ms (60fps)
- Memory usage per toast: < 1MB
- Animation frame rate: Consistent 60fps
- Queue processing delay: < 50ms

**Load Testing:**
- Trigger 20 toasts in rapid succession
- Monitor memory leaks (toast cleanup)
- Test on low-end devices (3+ years old)

---

## Recommended Implementation Libraries

### React Native Libraries

**Option 1: react-native-toast-message (Recommended)**
- Pros: Highly customizable, good performance, active maintenance
- Cons: Requires custom styling for elderly-friendly design
- GitHub: https://github.com/calintamas/react-native-toast-message

**Option 2: Custom Implementation**
- Build using Animated API + Modal
- Full control over UX details
- Consider for maximum accessibility customization

**Haptic Feedback:**
- `expo-haptics` (Expo) or `react-native-haptic-feedback`
- Simple API, cross-platform

**Accessibility:**
- `react-native-accessibility-info` for screen reader detection
- Built-in `accessibilityRole` and `accessibilityLabel` props

---

## Visual Design Examples

### Example Toast Layouts

```
┌─────────────────────────────────────────────────┐
│  [✓ Icon]  Your recording has been saved!       │
│                                                  │
│                                        [Dismiss] │
└─────────────────────────────────────────────────┘
Success Toast (Simple)

┌─────────────────────────────────────────────────┐
│  [! Icon]  Your device storage is full.         │
│            Please free up some space to          │
│            continue saving memories.             │
│                                                  │
│                    [Settings] [Dismiss]          │
└─────────────────────────────────────────────────┘
Error Toast with Action Button

┌─────────────────────────────────────────────────┐
│  [i Icon]  Creating text from your recording.   │
│            This may take a moment...             │
│                                                  │
│            [Loading spinner]                     │
└─────────────────────────────────────────────────┘
Info Toast with Progress Indicator
```

### Icon Set

**Required Icons:**
- Success: Checkmark in circle (filled)
- Error: Exclamation mark in circle (filled)
- Warning: Triangle with exclamation mark
- Info: "i" in circle (outlined)
- Loading: Spinner/activity indicator
- Microphone: For recording-related toasts
- Cloud: For sync/network toasts
- Settings: Gear icon

**Icon Design:**
- Minimum size: 32x32px
- Stroke width: 2-3px
- Rounded corners for friendly appearance
- High contrast, solid colors

---

## Maintenance & Updates

### Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-08 | Initial comprehensive specification | UX Research Team |

### Future Enhancements

**Phase 2 (Q1 2026):**
- Audio feedback option (spoken confirmation)
- Toast history log (accessible from settings)
- Customizable toast duration in settings
- Smart toast grouping (e.g., "3 recordings saved" instead of 3 separate toasts)

**Phase 3 (Q2 2026):**
- Predictive toast content based on user patterns
- Integration with voice assistant for hands-free acknowledgment
- Rich media toasts (thumbnail images for memory-related toasts)

### Analytics & Monitoring

**Key Metrics to Track:**
- Toast display frequency by type (success/error/warning/info)
- User dismissal rate (manual vs auto-dismiss)
- Action button click-through rate
- Error toast → retry → success conversion rate
- Average time toast remains visible

**User Feedback:**
- Conduct quarterly surveys on toast clarity and helpfulness
- Monitor support tickets related to confusion from toast messages
- A/B test message variations for critical error cases

---

## Appendix

### A. Message Writing Guidelines

**DO:**
- Use simple, everyday words
- Start with the most important information
- Be specific about what happened
- Offer a clear next step for errors
- Use "your" and "you" to personalize
- Keep sentences under 15 words

**DON'T:**
- Use technical jargon or error codes
- Blame the user ("You failed to...")
- Use ambiguous terms ("Something went wrong")
- Write in passive voice excessively
- Use humor or sarcasm (cultural sensitivity)
- Include multiple actions in one toast

### B. Localization String Keys

```javascript
// Example structure for i18n keys
export const toastMessages = {
  recording: {
    started: "toast.recording.started",
    stopped: "toast.recording.stopped",
    saved: "toast.recording.saved",
    savedWithDuration: "toast.recording.savedWithDuration",
    failed: "toast.recording.failed",
  },
  memory: {
    created: "toast.memory.created",
    updated: "toast.memory.updated",
    deleted: "toast.memory.deleted",
  },
  transcription: {
    started: "toast.transcription.started",
    completed: "toast.transcription.completed",
    failed: "toast.transcription.failed",
  },
  // ... etc
};
```

### C. Sample Implementation Code

```typescript
// Toast configuration interface
interface ToastConfig {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration: number | 'permanent';
  priority: 'critical' | 'high' | 'medium' | 'low';
  haptic?: 'light' | 'medium' | 'heavy';
  actions?: Array<{
    label: string;
    onPress: () => void;
    primary?: boolean;
  }>;
  icon?: string;
  dismissible?: boolean;
}

// Usage example
showToast({
  id: 'recording-saved',
  type: 'success',
  message: 'Your recording has been saved!',
  duration: 3000,
  priority: 'critical',
  haptic: 'light',
  dismissible: true,
});

showToast({
  id: 'storage-full',
  type: 'error',
  message: 'Your device storage is full. Please free up some space and try again.',
  duration: 'permanent',
  priority: 'critical',
  haptic: 'medium',
  actions: [
    {
      label: 'Settings',
      onPress: () => openSettings(),
      primary: true,
    },
  ],
  dismissible: true,
});
```

### D. Color Palette Reference

```javascript
export const toastColors = {
  success: {
    background: '#E8F5E9',
    border: '#4CAF50',
    text: '#1B5E20',
    icon: '#4CAF50',
  },
  error: {
    background: '#FFEBEE',
    border: '#F44336',
    text: '#B71C1C',
    icon: '#F44336',
  },
  warning: {
    background: '#FFF3E0',
    border: '#FF9800',
    text: '#E65100',
    icon: '#FF9800',
  },
  info: {
    background: '#E3F2FD',
    border: '#2196F3',
    text: '#0D47A1',
    icon: '#2196F3',
  },
};
```

### E. Decision Tree for Toast Priority

```
Is the user's data at risk of loss? → YES → Critical
                                   → NO ↓

Did a user-initiated action fail? → YES → High
                                  → NO ↓

Is this confirming a successful action? → YES → High
                                        → NO ↓

Is this providing helpful context? → YES → Medium
                                   → NO ↓

Low priority (consider if toast is needed)
```

---

## Contact & Support

**For Questions About This Specification:**
- UX Research Team: ux-research@memoria.ai
- Product Management: product@memoria.ai
- Engineering: dev-team@memoria.ai

**Feedback & Iteration:**
This specification should be treated as a living document. Please submit feedback, suggestions, and real-world learnings to continuously improve the toast notification system for our elderly users.

**Last Review Date:** 2025-10-08
**Next Review Date:** 2026-01-08 (Quarterly review cycle)

---

*Document End*
