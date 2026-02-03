# Home Tab Requirements Documentation

## Overview
The Home tab is the main screen of the Memoria.ai app where users interact with daily memory prompts through a swipeable card interface.

## UI Design Requirements

### 1. Header Section
- **App Title**: "Memoria.ai" with brand styling
- **Subtitle**: "Your personal memory keeper"
- **Color**: Use theme-aware colors from Colors constant

### 2. Quick Actions (Top)
- **Two buttons side by side**:
  - "View Memories" button with list.bullet icon
  - "Export Memoir" button with square.and.arrow.up icon
- **Styling**: Rounded corners, subtle shadows, theme-aware background

### 3. Swipeable Card Stack (Core Feature)
- **Background Cards**: Left and right preview cards (partially visible)
- **Active Card**: Main central card with full content
- **Card Content**:
  - Topic title (large, bold)
  - Topic description (smaller, lighter)
  - Action buttons at bottom:
    - Skip button (X icon, red color)
    - Record button (microphone icon, green color)

### 4. Memory Statistics (Bottom)
- **Conditional display**: Only show if user has recorded memories
- **Content**:
  - "This Week" section title
  - Number of new memories this week
  - Average recording length
- **Icons**: calendar and heart.fill icons

### 5. Layout & Spacing
- **Padding**: 20px sides, 60px top (status bar), 100px bottom (tab bar)
- **Card dimensions**: 90% width, 360px height
- **Card stack height**: 400px container

## Critical Navigation Logic Requirements

### Problem 1: A→B→A Reverting Logic
**MUST BE FIXED**: When user goes from Card A to Card B, then swipes back, Card A should return exactly as it was.

**Technical Requirements**:
- Maintain navigation history stack
- Track current position in history
- Background cards must show actual navigation targets
- No "built-in logic" should override expected behavior

### Problem 2: Auto-Transition/Flash Prevention
**MUST BE FIXED**: Eliminate the 0.1-1s automatic card change after swiping.

**Technical Requirements**:
- No race conditions in state updates
- Single atomic state changes
- Proper animation timing coordination
- No intermediate card flashing

### Problem 3: Background Card Accuracy
**MUST BE FIXED**: Background cards must accurately preview where swipes will take the user.

**Technical Requirements**:
- Left card = where RIGHT swipe will navigate
- Right card = where LEFT swipe will navigate
- Must reflect actual navigation history, not just adjacent cards
- Perfect synchronization with gesture logic

## Technical Implementation Requirements

### State Management
- **Use simple, reliable state management** (useState or useReducer)
- **Avoid complex state synchronization**
- **Single source of truth for navigation state**

### Navigation State Structure
```typescript
interface NavigationState {
  currentIndex: number;        // Current card index in DAILY_TOPICS
  navigationHistory: number[]; // Stack of visited card indices
  historyPosition: number;     // Current position in history stack
}
```

### Gesture Handling
- **Left swipe**: Move forward (next card or forward in history)
- **Right swipe**: Move backward (previous card or back in history)
- **Swipe threshold**: 25% of screen width or 1000 velocity
- **Animation duration**: 300ms
- **Haptic feedback**: Light impact on successful swipe

### Data Source
- **Use existing DAILY_TOPICS array** (8 cards total)
- **Cycle through topics**: Index 0-7, wrap around
- **Preserve existing card content and styling**

## Expected User Flow

### Initial State
- Show Card 0 ("Talk about your first job")
- Left background: Card 7 (previous in sequence)
- Right background: Card 1 (next in sequence)

### A→B→A Test Case
1. **Start**: Card A (index 0), history=[0], position=0
2. **Swipe left**: Go to Card B (index 1), history=[0,1], position=1
   - Left background should show Card A (for returning)
   - Right background should show Card 2 (next in sequence)
3. **Swipe right**: Return to Card A (index 0), history=[0,1], position=0
   - Left background should show Card 7 (previous in sequence)
   - Right background should show Card B (for going forward again)

## Integration Requirements

### Context Integration
- **RecordingContext**: Access memory stats and export functionality
- **ColorScheme**: Theme-aware styling throughout
- **Router**: Navigation to other screens

### Dependencies
- **React Native Gesture Handler**: For swipe detection
- **Expo Haptics**: For tactile feedback
- **React Native Animated**: For smooth card animations
- **Expo Router**: For screen navigation

## Performance Requirements
- **Smooth 60fps animations**
- **Instant response to gestures**
- **No memory leaks in gesture handlers**
- **Efficient re-renders only when necessary**

## Testing Checklist
- [ ] A→B→A reverting works perfectly
- [ ] No auto-transitions or card flashing
- [ ] Background cards always show correct preview
- [ ] Smooth animations at 60fps
- [ ] Proper haptic feedback
- [ ] Memory stats display correctly
- [ ] Quick actions navigation works
- [ ] Theme switching works properly
- [ ] Gesture thresholds feel natural

## Notes
- **Prioritize reliability over complexity**
- **Test thoroughly on both iOS and Web**
- **Maintain existing visual design**
- **Focus on fixing the three core navigation issues**