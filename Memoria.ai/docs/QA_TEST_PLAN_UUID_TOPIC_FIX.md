# QA Test Plan: UUID Topic System Fix & Free-Style Recording

**Date:** 2026-02-03
**Version:** 1.0
**Tester:** QA Team
**Platform:** iOS & Android (Expo Dev Build)
**Test Environment:** Development build with Supabase backend

---

## Executive Summary

This test plan validates the fix for the topic system UUID error and the addition of free-style recording functionality. The changes unified two separate topic systems that were causing database errors when saving recordings.

### Problem Statement
- **Issue 1:** UUID Error - "invalid input syntax for type uuid: 'childhood-home'" when saving recordings
- **Issue 2:** HomeScreen used database-backed topics (UUIDs), ThemeSelectionModal used hardcoded strings
- **Issue 3:** No option for free-style recording without a topic

### Solution Implemented
1. Created UUID validation utility (`lib/uuid.ts`)
2. Refactored ThemeSelectionModal to use database topics
3. Added free-style recording option (topic_id: null)
4. Updated RecordingContext to validate UUIDs before database insert
5. Updated all recording flows to support null theme

---

## Test Environment Setup

### Prerequisites
- [ ] Expo development build installed on test device
- [ ] Active internet connection
- [ ] Supabase backend accessible
- [ ] Test user account logged in
- [ ] Database contains sample topics in multiple categories
- [ ] At least one topic has already been recorded (for "recorded" badge testing)

### Initial State Verification
1. **Verify Database Topics:**
   - Open Supabase dashboard
   - Navigate to `recording_topics` table
   - Confirm topics exist with valid UUID ids
   - Note which topics have been recorded (check `memories` table for matching `topic_id`)

2. **Clear App State (if needed):**
   - Uninstall and reinstall app for clean state
   - OR clear AsyncStorage via dev tools

---

## Test Cases

## SECTION 1: UUID Validation & Database Integration

### TC-1.1: UUID Validation Utility
**Priority:** Critical
**Component:** `lib/uuid.ts`
**Objective:** Verify UUID validation functions work correctly

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Import and test `isValidUUID()` with valid UUID | Returns `true` | | |
| 2 | Test with invalid string "childhood-home" | Returns `false` | | |
| 3 | Test with null | Returns `false` | | |
| 4 | Test with undefined | Returns `false` | | |
| 5 | Test `validateUUID()` with valid UUID | Returns the UUID string | | |
| 6 | Test `validateUUID()` with invalid string | Returns `null` | | |

**Console Test Commands:**
```javascript
import { isValidUUID, validateUUID } from '@/lib/uuid';
console.log(isValidUUID('550e8400-e29b-41d4-a716-446655440000')); // true
console.log(isValidUUID('childhood-home')); // false
console.log(validateUUID('invalid')); // null
```

---

### TC-1.2: Recording Context UUID Validation
**Priority:** Critical
**Component:** `contexts/RecordingContext.tsx`
**Objective:** Ensure invalid topic IDs are converted to null before database insert

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Monitor console logs during recording save | Look for `[addMemory]` logs showing UUID validation | | |
| 2 | Save recording with valid topic UUID | `topic_id` in database matches the UUID | | |
| 3 | Save free-style recording (null topic) | `topic_id` in database is null | | |
| 4 | Check for validation warnings in console | Should see warning if invalid UUID provided | | |

**Verification:**
- Open Supabase `memories` table after each save
- Verify `topic_id` column value matches expectations
- No UUID format errors in console

---

## SECTION 2: Theme Selection Modal (Database Topics)

### TC-2.1: Modal Opening & Data Loading
**Priority:** Critical
**Component:** `components/ThemeSelectionModal.tsx`
**Objective:** Verify modal loads topics from database

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Tap floating record button | Theme selection modal appears | | |
| 2 | Observe loading state | Loading spinner visible briefly | | |
| 3 | Wait for topics to load | Topics appear in scrollable list | | |
| 4 | Count topics displayed | Matches unrecorded topic count | | |
| 5 | Check console logs | `[loadTopics]` logs show successful fetch | | |

**UI Elements to Verify:**
- Modal header: "Memory Suggestions"
- Subtitle text updates based on state
- Free-Style Recording card at top (✨ icon)
- Topic cards below with category badges

---

### TC-2.2: Free-Style Recording Option
**Priority:** Critical
**Component:** `components/ThemeSelectionModal.tsx`
**Objective:** Verify free-style recording option is always visible and functional

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Open theme selection modal | Free-Style card at top with ✨ icon | | |
| 2 | Read card text | Title: "Free Recording", Subtitle: "Record anything on your mind" | | |
| 3 | Verify styling | Honey gold background with border | | |
| 4 | Tap Free-Style card | Modal closes, recording screen opens | | |
| 5 | Check recording screen header | Shows "Free Recording" with ✨ badge | | |
| 6 | Verify prompt text | "Record anything on your mind" | | |

**Visual Verification:**
- Free-Style card has distinct styling (gold tint)
- Icon is ✨ (sparkles emoji)
- Card is always at the top, above topics

---

### TC-2.3: Topic Filtering - Unrecorded Only
**Priority:** High
**Component:** `components/ThemeSelectionModal.tsx`
**Objective:** Verify modal only shows topics that haven't been recorded

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Record a memory for Topic A | Memory saved successfully | | |
| 2 | Open theme selection modal | Topic A is NOT in the list | | |
| 3 | Verify other unrecorded topics appear | Topics B, C, D visible | | |
| 4 | Record a memory for Topic B | Memory saved successfully | | |
| 5 | Reopen theme selection modal | Topic B also filtered out | | |

**Database Verification:**
- Check `memories` table for entries with matching `topic_id`
- Verify modal filtering logic compares against these IDs

---

### TC-2.4: Category Badge Display
**Priority:** Medium
**Component:** `components/ThemeSelectionModal.tsx`
**Objective:** Verify category information displays correctly on topic cards

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Open theme selection modal | Topic cards show category badges | | |
| 2 | Verify badge content | Icon + category display name | | |
| 3 | Check badge styling | Honey gold background, rounded badge | | |
| 4 | Test with topic without category | No category badge shown | | |
| 5 | Verify badge positioning | Badge above topic prompt text | | |

**Visual Elements:**
- Badge color: Honey gold (`highlight` color + 20% opacity)
- Border: Honey gold + 40% opacity
- Icon matches category icon from database
- Display name matches `display_name` field

---

### TC-2.5: All Topics Recorded State
**Priority:** Medium
**Component:** `components/ThemeSelectionModal.tsx`
**Objective:** Verify modal behavior when all topics have been recorded

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Record memories for all available topics | All topics saved | | |
| 2 | Open theme selection modal | Free-Style option still visible | | |
| 3 | Check subtitle text | "All topics recorded! Try free recording." | | |
| 4 | Scroll down | See "Amazing work!" message with 🎉 icon | | |
| 5 | Read completion message | Suggests free recording or re-recording from Home | | |

**UI State:**
- Header subtitle changes to completion message
- All topics recorded message appears below Free-Style card
- Free-Style option remains functional

---

### TC-2.6: Loading & Error States
**Priority:** Medium
**Component:** `components/ThemeSelectionModal.tsx`
**Objective:** Verify modal handles loading and error states gracefully

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Simulate slow network | Loading spinner appears | | |
| 2 | Wait for topics to load | Loading state disappears | | |
| 3 | Simulate network error (offline mode) | Error message displays | | |
| 4 | Tap "Tap to retry" button | Attempts to reload topics | | |
| 5 | Restore connection and retry | Topics load successfully | | |

**Error Handling:**
- Error message: "Failed to load topics. Please try again."
- Retry button appears below error message
- Free-Style option remains accessible during errors

---

## SECTION 3: Recording Flow Integration

### TC-3.1: HomeScreen Topic Card Recording
**Priority:** Critical
**Component:** `app/(tabs)/index.tsx`, `components/RecordingFlowContainer.tsx`
**Objective:** Verify recording from HomeScreen topic cards uses valid UUIDs

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Navigate to Home screen | Topic cards visible | | |
| 2 | Read current topic prompt | Note the topic text | | |
| 3 | Tap green microphone button on card | Recording screen opens immediately | | |
| 4 | Verify recording screen shows topic | Topic prompt matches card | | |
| 5 | Record 5-second audio clip | Recording timer shows 00:05 | | |
| 6 | Tap "Done" button | Recording stops, edit modal appears | | |
| 7 | Tap "Done" in edit modal | Memory saved to database | | |
| 8 | Check console logs | No UUID errors, successful save | | |

**Database Verification:**
- Open Supabase `memories` table
- Find the new memory entry
- Verify `topic_id` is a valid UUID
- Verify `topic_id` matches the topic from HomeScreen

**Console Log Verification:**
```
[saveRecording] Recording title: [Topic prompt text]
[addMemory] Memory data prepared
[addMemory] Calling addMemory (await)...
[addMemory] Memory saved successfully
```

---

### TC-3.2: Floating Button → Theme Selection → Recording
**Priority:** Critical
**Component:** `app/(tabs)/_layout.tsx`, `components/ThemeSelectionModal.tsx`
**Objective:** Verify recording flow from floating button uses database topics

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Tap floating record button (tab bar) | Theme selection modal opens | | |
| 2 | Select a topic from the list | Modal closes, recording screen opens | | |
| 3 | Verify selected topic displays | Topic prompt matches selection | | |
| 4 | Record and save memory | Memory saved successfully | | |
| 5 | Check database | `topic_id` is valid UUID | | |
| 6 | Reopen theme selection modal | Selected topic is filtered out | | |

**Flow Verification:**
- Tab bar → ThemeSelectionModal → RecordingFlowContainer → SimpleRecordingScreen
- Selected theme passed correctly through the chain
- UUID validation happens before database insert

---

### TC-3.3: Free-Style Recording End-to-End
**Priority:** Critical
**Component:** Full recording flow
**Objective:** Verify free-style recordings save with null topic_id

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Tap floating record button | Theme selection modal opens | | |
| 2 | Tap "Free Recording" card | Recording screen opens | | |
| 3 | Verify free-style UI indicators | Badge shows ✨ "Free Recording" | | |
| 4 | Check prompt text | "Record anything on your mind" | | |
| 5 | Record 10-second audio clip | Timer reaches 00:10 | | |
| 6 | Tap "Done" | Recording stops, edit modal appears | | |
| 7 | Check default title | "Free Recording - [current date]" | | |
| 8 | Save without editing | Memory saved successfully | | |
| 9 | Open Supabase `memories` table | Find the new memory | | |
| 10 | Verify `topic_id` column | Value is `null` | | |

**Console Log Verification:**
```
[saveRecording] Free-style mode: true
[saveRecording] Recording title: Free Recording - [date]
[addMemory] Insert data prepared: topic_id: null
[addMemory] Memory saved successfully
```

**Database Schema:**
- `topic_id` column should allow NULL values
- No foreign key constraint violations

---

### TC-3.4: Category Filtering in Modal
**Priority:** Medium
**Component:** `components/ThemeSelectionModal.tsx`
**Objective:** Verify modal respects category filter when passed from HomeScreen

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | On HomeScreen, select "Childhood" category | Card shows childhood topics | | |
| 2 | Tap floating record button | Theme selection modal opens | | |
| 3 | Verify topics shown | Only unrecorded childhood topics visible | | |
| 4 | Check topic category badges | All show "Childhood" category | | |
| 5 | Switch to "All" category on Home | All topics visible on cards | | |
| 6 | Tap floating button again | Modal shows all unrecorded topics | | |

**Note:** This test case may need adjustment based on current implementation - verify if category filter is passed to modal.

---

## SECTION 4: Console Error Validation

### TC-4.1: No UUID Errors During Recording
**Priority:** Critical
**Component:** All recording flows
**Objective:** Ensure no UUID format errors appear in console

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Open browser console or React Native debugger | Console visible | | |
| 2 | Clear console logs | Clean slate | | |
| 3 | Record via HomeScreen topic card | No UUID errors | | |
| 4 | Record via theme selection modal | No UUID errors | | |
| 5 | Record free-style recording | No UUID errors | | |
| 6 | Search console for "invalid input syntax" | Zero results | | |

**Error Patterns to Check:**
- ❌ "invalid input syntax for type uuid"
- ❌ "Error saving memory"
- ❌ Supabase error codes related to UUID constraints

**Success Patterns:**
- ✅ "[addMemory] Memory saved successfully"
- ✅ "[addMemory] Total memories after save: [count]"

---

## SECTION 5: Cross-Platform Testing

### TC-5.1: iOS-Specific Testing
**Priority:** High
**Platform:** iOS (iPhone 12+, iOS 15+)

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Test all recording flows on iOS | All flows work correctly | | |
| 2 | Verify modal animations | Smooth slide-up animation | | |
| 3 | Check haptic feedback | Haptics fire on button taps | | |
| 4 | Test safe area handling | No content cut off by notch | | |
| 5 | Verify back gesture | Swipe from left edge closes modal | | |

**iOS-Specific Issues to Watch:**
- Modal presentation style (pageSheet)
- Haptic feedback timing
- Safe area insets on newer iPhones

---

### TC-5.2: Android-Specific Testing
**Priority:** High
**Platform:** Android (Pixel 4+, Android 10+)

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Test all recording flows on Android | All flows work correctly | | |
| 2 | Verify modal animations | Smooth slide-up animation | | |
| 3 | Test back button | Back button closes modal | | |
| 4 | Check status bar handling | Status bar color/style correct | | |
| 5 | Test on different screen sizes | UI scales appropriately | | |

**Android-Specific Issues to Watch:**
- Back button behavior
- Status bar color
- Different screen densities (mdpi, hdpi, xhdpi, xxhdpi)

---

## SECTION 6: Edge Cases & Error Scenarios

### TC-6.1: Network Connectivity Issues
**Priority:** High
**Component:** Topic loading, memory saving

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Enable airplane mode | Network disconnected | | |
| 2 | Open theme selection modal | Error state displays | | |
| 3 | Verify error message | "Failed to load topics. Please try again." | | |
| 4 | Disable airplane mode | Network restored | | |
| 5 | Tap retry button | Topics load successfully | | |
| 6 | Record and save memory offline | Appropriate error handling | | |

**Error Handling:**
- Topics load from cache if available
- Clear error messages for users
- Retry functionality works

---

### TC-6.2: Rapid Interaction Testing
**Priority:** Medium
**Component:** All interactive elements

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Rapidly tap floating button 5 times | Modal opens once, no duplicates | | |
| 2 | Quickly select topic and cancel | No state corruption | | |
| 3 | Start recording, immediately tap Done | Recording saves or appropriate error | | |
| 4 | Rapidly switch between topics in modal | No crashes or hanging | | |

**Potential Issues:**
- Race conditions in state updates
- Multiple modals opening
- Recording state conflicts

---

### TC-6.3: Empty Database States
**Priority:** Low
**Component:** Topic loading

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Clear all topics from database (dev only) | Database empty | | |
| 2 | Open theme selection modal | Only Free-Style option visible | | |
| 3 | Check for error messages | Graceful handling of empty state | | |
| 4 | Free-Style recording still works | Can record without topics | | |

---

## SECTION 7: Accessibility Testing

### TC-7.1: Screen Reader Compatibility
**Priority:** Medium
**Platform:** Both iOS and Android

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Enable VoiceOver (iOS) or TalkBack (Android) | Screen reader active | | |
| 2 | Navigate to theme selection modal | Modal elements announced | | |
| 3 | Focus Free-Style card | "Start free recording without a topic" announced | | |
| 4 | Focus topic cards | Topic prompt text read aloud | | |
| 5 | Test recording screen elements | All buttons have labels | | |

**Accessibility Labels to Verify:**
- Free-Style card: "Start free recording without a topic"
- Topic cards: "Record about: [topic prompt]"
- Close button: "Close theme selection"

---

### TC-7.2: Touch Target Sizes
**Priority:** High
**Component:** All interactive elements

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Measure Free-Style card height | Minimum 64px (WCAG AAA) | | |
| 2 | Measure topic card heights | Minimum 80px | | |
| 3 | Measure modal close button | 44x44px minimum | | |
| 4 | Test with finger (not stylus) | All buttons easily tappable | | |

**WCAG 2.1 Guidelines:**
- Minimum touch target: 44x44px (iOS), 48x48px (Android)
- AAA recommendation: 64x64px for elderly users

---

## SECTION 8: Performance Testing

### TC-8.1: Modal Load Time
**Priority:** Medium
**Component:** `components/ThemeSelectionModal.tsx`

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Clear AsyncStorage cache | Cache empty | | |
| 2 | Start performance timer | Timer running | | |
| 3 | Open theme selection modal | Modal opens | | |
| 4 | Measure time to topics visible | Less than 2 seconds | | |
| 5 | Close and reopen modal | Second load uses cache (faster) | | |

**Performance Metrics:**
- Initial load (no cache): < 2 seconds
- Cached load: < 500ms
- Topics render: < 100ms after data received

---

### TC-8.2: Memory Leak Testing
**Priority:** Low
**Component:** All modals and screens

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Open and close theme modal 20 times | No crashes | | |
| 2 | Monitor device memory usage | Memory returns to baseline | | |
| 3 | Record 10 memories in succession | No performance degradation | | |
| 4 | Check for console warnings | No memory leak warnings | | |

---

## SECTION 9: Data Integrity & Database Validation

### TC-9.1: Topic ID Integrity in Database
**Priority:** Critical
**Component:** Database `memories` table

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Record memory from HomeScreen topic | Memory saved | | |
| 2 | Query `memories` table for the entry | Entry exists | | |
| 3 | Verify `topic_id` format | Valid UUID v4 format | | |
| 4 | Check foreign key relationship | `topic_id` exists in `recording_topics` | | |
| 5 | Record free-style memory | Memory saved | | |
| 6 | Verify `topic_id` is null | Value is `NULL` | | |
| 7 | Check no foreign key errors | No constraint violations | | |

**SQL Verification Query:**
```sql
-- Check recent memories
SELECT id, title, topic_id, created_at
FROM memories
ORDER BY created_at DESC
LIMIT 10;

-- Verify UUID format
SELECT id, topic_id,
  CASE
    WHEN topic_id IS NULL THEN 'Free-Style'
    WHEN topic_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'Valid UUID'
    ELSE 'Invalid UUID'
  END as uuid_status
FROM memories
WHERE created_at > NOW() - INTERVAL '1 hour';
```

---

### TC-9.2: Topic History Tracking
**Priority:** Low
**Component:** `services/topics.ts`

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Record memory for Topic A | Memory saved | | |
| 2 | Check `user_topic_history` table | Entry created for Topic A | | |
| 3 | Verify `was_used` flag | Set to `true` | | |
| 4 | Verify `memory_id` link | Matches saved memory ID | | |
| 5 | Check topic filtering | Topic A filtered from modal | | |

---

## SECTION 10: Regression Testing

### TC-10.1: Existing Features Still Work
**Priority:** Critical
**Component:** All existing functionality

| Test Area | Action | Expected Result | Pass/Fail | Notes |
|-----------|--------|----------------|-----------|-------|
| Playback | Play a recorded memory | Audio plays correctly | | |
| Deletion | Delete a memory | Memory removed from list | | |
| Editing | Edit memory title/description | Changes saved | | |
| Transcription | View transcription | Mock transcription appears | | |
| My Life screen | View memories list | All memories display | | |

---

## Test Execution Summary

### Test Environment
- **Device 1:** iPhone [Model] - iOS [Version]
- **Device 2:** Android [Model] - Android [Version]
- **Build Version:** [Version Number]
- **Test Date:** [Date]
- **Tester:** [Name]

### Pass/Fail Summary

| Section | Total Tests | Passed | Failed | Blocked | Notes |
|---------|-------------|--------|--------|---------|-------|
| UUID Validation | | | | | |
| Theme Selection Modal | | | | | |
| Recording Flow | | | | | |
| Console Errors | | | | | |
| Cross-Platform | | | | | |
| Edge Cases | | | | | |
| Accessibility | | | | | |
| Performance | | | | | |
| Data Integrity | | | | | |
| Regression | | | | | |
| **TOTAL** | | | | | |

---

## Critical Issues Found

| Issue ID | Severity | Component | Description | Steps to Reproduce | Status |
|----------|----------|-----------|-------------|-------------------|--------|
| | | | | | |

---

## Known Limitations

1. **Topic Refresh:** Topics are cached for 24 hours. New topics added to database won't appear until cache expires or app restart.
2. **Offline Recording:** Free-style recordings can be saved offline, but topic-based recordings require online connection to validate topic exists.
3. **Category Filter:** Category filter from HomeScreen is currently not passed to ThemeSelectionModal (verify in implementation).

---

## Sign-Off

### QA Approval
- **Tester Name:** ___________________________
- **Date:** ___________________________
- **Signature:** ___________________________

### Product Manager Approval
- **PM Name:** ___________________________
- **Date:** ___________________________
- **Signature:** ___________________________

---

## Appendix A: File Change Summary

### Files Created
- `lib/uuid.ts` - UUID validation utilities

### Files Modified
- `components/ThemeSelectionModal.tsx` - Database integration, free-style option
- `contexts/RecordingContext.tsx` - UUID validation, null topic support
- `components/SimpleRecordingScreen.tsx` - Free-style UI mode
- `components/RecordingFlowContainer.tsx` - Null theme type support
- `app/(tabs)/_layout.tsx` - Null theme type support

### Database Schema Requirements
- `memories.topic_id` must allow NULL values
- `recording_topics` must have UUID primary keys
- No foreign key constraints that prevent NULL `topic_id`

---

## Appendix B: Test Data Setup

### Sample Topics to Verify
Create these test topics in Supabase for comprehensive testing:

```sql
-- Childhood category topic
INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags, is_active)
VALUES (
  (SELECT id FROM topic_categories WHERE name = 'childhood' LIMIT 1),
  'Describe your childhood home in detail',
  'easy',
  ARRAY['childhood', 'home', 'nostalgia'],
  true
);

-- Career category topic
INSERT INTO recording_topics (category_id, prompt, difficulty_level, tags, is_active)
VALUES (
  (SELECT id FROM topic_categories WHERE name = 'career' LIMIT 1),
  'Tell us about your first job',
  'medium',
  ARRAY['career', 'work', 'youth'],
  true
);
```

### Sample Memory to Create
Record at least one memory for one topic to test "recorded" badge and filtering:

1. Record memory for "Describe your childhood home"
2. Save successfully
3. Verify it no longer appears in ThemeSelectionModal

---

## Appendix C: Console Log Patterns

### Successful Recording Save
```
[saveRecording] START
[saveRecording] Recording title: [Topic or "Free Recording - date"]
[saveRecording] Free-style mode: [true/false]
[addMemory] START - Adding memory to Supabase
[addMemory] User ID: [uuid]
[addMemory] Insert data prepared: topic_id: [uuid or null]
[addMemory] Calling Supabase insert...
[addMemory] Supabase insert completed in [X]ms
[addMemory] Memory saved successfully: { id: [uuid], title: [...] }
[addMemory] Total memories now: [count]
[saveRecording] SUCCESS
```

### UUID Validation (when invalid ID provided)
```
[addMemory] Invalid topic_id format, setting to null: childhood-home
```

### Topic Loading
```
[loadTopics] Loaded [X] topics from Supabase
```

---

**End of Test Plan**
