# Card Stack Debug Worklog

## Issue: A->B->A Reverting Not Working

### Problem Description
User reported: "Card A -> B, then swipe back from B, A should come back. The next one is not matching"

### Root Cause Analysis

**Initial Hypothesis (User)**: "My assumption is that the swiping behavior has some built-in logic re/ the card to show after a swiping (regardless of left or right) and it overwrites our make-more-sense logic"

**Actual Root Cause Found**: The background card calculation logic was NOT reflecting the actual navigation history. The gesture navigation logic was correct, but the visual preview (background cards) was misleading users.

### Technical Details

#### Navigation Logic (WORKING CORRECTLY)
```javascript
// This logic was always correct:
if (direction === 'forward') {
  if (stackPosition < cardStack.length - 1) {
    // Go forward in history ✅
    setStackPosition(stackPosition + 1);
    setCurrentIndex(cardStack[stackPosition + 1]);
  } else {
    // Add new card to history ✅
    const nextIndex = (currentIndex + 1) % DAILY_TOPICS.length;
    setCardStack(prev => [...prev, nextIndex]);
    setStackPosition(prev => prev + 1);
    setCurrentIndex(nextIndex);
  }
} else {
  if (stackPosition > 0) {
    // Go back in history ✅ <- This was always working!
    setStackPosition(stackPosition - 1);
    setCurrentIndex(cardStack[stackPosition - 1]);
  } else {
    // Add previous card to beginning ✅
    const prevIndex = (currentIndex - 1 + DAILY_TOPICS.length) % DAILY_TOPICS.length;
    setCardStack(prev => [prevIndex, ...prev]);
    setCurrentIndex(prevIndex);
  }
}
```

#### Background Cards Logic (THE PROBLEM)
```javascript
// BROKEN - Always showed adjacent cards, ignoring history:
const leftIndex = (currentIndex - 1 + DAILY_TOPICS.length) % DAILY_TOPICS.length;
const rightIndex = (currentIndex + 1) % DAILY_TOPICS.length;

// FIXED - Now simulates actual navigation logic:
// Left card (where swipe right will go)
if (stackPosition > 0) {
  leftCard = DAILY_TOPICS[cardStack[stackPosition - 1]]; // Actual history
} else {
  leftCard = DAILY_TOPICS[prevIndex]; // New previous card
}

// Right card (where swipe left will go)
if (stackPosition < cardStack.length - 1) {
  rightCard = DAILY_TOPICS[cardStack[stackPosition + 1]]; // Actual history
} else {
  rightCard = DAILY_TOPICS[nextIndex]; // New next card
}
```

### Timeline of Fixes

1. **Initial Problem**: Excessive console logging causing rapid refreshes
2. **Simplification**: Replaced complex state with currentIndex/cardStack/stackPosition
3. **Navigation Fix**: Cleaned up gesture handling and removed performance bottlenecks
4. **Background Cards Fix**: Made background cards EXACTLY match navigation logic

### Expected A->B->A Flow (After Fix)

1. **Start**: Card A (index 0), stack=[0], pos=0
   - Background: (prev=7, next=1)

2. **Swipe Left A->B**: Card B (index 1), stack=[0,1], pos=1
   - Background: (left=A, right=2) ✅ A correctly shown on left

3. **Swipe Right B->A**: Card A (index 0), stack=[0,1], pos=0
   - Background: (left=7, right=1) ✅ Perfect reverting!

### Debugging Added

Added comprehensive logging to trace:
- Navigation direction and type (history vs new card)
- Stack state before/after each navigation
- Background card calculations with exact card names
- Stack position and history tracking

### Current Status

- ✅ Navigation logic: Working correctly
- ✅ Background cards: Now match navigation exactly
- ✅ A->B->A reverting: Should work perfectly
- ✅ Cache cleared: Fresh build with all fixes
- 🔄 Testing: Ready for user validation

### Test Plan

1. Start app (should show Card A with B on right)
2. Swipe left A->B (should show Card B with A on left, C on right)
3. Swipe right B->A (should show Card A again, proving reverting works)
4. Verify background cards always match where gestures will actually go

### Key Insight

The user's hypothesis was correct - there was "built-in logic" that was overriding the expected behavior, but it wasn't in the gesture handling. It was in the background card calculation that was giving users false expectations about where their swipes would take them.