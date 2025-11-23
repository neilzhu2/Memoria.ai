# UX Research Report: Memoria.ai
## Audio Skip, Transcription Limits, and Modal Header Consistency

**Date:** November 22, 2025
**Researcher:** UX Research Strategist
**Target Users:** Adults 65+ (Primary), Family Members (Secondary)

---

## Executive Summary

This report provides evidence-based recommendations for three UX issues identified through user feedback:

| Issue | Current State | Recommendation | Priority |
|-------|---------------|----------------|----------|
| Audio Skip Duration | 15 seconds | **10 seconds** | High |
| Transcription Limit | 500 characters | **5,000 characters** | High |
| Modal Header Consistency | Inconsistent | **Standardize: X on left, title centered** | Medium |

---

## Issue 1: Audio Skip Duration

### Current Implementation
- Located in: `/Users/lihanzhu/Desktop/Memoria/Memoria.ai/hooks/useAudioPlayback.ts`
- Current skip duration: **15 seconds** (both forward and backward)
- UI labels in EditMemoryModal reference "goforward.15" and "gobackward.15" icons

### Research Findings

#### Industry Standards
| App | Skip Back | Skip Forward | Customizable |
|-----|-----------|--------------|--------------|
| Apple Podcasts (iOS default) | 15 sec | 30 sec | Yes (10, 15, 30, 45, 60 sec) |
| Spotify | 15 sec | 15 sec | No |
| Audible | 30 sec | 30 sec | Yes |
| Overcast | 15 sec | 30 sec | Yes |
| Voice Memos (iOS) | N/A | N/A | Uses scrubbing only |

#### Key Insight: Content Duration Matters
The 15-30 second standard is optimized for **long-form content** (30-60+ minute podcasts, audiobooks). For Memoria.ai's use case:

- **Typical memory recording:** 30 seconds to 5 minutes
- **Average recording (estimated):** 2-3 minutes
- **15 seconds = 25-50% of short recordings**

For a 60-second memory recording, a 15-second skip moves 25% through the content in one tap - far too aggressive for precise navigation.

#### Research on Elderly Users
From Nielsen Norman Group and academic research on older adult interface design:

1. **Motor precision declines with age** - Users may accidentally tap skip buttons
2. **Recovery from errors is more difficult** - Smaller skips allow easier correction
3. **Familiarity with content length** - Short recordings benefit from proportionally smaller skips
4. **Cognitive load** - Keeping track of position is harder with large jumps

#### Speech Rate Analysis
- Average conversational speech: **110-150 words per minute**
- For elderly users (typically slower): **100-130 words per minute**
- 10-second skip = ~15-20 words (roughly one complete thought)
- 15-second skip = ~22-30 words (potentially multiple thoughts)

### Recommendation: 10 Seconds

**Rationale:**
1. **Proportional to content length:** 10 seconds is 8-17% of typical 1-3 minute recordings (vs. 12-25% for 15s)
2. **Granular enough for short content:** Users can locate specific moments without overshooting
3. **Industry precedent:** Apple Podcasts offers 10s as the smallest option; many users choose it
4. **Error recovery:** Easier to correct accidental taps with smaller increments
5. **Accessibility:** Aligns with research showing older adults prefer more precise controls

**Alternative Considered: 5 Seconds**
- Too granular for longer recordings (5+ minutes)
- May feel tedious for users trying to skip sections
- Not a standard option in any major platform

**Implementation Note:**
```typescript
// hooks/useAudioPlayback.ts - Lines 148 and 164
const SKIP_DURATION_MS = 10000; // Change from 15000 to 10000
```

Update icon references from "goforward.15"/"gobackward.15" to "goforward.10"/"gobackward.10" in:
- `components/EditMemoryModal.tsx` (Lines 274, 294)

### Future Consideration: Variable Skip Times
If analytics show diverse user needs, consider adding settings for skip duration. However, for MVP:
- **Keep it simple** - One well-chosen default is better than options that confuse
- **Cognitive load** - Settings add complexity for elderly users
- **Recommendation:** Launch with 10 seconds, gather feedback, then evaluate if customization is needed

---

## Issue 2: Transcription Character Limit

### Current Implementation
- Located in: `/Users/lihanzhu/Desktop/Memoria/Memoria.ai/components/EditMemoryModal.tsx`
- Current limit: **500 characters** (Line 336: `maxLength={500}`)
- Character counter displayed to user (Line 344)

### Research Findings

#### Speech-to-Text Mathematics

| Recording Duration | Words (at 130 wpm) | Characters (5.5 chars/word) |
|-------------------|--------------------|-----------------------------|
| 30 seconds | 65 words | ~358 characters |
| 1 minute | 130 words | ~715 characters |
| 2 minutes | 260 words | ~1,430 characters |
| 3 minutes | 390 words | ~2,145 characters |
| 5 minutes | 650 words | ~3,575 characters |
| 10 minutes | 1,300 words | ~7,150 characters |

**Critical Finding:** The current 500-character limit only accommodates recordings under ~45 seconds at normal speaking pace. This is severely inadequate for the 30-second to 5-minute typical use case.

#### Elderly Speech Patterns
Research indicates elderly users may:
- Speak more slowly (100-120 wpm)
- Include more pauses and thinking time
- Use longer, more detailed storytelling approaches

This means their character-to-duration ratio may be lower, but recordings may be longer overall.

#### Database Considerations

| Field Type | Storage | Max Characters | Notes |
|------------|---------|----------------|-------|
| VARCHAR(500) | ~0.5 KB | 500 | Current - Inadequate |
| VARCHAR(5000) | ~5 KB | 5,000 | Recommended |
| TEXT | Variable | ~65,535 | Flexible, slightly slower queries |
| MEDIUMTEXT | Variable | ~16 million | Overkill |

**Storage Impact Analysis:**
- 5,000 characters = ~5 KB per transcription
- 1,000 memories = ~5 MB (negligible)
- 10,000 memories = ~50 MB (still very manageable)

Modern databases (including Supabase/PostgreSQL) handle TEXT fields efficiently with proper indexing.

#### Competitive Analysis
- Apple Voice Memos: No transcription limit (uses on-device ML)
- Otter.ai: No practical limit (cloud-based)
- Rev: Charges per minute, no character limit
- Most transcription services: Limited only by recording duration

### Recommendation: 5,000 Characters

**Rationale:**
1. **Accommodates 7+ minute recordings** - Covers vast majority of use cases
2. **Buffer for uncertainty** - Speech rate varies; 5,000 provides comfortable margin
3. **Minimal storage impact** - Negligible database/performance concerns
4. **Future-proof** - No need to revisit this limit
5. **User experience** - Eliminates frustrating truncation

**Why Not Unlimited (TEXT field)?**
- Provides some protection against abuse/errors
- Clearer user expectations
- Easier to validate on frontend
- 5,000 is effectively "unlimited" for voice memos

**Implementation:**
```typescript
// components/EditMemoryModal.tsx - Line 336
maxLength={5000}

// Line 344 - Update counter display
{transcription.length}/5000
```

**Database Migration (if applicable):**
```sql
ALTER TABLE memories
MODIFY COLUMN transcription VARCHAR(5000);
```

---

## Issue 3: Modal Header Consistency

### Current Implementation Audit

| Modal Component | X Position | Title Position | Pattern |
|-----------------|------------|----------------|---------|
| **EditMemoryModal** | LEFT | CENTER | iOS Standard |
| **EditProfileModal** | LEFT | CENTER | iOS Standard |
| **ThemeSelectionModal** | LEFT | CENTER | iOS Standard |
| **FeedbackModal** | RIGHT | LEFT | Non-standard |
| **TermsOfUseModal** | RIGHT | LEFT | Non-standard |
| **MemoryPreviewModal** | RIGHT | LEFT-aligned in row | Non-standard |
| **RecordingCompletionModal** | None (action buttons only) | Centered | Action dialog |

### Research Findings

#### Apple Human Interface Guidelines (iOS)
From Apple's official documentation:

> "In iOS, the Done, Save and Cancel buttons are almost always used to dismiss a modal view... they stake out a default location at **top right**."

However, for page sheets (the modal style used in Memoria):
> "People typically expect to find a button in the navigation bar or swipe down."

**Key iOS Conventions:**
- **Cancel/X button:** Top LEFT (especially in full-height page sheets)
- **Done/Save button:** Top RIGHT
- **Title:** Centered between navigation items

#### Material Design Guidelines
- **Full-screen dialogs:** X on LEFT, action on RIGHT
- **Standard dialogs:** Dismiss actions in footer, not header
- **No X required:** Standard dialogs dismiss via outside tap or back button

#### Consistency Research for Elderly Users
From Nielsen Norman Group:

> "The most important factor for increasing usability for the elderly is the use of **consistent and persistent navigation**."

Key finding: **Consistency within the app matters more than platform convention adherence** for users who may not use many other apps.

### Analysis of Current Patterns

**Pattern A: X on LEFT (Correct for iOS page sheets)**
- EditMemoryModal
- EditProfileModal
- ThemeSelectionModal

**Pattern B: X on RIGHT (Header flows left-to-right)**
- FeedbackModal
- TermsOfUseModal
- MemoryPreviewModal

**Pattern C: No X (Action dialog)**
- RecordingCompletionModal (appropriate - requires explicit decision)

### Recommendation: Standardize to Pattern A (X on LEFT)

**Recommended Standard:**
```
+------------------------------------------+
| [X]         Modal Title              [Save/Done] |
+------------------------------------------+
```

Or for modals without a save action:
```
+------------------------------------------+
| [X]         Modal Title                        |
+------------------------------------------+
```

**Rationale:**
1. **iOS convention for page sheets** - The `presentationStyle="pageSheet"` modals should follow iOS page sheet conventions
2. **Consistency with majority** - 3 of 6 modals already use this pattern
3. **Swipe-to-dismiss alignment** - Page sheets support swipe-down to dismiss; X on left aligns with swipe gesture origin
4. **Left-to-right reading** - Users see dismiss option first, then title (clear escape path)
5. **Predictability for elderly users** - Same location every time reduces hunting

### Implementation Plan

**Modals Requiring Updates:**

1. **FeedbackModal.tsx** (Lines 76-92)
   - Move X button from right to left
   - Move header content to center
   - Add placeholder on right for balance

2. **TermsOfUseModal.tsx** (Lines 33-46)
   - Move X button from right to left
   - Center the title

3. **MemoryPreviewModal.tsx** (Lines 60-76)
   - Restructure header layout
   - X on left, title centered

**Modals Already Correct:**
- EditMemoryModal - No changes needed
- EditProfileModal - No changes needed
- ThemeSelectionModal - No changes needed

**RecordingCompletionModal:**
- No X button - This is correct for action dialogs requiring explicit choice
- Keep as-is

### Standard Header Component (Future Recommendation)

Consider creating a reusable ModalHeader component:

```typescript
interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  rightAction?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
  };
}
```

This would ensure consistency across all current and future modals.

---

## Summary of Recommendations

### High Priority

1. **Audio Skip: Change from 15s to 10s**
   - Single code change in useAudioPlayback.ts
   - Update icon references in EditMemoryModal.tsx
   - Minimal risk, immediate usability improvement

2. **Transcription Limit: Increase from 500 to 5,000 characters**
   - Update maxLength in EditMemoryModal.tsx
   - Database migration if needed
   - Eliminates major user frustration

### Medium Priority

3. **Modal Consistency: Standardize X button position**
   - Update FeedbackModal, TermsOfUseModal, MemoryPreviewModal
   - Consider creating reusable ModalHeader component
   - Improves predictability for elderly users

---

## Appendix: Files Referenced

| File | Path | Relevant Lines |
|------|------|----------------|
| useAudioPlayback.ts | `/hooks/useAudioPlayback.ts` | 148, 164 (skip duration) |
| EditMemoryModal.tsx | `/components/EditMemoryModal.tsx` | 274, 294 (icons), 336, 344 (character limit) |
| FeedbackModal.tsx | `/components/FeedbackModal.tsx` | 76-92 (header) |
| TermsOfUseModal.tsx | `/components/TermsOfUseModal.tsx` | 33-46 (header) |
| MemoryPreviewModal.tsx | `/components/MemoryPreviewModal.tsx` | 60-76 (header) |
| ThemeSelectionModal.tsx | `/components/ThemeSelectionModal.tsx` | 67-84 (header - correct) |
| EditProfileModal.tsx | `/components/EditProfileModal.tsx` | 481-491 (header - correct) |

---

## References

1. Apple Human Interface Guidelines - Modality (2024)
2. Material Design 3 - Dialogs Guidelines
3. Nielsen Norman Group - Usability for Senior Citizens (2024)
4. Toptal - UI Design for Older Adults
5. ResearchGate - Touch Screen User Interfaces for Older Adults: Button Size and Spacing
6. VirtualSpeech - Average Speaking Rate and Words per Minute
7. Apple Developer Documentation - iOS App Architecture
