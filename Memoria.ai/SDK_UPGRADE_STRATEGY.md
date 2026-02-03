# Expo SDK Upgrade Strategy for Memoria.ai

## Current Situation (2025-10-13)

- **Current SDK**: 53
- **Target SDK**: 54
- **Blocker**: Tamagui 1.132.24 requires React Native ^0.79.2, but SDK 54 needs 0.81.x

## Solution

Upgrade Tamagui to 1.135.2+ which supports any React Native version.

## Step-by-Step Upgrade Process

### 1. Pre-Upgrade Checklist
```bash
# Commit all current changes
git add .
git commit -m "chore: prepare for SDK upgrade"

# Check current versions
npm ls expo tamagui react-native
```

### 2. Upgrade Tamagui First
```bash
# Update all Tamagui packages to latest
npm install tamagui@latest @tamagui/babel-plugin@latest --legacy-peer-deps
```

### 3. Upgrade Expo SDK
```bash
# Upgrade to SDK 54
npm install expo@^54.0.0 --legacy-peer-deps

# Fix all package versions for SDK 54
npx expo install --fix
```

### 4. Clean and Restart
```bash
# Kill all processes
killall -9 node

# Clear caches
npx expo start --clear
```

### 5. Test on Simulator
```bash
# Test on iOS simulator
npx expo start --ios
```

### 6. Test on Physical Device
- Open Expo Go on your phone (must be version 54)
- Scan QR code or enter URL

### 7. Verify Migration
- [ ] App loads without errors
- [ ] Recording works (expo-audio migration)
- [ ] Playback works
- [ ] UI renders correctly (Tamagui)
- [ ] Navigation works

## Future SDK Upgrades (55, 56, etc.)

### Before Upgrading

1. **Check Tamagui Compatibility**
   ```bash
   npm view tamagui peerDependencies
   ```

2. **Check React Native Reanimated Compatibility**
   - Visit: https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/

3. **Check Other Key Dependencies**
   - expo-audio
   - expo-router
   - react-navigation

### Upgrade Process

```bash
# 1. Update Tamagui if needed
npm install tamagui@latest @tamagui/babel-plugin@latest --legacy-peer-deps

# 2. Update Expo
npm install expo@^<NEW_VERSION> --legacy-peer-deps

# 3. Fix all packages
npx expo install --fix

# 4. Clean restart
killall -9 node
npx expo start --clear
```

### Common Issues & Solutions

**Issue**: Peer dependency conflicts
**Solution**: Use `--legacy-peer-deps` flag

**Issue**: Worklets version mismatch
**Solution**:
```bash
npm install react-native-worklets@latest react-native-worklets-core@latest --legacy-peer-deps
```

**Issue**: GestureHandler errors
**Solution**: Ensure `GestureHandlerRootView` wraps app in `app/_layout.tsx`

**Issue**: Metro bundler cache issues
**Solution**:
```bash
killall -9 node
npx expo start --clear
```

## Key Dependencies to Monitor

| Package | Why Critical | Compatibility Check |
|---------|-------------|---------------------|
| Tamagui | UI framework, has RN version requirements | `npm view tamagui peerDependencies` |
| expo-audio | Core recording feature | Check Expo docs for SDK compatibility |
| react-native-reanimated | Animations, has worklets dependency | Check Swmansion compatibility table |
| expo-router | Navigation | Usually upgraded automatically with SDK |

## Rollback Plan

If upgrade fails:
```bash
# Revert to previous commit
git reset --hard HEAD~1

# Reinstall dependencies
npm install --legacy-peer-deps

# Clean restart
killall -9 node
npx expo start --clear
```

## Notes

- Always use `--legacy-peer-deps` to handle peer dependency conflicts
- Test on simulator before physical device
- Keep Tamagui updated - they're actively maintaining RN compatibility
- Document any custom fixes for team reference
