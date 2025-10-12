# Background Card Sequence Logic

## Clear Rules

1. **Left Card** = Where RIGHT swipe will take you
2. **Right Card** = Where LEFT swipe will take you

## Expected A->B->A Sequence

### State 1: Start at Card A
- `currentIndex: 0` (Card A: "Talk about your first job")
- `cardStack: [0]`
- `stackPosition: 0`
- **Left Card**: Card 7 (previous in sequence)
- **Right Card**: Card 1 (next in sequence) ← This should be Card B

### State 2: After A->B (swipe left)
- `currentIndex: 1` (Card B: "Describe your childhood home")
- `cardStack: [0, 1]`
- `stackPosition: 1`
- **Left Card**: Card 0 (Card A from history) ← CRITICAL: Should show A
- **Right Card**: Card 2 (next in sequence)

### State 3: After B->A (swipe right)
- `currentIndex: 0` (Card A: "Talk about your first job")
- `cardStack: [0, 1]`
- `stackPosition: 0`
- **Left Card**: Card 7 (previous in sequence)
- **Right Card**: Card 1 (Card B from history) ← CRITICAL: Should show B

## Logic Implementation

```javascript
const getLeftCard = () => {
  // Left = where RIGHT swipe goes
  if (stackPosition > 0) {
    // Can go back in history
    return DAILY_TOPICS[cardStack[stackPosition - 1]];
  } else {
    // Would go to previous in sequence
    const prevIndex = (currentIndex - 1 + DAILY_TOPICS.length) % DAILY_TOPICS.length;
    return DAILY_TOPICS[prevIndex];
  }
};

const getRightCard = () => {
  // Right = where LEFT swipe goes
  if (stackPosition < cardStack.length - 1) {
    // Can go forward in history
    return DAILY_TOPICS[cardStack[stackPosition + 1]];
  } else {
    // Would go to next in sequence
    const nextIndex = (currentIndex + 1) % DAILY_TOPICS.length;
    return DAILY_TOPICS[nextIndex];
  }
};
```

## Debug Output Format

```
📋 Final background cards: {
  current: "0: Talk about your first job",
  left: "7: Your proudest achievement",
  right: "1: Describe your childhood home",
  stack: "0*: Talk about your first job"
}
```

The `*` indicates current position in stack.

## Test Sequence

1. **Initial**: Current=A, Left=7, Right=B ✅
2. **Swipe Left A->B**: Current=B, Left=A, Right=2 ✅
3. **Swipe Right B->A**: Current=A, Left=7, Right=B ✅

This should work perfectly now!