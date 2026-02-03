# iOS Build Troubleshooting Guide

**Last Updated**: February 2, 2026
**Purpose**: Document all build issues encountered and their solutions for future reference.

---

## Quick Reference: Build Commands

```bash
# Start dev server (after app is installed)
npx expo start --dev-client

# Regenerate native iOS folder (fixes many issues)
npx expo prebuild --clean

# Reinstall pods (when pod-related errors occur)
cd ios && rm -rf Pods Podfile.lock && pod install --repo-update

# Full clean rebuild
rm -rf ios/Pods ios/Podfile.lock ios/build node_modules
npm install
cd ios && pod install
```

---

## Build Issues Encountered

### Issue 1: libdav1d "no such file or directory"
**Error**: `Build input file cannot be found: '.../Pods/libdav1d/generate/tmpl_arm/mc16.S'`

**Cause**: CocoaPods cache corruption or incomplete pod installation.

**Solution**:
```bash
cd ios
rm -rf Pods Podfile.lock ~/Library/Caches/CocoaPods
pod cache clean --all
pod install --repo-update
```

---

### Issue 2: ReactCodegen "Build input file cannot be found"
**Error**: Multiple files like `States.cpp`, `ShadowNodes.cpp` not found in `ios/build/generated/ios/react/renderer/components/`

**Cause**: Codegen didn't generate files properly, or build folder was deleted after codegen ran.

**Solution**:
```bash
cd ios
rm -rf build/generated
pod install  # This regenerates codegen files
```

Then in Xcode: Clean Build Folder (Cmd+Shift+K)

---

### Issue 3: Sandbox permission denied
**Error**: `Sandbox: bash(xxxxx) deny(1) file-read-data /Users/.../ios/.xcode.env`

**Cause**: macOS sandbox blocking Xcode build scripts from reading files.

**Solution**:
1. Fix file permissions:
   ```bash
   chmod 644 ios/.xcode.env
   ```

2. Disable User Script Sandboxing in Xcode:
   - Select target → Build Settings → Search "sandbox"
   - Set **User Script Sandboxing** to **No**

**Note**: This setting may reset after `pod deintegrate` or `prebuild --clean`. Always verify after regenerating native code.

---

### Issue 4: SDWebImage header not found
**Error**: `'SDWebImage/SDImageAPNGCoder.h' file not found`

**Cause**: Pod integration broken or headers not properly linked.

**Solution**:
```bash
cd ios
pod deintegrate
pod install --repo-update
```

---

### Issue 5: Keychain access prompt
**Symptom**: Dialog asking for password to access "Apple Development: [NAME]" in keychain

**Cause**: Xcode needs to access signing certificate stored in Keychain.

**Solution**: Enter your **Mac login password** (not Apple ID), click "Always Allow".

---

### Issue 6: "No development servers found" on phone
**Symptom**: App installed but shows "No development servers found"

**Cause**: Metro bundler not running or phone can't connect to it.

**Solution**:
1. Start Metro: `npx expo start --dev-client`
2. Get Mac IP: `ipconfig getifaddr en0`
3. On phone, tap "Enter URL manually" → enter `http://[MAC_IP]:8081`

**If connection fails**:
- Ensure phone and Mac on same WiFi network
- Check Mac firewall (System Settings → Network → Firewall)
- Try with USB: `npx expo start --dev-client --localhost`

---

### Issue 7: RCTFatal crash on load
**Error**: App shows "There was a problem loading the project" with RCTFatal stack trace

**Cause**: Usually URI scheme mismatch or native code out of sync with JS.

**Solution**:
```bash
npx expo prebuild --clean
```
Then rebuild in Xcode.

---

### Issue 8: Codegen TypeError - combineSchemasInFileList is not a function
**Error**: `TypeError: CodegenUtils.getCombineJSToSchema(...).combineSchemasInFileList is not a function`

**Cause**: Corrupted or incomplete `node_modules` installation. The `@react-native/codegen` package is damaged.

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

**Note**: If you see "invalid or damaged lockfile detected" warnings, run `npm install` a second time. The first run repairs the lockfile, the second ensures all packages are correctly installed.

**Key Learning**: Even when Xcode says "Build Succeeded", if the codegen failed during `pod install`, the app will crash on launch with RCTFatal. The build success only means native compilation succeeded, not that the JS bridge code was properly generated.

---

### Issue 9: Phone Can't Connect to Metro (Network Isolation)
**Symptom**: Phone and Mac on same WiFi, but phone can't reach `http://[MAC_IP]:8081`. Safari on phone times out when accessing the URL.

**Cause**: Router has AP isolation (client isolation) enabled, preventing devices from communicating with each other.

**Solution - Use Expo Tunnel Mode**:
```bash
# Install ngrok as local dev dependency
npm install --save-dev @expo/ngrok@^4.1.0

# Start with tunnel mode
npx expo start --dev-client --tunnel
```

**Getting the tunnel URL**:
```bash
# The URL is shown in Metro output, or query ngrok API:
curl -s http://localhost:4040/api/tunnels | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['tunnels'][0]['public_url'])"
```

**If tunnel URL doesn't work on phone WiFi**: Try switching phone to **cellular data**. Some corporate/home networks block outbound connections to tunnel services.

**Verify tunnel works**: On phone Safari, visit `https://[tunnel-url]/status` - should show `packager-status:running`

---

### Issue 10: ngrok tunnel not installing properly
**Error**: `CommandError: Install @expo/ngrok@^4.1.0 and try again` (even after global install)

**Cause**: Global npm installation not being picked up by Expo.

**Solution**: Install as local dev dependency instead:
```bash
npm install --save-dev @expo/ngrok@^4.1.0
```

---

### Issue 11: Tunnel Mode SSR Crash
**Error**: `ReferenceError: window is not defined` at AsyncStorage during Metro bundling

**Cause**: Tunnel mode triggers server-side rendering (SSR) where `window` doesn't exist. Code that accesses `AsyncStorage` or browser-only APIs at module initialization will crash.

**Workaround**: This usually only affects the initial web bundle render. The iOS app should still work. If Metro crashes:
```bash
# Restart Metro with cleared cache
npx expo start --dev-client --tunnel --clear
```

**Permanent Fix** (if needed): Wrap browser-only code in platform checks:
```typescript
import { Platform } from 'react-native';
const isSSR = typeof window === 'undefined' && Platform.OS === 'web';
// Only use AsyncStorage if not in SSR
```

---

## Metro Connection Troubleshooting Flowchart

When the app shows "No development servers found":

```
1. Is Metro running?
   └─ No  → Run: npx expo start --dev-client
   └─ Yes → Continue to step 2

2. Can phone reach Mac on local network?
   └─ Test: Open Safari on phone, visit http://[MAC_IP]:8081/status
   └─ Works (shows "packager-status:running") → Enter URL manually in app
   └─ Fails → Continue to step 3

3. Network isolation detected. Try tunnel mode:
   └─ npm install --save-dev @expo/ngrok@^4.1.0
   └─ npx expo start --dev-client --tunnel
   └─ Get tunnel URL and try in app

4. Tunnel URL doesn't work on WiFi?
   └─ Switch phone to cellular data
   └─ Try tunnel URL again (use https://)

5. Still getting errors?
   └─ Check Metro logs for crashes
   └─ Try: npx expo start --dev-client --tunnel --clear
```

---

## Xcode Settings to Verify Before Each Build

After running `prebuild --clean` or `pod deintegrate`, always check:

1. **Signing & Capabilities**:
   - Team: Your Apple Developer account selected
   - Bundle Identifier: Your unique ID (e.g., `com.neiljenny.memoria`)
   - Automatically manage signing: ✓ Checked

2. **Build Settings**:
   - User Script Sandboxing: **No**

---

## Development Workflow

### First-time setup:
1. `npm install`
2. `npx expo prebuild`
3. `cd ios && pod install`
4. Open `ios/Memoriaai.xcworkspace` in Xcode
5. Configure signing (team, bundle ID)
6. Set User Script Sandboxing = No
7. Build to device (Play button)

### Daily development:
1. `npx expo start --dev-client`
2. Open app on phone
3. Enter Metro URL if needed

### After adding native dependencies:
1. `npx expo prebuild --clean`
2. Rebuild in Xcode
3. Verify Xcode settings (signing, sandboxing)

---

## Useful Commands

```bash
# Check Mac's local IP
ipconfig getifaddr en0

# Check what's running on port 8081
lsof -i :8081

# Kill Metro if stuck
pkill -f "expo start"

# Open Xcode workspace
open ios/Memoriaai.xcworkspace

# Check pod versions
cd ios && pod outdated
```

---

## Environment Info

- **Node.js**: v25.4.0
- **Expo SDK**: 54
- **React Native**: 0.81.5
- **Xcode**: (check with `xcodebuild -version`)
- **macOS**: Darwin 25.2.0
- **Bundle ID**: com.neiljenny.memoria

---

## Related Documentation

- `docs/APPLE_DEVELOPER_ACCOUNT_SETUP.md` - Apple account setup with app-specific passwords
- `docs/ios-build-troubleshooting.md` - Original troubleshooting notes
- `WORKLOG.md` - Development session logs
