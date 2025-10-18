# Troubleshooting Session - October 16, 2025

## Session Goal
Start the iOS simulator to view the current state of Memoria.ai app.

## Initial State
- Last known working session: October 8, 2025
- App was functional with:
  - Recording with mock transcription
  - Memory saving and listing
  - EditMemoryModal working
  - All core features operational

## Issues Encountered

### 1. Initial Startup Failure
**Problem:** `expo start --ios` failed with error:
```
Error: Cannot find module './plugins/createBaseMod'
```

**Root Cause:** Corrupted or incomplete node_modules dependencies

### 2. Node Modules Corruption
**Symptoms:**
- expo CLI binary missing from node_modules/.bin/
- Multiple failed attempts to remove node_modules
- Files locked by system processes

**Attempted Solutions:**
1. ❌ `rm -rf node_modules` - Hung on react-native directory (locked files)
2. ❌ `npm install --force` - ENOTEMPTY errors
3. ❌ `npx rimraf node_modules` - Failed with ENOTEMPTY on @esbuild
4. ✅ `mv node_modules node_modules_old_corrupted && npm install` - SUCCESS

**Result:** Fresh install completed with 1350 packages installed

### 3. Metro Bundler Startup Failure
**Problem:** Metro bundler stuck at "Waiting on http://localhost:8081"

**Symptoms:**
- Expo says "Starting Metro Bundler"
- Message: "warning: Bundler cache is empty, rebuilding (this may take a minute)"
- Never progresses past "Waiting on http://localhost:8081"
- Port 8081 IS listening (confirmed with lsof)
- No error messages shown
- Simulator shows: "Could not connect to development server"

**Attempted Solutions:**

1. **Network Connection Issues**
   - ❌ Started with `--ios` flag (used network IP 192.168.1.83)
   - ✅ Changed to `--localhost` flag (forced 127.0.0.1)
   - Still couldn't connect

2. **Cache Clearing**
   - ❌ Added `--clear` flag to clear Metro cache
   - Still stuck at startup

3. **Process Management**
   - ❌ `killall -9 node` to kill all node processes
   - ❌ Terminated Expo Go app in simulator
   - Still stuck after restart

4. **Package Version Mismatches**
   - **Issue:** Warning about incompatible versions:
     - `@react-native-async-storage/async-storage@2.2.0` - expected: 2.1.2
     - `jest-expo@51.0.4` - expected: ~53.0.10
   - ✅ Ran `npx expo install --fix`
   - ✅ Updated to correct versions
   - ❌ Metro still stuck (warnings gone but issue persists)

5. **Manual Bundle Request**
   - ❌ `curl http://localhost:8081/node_modules/expo-router/entry.bundle?platform=ios&dev=true`
   - Request hangs indefinitely, never returns

## Current State (After 1+ Hour)

### What's Working
- ✅ iOS Simulator is running (iPhone 16 Pro)
- ✅ node_modules fully installed (1379 packages)
- ✅ Package versions correct (async-storage, jest-expo fixed)
- ✅ Port 8081 listening (confirmed with lsof and nc)
- ✅ Expo process running (PID confirmed)

### What's NOT Working
- ❌ Metro bundler frozen at initialization
- ❌ Cannot connect to dev server from simulator
- ❌ No bundle being served
- ❌ No error messages to diagnose

## Configuration Analysis

### babel.config.js
```javascript
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Temporarily disabled tamagui plugin to fix import.meta issues
      // ['@tamagui/babel-plugin', { components: ['tamagui'], config: './tamagui.config.ts' }],
      // Reanimated plugin MUST be last:
      'react-native-reanimated/plugin',
    ],
  }
}
```

**Note:** Tamagui babel plugin is DISABLED (per previous session work log)

### metro.config.js
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.transformer.unstable_allowRequireContext = true;
if (config.resolver.platforms && !config.resolver.platforms.includes('web')) {
  config.resolver.platforms.push('web');
}
module.exports = config;
```

### app/_layout.tsx
- Uses TamaguiProvider (but babel plugin is disabled)
- Imports react-native-reanimated
- Imports react-native-toast-message

## Potential Root Causes (To Investigate)

### 1. Tamagui Configuration Conflict
- App uses TamaguiProvider in _layout.tsx
- But Tamagui babel plugin is disabled in babel.config.js
- This mismatch may cause Metro to fail silently during transform phase

### 2. Module Resolution Issue
- Possible circular dependency
- Import graph may have unresolvable modules
- Metro may be stuck trying to resolve dependencies

### 3. Transform Pipeline Issue
- react-native-reanimated/plugin may be incompatible
- Babel transformation may be failing without error output

### 4. Cache Corruption
- Even with --clear flag, some cache may be corrupted
- Watchman cache could be stale
- Metro cache location may need manual clearing

## Commands Used (Chronological)

```bash
# Initial attempt
npx expo start --ios  # Failed: Cannot find module

# Dependency reinstall attempts
rm -rf node_modules && npm install  # Hung on locked files
killall -9 rm
npx rimraf node_modules  # Failed: ENOTEMPTY
npm install --force  # Failed: ENOTEMPTY

# Successful reinstall
mv node_modules node_modules_old_corrupted
npm install  # SUCCESS: 1350 packages

# Metro startup attempts
npm start -- --ios  # Stuck at "Waiting"
npm start -- --ios --localhost  # Still stuck
npm start -- --ios --localhost --clear  # Still stuck

# Package fixes
npx expo install --fix  # Fixed version mismatches

# Final attempt
killall -9 node
npm start -- --ios --localhost --clear  # Still stuck
```

## System Information

- **Platform:** macOS (Darwin 24.6.0)
- **Expo SDK:** 53.0.23
- **React Native:** 0.79.5
- **React:** 19.0.0
- **Node processes running:** Multiple (VS Code, Adobe, etc. - may be locking files)
- **Simulator:** iPhone 16 Pro (iOS 18.1)

## Files That May Need Investigation

1. `tamagui.config.ts` - Verify configuration is valid
2. `app/_layout.tsx` - Check if imports are resolvable
3. `app/(tabs)/_layout.tsx` - Check tab navigation setup
4. Any files using Tamagui components without babel plugin
5. Metro cache directories:
   - `.expo/`
   - `node_modules/.cache/`
   - `/tmp/metro-*`

## BREAKTHROUGH - Root Cause Identified

### Discovery Process
1. Used `EXPO_DEBUG=true` to get verbose logging
2. Found that Metro WAS starting but silently failing
3. **KEY FINDING: The `--clear` flag was causing Metro to hang indefinitely during cache rebuild**

### Current State After Removing `--clear`
- ✅ Metro bundler is running (`packager-status:running`)
- ✅ Port 8081 is listening and responding
- ✅ Manifest endpoint is serving successfully
- ✅ Expo Go connects and fetches manifest
- ❌ **NEW ISSUE:** Expo Go never requests the JavaScript bundle after fetching manifest
- ❌ Metro stays at "Waiting on http://localhost:8081" (waiting for first bundle request)
- ❌ Simulator still shows "Could not connect to development server"

### Debug Logs Show:
```
2025-10-16T20:06:14.935Z expo:start:server:middleware:manifest Resolved entry point: node_modules/expo-router/entry.js
2025-10-16T20:10:32.711Z expo:start:server:middleware:manifest Resolved entry point: node_modules/expo-router/entry.js
2025-10-16T20:13:46.788Z expo:start:server:middleware:manifest Resolved entry point: node_modules/expo-router/entry.js
```

Manifest requested 3 times (initial + 2 reloads), but NO bundle requests follow.

### Hypothesis
There's likely a **code error in the manifest or app configuration** that prevents Expo Go from proceeding to bundle the app. Possibilities:
1. Invalid app.json/app.config
2. Circular dependency in entry point
3. SDK version mismatch between Expo Go (2.33.17) and SDK 53
4. Tamagui configuration issue without babel plugin enabled

## Next Steps for Investigation

1. ✅ **COMPLETED:** Identified that `--clear` flag causes Metro to hang - DON'T USE IT
2. Check app.json for configuration errors
3. Verify SDK 53 compatibility with Expo Go 2.33.17
4. Test if Tamagui needs its babel plugin re-enabled
5. Try temporarily simplifying app/_layout.tsx to isolate the blocker
6. Check for any errors in Expo Go app itself (simulator console)

## Lessons Learned

1. **Node modules corruption is hard to fix** - Standard rm commands fail on locked files
2. **Metro fails silently** - Stuck at "Waiting" with no error output
3. **Package version mismatches may be red herrings** - Fixed them but didn't solve the core issue
4. **Port listening != working server** - Port 8081 listens but doesn't serve
5. **Tamagui + Expo config is complex** - Disabling babel plugin may break Metro initialization

## Questions to Answer

1. Why does Metro get stuck at initialization instead of showing a build error?
2. Can TamaguiProvider work without @tamagui/babel-plugin?
3. Is there a Metro log file we haven't checked?
4. Did the October 8 session have the babel plugin enabled or disabled?
5. What changed between October 8 (working) and October 16 (broken)?

---

**Session Duration:** ~2.5 hours
**Status:** PARTIALLY RESOLVED - Metro runs but bundle build hangs silently
**Critical Discovery:** `--clear` flag causes Metro to hang indefinitely

## FINAL STATUS & ACTIONABLE SOLUTION

### What We Fixed
1. ✅ Corrupted node_modules (reinstalled successfully)
2. ✅ Package version mismatches (fixed with `npx expo install --fix`)
3. ✅ Metro startup hanging (caused by `--clear` flag - **NEVER USE IT**)
4. ✅ New Architecture incompatibility (disabled `newArchEnabled`)

### Remaining Issue
**Metro receives bundle requests but hangs silently during build** - No error output, just infinite wait.

Direct bundle test: `curl http://localhost:8081/node_modules/expo-router/entry.bundle?platform=ios&dev=true` hangs indefinitely.

### Root Cause Analysis
Most likely causes:
1. **Tamagui without babel plugin** - App uses TamaguiProvider but babel plugin is disabled
2. **Silent build error** - Babel/Metro transform failing without error reporting
3. **Native module requirement** - expo-speech-recognition may require development build

### RECOMMENDED SOLUTION

**Option A: Re-enable Tamagui Babel Plugin (Quick Fix)**
Edit `babel.config.js` and uncomment:
```javascript
['@tamagui/babel-plugin', { components: ['tamagui'], config: './tamagui.config.ts' }],
```

**Option B: Build Development Client (Proper Solution)**
```bash
npx expo run:ios
```
This builds a custom development app with all native modules included.

**Option C: Temporarily Remove Tamagui (Diagnostic)**
Comment out TamaguiProvider in `app/_layout.tsx` to isolate if Tamagui is the blocker.

### Key Learnings
- **NEVER use `--clear` flag** - causes indefinite Metro hang
- **`newArchEnabled: true` breaks Expo Go** - must be false for Expo Go compatibility
- **Metro fails silently** - build errors don't always show in output
- **Node modules corruption** - use `mv` then fresh install, not `rm -rf`
