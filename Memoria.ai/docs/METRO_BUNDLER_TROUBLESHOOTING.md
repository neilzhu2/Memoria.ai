# Metro Bundler Troubleshooting Guide

## Issue: Changes Not Appearing / Hot Reload Not Working

### Symptoms
- Made code changes but they don't appear in the app
- Metro bundler shows "Waiting on http://localhost:8081" indefinitely
- App loads but shows old code (before your changes)
- No bundling progress shown

### Root Cause
Metro bundler can get stuck when:
- Multiple Expo processes are running simultaneously
- Cache becomes corrupted
- File watchers stop responding
- Major structural changes (new files, new dependencies) aren't detected

---

## Solution: Complete Reset Process

Follow these steps **in order** when hot reload isn't working:

### Step 1: Kill All Processes
```bash
# Kill all Expo and Metro processes
killall -9 "Expo Go" "node" 2>/dev/null
pkill -9 -f "expo start" 2>/dev/null
sleep 2
```

**What this does:** Forcefully terminates all running Expo and Node processes that might be holding locks on the bundler.

### Step 2: Clean Start with Cache Clear
```bash
cd /path/to/your/project
npx expo start --clear --ios
```

**Flags explained:**
- `--clear`: Clears Metro bundler cache (forces complete rebuild)
- `--ios`: Opens iOS simulator automatically

**Expected output:**
```
Starting Metro Bundler
warning: Bundler cache is empty, rebuilding (this may take a minute)
iOS node_modules/expo-router/entry.js ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░ 99.9%
iOS Bundled 17519ms node_modules/expo-router/entry.js (1732 modules)
```

### Step 3: Wait for Complete Bundle
- **DO NOT** interact with the app until you see "Bundled" message
- First build takes 15-30 seconds
- Progress bar should reach 100%
- You'll see "WARN" and "LOG" messages when ready

### Step 4: Verify Changes Loaded
- Navigate to the affected screen in your app
- Check that new features/changes are visible
- Look for console logs if you added any

---

## Quick Reference Commands

### For iOS Development
```bash
# Complete reset
killall -9 "Expo Go" "node" 2>/dev/null && pkill -9 -f "expo start" 2>/dev/null && sleep 2 && cd /path/to/Memoria/Memoria.ai && npx expo start --clear --ios
```

### For Android Development
```bash
# Complete reset
killall -9 "Expo Go" "node" 2>/dev/null && pkill -9 -f "expo start" 2>/dev/null && sleep 2 && cd /path/to/Memoria/Memoria.ai && npx expo start --clear --android
```

### Just Clear Cache (Lighter Reset)
```bash
npx expo start --clear
```

---

## When to Use This Process

### Always Use for:
1. **New file creations** - When you add new `.ts`, `.tsx`, or `.js` files
2. **New hook implementations** - When creating custom hooks
3. **Major refactoring** - When moving code between files
4. **Dependency changes** - After `npm install` or `package.json` updates
5. **Context/Provider changes** - When modifying React Context files
6. **Hot reload failures** - When you see "Fast refresh" errors

### May Not Need for:
- Small text changes (copy updates)
- Style-only modifications (colors, spacing)
- Comment additions
- Minor bug fixes in existing functions

---

## Common Scenarios

### Scenario 1: "I added a new feature file but app doesn't show it"

**Problem:** Created `hooks/useAudioPlayback.ts` but components can't import it

**Solution:**
```bash
# Step 1: Kill everything
killall -9 "Expo Go" "node" 2>/dev/null && pkill -9 -f "expo start" 2>/dev/null

# Step 2: Clean start
cd /Users/lihanzhu/Desktop/Memoria/Memoria.ai
npx expo start --clear --ios

# Step 3: Wait for "Bundled" message (15-30 seconds)
```

### Scenario 2: "Metro is stuck on 'Waiting on http://localhost:8081'"

**Problem:** Metro started but never begins bundling

**Solution:**
```bash
# Force kill and restart
killall -9 "Expo Go" "node" 2>/dev/null
pkill -9 -f "expo start" 2>/dev/null
sleep 2
npx expo start --clear --ios
```

### Scenario 3: "App shows old code after my changes"

**Problem:** Hot reload applied but changes aren't visible

**Solution:**
```bash
# In the Expo terminal, press:
r  # Reload app
# OR
Shift + r  # Reset cache and reload

# If that doesn't work, do full reset:
killall -9 "Expo Go" "node" 2>/dev/null && sleep 2 && npx expo start --clear --ios
```

---

## Advanced Troubleshooting

### If Complete Reset Doesn't Work

1. **Check for syntax errors**
   ```bash
   npm run type-check
   ```

2. **Verify file paths are correct**
   - Ensure imports use correct paths
   - Check for typos in file names
   - Confirm files are in expected locations

3. **Clear node_modules (nuclear option)**
   ```bash
   rm -rf node_modules
   npm install
   npx expo start --clear --ios
   ```

4. **Check simulator/device**
   - Close simulator completely
   - Restart simulator
   - Delete Expo Go app and reinstall

---

## Prevention Tips

### Best Practices to Avoid Issues

1. **One Metro instance** - Never run multiple `expo start` commands
2. **Kill before restart** - Always kill previous instances before starting new ones
3. **Use --clear for big changes** - Any new files = use `--clear` flag
4. **Watch the terminal** - Wait for "Bundled" message before testing
5. **Background processes** - Run in background to monitor logs continuously

### Monitoring Background Processes
```bash
# Start in background
npx expo start --clear --ios &

# Check output
# (Background bash ID will be shown)

# Monitor logs
tail -f /path/to/logs
```

---

## Integration with Development Workflow

### Standard Development Process

1. **Make code changes** (edit files, add features)
2. **Check if major change:**
   - New files? → YES → Use complete reset
   - New imports? → YES → Use complete reset
   - Style only? → NO → Just save and let hot reload work
3. **If major change, run:**
   ```bash
   killall -9 "Expo Go" "node" 2>/dev/null && pkill -9 -f "expo start" 2>/dev/null && sleep 2 && npx expo start --clear --ios
   ```
4. **Wait for "Bundled" message**
5. **Test in app**
6. **Repeat**

### Before Committing Code

```bash
# Ensure clean build works
killall -9 "Expo Go" "node" 2>/dev/null
pkill -9 -f "expo start" 2>/dev/null
sleep 2
npx expo start --clear --ios

# Wait for successful bundle
# Test all features
# Then commit
```

---

## Historical Context

### Why This Document Exists

This process was documented after recurring issues with Metro bundler not detecting changes, specifically:

1. **Recording screen implementation** (October 2025)
   - Added `SimpleRecordingScreen.tsx`
   - Hot reload didn't pick up new component
   - Required complete Metro restart

2. **Audio playback feature** (October 2025)
   - Created `hooks/useAudioPlayback.ts`
   - Modified `mylife.tsx` and `RecordingsList.tsx`
   - Metro stuck on "Waiting" indefinitely
   - Complete reset with `--clear` flag resolved it

### Lessons Learned

- **Hot reload is not reliable** for structural changes
- **Cache clearing is essential** after major modifications
- **Background processes** can interfere with new instances
- **Always wait** for complete bundle before testing

---

## Quick Checklist

When changes don't appear:

- [ ] Kill all Expo/Node processes
- [ ] Wait 2 seconds
- [ ] Run `npx expo start --clear --ios`
- [ ] Wait for "Bundled" message (full 100%)
- [ ] Check terminal for errors
- [ ] Test feature in app
- [ ] If still broken, check syntax errors
- [ ] If still broken, delete node_modules and reinstall

---

## Contact & Updates

**Maintainer:** Claude Code Development Team
**Last Updated:** October 4, 2025
**Tested Platforms:** iOS Simulator (iPhone 16 Pro), Expo SDK 53

**Updates should be made when:**
- New Metro issues are discovered
- Better solutions are found
- Expo/React Native versions change behavior
